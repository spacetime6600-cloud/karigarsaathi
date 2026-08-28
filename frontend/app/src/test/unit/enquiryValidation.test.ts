import { describe, it, expect, beforeEach } from 'vitest';
import {
  EnquirySubmissionService,
  ENQUIRY_ABUSE_CONFIG,
} from '@/services/enquiries/enquirySubmissionService';
import { MockPassportRepository } from '@/repositories/mock/MockPassportRepository';
import { MockProductRepository } from '@/repositories/mock/MockProductRepository';
import { MockEnquiryRepository } from '@/repositories/mock/MockEnquiryRepository';
import { PublicCraftPassport } from '@/types';
import { ProductRecord } from '@/domain/products';

describe('Buyer Enquiry Validation & Abuse Controls Suite', () => {
  let passportRepo: MockPassportRepository;
  let productRepo: MockProductRepository;
  let enquiryRepo: MockEnquiryRepository;
  let service: EnquirySubmissionService;

  const validPublicPassport: PublicCraftPassport = {
    slug: 'silk-saree-slug-123',
    passportId: 'KP_SILK_123',
    productId: 'prod_silk_123',
    ownerId: 'artisan_owner_1',
    status: 'active',
    snapshotVersion: 1,
    publicData: {
      title: 'Heritage Assamese Silk Saree',
      photos: ['https://example.com/saree.jpg'],
      category: 'Textiles',
      price: 14000,
      currency: 'INR',
      artisanName: 'Ravi Kumar',
    },
    activatedAt: '2026-08-27T10:00:00Z',
    updatedAt: '2026-08-27T10:00:00Z',
  };

  const validProduct: ProductRecord = {
    id: 'prod_silk_123',
    ownerId: 'artisan_owner_1',
    title: 'Heritage Assamese Silk Saree',
    description: 'Authentic handcrafted silk saree.',
    category: 'Textiles',
    craftType: 'Silk Weaving',
    state: 'Assam',
    price: 14000,
    currency: 'INR',
    stockQuantity: 3,
    status: 'ready',
    photoPaths: ['p1.jpg'],
    createdAt: '2026-08-27T10:00:00Z',
    updatedAt: '2026-08-27T10:00:00Z',
  };

  beforeEach(async () => {
    passportRepo = new MockPassportRepository();
    productRepo = new MockProductRepository();
    enquiryRepo = new MockEnquiryRepository();

    await passportRepo.createOrUpdatePublicPassport(validPublicPassport);
    await productRepo.createProduct(validProduct.ownerId, validProduct);

    service = new EnquirySubmissionService(passportRepo, productRepo, enquiryRepo);
  });

  it('1. Successfully submits a valid structured enquiry with explicit consent', async () => {
    const result = await service.submitStructuredEnquiry({
      publicSlug: 'silk-saree-slug-123',
      buyerName: 'Priya Sharma',
      buyerContact: '+91 9876543210',
      buyerOrganisation: 'Heritage Boutique',
      destinationCity: 'Mumbai',
      quantityRequested: 2,
      targetPrice: 13500,
      message: 'Looking for 2 pure silk sarees for our upcoming bridal showcase.',
      preferredContactMethod: 'whatsapp',
      consentToBeContacted: true,
      formStartedAt: Date.now() - 3000, // 3s ago
    });

    expect(result.success).toBe(true);
    expect(result.enquiryId).toBeDefined();
    expect(result.status).toBe('new');

    const storedEnquiries = await enquiryRepo.listArtisanEnquiries('artisan_owner_1');
    expect(storedEnquiries.length).toBe(1);
    expect(storedEnquiries[0].buyerName).toBe('Priya Sharma');
    expect(storedEnquiries[0].artisanId).toBe('artisan_owner_1');
  });

  it('2. Rejects submission when honeypot field is filled by bot', async () => {
    const result = await service.submitStructuredEnquiry({
      publicSlug: 'silk-saree-slug-123',
      buyerName: 'Spam Bot',
      buyerContact: 'bot@spam.com',
      message: 'Cheap sunglasses deals',
      consentToBeContacted: true,
      honeypot: 'http://spam-link.com',
      formStartedAt: Date.now() - 5000,
    });

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('BOT_DETECTED');
  });

  it('3. Rejects submission when form is completed too fast (< 2 seconds)', async () => {
    const result = await service.submitStructuredEnquiry({
      publicSlug: 'silk-saree-slug-123',
      buyerName: 'Fast Bot',
      buyerContact: 'fast@bot.com',
      message: 'Immediate submission',
      consentToBeContacted: true,
      formStartedAt: Date.now() - 500, // Only 500ms
    });

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('BOT_DETECTED');
  });

  it('4. Rejects submission when explicit contact consent is missing', async () => {
    const result = await service.submitStructuredEnquiry({
      publicSlug: 'silk-saree-slug-123',
      buyerName: 'Ananya Deshmukh',
      buyerContact: 'ananya@example.com',
      message: 'Interested in silk weave.',
      consentToBeContacted: false, // Not granted
      formStartedAt: Date.now() - 4000,
    });

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('INVALID_INPUT');
    expect(result.message).toContain('consent to be contacted');
  });

  it('5. Suppresses duplicate submissions within the 10-minute duplicate window', async () => {
    const payload = {
      publicSlug: 'silk-saree-slug-123',
      buyerName: 'Kiran Sen',
      buyerContact: '+91 98450 11223',
      message: 'Wholesale inquiry for craft exhibition.',
      consentToBeContacted: true,
      formStartedAt: Date.now() - 4000,
    };

    // First submission
    const res1 = await service.submitStructuredEnquiry(payload, 'src_kiran_ip');
    expect(res1.success).toBe(true);

    // Second submission immediately after
    const res2 = await service.submitStructuredEnquiry(payload, 'src_kiran_ip');
    expect(res2.success).toBe(false);
    expect(res2.errorCode).toBe('DUPLICATE');
  });

  it('6. Enforces rate-limiting when source submits more than allowed limit in 15 minutes', async () => {
    const makePayload = (i: number) => ({
      publicSlug: 'silk-saree-slug-123',
      buyerName: `Buyer ${i}`,
      buyerContact: `buyer${i}@example.com`,
      message: `Enquiry message number ${i}`,
      consentToBeContacted: true,
      formStartedAt: Date.now() - 3000,
    });

    // Submit 5 times (allowed)
    for (let i = 1; i <= ENQUIRY_ABUSE_CONFIG.MAX_PER_SOURCE_15_MIN; i++) {
      const res = await service.submitStructuredEnquiry(makePayload(i), 'rate_limited_ip');
      expect(res.success).toBe(true);
    }

    // 6th submission should trigger RATE_LIMITED
    const res6 = await service.submitStructuredEnquiry(makePayload(6), 'rate_limited_ip');
    expect(res6.success).toBe(false);
    expect(res6.errorCode).toBe('RATE_LIMITED');
  });
});
