import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const ABUSE_CONFIG = {
  MIN_FORM_COMPLETION_MS: 2000,
  DUPLICATE_WINDOW_MS: 10 * 60 * 1000,
  MAX_PER_SOURCE_15_MIN: 5,
  MAX_PER_PASSPORT_DAILY: 20,
  WINDOW_15_MIN_MS: 15 * 60 * 1000,
  WINDOW_DAY_MS: 24 * 60 * 60 * 1000,
  HMAC_SECRET: process.env.ENQUIRY_HMAC_SECRET || 'karigarsaathi_server_hmac_secret_2026',
};

const FORBIDDEN_CLIENT_FIELDS = [
  'artisanId',
  'ownerId',
  'recipientId',
  'productId',
  'passportId',
  'status',
  'createdAt',
  'updatedAt',
  'statusHistory',
  'abuseMetadata',
  'sourceHash',
  'rateLimitCounters',
  'coordinatorId',
  'coordinatorUid',
];

export const submitBuyerEnquiry = functions.https.onCall(async (data, context) => {
  try {
    const rawPayload = data || {};

    // 1. Rejection of forbidden client-controlled administrative fields
    for (const field of FORBIDDEN_CLIENT_FIELDS) {
      if (field in rawPayload && rawPayload[field] !== undefined) {
        throw new functions.https.HttpsError('invalid-argument', 'Forbidden field in payload.');
      }
    }

    // 2. Honeypot check
    if (rawPayload.honeypot && String(rawPayload.honeypot).trim() !== '') {
      return {
        success: false,
        errorCode: 'BOT_DETECTED',
        message: 'Unable to process enquiry at this time.',
      };
    }

    // 3. Minimum form duration check (>= 2s)
    if (rawPayload.formStartedAt) {
      const duration = Date.now() - Number(rawPayload.formStartedAt);
      if (duration < ABUSE_CONFIG.MIN_FORM_COMPLETION_MS) {
        return {
          success: false,
          errorCode: 'BOT_DETECTED',
          message: 'Submission completed unusually fast. Please try again.',
        };
      }
    }

    // 4. Contact consent check
    if (rawPayload.consentToBeContacted !== true) {
      return {
        success: false,
        errorCode: 'CONSENT_REQUIRED',
        message: 'Explicit contact consent is required to submit an enquiry.',
      };
    }

    // 5. Input validation & sanitization
    const slug = String(rawPayload.publicSlug || '').trim();
    const buyerName = String(rawPayload.buyerName || '').trim();
    const buyerContact = String(rawPayload.buyerContact || rawPayload.buyerPhone || rawPayload.buyerEmail || '').trim();
    const message = String(rawPayload.message || '').trim();
    const quantityRequested = Number(rawPayload.quantityRequested) || 1;

    if (!slug) {
      throw new functions.https.HttpsError('invalid-argument', 'Public Craft Passport identifier is missing.');
    }

    if (!buyerName || buyerName.length < 2 || buyerName.length > 100) {
      throw new functions.https.HttpsError('invalid-argument', 'Please provide a valid full name (2-100 characters).');
    }

    if (!buyerContact || buyerContact.length < 5 || buyerContact.length > 100) {
      throw new functions.https.HttpsError('invalid-argument', 'Please provide a valid phone number or email address.');
    }

    if (!message || message.length < 5 || message.length > 2000) {
      throw new functions.https.HttpsError('invalid-argument', 'Please provide a clear enquiry message (5-2,000 characters).');
    }

    // 6. Server Source Hashing
    const rawSource = (context.rawRequest && (context.rawRequest.ip || context.rawRequest.headers['x-forwarded-for'])) || context.auth?.uid || '127.0.0.1';
    const sourceHash = 'src_' + crypto.createHmac('sha256', ABUSE_CONFIG.HMAC_SECRET).update(String(rawSource)).digest('hex').substring(0, 16);

    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();

    // 7. Transactional Rate Limiting, Passport & Product Resolution, and Persistence
    return await db.runTransaction(async (transaction) => {
      // 7a. Rate Limit: Source
      const sourceLimitRef = db.doc(_enquiryRateLimits/);
      const sourceLimitSnap = await transaction.get(sourceLimitRef);
      const sourceData = sourceLimitSnap.exists ? sourceLimitSnap.data() : { timestamps: [] };
      const sourceTimestamps = (sourceData?.timestamps || []).filter((ts: number) => nowMs - ts < ABUSE_CONFIG.WINDOW_15_MIN_MS);

      if (sourceTimestamps.length >= ABUSE_CONFIG.MAX_PER_SOURCE_15_MIN) {
        return {
          success: false,
          errorCode: 'RATE_LIMITED',
          message: 'Too many enquiries submitted. Please wait 15 minutes before trying again.',
        };
      }

      // 7b. Rate Limit: Passport
      const passportLimitRef = db.doc(_enquiryRateLimits/);
      const passportLimitSnap = await transaction.get(passportLimitRef);
      const passportData = passportLimitSnap.exists ? passportLimitSnap.data() : { timestamps: [] };
      const passportTimestamps = (passportData?.timestamps || []).filter((ts: number) => nowMs - ts < ABUSE_CONFIG.WINDOW_DAY_MS);

      if (passportTimestamps.length >= ABUSE_CONFIG.MAX_PER_PASSPORT_DAILY) {
        return {
          success: false,
          errorCode: 'RATE_LIMITED',
          message: 'This craft item has reached its daily enquiry limit. Please try again tomorrow.',
        };
      }

      // 7c. Duplicate Suppression
      const duplicateKey = crypto.createHash('sha256').update(${sourceHash}___).digest('hex');
      const dupRef = db.doc(_enquiryIdempotency/dup_);
      const dupSnap = await transaction.get(dupRef);
      if (dupSnap.exists && (nowMs - (dupSnap.data()?.createdAtMs || 0)) < ABUSE_CONFIG.DUPLICATE_WINDOW_MS) {
        return {
          success: false,
          errorCode: 'DUPLICATE',
          message: 'An identical enquiry was recently submitted. Please wait before submitting again.',
        };
      }

      // 7d. Authoritatively Load Public Passport Projection
      const passportRef = db.doc(publicCraftPassports/);
      const passportSnap = await transaction.get(passportRef);
      if (!passportSnap.exists) {
        return {
          success: false,
          errorCode: 'NOT_FOUND',
          message: 'Unable to locate Craft Passport.',
        };
      }

      const passportDataRecord = passportSnap.data() || {};
      if (passportDataRecord.status === 'revoked' || passportDataRecord.revokedAt) {
        return {
          success: false,
          errorCode: 'REVOKED_PASSPORT',
          message: 'This Craft Passport has been revoked and is no longer accepting enquiries.',
        };
      }

      const authoritativeArtisanId = passportDataRecord.ownerId;
      const authoritativeProductId = passportDataRecord.productId;

      if (!authoritativeArtisanId || !authoritativeProductId) {
        return {
          success: false,
          errorCode: 'INVALID_PASSPORT_STATE',
          message: 'Invalid passport configuration.',
        };
      }

      // 7e. Load and Verify Target Product
      const productRef = db.doc(products/);
      const productSnap = await transaction.get(productRef);
      if (!productSnap.exists) {
        return {
          success: false,
          errorCode: 'NOT_FOUND',
          message: 'Target craft item record not found.',
        };
      }

      const productRecord = productSnap.data() || {};
      if (productRecord.ownerId !== authoritativeArtisanId) {
        return {
          success: false,
          errorCode: 'INCONSISTENT_RECORD',
          message: 'Unable to process enquiry due to item record conflict.',
        };
      }

      if (productRecord.status === 'archived') {
        return {
          success: false,
          errorCode: 'PRODUCT_ARCHIVED',
          message: 'This craft item is archived and cannot receive enquiries.',
        };
      }

      // 7f. Persist Rate Limit & Idempotency Updates
      sourceTimestamps.push(nowMs);
      transaction.set(sourceLimitRef, { timestamps: sourceTimestamps, updatedAt: nowIso }, { merge: true });

      passportTimestamps.push(nowMs);
      transaction.set(passportLimitRef, { timestamps: passportTimestamps, updatedAt: nowIso }, { merge: true });

      transaction.set(dupRef, { createdAtMs: nowMs, createdAt: nowIso });

      // 7g. Create Enquiry Document
      const enquiryId = 'enq_' + nowMs + '_' + Math.random().toString(36).substring(2, 7);
      const enquiryRef = db.doc(uyerEnquiries/);

      const newEnquiry = {
        id: enquiryId,
        passportId: passportDataRecord.passportId || slug,
        publicSlug: slug,
        productId: authoritativeProductId,
        productTitle: productRecord.title || passportDataRecord.publicData?.title || 'Handcrafted Item',
        productImage: passportDataRecord.publicData?.photos?.[0] || productRecord.photoPaths?.[0] || '',
        artisanId: authoritativeArtisanId,
        buyerName,
        buyerContact,
        buyerPhone: rawPayload.buyerPhone ? String(rawPayload.buyerPhone).trim() : undefined,
        buyerEmail: rawPayload.buyerEmail ? String(rawPayload.buyerEmail).trim() : undefined,
        buyerOrganisation: rawPayload.buyerOrganisation ? String(rawPayload.buyerOrganisation).trim() : undefined,
        destinationCity: rawPayload.destinationCity ? String(rawPayload.destinationCity).trim() : undefined,
        quantityRequested,
        targetPrice: rawPayload.targetPrice ? Number(rawPayload.targetPrice) : undefined,
        initialMessage: message,
        message,
        preferredContactMethod: rawPayload.preferredContactMethod || 'whatsapp',
        consentToBeContacted: true,
        status: 'new',
        receivedAt: nowIso,
        createdAt: nowIso,
        updatedAt: nowIso,
        replies: [],
        source: 'craft_passport',
        schemaVersion: 1,
        abuseMetadata: {
          sourceHash,
          formDurationMs: rawPayload.formStartedAt ? nowMs - Number(rawPayload.formStartedAt) : 0,
        },
      };

      transaction.set(enquiryRef, newEnquiry);

      // 7h. Transactionally Update Product Lifecycle Status
      if (['draft', 'ready', 'shared'].includes(productRecord.status) && productRecord.status !== 'enquiry_received') {
        const historyEntry = {
          previousStatus: productRecord.status,
          newStatus: 'enquiry_received',
          changedAt: nowIso,
          changedBy: 'buyer',
          actorType: 'buyer',
          reason: 'Structured buyer enquiry submitted via Craft Passport',
          triggeringEnquiryId: enquiryId,
        };

        const existingHistory = Array.isArray(productRecord.statusHistory) ? productRecord.statusHistory : [];
        transaction.update(productRef, {
          status: 'enquiry_received',
          statusHistory: [...existingHistory, historyEntry],
          updatedAt: nowIso,
        });
      }

      return {
        success: true,
        enquiryId,
        acceptedAt: nowIso,
        status: 'new',
        message: 'Enquiry received successfully.',
      };
    });
  } catch (err: any) {
    if (err instanceof functions.https.HttpsError) throw err;
    throw new functions.https.HttpsError('internal', 'Unable to complete your request at this time. Please try again later.');
  }
});
