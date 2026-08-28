import { describe, it, expect } from 'vitest';
import { PassportManager } from '@/services/passport/passportManager';
import { MockPassportRepository } from '@/repositories/mock/MockPassportRepository';
import { ProductDraft, PassportPublicField } from '@/types';

describe('Phase 10 — Passport Security & Privacy Isolation Gate', () => {
  const mockRepo = new MockPassportRepository();
  const passportManager = new PassportManager(mockRepo);

  const OWNER_ID = 'artisan_owner_101';

  const validReadyDraft: ProductDraft = {
    id: 'prod_valid_101',
    artisanId: OWNER_ID,
    ownerId: OWNER_ID,
    title: 'Assam Muga Silk Mekhela Chador',
    titleHindi: 'असम मूगा रेशम मेखेला चादर',
    category: 'Handloom Textiles',
    subcategory: 'Mekhela Chador',
    technique: 'Traditional Handloom Weaving',
    craftType: 'Muga Silk',
    materials: ['Pure Golden Muga Silk', 'Natural Dyes'],
    material: 'Pure Golden Muga Silk',
    colour: 'Golden Amber',
    dimensions: '4.5m x 1m',
    origin: 'Sualkuchi, Assam',
    story: 'Woven from indigenous golden silk unique to the Brahmaputra valley.',
    description: 'Woven from indigenous golden silk unique to the Brahmaputra valley.',
    photos: [
      { id: 'p1', name: 'photo1.jpg', size: 1024, type: 'image/jpeg', url: 'https://example.com/muga1.jpg', uploadedAt: '2026-08-27T10:00:00.000Z' },
    ],
    coverPhotoIndex: 0,
    stockQuantity: 2,
    sku: 'MUG-SUAL-001',
    tags: ['Muga Silk', 'Assam', 'Handloom'],
    makingTime: '15 Days',
    careInstructions: 'Dry clean only. Store wrapped in muslin.',
    costBreakdown: { rawMaterials: 6000, laborHours: 30, hourlyRate: 200, packagingAndLogistics: 500, totalCost: 12500 },
    selectedPrice: 18500,
    currency: 'INR',
    pricingStrategy: 'fair_trade',
    publicFields: {
      title: true, category: true, technique: true, materials: true,
      dimensions: true, origin: true, story: true, artisanName: true,
      workshopLocation: true, directContact: false, retailPrice: true, wholesaleAvailable: false,
    },
    confirmedFacts: [],
    needsReviewFacts: [],
    status: 'ready',
    createdAt: '2026-08-27T10:00:00.000Z',
    updatedAt: '2026-08-27T10:00:00.000Z',
  };

  it('1. Non-ready products cannot activate a Craft Passport', async () => {
    const incompleteDraft: ProductDraft = {
      ...validReadyDraft,
      photos: [], // Missing photos (fails condition 1)
    };

    const approvedFields: PassportPublicField[] = ['title', 'photos', 'materials'];

    await expect(
      passportManager.activatePassport(OWNER_ID, incompleteDraft, approvedFields)
    ).rejects.toThrow(/Cannot activate Craft Passport/);
  });

  it('2. Only approved fields enter the public projection', async () => {
    const approvedFields: PassportPublicField[] = ['title', 'materials', 'origin' as PassportPublicField];
    const artisanProfile = {
      id: OWNER_ID,
      name: 'Rupali Das',
      phone: '+91 9876543210',
      role: 'artisan' as const,
      craftType: 'Muga Silk',
      location: 'Sualkuchi, Assam',
      avatarUrl: '',
      workshopName: 'Rupali Silk Loom',
      bio: 'Master weaver',
      joinedYear: 2012,
    };

    const sanitized = passportManager.buildSanitizedData(validReadyDraft, approvedFields, artisanProfile);

    // Approved fields are present
    expect(sanitized.title).toBe('Assam Muga Silk Mekhela Chador');
    expect(sanitized.materials).toEqual(['Pure Golden Muga Silk', 'Natural Dyes']);

    // Unapproved fields are omitted
    expect(sanitized.artisanName).toBeUndefined();
    expect(sanitized.artisanStory).toBeUndefined();
    expect(sanitized.price).toBeUndefined();
    expect(sanitized.dimensions).toBeUndefined();
  });

  it('3. Sensitive fields never enter the public projection', async () => {
    const approvedFields: PassportPublicField[] = [
      'title', 'description', 'photos', 'category', 'technique', 'materials',
      'dimensions', 'careInstructions', 'tags', 'price', 'artisanName', 'story', 'location', 'contactOption'
    ];

    const artisanProfile = {
      id: OWNER_ID,
      name: 'Rupali Das',
      phone: '+91 9876543210',
      role: 'artisan' as const,
      craftType: 'Muga Silk',
      location: 'Sualkuchi, Assam',
      avatarUrl: '',
      workshopName: 'Rupali Silk Loom',
      bio: 'Master weaver',
      joinedYear: 2012,
    };

    const sanitized = passportManager.buildSanitizedData(validReadyDraft, approvedFields, artisanProfile);
    const sanitizedJson = JSON.stringify(sanitized);

    // Must NOT contain internal UID, phone, cost calculations, or sensitive metadata
    expect(sanitizedJson).not.toContain(OWNER_ID);
    expect(sanitizedJson).not.toContain('+91 9876543210');
    expect(sanitizedJson).not.toContain('rawMaterials');
    expect(sanitizedJson).not.toContain('hourlyRate');
    expect(sanitizedJson).not.toContain('totalCost');
  });

  it('4. Public active Craft Passport loads without authentication', async () => {
    const approvedFields: PassportPublicField[] = ['title', 'photos', 'materials', 'price', 'artisanName'];
    const { slug } = await passportManager.activatePassport(
      OWNER_ID,
      validReadyDraft,
      approvedFields,
      { name: 'Rupali Das' }
    );

    const publicPassport = await passportManager.getPublicPassport(slug);
    expect(publicPassport).not.toBeNull();
    expect(publicPassport?.status).toBe('active');
    expect(publicPassport?.publicData.title).toBe('Assam Muga Silk Mekhela Chador');
  });

  it('5. Revocation immediately prevents public product data access', async () => {
    const approvedFields: PassportPublicField[] = ['title', 'photos', 'materials'];
    const { passport, slug } = await passportManager.activatePassport(
      OWNER_ID,
      validReadyDraft,
      approvedFields
    );

    // Verify it is initially active
    let publicView = await passportManager.getPublicPassport(slug);
    expect(publicView?.status).toBe('active');
    expect(publicView?.publicData.title).toBeTruthy();

    // Revoke
    await passportManager.revokePassport(OWNER_ID, passport.id);

    // Verify public view status is revoked and publicData is stripped
    publicView = await passportManager.getPublicPassport(slug);
    expect(publicView?.status).toBe('revoked');
    expect(publicView?.publicData.title).toBe('');
    expect(publicView?.publicData.photos).toHaveLength(0);
  });
});
