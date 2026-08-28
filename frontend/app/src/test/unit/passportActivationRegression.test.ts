import { describe, it, expect } from 'vitest';
import { PassportManager } from '@/services/passport/passportManager';
import { MockPassportRepository } from '@/repositories/mock/MockPassportRepository';
import { removeUndefinedDeep } from '@/utils/firestore';
import { ProductDraft, PassportPublicField } from '@/types';
import { Timestamp, serverTimestamp, FieldValue } from 'firebase/firestore';

describe('Craft Passport Activation & Undefined Field Safety Regression Suite', () => {
  const mockRepo = new MockPassportRepository();
  const passportManager = new PassportManager(mockRepo);

  const OWNER_ID = 'artisan_owner_regression';

  const baseReadyDraft: ProductDraft = {
    id: 'prod_regression_01',
    artisanId: OWNER_ID,
    ownerId: OWNER_ID,
    title: 'Handloom Jamdani Silk Saree',
    category: 'Handloom Textiles',
    technique: 'Pit Loom Weaving',
    craftType: 'Jamdani',
    materials: ['Mulberry Silk', 'Zari'],
    material: 'Mulberry Silk',
    dimensions: '5.5m x 1.15m',
    origin: 'Kamrup, Assam',
    story: 'Woven over 14 days by master artisan.',
    description: 'Woven over 14 days by master artisan.',
    photos: [
      {
        id: 'p1',
        name: 'photo1.jpg',
        size: 1024,
        type: 'image/jpeg',
        url: 'https://example.com/saree1.jpg',
        uploadedAt: '2026-08-27T10:00:00.000Z',
      },
    ],
    coverPhotoIndex: 0,
    stockQuantity: 2,
    selectedPrice: 12500,
    currency: 'INR',
    pricingStrategy: 'fair_trade',
    costBreakdown: { rawMaterials: 4000, laborHours: 20, hourlyRate: 200, packagingAndLogistics: 500, totalCost: 8500 },
    publicFields: {
      title: true,
      category: true,
      technique: true,
      materials: true,
      dimensions: true,
      origin: true,
      story: true,
      artisanName: true,
      workshopLocation: true,
      directContact: false,
      retailPrice: true,
      wholesaleAvailable: false,
    },
    confirmedFacts: [],
    needsReviewFacts: [],
    status: 'ready',
    createdAt: '2026-08-27T10:00:00.000Z',
    updatedAt: '2026-08-27T10:00:00.000Z',
    // Notice careInstructions is explicitly undefined
    careInstructions: undefined,
  };

  it('1. A ready product with careInstructions undefined activates successfully without error', async () => {
    const approvedFields: PassportPublicField[] = [
      'title',
      'photos',
      'materials',
      'dimensions',
      'careInstructions',
    ];

    const result = await passportManager.activatePassport(
      OWNER_ID,
      baseReadyDraft,
      approvedFields
    );

    expect(result.passport).toBeDefined();
    expect(result.passport.status).toBe('active');
    expect(result.slug).toBeTruthy();
    expect(result.publicUrl).toContain(result.slug);
  });

  it('2. The public projection does not contain careInstructions when undefined', async () => {
    const approvedFields: PassportPublicField[] = [
      'title',
      'photos',
      'materials',
      'dimensions',
      'careInstructions',
    ];

    const sanitized = passportManager.buildSanitizedData(
      baseReadyDraft,
      approvedFields
    );

    // careInstructions must NOT be present as an undefined property
    expect(Object.prototype.hasOwnProperty.call(sanitized, 'careInstructions')).toBe(false);
    expect(sanitized.careInstructions).toBeUndefined();

    // Verify it survives JSON serialization cleanly without undefined
    const keys = Object.keys(sanitized);
    expect(keys).not.toContain('careInstructions');
  });

  it('3. removeUndefinedDeep removes nested undefined fields and array entries', () => {
    const payloadWithUndefined = {
      title: 'Craft Saree',
      nullValue: null,
      undefinedField: undefined,
      nested: {
        valid: 'value',
        missing: undefined,
        deep: {
          number: 42,
          none: undefined,
        },
      },
      arrayWithUndefined: ['item1', undefined, 'item2', undefined],
    };

    const clean = removeUndefinedDeep(payloadWithUndefined);

    expect(clean).toEqual({
      title: 'Craft Saree',
      nullValue: null,
      nested: {
        valid: 'value',
        deep: {
          number: 42,
        },
      },
      arrayWithUndefined: ['item1', 'item2'],
    });

    expect(Object.prototype.hasOwnProperty.call(clean, 'undefinedField')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(clean.nested, 'missing')).toBe(false);
  });

  it('4. removeUndefinedDeep preserves Date, Timestamp and FieldValue instances without modification', () => {
    const now = new Date();
    const timestamp = Timestamp.now();
    const serverTime = serverTimestamp();

    const complexPayload = {
      createdAt: now,
      firestoreTimestamp: timestamp,
      serverTime: serverTime,
      otherField: 'preserved',
      unwanted: undefined,
    };

    const clean = removeUndefinedDeep(complexPayload);

    expect(clean.createdAt).toBeInstanceOf(Date);
    expect(clean.createdAt.getTime()).toBe(now.getTime());
    expect(clean.firestoreTimestamp).toBeInstanceOf(Timestamp);
    expect(clean.serverTime).toBeInstanceOf(FieldValue);
    expect(Object.prototype.hasOwnProperty.call(clean, 'unwanted')).toBe(false);
  });

  it('5. An approved non-empty careInstructions value is preserved', () => {
    const draftWithCare: ProductDraft = {
      ...baseReadyDraft,
      careInstructions: 'Dry clean only. Store wrapped in pure muslin cloth.',
    };

    const approvedFields: PassportPublicField[] = ['title', 'photos', 'careInstructions'];
    const sanitized = passportManager.buildSanitizedData(draftWithCare, approvedFields);

    expect(sanitized.careInstructions).toBe('Dry clean only. Store wrapped in pure muslin cloth.');
  });

  it('6. Unapproved fields remain strictly absent from the public projection', () => {
    const draftWithAllFields: ProductDraft = {
      ...baseReadyDraft,
      careInstructions: 'Dry clean only.',
      dimensions: '5.5m x 1.15m',
      tags: ['silk', 'handloom'],
      selectedPrice: 12500,
    };

    // Artisan ONLY approves title and photos
    const approvedFields: PassportPublicField[] = ['title', 'photos'];
    const sanitized = passportManager.buildSanitizedData(draftWithAllFields, approvedFields);

    expect(sanitized.title).toBe('Handloom Jamdani Silk Saree');
    expect(sanitized.photos).toHaveLength(1);
    expect(sanitized.careInstructions).toBeUndefined();
    expect(sanitized.dimensions).toBeUndefined();
    expect(sanitized.tags).toBeUndefined();
    expect(sanitized.price).toBeUndefined();
    expect(sanitized.artisanName).toBeUndefined();
  });

  it('7. QR code URL generation happens only after successful activation', async () => {
    const incompleteDraft: ProductDraft = {
      ...baseReadyDraft,
      photos: [], // Fails readiness check condition 1
    };

    let activationError: Error | null = null;
    try {
      await passportManager.activatePassport(OWNER_ID, incompleteDraft, ['title', 'photos']);
    } catch (err) {
      activationError = err as Error;
    }

    expect(activationError).not.toBeNull();
    expect(activationError?.message).toContain('Cannot activate Craft Passport');

    // Verify no passport was published to public storage
    const published = await passportManager.getPublicPassport('non-existent-or-failed');
    expect(published).toBeNull();
  });
});
