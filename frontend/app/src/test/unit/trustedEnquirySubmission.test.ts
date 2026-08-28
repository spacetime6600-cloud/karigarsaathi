import { describe, it, expect, beforeEach } from 'vitest';
import { TrustedEnquiryHandler } from '@/services/enquiries/trustedEnquiryHandler';
import { MockPassportRepository } from '@/repositories/mock/MockPassportRepository';
import { MockProductRepository } from '@/repositories/mock/MockProductRepository';
import { MockEnquiryRepository } from '@/repositories/mock/MockEnquiryRepository';
import { PublicCraftPassport } from '@/types';
import { ProductRecord } from '@/domain/products';

describe('Trusted Server-Authoritative Enquiry Handler Suite', () => {
  let passportRepo: MockPassportRepository;
  let productRepo: MockProductRepository;
  let enquiryRepo: MockEnquiryRepository;
  let handler: TrustedEnquiryHandler;

  const artisanAUid = 'artisan_A_real_uid';
  const artisanBUid = 'artisan_B_spoofed_uid';

  const activePassport: PublicCraftPassport = {
    slug: 'assam-silk-saree-authentic',
    passportId: 'KP_ASSAM_001',
    productId: 'prod_assam_saree_01',
    ownerId: artisanAUid, // Genuine owner in trusted database
    status: 'active',
    snapshotVersion: 1,
    publicData: {
      title: 'Authentic Assam Silk Saree',
      photos: ['https://example.com/saree.jpg'],
      price: 15000,
      currency: 'INR',
      artisanName: 'Ravi Kumar',
    },
    activatedAt: '2026-08-27T10:00:00Z',
    updatedAt: '2026-08-27T10:00:00Z',
  };

  const revokedPassport: PublicCraftPassport = {
    slug: 'revoked-craft-passport',
    passportId: 'KP_REVOKED_001',
    productId: 'prod_revoked_01',
    ownerId: artisanAUid,
    status: 'revoked',
    snapshotVersion: 1,
    publicData: {
      title: 'Revoked Craft Item',
      photos: [],
    },
    activatedAt: '2026-08-27T10:00:00Z',
    updatedAt: '2026-08-27T10:00:00Z',
    revokedAt: '2026-08-27T11:00:00Z',
  };

  const readyProduct: ProductRecord = {
    id: 'prod_assam_saree_01',
    ownerId: artisanAUid,
    title: 'Authentic Assam Silk Saree',
    description: 'Handcrafted silk saree with traditional weave.',
    category: 'Textiles',
    craftType: 'Weaving',
    state: 'Assam',
    price: 15000,
    currency: 'INR',
    stockQuantity: 4,
    status: 'ready',
    photoPaths: ['photo_01.jpg'],
    createdAt: '2026-08-27T10:00:00Z',
    updatedAt: '2026-08-27T10:00:00Z',
  };

  const archivedProduct: ProductRecord = {
    id: 'prod_archived_01',
    ownerId: artisanAUid,
    title: 'Archived Silk Scarf',
    description: 'Historical archive item.',
    category: 'Textiles',
    craftType: 'Weaving',
    state: 'Assam',
    price: 3000,
    currency: 'INR',
    stockQuantity: 0,
    status: 'archived',
    photoPaths: ['photo_archived.jpg'],
    createdAt: '2026-08-27T10:00:00Z',
    updatedAt: '2026-08-27T10:00:00Z',
  };

  const archivedPassport: PublicCraftPassport = {
    slug: 'archived-silk-scarf',
    passportId: 'KP_ARCHIVED_001',
    productId: 'prod_archived_01',
    ownerId: artisanAUid,
    status: 'active',
    snapshotVersion: 1,
    publicData: {
      title: 'Archived Silk Scarf',
      photos: [],
    },
    activatedAt: '2026-08-27T10:00:00Z',
    updatedAt: '2026-08-27T10:00:00Z',
  };

  beforeEach(async () => {
    passportRepo = new MockPassportRepository();
    productRepo = new MockProductRepository();
    enquiryRepo = new MockEnquiryRepository();

    await passportRepo.createOrUpdatePublicPassport(activePassport);
    await passportRepo.createOrUpdatePublicPassport(revokedPassport);
    await passportRepo.createOrUpdatePublicPassport(archivedPassport);

    await productRepo.createProduct(artisanAUid, readyProduct);
    await productRepo.createProduct(artisanAUid, archivedProduct);

    handler = new TrustedEnquiryHandler(passportRepo, productRepo, enquiryRepo);
  });

  // A. Correct Artisan Routing & Spoofing Rejection
  it('A1. Correctly routes enquiry to Artisan A based on server passport projection', async () => {
    const result = await handler.handleSubmission({
      publicSlug: activePassport.slug,
      buyerName: 'Anita Roy',
      buyerContact: 'anita@boutique.in',
      message: 'Interested in buying 2 sarees for our upcoming craft exhibition.',
      quantityRequested: 2,
      consentToBeContacted: true,
      formStartedAt: Date.now() - 3000,
    });

    expect(result.success).toBe(true);
    expect(result.enquiryId).toBeDefined();

    // Verify stored enquiry has authoritative artisanId
    const storedEnquiry = await enquiryRepo.getEnquiryById(result.enquiryId!);
    expect(storedEnquiry).not.toBeNull();
    expect(storedEnquiry?.artisanId).toBe(artisanAUid);
    expect(storedEnquiry?.productId).toBe(activePassport.productId);
    expect(storedEnquiry?.status).toBe('new');

    // Confirm product status changed transactionally to enquiry_received
    const updatedProduct = await productRepo.getOwnedProductById(artisanAUid, activePassport.productId);
    expect(updatedProduct?.status).toBe('enquiry_received');
    expect(updatedProduct?.statusHistory).toBeDefined();
    expect(updatedProduct?.statusHistory?.length).toBeGreaterThan(0);
    expect(updatedProduct?.statusHistory?.[0].actorType).toBe('buyer');
  });

  it('A2. Authoritatively overwrites any client-supplied artisanId / ownerId with persisted owner', async () => {
    const result = await handler.handleSubmission({
      publicSlug: activePassport.slug,
      artisanId: artisanBUid, // Spoofed field sent by attacker
      ownerId: artisanBUid,
      buyerName: 'Anita Roy',
      buyerContact: 'anita@boutique.in',
      message: 'Attempting to spoof destination artisan.',
      consentToBeContacted: true,
      formStartedAt: Date.now() - 3000,
    });

    expect(result.success).toBe(true);
    const stored = await enquiryRepo.getEnquiryById(result.enquiryId!);
    // Must strictly be genuine Artisan A
    expect(stored?.artisanId).toBe(artisanAUid);
  });

  it('A3. Archived product is rejected and remains archived', async () => {
    const result = await handler.handleSubmission({
      publicSlug: archivedPassport.slug,
      buyerName: 'Curator',
      buyerContact: 'curator@museum.org',
      message: 'Requesting purchase of archived item.',
      consentToBeContacted: true,
      formStartedAt: Date.now() - 3000,
    });

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('PRODUCT_ARCHIVED');

    const product = await productRepo.getOwnedProductById(artisanAUid, archivedProduct.id);
    expect(product?.status).toBe('archived');
  });

  // B. Passport Protection
  it('B1. Rejects enquiry on revoked Craft Passport', async () => {
    const result = await handler.handleSubmission({
      publicSlug: revokedPassport.slug,
      buyerName: 'Anita Roy',
      buyerContact: 'anita@boutique.in',
      message: 'Inquiring about revoked item.',
      consentToBeContacted: true,
      formStartedAt: Date.now() - 3000,
    });

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('REVOKED_PASSPORT');
  });

  it('B2. Rejects enquiry on non-existent passport slug', async () => {
    const result = await handler.handleSubmission({
      publicSlug: 'non-existent-slug-xyz',
      buyerName: 'Anita Roy',
      buyerContact: 'anita@boutique.in',
      message: 'Inquiring about non-existent item.',
      consentToBeContacted: true,
      formStartedAt: Date.now() - 3000,
    });

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('NOT_FOUND');
  });

  // C. Server Abuse Controls & Rate Limiting
  it('C1. Rejects submissions with populated honeypot (BOT_DETECTED)', async () => {
    const result = await handler.handleSubmission({
      publicSlug: activePassport.slug,
      buyerName: 'Bot Submitter',
      buyerContact: 'bot@spam.com',
      message: 'Automated spam message.',
      honeypot: 'spam_value_in_hidden_field',
      consentToBeContacted: true,
      formStartedAt: Date.now() - 3000,
    });

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('BOT_DETECTED');
  });

  it('C2. Rejects submissions completed in under 2 seconds (BOT_DETECTED)', async () => {
    const result = await handler.handleSubmission({
      publicSlug: activePassport.slug,
      buyerName: 'Fast Submitter',
      buyerContact: 'fast@script.com',
      message: 'Fast script message.',
      consentToBeContacted: true,
      formStartedAt: Date.now() - 500, // 500ms < 2000ms threshold
    });

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('BOT_DETECTED');
  });

  it('C3. Suppresses duplicate enquiries submitted within 10-minute window', async () => {
    const payload = {
      publicSlug: activePassport.slug,
      buyerName: 'Anita Roy',
      buyerContact: 'anita@boutique.in',
      message: 'I would like to order 2 sarees for boutique.',
      quantityRequested: 2,
      consentToBeContacted: true,
      formStartedAt: Date.now() - 3000,
    };

    const first = await handler.handleSubmission(payload, '192.168.1.50');
    expect(first.success).toBe(true);

    const duplicate = await handler.handleSubmission(payload, '192.168.1.50');
    expect(duplicate.success).toBe(false);
    expect(duplicate.errorCode).toBe('DUPLICATE');
  });

  it('C4. Returns existing enquiry when idempotencyKey is repeated', async () => {
    const payload = {
      publicSlug: activePassport.slug,
      buyerName: 'Anita Roy',
      buyerContact: 'anita@boutique.in',
      message: 'Order with idempotency key.',
      quantityRequested: 1,
      consentToBeContacted: true,
      formStartedAt: Date.now() - 3000,
      idempotencyKey: 'idem_key_unique_123',
    };

    const first = await handler.handleSubmission(payload, '192.168.1.51');
    expect(first.success).toBe(true);

    const second = await handler.handleSubmission(payload, '192.168.1.51');
    expect(second.success).toBe(true);
    expect(second.enquiryId).toBe(first.enquiryId);
  });

  it('C5. Enforces source rate limit (max 5 per 15 minutes)', async () => {
    const sourceIp = '10.0.0.101';

    for (let i = 1; i <= 5; i++) {
      const res = await handler.handleSubmission({
        publicSlug: activePassport.slug,
        buyerName: 'Buyer ' + i,
        buyerContact: 'buyer' + i + '@test.com',
        message: 'Unique enquiry message number ' + i + ' for rate limit test.',
        quantityRequested: i,
        consentToBeContacted: true,
        formStartedAt: Date.now() - 3000,
      }, sourceIp);
      expect(res.success).toBe(true);
    }

    // 6th attempt must be rate-limited
    const sixth = await handler.handleSubmission({
      publicSlug: activePassport.slug,
      buyerName: 'Buyer 6',
      buyerContact: 'buyer6@test.com',
      message: 'Unique enquiry message number 6 exceeding rate limit.',
      consentToBeContacted: true,
      formStartedAt: Date.now() - 3000,
    }, sourceIp);

    expect(sixth.success).toBe(false);
    expect(sixth.errorCode).toBe('RATE_LIMITED');
  });
});
