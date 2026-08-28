import { describe, it, expect } from 'vitest';
import { draftToProductRecord } from '@/domain/products';
import { removeUndefinedDeep, findUndefinedPaths } from '@/utils/firestore';
import { ProductDraft } from '@/types';
import { MockProductRepository } from '@/repositories/mock/MockProductRepository';
import { Timestamp, serverTimestamp, doc } from 'firebase/firestore';
import { db } from '@/config/firebase';

describe('Firestore Product Persistence & Undefined Safety Regression Suite', () => {
  const mockRepo = new MockProductRepository();
  const OWNER_ID = 'artisan_persistence_test';

  const baseDraftWithUndefined: ProductDraft = {
    id: 'draft_test_pers_01',
    artisanId: OWNER_ID,
    ownerId: OWNER_ID,
    title: 'Handmade Dokra Brass Figurine',
    category: 'Metalwork & Brass',
    technique: 'Lost-Wax Casting',
    craftType: 'Dokra',
    material: 'Bell Metal Brass',
    materials: ['Bell Metal Brass', 'Beeswax'],
    origin: 'Bastar, Chhattisgarh',
    story: 'Centuries-old tribal lost-wax bell metal casting.',
    description: 'Centuries-old tribal lost-wax bell metal casting.',
    photos: [
      {
        id: 'p1',
        url: 'https://example.com/dokra.jpg',
        name: 'dokra1.jpg',
        size: 2048,
        type: 'image/jpeg',
        uploadedAt: '2026-08-27T10:00:00.000Z',
      },
    ],
    coverPhotoIndex: 0,
    stockQuantity: 5,
    selectedPrice: 4200,
    currency: 'INR',
    costBreakdown: {
      rawMaterials: 1500,
      laborHours: 10,
      hourlyRate: 150,
      packagingAndLogistics: 300,
      totalCost: 3300,
    },
    pricingStrategy: 'fair_trade',
    publicFields: {
      title: true,
      category: true,
      technique: true,
      materials: true,
      dimensions: false,
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
    status: 'draft',
    createdAt: '2026-08-27T10:00:00.000Z',
    updatedAt: '2026-08-27T10:00:00.000Z',
    // Optional properties intentionally left undefined:
    dimensions: undefined as unknown as string,
    dimensionsObj: undefined,
    weightObj: undefined,
    careInstructions: undefined,
    subcategory: undefined,
    titleHindi: undefined,
    descriptionHindi: undefined,
    sku: undefined,
    makingTime: undefined,
    customisationAvailable: undefined,
    shippingNotes: undefined,
    voiceNoteUrl: undefined,
    voiceTranscript: undefined,
    voiceConfidence: undefined,
    passportId: undefined,
    passportStatus: undefined,
    passportSlug: undefined,
    lifecycleStatus: undefined,
    archivedAt: undefined,
    duplicatedFrom: undefined,
  };

  it('1. draftToProductRecord omits optional undefined properties completely', () => {
    const record = draftToProductRecord(baseDraftWithUndefined, OWNER_ID);

    expect(record.id).toBe('draft_test_pers_01');
    expect(record.title).toBe('Handmade Dokra Brass Figurine');
    expect(record.ownerId).toBe(OWNER_ID);

    // Verify undefined properties are NOT present as keys
    const undefinedPaths = findUndefinedPaths(record);
    expect(undefinedPaths).toHaveLength(0);

    expect(Object.prototype.hasOwnProperty.call(record, 'careInstructions')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(record, 'dimensions')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(record, 'titleHindi')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(record, 'sku')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(record, 'voiceNoteUrl')).toBe(false);
  });

  it('2. removeUndefinedDeep removes nested undefined object properties', () => {
    const nestedObject = {
      title: 'Craft Object',
      images: [
        {
          id: 'img_1',
          originalPath: 'users/123/p1.jpg',
          displayPath: undefined,
          cropInfo: {
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            rotation: undefined,
          },
        },
      ],
      cost: {
        total: 500,
        breakdown: undefined,
      },
    };

    const clean = removeUndefinedDeep(nestedObject);

    expect(clean.images[0].displayPath).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(clean.images[0], 'displayPath')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(clean.images[0].cropInfo, 'rotation')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(clean.cost, 'breakdown')).toBe(false);
    expect(clean.cost.total).toBe(500);
  });

  it('3. removeUndefinedDeep filters undefined array entries', () => {
    const arrayData = {
      tags: ['brass', undefined, 'dokra', undefined, 'handmade'],
    };

    const clean = removeUndefinedDeep(arrayData);
    expect(clean.tags).toEqual(['brass', 'dokra', 'handmade']);
  });

  it('4. removeUndefinedDeep preserves Timestamp, serverTimestamp, and DocumentReference values', () => {
    const ts = Timestamp.now();
    const serverTs = serverTimestamp();
    const docRef = doc(db, 'products', 'test_doc_ref');

    const complex = {
      createdAt: ts,
      updatedAt: serverTs,
      ref: docRef,
      normal: 'ok',
      unwanted: undefined,
    };

    const clean = removeUndefinedDeep(complex);

    expect(clean.createdAt).toBe(ts);
    expect(clean.updatedAt).toBe(serverTs);
    expect(clean.ref).toBe(docRef);
    expect(Object.prototype.hasOwnProperty.call(clean, 'unwanted')).toBe(false);
  });

  it('5. removeUndefinedDeep preserves explicit null values', () => {
    const nullPayload = {
      title: 'Valid Saree',
      archivedAt: null,
      deletedField: null,
    };

    const clean = removeUndefinedDeep(nullPayload);
    expect(clean.archivedAt).toBeNull();
    expect(clean.deletedField).toBeNull();
    expect(clean.title).toBe('Valid Saree');
  });

  it('6. findUndefinedPaths accurately reports paths of all undefined fields', () => {
    const dirtyData = {
      a: 1,
      b: undefined,
      c: {
        d: 'ok',
        e: undefined,
      },
      list: ['val', undefined],
    };

    const paths = findUndefinedPaths(dirtyData);
    expect(paths).toContain('root.b');
    expect(paths).toContain('root.c.e');
    expect(paths).toContain('root.list[1]');
    expect(paths).toHaveLength(3);
  });

  it('7. Product creation succeeds through repository with undefined inputs', async () => {
    const recordPayload = draftToProductRecord(baseDraftWithUndefined, OWNER_ID);
    const created = await mockRepo.createProduct(OWNER_ID, recordPayload);

    expect(created.id).toBe('draft_test_pers_01');
    expect(created.title).toBe('Handmade Dokra Brass Figurine');
    expect(created.price).toBe(4200);

    const fetched = await mockRepo.getOwnedProductById(OWNER_ID, created.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.title).toBe('Handmade Dokra Brass Figurine');
  });

  it('8. A 10/10 valid product persists and transitions status to ready', async () => {
    const readyDraft: ProductDraft = {
      ...baseDraftWithUndefined,
      dimensions: '15cm x 8cm x 22cm',
      status: 'ready',
      completionState: {
        isReady: true,
        completedAt: new Date().toISOString(),
      },
    };

    const recordPayload = draftToProductRecord(readyDraft, OWNER_ID);
    const updated = await mockRepo.createProduct(OWNER_ID, recordPayload);

    expect(updated.status).toBe('ready');
    expect(updated.completionState?.isReady).toBe(true);

    const check = findUndefinedPaths(updated);
    expect(check).toHaveLength(0);
  });
});
