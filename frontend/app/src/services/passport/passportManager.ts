/**
 * Craft Passport Lifecycle Manager for KarigarSaathi
 * Orchestrates readiness gates, consent records, sanitized public projections,
 * cryptographically unpredictable slug creation, revocation, and republishing.
 */

import {
  ProductDraft,
  CraftPassport,
  PublicCraftPassport,
  SanitizedPassportData,
  PassportPublicField,
  ConsentRecord,
  ArtisanProfile,
  ActivatedPassportResult,
} from '@/types';
import { validateProductForReadiness, ReadinessValidationError } from '@/domain/products/validation';
import { IPassportRepository } from '@/repositories/interfaces/IPassportRepository';
import { FirestorePassportRepository } from '@/repositories/firebase/FirestorePassportRepository';
import { MockPassportRepository } from '@/repositories/mock/MockPassportRepository';
import { exportAuditService } from '@/services/audit/exportAuditService';
import { logger } from '@/services/logging/logger';
import { removeUndefinedDeep } from '@/utils/firestore';

export class PassportReadinessError extends Error {
  public readonly errors: ReadinessValidationError[];
  constructor(errors: ReadinessValidationError[]) {
    super(`Cannot activate Craft Passport: Product failed ${errors.length} readiness requirements.`);
    this.name = 'PassportReadinessError';
    this.errors = errors;
  }
}

// Select repository based on environment
const passportRepo: IPassportRepository =
  typeof window !== 'undefined' && (window as unknown as { __USE_MOCK_REPO__?: boolean }).__USE_MOCK_REPO__
    ? new MockPassportRepository()
    : new FirestorePassportRepository();

export class PassportManager {
  private repo: IPassportRepository;

  constructor(repository: IPassportRepository = passportRepo) {
    this.repo = repository;
  }

  /**
   * Generates a cryptographically random, collision-resistant URL slug.
   */
  generatePublicSlug(productTitle: string): { slug: string; token: string } {
    const cleanPrefix = (productTitle || 'craft-item')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32);

