import { describe, it, expect } from 'vitest';
import { MULTILINGUAL_PRODUCT_FIXTURES } from '@/test/fixtures/multilingualProducts';
import { validateProductForReadiness } from '@/domain/products/validation';
import { draftToProductRecord } from '@/domain/products';
import { ProductDraft } from '@/types';

describe('Indic Script & Multilingual Preservation Quality Gate', () => {
  const languages = ['en', 'hi', 'or', 'bn', 'te'] as const;

  it('1. Contains complete valid fixtures for all 5 target Indic languages', () => {
    for (const lang of languages) {
      const fixture = MULTILINGUAL_PRODUCT_FIXTURES[lang];
      expect(fixture).toBeDefined();
      expect(fixture.languageCode).toBe(lang);
      expect(fixture.title.length).toBeGreaterThan(5);
      expect(fixture.description.length).toBeGreaterThan(10);
      expect(fixture.materials.length).toBeGreaterThanOrEqual(1);
      expect(fixture.craftType.length).toBeGreaterThan(2);
    }
  });

  it('2. Preserves Unicode Indic characters through Draft -> Record conversion', () => {
    for (const lang of languages) {
      const fixture = MULTILINGUAL_PRODUCT_FIXTURES[lang];
      const draft: ProductDraft = {
        id: `draft_indic_${lang}`,
        ownerId: 'artisan_indic_test',
        artisanId: 'artisan_indic_test',
        title: fixture.title,
        category: fixture.category,
        technique: fixture.craftType,
        craftType: fixture.craftType,
        origin: fixture.state,
        materials: fixture.materials,
        material: fixture.materials.join(', '),
        dimensions: fixture.dimensions,
        coverPhotoIndex: 0,
        story: fixture.story,
        selectedPrice: fixture.price,
        confirmedFacts: [],
        needsReviewFacts: [],
        costBreakdown: {
          rawMaterials: 3800,
          laborHours: 42,
          hourlyRate: 150,
          packagingAndLogistics: 450,
          totalCost: 10550,
        },
        pricingStrategy: 'fair_trade',
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
          directContact: true,
          retailPrice: true,
          wholesaleAvailable: false,
        },
        photos: [
          {
            id: 'photo_1',
            url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800',
            name: 'photo_1.jpg',
            size: 50000,
            type: 'image/jpeg',
            uploadedAt: new Date().toISOString(),
            isCover: true,
          },
        ],
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        schemaVersion: 1,
      };

      const record = draftToProductRecord(draft, 'artisan_indic_test');

      // Verify exact Unicode string fidelity (no garbling / mojibake)
      expect(record.title).toBe(fixture.title);
      expect(record.story).toBe(fixture.story);
      expect(record.category).toBe(fixture.category);
      expect(record.craftType).toBe(fixture.craftType);
      expect(record.materials).toEqual(fixture.materials);
    }
  });

  it('3. Successfully passes 10-point readiness gate across all Indic languages', () => {
    for (const lang of languages) {
      const fixture = MULTILINGUAL_PRODUCT_FIXTURES[lang];
      const draft: ProductDraft = {
        id: `draft_indic_ready_${lang}`,
        ownerId: 'artisan_indic_test',
        artisanId: 'artisan_indic_test',
        title: fixture.title,
        category: fixture.category,
        technique: fixture.craftType,
        craftType: fixture.craftType,
        origin: fixture.state,
        materials: fixture.materials,
        material: fixture.materials.join(', '),
        dimensions: fixture.dimensions,
        story: fixture.story,
        selectedPrice: fixture.price,
        stockQuantity: 5,
        coverPhotoIndex: 0,
        primaryImageId: 'photo_cover',
        confirmedFacts: [],
        needsReviewFacts: [],
        costBreakdown: {
          rawMaterials: 3800,
          laborHours: 42,
          hourlyRate: 150,
          packagingAndLogistics: 450,
          totalCost: 10550,
        },
        pricingStrategy: 'fair_trade',
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
          directContact: true,
          retailPrice: true,
          wholesaleAvailable: false,
        },
        photos: [
          {
            id: 'photo_cover',
            url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800',
            name: 'photo_cover.jpg',
            size: 50000,
            type: 'image/jpeg',
            uploadedAt: new Date().toISOString(),
            isCover: true,
          },
        ],
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        schemaVersion: 1,
      };

      const readiness = validateProductForReadiness(draft);
      expect(readiness.isReady).toBe(true);
      expect(readiness.errors.length).toBe(0);
    }
  });
});

