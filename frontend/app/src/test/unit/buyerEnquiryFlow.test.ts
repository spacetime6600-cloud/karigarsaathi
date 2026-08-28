import { describe, it, expect, beforeEach } from 'vitest';
import { EnquirySubmissionService } from '@/services/enquiries/enquirySubmissionService';
import { MockPassportRepository } from '@/repositories/mock/MockPassportRepository';
import { MockProductRepository } from '@/repositories/mock/MockProductRepository';
import { MockEnquiryRepository } from '@/repositories/mock/MockEnquiryRepository';
import { PublicCraftPassport } from '@/types';
import { ProductRecord } from '@/domain/products';

describe('Buyer Enquiry Flow & Server-Authoritative Routing Suite', () => {
  let passportRepo: MockPassportRepository;
  let productRepo: MockProductRepository;
  let enquiryRepo: MockEnquiryRepository;
  let service: EnquirySubmissionService;

  const artisanAUid = 'artisan_A_real_uid';
  const artisanBUid = 'artisan_B_spoofed_uid';

  const activePassport: PublicCraftPassport = {
    slug: 'assam-silk-saree-authentic',
    passportId: 'KP_ASSAM_001',
    productId: 'prod_assam_saree_01',
    ownerId: artisanAUid, // Genuine owner in trusted Firestore snapshot
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
    status: 'shared',
    photoPaths: ['photo_01.jpg'],
    createdAt: '2026-08-27T10:00:00Z',
    updatedAt: '2026-08-27T10:00:00Z',
  };

  beforeEach(async () => {
    passportRepo = new MockPassportRepository();
    productRepo = new MockProductRepository();
    enquiryRepo = new MockEnquiryRepository();

    await passportRepo.createOrUpdatePublicPassport(activePassport);
    await passportRepo.createOrUpdatePublicPassport(revokedPassport);
    await productRepo.createProduct(artisanAUid, readyProduct);

    service = new EnquirySubmissionService(passportRepo, productRepo, enquiryRepo);
  });

  it('1. Resolves destination artisan on server and ignores client attempts to spoof artisanId', async () => {
    // Client sends an enquiry payload with a spoofed artisanId
    const result = await service.submitStructuredEnquiry({
      publicSlug: 'assam-silk-saree-authentic',
      buyerName: 'Anita Roy',
      buyerContact: 'anita@boutique.in',
      message: 'Looking to purchase 2 pieces.',
      consentToBeContacted: true,
      formStartedAt: Date.now() - 3000,
      // Attempting to inject spoofed fields:
      ...({ artisanId: artisanBUid, ownerId: artisanBUid } as unknown as Record<string, unknown>),
    });

    expect(result.success).toBe(true);
    expect(result.enquiryId).toBeDefined();

    // Verify stored enquiry belongs strictly to Artisan A (resolved from server passport projection)
    const storedEnquiries = await enquiryRepo.listArtisanEnquiries(artisanAUid);
    expect(storedEnquiries.length).toBe(1);
    expect(storedEnquiries[0].artisanId).toBe(artisanAUid);

    // Verify Artisan B received zero enquiries
    const artisanBEnquiries = await enquiryRepo.listArtisanEnquiries(artisanBUid);
    expect(artisanBEnquiries.length).toBe(0);
  });

  it('2. Transactionally updates product lifecycle status to enquiry_received with audit trail', async () => {
    await service.submitStructuredEnquiry({
      publicSlug: 'assam-silk-saree-authentic',
      buyerName: 'Anita Roy',
      buyerContact: 'anita@boutique.in',
      message: 'Looking to purchase 2 pieces.',
      consentToBeContacted: true,
      formStartedAt: Date.now() - 3000,
    });

    const updatedProduct = await productRepo.getOwnedProductById(artisanAUid, 'prod_assam_saree_01');
    expect(updatedProduct).toBeDefined();
    expect(updatedProduct?.status).toBe('enquiry_received');
    expect(updatedProduct?.statusHistory).toBeDefined();
    expect(updatedProduct?.statusHistory?.length).toBeGreaterThan(0);
    expect(updatedProduct?.statusHistory?.[0].newStatus).toBe('enquiry_received');
  });

  it('3. Rejects enquiry submission when Craft Passport is revoked', async () => {
    const result = await service.submitStructuredEnquiry({
      publicSlug: 'revoked-craft-passport',
      buyerName: 'Anita Roy',
      buyerContact: 'anita@boutique.in',
      message: 'Inquiring about revoked item.',
      consentToBeContacted: true,
      formStartedAt: Date.now() - 3000,
    });

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('REVOKED_PASSPORT');
    expect(result.message).toContain('revoked by the artisan');
  });

  it('4. Rejects enquiry submission when passport slug does not exist', async () => {
    const result = await service.submitStructuredEnquiry({
      publicSlug: 'non-existent-craft-slug',
      buyerName: 'Anita Roy',
      buyerContact: 'anita@boutique.in',
      message: 'Inquiring about missing item.',
      consentToBeContacted: true,
      formStartedAt: Date.now() - 3000,
    });

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('NOT_FOUND');
  });
});
