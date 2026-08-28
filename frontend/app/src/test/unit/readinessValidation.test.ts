import { describe, it, expect } from 'vitest';
import { validateProductForReadiness } from '@/domain/products/validation';
import { ProductDraft } from '@/types';

describe('Phase 9 Final Listing-Readiness Validation Gate (10-Point Checklist)', () => {
  const completeValidDraft: ProductDraft = {
    id: 'prod_valid_123',
    artisanId: 'artisan_test_uid',
    title: 'Handloom Pure Silk Jamdani Saree',
    titleHindi: 'हथकरघा रेशम जामदानी साड़ी',
    category: 'Handloom Textiles',
    subcategory: 'Sarees',
    technique: 'Jamdani Weaving',
    craftType: 'Jamdani',
    materials: ['Mulberry Silk', 'Natural Indigo Dye'],
    material: 'Mulberry Silk',
    colour: 'Indigo & Terracotta',
    dimensions: '5.5m x 1.15m',
    origin: 'Kamrup, Assam',
    story: 'Woven completely on a pit loom over 18 days celebrating river heritage.',
    description: 'Woven completely on a pit loom over 18 days celebrating river heritage.',
    photos: [
      { id: 'p1', name: 'photo1.jpg', size: 1024, type: 'image/jpeg', url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c', uploadedAt: '2026-08-27T10:00:00.000Z' },
    ],
    images: [
      {
        id: 'img_1',
        originalPath: 'users/artisan_test_uid/products/prod_valid_123/originals/p1.jpg',
        displayPath: 'users/artisan_test_uid/products/prod_valid_123/display/p1.webp',
        fileName: 'photo1.jpg',
        contentType: 'image/jpeg',
        originalSize: 1024,
        displaySize: 512,
        width: 1600,
        height: 1200,
        uploadStatus: 'completed',
        createdAt: '2026-08-27T10:00:00.000Z',
      },
    ],
    coverPhotoIndex: 0,
    primaryImageId: 'img_1',
    stockQuantity: 3,
    sku: 'JAM-SILK-001',
    tags: ['Silk', 'Jamdani', 'Handloom'],
    makingTime: '18 Days',
    careInstructions: 'Dry clean only',
    customisationAvailable: true,
    shippingNotes: 'Ships in wooden craft box',
    costBreakdown: { rawMaterials: 4000, laborHours: 20, hourlyRate: 200, packagingAndLogistics: 500, totalCost: 8500 },
    selectedPrice: 14500,
    currency: 'INR',
    pricingStrategy: 'fair_trade',
    publicFields: {
      title: true, category: true, technique: true, materials: true,
      dimensions: true, origin: true, story: true, artisanName: true,
      workshopLocation: true, directContact: true, retailPrice: true, wholesaleAvailable: false,
    },
    confirmedFacts: [],
    needsReviewFacts: [],
    status: 'draft',
    createdAt: '2026-08-27T10:00:00.000Z',
    updatedAt: '2026-08-27T10:00:00.000Z',
  };

  it('1. Passes when all 10 readiness criteria are fully satisfied', () => {
    const result = validateProductForReadiness(completeValidDraft);
    expect(result.isReady).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('2. Fails when photograph is missing', () => {
    const draft = { ...completeValidDraft, photos: [], images: [] };
    const result = validateProductForReadiness(draft);
    expect(result.isReady).toBe(false);
    expect(result.errors.some((e) => e.field === 'photos')).toBe(true);
    expect(result.errors.find((e) => e.field === 'photos')?.stepUrl).toBe('/artisan/products/new/photos');
  });

  it('3. Fails when primary cover image is not selected', () => {
    const draft = { ...completeValidDraft, coverPhotoIndex: -1, primaryImageId: undefined };
    const result = validateProductForReadiness(draft);
    expect(result.isReady).toBe(false);
    expect(result.errors.some((e) => e.field === 'primaryImage')).toBe(true);
  });

  it('4. Fails when any image upload is pending or failed', () => {
    const draft: ProductDraft = {
      ...completeValidDraft,
      images: [
        {
          id: 'img_failed',
          originalPath: '',
          displayPath: '',
          fileName: 'bad.jpg',
          contentType: 'image/jpeg',
          originalSize: 500,
          displaySize: 0,
          uploadStatus: 'failed',
          createdAt: '2026-08-27T10:00:00.000Z',
        },
      ],
    };
    const result = validateProductForReadiness(draft);
    expect(result.isReady).toBe(false);
    expect(result.errors.some((e) => e.field === 'imageUploadStatus')).toBe(true);
  });

  it('5. Fails when title is missing or whitespace only', () => {
    const draft = { ...completeValidDraft, title: '   ' };
    const result = validateProductForReadiness(draft);
    expect(result.isReady).toBe(false);
    expect(result.errors.some((e) => e.field === 'title')).toBe(true);
    expect(result.errors.find((e) => e.field === 'title')?.stepUrl).toBe('/artisan/products/new/details');
  });

  it('6. Fails when description/story is missing or whitespace only', () => {
    const draft = { ...completeValidDraft, story: '', description: '   ' };
    const result = validateProductForReadiness(draft);
    expect(result.isReady).toBe(false);
    expect(result.errors.some((e) => e.field === 'description')).toBe(true);
  });

  it('7. Fails when category is missing', () => {
    const draft = { ...completeValidDraft, category: '' };
    const result = validateProductForReadiness(draft);
    expect(result.isReady).toBe(false);
    expect(result.errors.some((e) => e.field === 'category')).toBe(true);
  });

  it('8. Fails when craft technique / craftType is missing', () => {
    const draft = { ...completeValidDraft, technique: '', craftType: '' };
    const result = validateProductForReadiness(draft);
    expect(result.isReady).toBe(false);
    expect(result.errors.some((e) => e.field === 'craftType')).toBe(true);
  });

  it('9. Fails when raw materials are empty', () => {
    const draft = { ...completeValidDraft, materials: [], material: '' };
    const result = validateProductForReadiness(draft);
    expect(result.isReady).toBe(false);
    expect(result.errors.some((e) => e.field === 'materials')).toBe(true);
  });

  it('10. Fails when retail price is negative or NaN or undefined', () => {
    const draft1 = { ...completeValidDraft, selectedPrice: -100, price: -100 };
    expect(validateProductForReadiness(draft1).isReady).toBe(false);

    const draft2 = { ...completeValidDraft, selectedPrice: NaN };
    expect(validateProductForReadiness(draft2).isReady).toBe(false);
  });

  it('11. Fails when stock quantity is negative, fractional, or undefined', () => {
    const draft1 = { ...completeValidDraft, stockQuantity: -1 };
    expect(validateProductForReadiness(draft1).isReady).toBe(false);

    const draft2 = { ...completeValidDraft, stockQuantity: 2.5 };
    expect(validateProductForReadiness(draft2).isReady).toBe(false);

    const draft3 = { ...completeValidDraft, stockQuantity: undefined };
    expect(validateProductForReadiness(draft3).isReady).toBe(false);
  });
});
