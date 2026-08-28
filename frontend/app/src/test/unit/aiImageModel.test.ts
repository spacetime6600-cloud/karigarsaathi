import { describe, it, expect } from 'vitest';
import { draftToProductRecord, productRecordToDraft } from '@/domain/products';
import { validateProductForReadiness } from '@/domain/products/validation';
import { ProductDraft } from '@/types';

describe('AI Image Data Model & Compatibility', () => {
  const sampleDraft: ProductDraft = {
    id: 'prod_test_001',
    artisanId: 'artisan_user_1',
    ownerId: 'artisan_user_1',
    title: 'Handloom Sambalpuri Silk Ikat Saree',
    category: 'Handloom Textiles',
    technique: 'Traditional Handloom Ikat',
    material: 'Pure Silk',
    materials: ['Pure Silk', 'Natural Vegetable Dyes'],
    origin: 'Odisha, India',
    dimensions: '5.5m x 1.2m',
    story: 'Authentic handwoven saree crafted by master artisans over 14 days.',
    selectedPrice: 12500,
    currency: 'INR',
    pricingStrategy: 'fair_trade',
    costBreakdown: {
      rawMaterials: 4000,
      laborHours: 35,
      hourlyRate: 200,
      packagingAndLogistics: 500,
      totalCost: 11500,
    },
    confirmedFacts: [],
    needsReviewFacts: [],
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
    stockQuantity: 5,
    photos: [
      {
        id: 'photo_1',
        url: 'https://storage.googleapis.com/test-bucket/enhanced_photo_1.png',
        name: 'saree_cover.jpg',
        size: 1500000,
        type: 'image/jpeg',
        uploadedAt: '2026-08-28T00:00:00Z',
        isCover: true,
        rawOriginalUrl: 'https://storage.googleapis.com/test-bucket/original_photo_1.jpg',
        enhancedUrl: 'https://storage.googleapis.com/test-bucket/enhanced_photo_1.png',
        previewUrl: 'https://storage.googleapis.com/test-bucket/preview_photo_1.png',
        enhancementStatus: 'succeeded',
        approvalStatus: 'approved',
        selectedVariant: 'enhanced',
        warnings: [],
        metrics: {
          mean_delta_e: 1.2,
          luminance_ssim: 0.97,
          edge_preservation_ratio: 0.95,
        },
        jobId: 'job_001',
        requestId: 'req_001',
      },
    ],
    images: [
      {
        id: 'photo_1',
        originalPath: 'users/artisan_user_1/products/prod_test_001/images/orig.jpg',
        displayPath: 'users/artisan_user_1/products/prod_test_001/images/disp.jpg',
        originalDownloadURL: 'https://storage.googleapis.com/test-bucket/original_photo_1.jpg',
        displayDownloadURL: 'https://storage.googleapis.com/test-bucket/display_photo_1.jpg',
        fileName: 'saree_cover.jpg',
        contentType: 'image/jpeg',
        originalSize: 2500000,
        displaySize: 500000,
        uploadStatus: 'completed',
        createdAt: '2026-08-28T00:00:00Z',
        enhancement: {
          jobId: 'job_001',
          requestId: 'req_001',
          status: 'succeeded',
          approvalStatus: 'approved',
          selectedVariant: 'enhanced',
          enhancedPath: 'https://storage.googleapis.com/test-bucket/enhanced_photo_1.png',
          enhancedDownloadURL: 'https://storage.googleapis.com/test-bucket/enhanced_photo_1.png',
          previewPath: 'https://storage.googleapis.com/test-bucket/preview_photo_1.png',
          previewDownloadURL: 'https://storage.googleapis.com/test-bucket/preview_photo_1.png',
          metrics: {
            mean_delta_e: 1.2,
            luminance_ssim: 0.97,
            edge_preservation_ratio: 0.95,
          },
          updatedAt: '2026-08-28T00:00:00Z',
        },
      },
    ],
    primaryImageId: 'photo_1',
    coverPhotoIndex: 0,
    status: 'draft',
    createdAt: '2026-08-28T00:00:00Z',
    updatedAt: '2026-08-28T00:00:00Z',
  };

  it('serializes draft to Firestore ProductRecord without undefined fields', () => {
    const record = draftToProductRecord(sampleDraft, 'artisan_user_1');

    expect(record.id).toBe('prod_test_001');
    expect(record.ownerId).toBe('artisan_user_1');
    expect(record.images).toBeDefined();
    expect(record.images?.[0].enhancement?.status).toBe('succeeded');
    expect(record.images?.[0].enhancement?.approvalStatus).toBe('approved');
    expect(record.images?.[0].enhancement?.selectedVariant).toBe('enhanced');

    // Ensure raw original is preserved
    expect(record.images?.[0].originalDownloadURL).toBe('https://storage.googleapis.com/test-bucket/original_photo_1.jpg');

    // Ensure no undefined values exist in the object tree
    const jsonStr = JSON.stringify(record);
    expect(jsonStr).not.toContain('"undefined"');
    const parsed = JSON.parse(jsonStr);
    expect(parsed.images[0].enhancement.metrics.mean_delta_e).toBe(1.2);
  });

  it('deserializes ProductRecord back to ProductDraft with AI enhancement variants', () => {
    const record = draftToProductRecord(sampleDraft, 'artisan_user_1');
    const restoredDraft = productRecordToDraft(record);

    expect(restoredDraft.photos).toHaveLength(1);
    const photo = restoredDraft.photos[0];
    expect(photo.id).toBe('photo_1');
    expect(photo.rawOriginalUrl).toBe('https://storage.googleapis.com/test-bucket/original_photo_1.jpg');
    expect(photo.enhancedUrl).toBe('https://storage.googleapis.com/test-bucket/enhanced_photo_1.png');
    expect(photo.approvalStatus).toBe('approved');
    expect(photo.selectedVariant).toBe('enhanced');
    expect(photo.url).toBe('https://storage.googleapis.com/test-bucket/enhanced_photo_1.png');
  });

  it('uses original photo when approvalStatus is rejected', () => {
    const rejectedDraft: ProductDraft = {
      ...sampleDraft,
      images: [
        {
          ...sampleDraft.images![0],
          enhancement: {
            ...sampleDraft.images![0].enhancement!,
            approvalStatus: 'rejected',
            selectedVariant: 'original',
          },
        },
      ],
    };

    const record = draftToProductRecord(rejectedDraft, 'artisan_user_1');
    const restoredDraft = productRecordToDraft(record);

    const photo = restoredDraft.photos[0];
    expect(photo.selectedVariant).toBe('original');
    expect(photo.approvalStatus).toBe('rejected');
    expect(photo.url).toBe(sampleDraft.images![0].displayDownloadURL);
  });

  it('maintains 10-point listing readiness score regardless of AI enhancement status', () => {
    const validation = validateProductForReadiness(sampleDraft);
    expect(validation.isReady).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });
});