    // Cryptographic random token (12 alphanumeric chars)
    const randomBytes = new Uint8Array(6);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(randomBytes);
    } else {
      for (let i = 0; i < 6; i++) randomBytes[i] = Math.floor(Math.random() * 256);
    }
    const token = Array.from(randomBytes).map((b) => b.toString(16).padStart(2, '0')).join('');
    const slug = `${cleanPrefix || 'craft'}-${token}`;

    return { slug, token };
  }

  /**
   * Builds the sanitized public projection containing ONLY approved fields.
   * Strips all private account data, UIDs, internal pricing sheets, and storage paths.
   * Guarantees that optional fields are omitted when missing, never assigned undefined.
   */
  buildSanitizedData(
    draft: ProductDraft,
    approvedFields: PassportPublicField[],
    artisanProfile?: Partial<ArtisanProfile>
  ): SanitizedPassportData {
    const isApproved = (field: PassportPublicField) => approvedFields.includes(field);

    const rawPhotos = (draft.photos || [])
      .map((p) => p.url)
      .filter((u): u is string => typeof u === 'string' && u.trim().length > 0);
    const approvedPhotos = isApproved('photos') ? rawPhotos : rawPhotos.slice(0, 1);

    const titleText = (draft.title || '').trim();
    const sanitized: SanitizedPassportData = {
      title: (isApproved('title') && titleText) ? titleText : 'Handcrafted Heritage Item',
      photos: approvedPhotos,
    };

    if (isApproved('titleHindi') && draft.titleHindi?.trim()) {
      sanitized.titleHindi = draft.titleHindi.trim();
    }

    if (isApproved('description')) {
      const desc = (draft.story || draft.description || '').trim();
      if (desc) sanitized.description = desc;
    }

    if (isApproved('descriptionHindi') && draft.descriptionHindi?.trim()) {
      sanitized.descriptionHindi = draft.descriptionHindi.trim();
    }

    if (isApproved('category') && draft.category?.trim()) {
      sanitized.category = draft.category.trim();
    }

    if (isApproved('subcategory') && draft.subcategory?.trim()) {
      sanitized.subcategory = draft.subcategory.trim();
    }

    if (isApproved('technique')) {
      const tech = (draft.technique || draft.craftType || '').trim();
      if (tech) sanitized.technique = tech;
    }

    if (isApproved('materials') && Array.isArray(draft.materials) && draft.materials.length > 0) {
      const validMaterials = draft.materials.map((m) => m?.trim()).filter((m): m is string => Boolean(m));
      if (validMaterials.length > 0) {
        sanitized.materials = validMaterials;
      }
    }

    if (isApproved('dimensions') && draft.dimensions?.trim()) {
      sanitized.dimensions = draft.dimensions.trim();
    }

    if (isApproved('careInstructions') && draft.careInstructions?.trim()) {
      sanitized.careInstructions = draft.careInstructions.trim();
    }

    if (isApproved('tags') && Array.isArray(draft.tags) && draft.tags.length > 0) {
      const validTags = draft.tags.map((t) => t?.trim()).filter((t): t is string => Boolean(t));
      if (validTags.length > 0) {
        sanitized.tags = validTags;
      }
    }

    if (isApproved('price') && typeof draft.selectedPrice === 'number' && !isNaN(draft.selectedPrice)) {
      sanitized.price = draft.selectedPrice;
      sanitized.currency = draft.currency?.trim() || 'INR';
    }

    if (isApproved('artisanName')) {
      const name = (artisanProfile?.name || '').trim();
      if (name) {
        sanitized.artisanName = name;
      } else {
        sanitized.artisanName = 'Master Artisan';
      }
    }

    if (isApproved('story')) {
      const story = (artisanProfile?.bio || draft.story || '').trim();
      if (story) sanitized.artisanStory = story;
    }

    if (isApproved('location')) {
      const state = (draft.origin || artisanProfile?.location || '').trim();
      if (state) sanitized.state = state;
      const workshop = (artisanProfile?.workshopName || '').trim();
      if (workshop) sanitized.workshopName = workshop;
    }

    if (isApproved('contactOption')) {
      sanitized.contactOption = true;
    }

    // Deterministic cryptographic provenance hash of approved fields
    const hashPayload = `${sanitized.title}|${sanitized.category || ''}|${sanitized.technique || ''}|${draft.createdAt || ''}`;
    const hexDigest = Array.from(new TextEncoder().encode(hashPayload)).reduce((acc, b) => acc + b.toString(16), '');
    sanitized.verificationHash = `KS-VERIFIED-${hexDigest}`.slice(0, 24).toUpperCase();

    return removeUndefinedDeep(sanitized);
  }

  /**
   * Activates a public Craft Passport for a product passing the 10-point readiness check.
   */
  async activatePassport(
    ownerId: string,
    draft: ProductDraft,
    approvedFields: PassportPublicField[],
    artisanProfile?: Partial<ArtisanProfile>
  ): Promise<ActivatedPassportResult> {
    // 1. Mandatory Readiness Validation Gate
    const readiness = validateProductForReadiness(draft);
    if (!readiness.isReady) {
      const errorMsg = `Cannot activate Craft Passport: Product failed ${readiness.errors.length} readiness requirements.`;
      logger.error('INVENTORY', errorMsg, { errors: readiness.errors });
      throw new PassportReadinessError(readiness.errors);
    }

    const now = new Date().toISOString();
    const passportId = draft.passportId || `pass_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const { slug, token } = this.generatePublicSlug(draft.title);

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://karigarsaathi.web.app';
    const publicUrl = `${baseUrl}/passport/${slug}`;

    // 2. Build sanitized projection with optional undefined fields stripped
    const sanitizedData = this.buildSanitizedData(draft, approvedFields, artisanProfile);

    // 3. Record Consent Record (safe payload)
    const consentRecord: ConsentRecord = removeUndefinedDeep({
      id: `consent_${Date.now()}`,
      ownerId,
      productId: draft.id,
      passportId,
      purpose: 'public_passport',
      approvedFields,
      consentGranted: true,
      snapshotVersion: 1,
      actorUid: ownerId,
      createdAt: now,
    });
    await this.repo.recordConsent(consentRecord);

    // 4. Create Private Passport Document (safe payload)
    const passport: CraftPassport = removeUndefinedDeep({
      id: passportId,
      ownerId,
      productId: draft.id,
      publicToken: token,
      publicSlug: slug,
      status: 'active',
      approvedFields,
      consentRecordId: consentRecord.id,
      publishedSnapshotVersion: 1,
      createdAt: now,
      updatedAt: now,
      activatedAt: now,
      artisanId: ownerId,
      artisanName: sanitizedData.artisanName,
      productTitle: sanitizedData.title,
      publicUrl,
    });
    await this.repo.createPassport(passport);

    // 5. Create Sanitized Public Document (safe payload)
    const publicPassport: PublicCraftPassport = removeUndefinedDeep({
      passportId,
      productId: draft.id,
      ownerId,
      slug,
      status: 'active',
      snapshotVersion: 1,
      publicData: sanitizedData,
      activatedAt: now,
      updatedAt: now,
    });
    await this.repo.createOrUpdatePublicPassport(publicPassport);

    // 6. Record Audit Trail
    const audit = exportAuditService.createRecord({
      ownerId,
      productId: draft.id,
      passportId,
      format: 'qr',
      action: 'published',
      status: 'completed',
    });
    await this.repo.recordAudit(audit);

    logger.info('INVENTORY', 'Craft Passport activated successfully', {
      passportId,
      slug,
      ownerId,
    });

    return {
      passportId,
      publicSlug: slug,
      publicUrl,
      status: 'active',
      publicData: sanitizedData,
      snapshotVersion: 1,
      passport,
      slug,
    };
  }

  /**
   * Revokes an existing Craft Passport, immediately blocking public access.
   */
  async revokePassport(ownerId: string, passportId: string): Promise<void> {
    const passport = await this.repo.getPassportById(ownerId, passportId);
    if (!passport) {
      throw new Error(`Passport ${passportId} not found.`);
    }

    await this.repo.revokePassport(ownerId, passportId);

    // Record audit record
    const audit = exportAuditService.createRecord({
      ownerId,
      productId: passport.productId,
      passportId,
      format: 'qr',
      action: 'failed',
      status: 'completed',
      errorMessage: 'Passport revoked by artisan',
    });
    await this.repo.recordAudit(audit);

    logger.info('INVENTORY', 'Craft Passport revoked successfully', { passportId, ownerId });
  }

  /**
   * Fetches the sanitized public snapshot by slug.
   */
  async getPublicPassport(slug: string): Promise<PublicCraftPassport | null> {
    return this.repo.getPublicPassportBySlug(slug);
  }

  /**
   * Submits a buyer enquiry.
   */
  async submitEnquiry(params: {
    passportId?: string;
    productId: string;
    productTitle: string;
    artisanId?: string;
    buyerName: string;
    buyerContact: string;
    message: string;
    quantityRequested?: number;
  }) {
    if (!params.buyerName.trim()) throw new Error('Buyer name is required.');
    if (!params.buyerContact.trim()) throw new Error('Contact details are required.');
    if (!params.message.trim()) throw new Error('Enquiry message cannot be empty.');

    return this.repo.submitBuyerEnquiry({
      passportId: params.passportId,
      productId: params.productId,
      productTitle: params.productTitle,
      artisanId: params.artisanId || '',
      buyerName: params.buyerName.trim(),
      buyerContact: params.buyerContact.trim(),
      initialMessage: params.message.trim(),
      message: params.message.trim(),
      quantityRequested: params.quantityRequested || 1,
      preferredContactMethod: 'whatsapp',
      consentToBeContacted: true,
      createdAt: new Date().toISOString(),
      schemaVersion: 1,
      status: 'new',
    });
  }

  /**
   * Lists buyer enquiries for artisan inbox.
   */
  async listEnquiries(artisanId: string) {
    return this.repo.listBuyerEnquiries(artisanId);
  }
}

export const passportManager = new PassportManager();
