/**
 * Firestore Implementation of IPassportRepository for KarigarSaathi
 * Manages private owner-scoped collections, sanitized public projections, and buyer enquiries.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { IPassportRepository } from '@/repositories/interfaces/IPassportRepository';
import {
  CraftPassport,
  PublicCraftPassport,
  ConsentRecord,
  ExportAuditRecord,
  BuyerEnquiry,
  CraftPassportStatus,
} from '@/types';
import { logger } from '@/services/logging/logger';
import { removeUndefinedDeep } from '@/utils/firestore';

export class FirestorePassportRepository implements IPassportRepository {
  // Private Passport operations
  async createPassport(passport: CraftPassport): Promise<CraftPassport> {
    try {
      const owner = passport.ownerId || passport.artisanId || 'unknown';
      const docRef = doc(db, 'users', owner, 'craftPassports', passport.id);
      const safePassport = removeUndefinedDeep(passport);
      await setDoc(docRef, safePassport);
      logger.info('INVENTORY', 'Created private Craft Passport document', {
        passportId: passport.id,
        ownerId: owner,
        productId: passport.productId,
      });
      return safePassport;
    } catch (err) {
      logger.error('INVENTORY', 'Failed to create Craft Passport in Firestore', {
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  async getPassportById(ownerId: string, passportId: string): Promise<CraftPassport | null> {
    try {
      const docRef = doc(db, 'users', ownerId, 'craftPassports', passportId);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) return null;
      return snapshot.data() as CraftPassport;
    } catch (err) {
      logger.error('INVENTORY', 'Failed to get Craft Passport by ID', {
        error: err instanceof Error ? err.message : String(err),
      });
      return null;
    }
  }

  async getPassportByProductId(ownerId: string, productId: string): Promise<CraftPassport | null> {
    try {
      const colRef = collection(db, 'users', ownerId, 'craftPassports');
      const q = query(colRef, where('productId', '==', productId), limit(1));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      return snapshot.docs[0].data() as CraftPassport;
    } catch (err) {
      logger.error('INVENTORY', 'Failed to get Craft Passport by product ID', {
        error: err instanceof Error ? err.message : String(err),
      });
      return null;
    }
  }

  async updatePassportStatus(
    ownerId: string,
    passportId: string,
    status: CraftPassportStatus,
    metadata: Partial<CraftPassport> = {}
  ): Promise<void> {
    try {
      const docRef = doc(db, 'users', ownerId, 'craftPassports', passportId);
      const updatePayload: Record<string, unknown> = {
        ...metadata,
        status,
        updatedAt: new Date().toISOString(),
      };
      if (status === 'active' && !metadata.activatedAt) {
        updatePayload.activatedAt = new Date().toISOString();
      }
      if (status === 'revoked' && !metadata.revokedAt) {
        updatePayload.revokedAt = new Date().toISOString();
      }
      const safePayload = removeUndefinedDeep(updatePayload);
      await updateDoc(docRef, safePayload);
    } catch (err) {
      logger.error('INVENTORY', 'Failed to update Craft Passport status in Firestore', {
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  async revokePassport(ownerId: string, passportId: string): Promise<void> {
    const passport = await this.getPassportById(ownerId, passportId);
    const now = new Date().toISOString();

    await this.updatePassportStatus(ownerId, passportId, 'revoked', { revokedAt: now });

    if (passport?.publicSlug) {
      await this.revokePublicPassport(passport.publicSlug);
    }
  }

  // Public Sanitized Projection operations
  async createOrUpdatePublicPassport(publicPassport: PublicCraftPassport): Promise<void> {
    try {
      const docRef = doc(db, 'publicCraftPassports', publicPassport.slug);
      const safePublicPassport = removeUndefinedDeep(publicPassport);
      await setDoc(docRef, safePublicPassport);
      logger.info('INVENTORY', 'Published sanitized public Craft Passport projection', {
        slug: publicPassport.slug,
        status: publicPassport.status,
      });
    } catch (err) {
      logger.error('INVENTORY', 'Failed to set public Craft Passport document', {
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  async getPublicPassportBySlug(slug: string): Promise<PublicCraftPassport | null> {
    try {
      const docRef = doc(db, 'publicCraftPassports', slug);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) return null;
      return snapshot.data() as PublicCraftPassport;
    } catch (err) {
      logger.error('INVENTORY', 'Failed to fetch public Craft Passport by slug', {
        error: err instanceof Error ? err.message : String(err),
      });
      return null;
    }
  }

  async revokePublicPassport(slug: string): Promise<void> {
    try {
      const docRef = doc(db, 'publicCraftPassports', slug);
      const existing = await getDoc(docRef);
      if (existing.exists()) {
        const now = new Date().toISOString();
        // Clear publicData completely so revoked passport leaks zero product information
        const revokedDoc: PublicCraftPassport = {
          ...(existing.data() as PublicCraftPassport),
          status: 'revoked',
          publicData: {
            title: '',
            photos: [],
          },
          revokedAt: now,
          updatedAt: now,
        };
        const safeRevokedDoc = removeUndefinedDeep(revokedDoc);
        await setDoc(docRef, safeRevokedDoc);
      }
    } catch (err) {
      logger.error('INVENTORY', 'Failed to revoke public Craft Passport document', {
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  // Consent & Audit operations
  async recordConsent(consent: ConsentRecord): Promise<ConsentRecord> {
    try {
      const docRef = doc(db, 'users', consent.ownerId, 'consentRecords', consent.id);
      const safeConsent = removeUndefinedDeep(consent);
      await setDoc(docRef, safeConsent);
      return safeConsent;
    } catch (err) {
      logger.error('INVENTORY', 'Failed to record consent in Firestore', {
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  async getConsentRecord(ownerId: string, consentId: string): Promise<ConsentRecord | null> {
    try {
      const docRef = doc(db, 'users', ownerId, 'consentRecords', consentId);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) return null;
      return snapshot.data() as ConsentRecord;
    } catch {
      return null;
    }
  }

  async recordAudit(audit: ExportAuditRecord): Promise<ExportAuditRecord> {
    try {
      const docRef = doc(db, 'users', audit.ownerId, 'exportAuditRecords', audit.id);
      const safeAudit = removeUndefinedDeep(audit);
      await setDoc(docRef, safeAudit);
      return safeAudit;
    } catch (err) {
      logger.warn('INVENTORY', 'Failed to write export audit record to Firestore', {
        error: err instanceof Error ? err.message : String(err),
      });
      return audit;
    }
  }

  async listAuditRecords(ownerId: string, productId?: string): Promise<ExportAuditRecord[]> {
    try {
      const colRef = collection(db, 'users', ownerId, 'exportAuditRecords');
      let q = query(colRef, orderBy('createdAt', 'desc'), limit(50));
      if (productId) {
        q = query(colRef, where('productId', '==', productId), limit(50));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => d.data() as ExportAuditRecord);
    } catch {
      return [];
    }
  }

  // Buyer Enquiries
  async submitBuyerEnquiry(enquiryInput: Omit<BuyerEnquiry, 'id' | 'receivedAt' | 'replies'>): Promise<BuyerEnquiry> {
    try {
      const enquiryId = `enq_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const now = new Date().toISOString();
      const newEnquiry: BuyerEnquiry = {
        ...enquiryInput,
        id: enquiryId,
        receivedAt: now,
        createdAt: now,
        status: 'new',
        replies: [],
      };

      const docRef = doc(db, 'buyerEnquiries', enquiryId);
      const safeEnquiry = removeUndefinedDeep(newEnquiry);
      await setDoc(docRef, safeEnquiry);
      logger.info('INVENTORY', 'Submitted buyer enquiry to Firestore', {
        enquiryId,
        productId: enquiryInput.productId,
      });
      return safeEnquiry;
    } catch (err) {
      logger.error('INVENTORY', 'Failed to submit buyer enquiry in Firestore', {
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  async listBuyerEnquiries(artisanId: string): Promise<BuyerEnquiry[]> {
    try {
      const colRef = collection(db, 'buyerEnquiries');
      const q = query(colRef, where('artisanId', '==', artisanId), limit(50));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => d.data() as BuyerEnquiry);
    } catch {
      return [];
    }
  }

  async getBuyerEnquiryById(enquiryId: string): Promise<BuyerEnquiry | null> {
    try {
      const docRef = doc(db, 'buyerEnquiries', enquiryId);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) return null;
      return snapshot.data() as BuyerEnquiry;
    } catch {
      return null;
    }
  }
}
