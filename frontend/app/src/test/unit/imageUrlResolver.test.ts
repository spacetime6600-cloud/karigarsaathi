import { describe, it, expect } from 'vitest';
import {
  resolveProductImageUrl,
  resolveProductCoverUrl,
  FALLBACK_PRODUCT_IMAGE_URL,
} from '@/services/media/imageUrlResolver';
import { ProductImageRecord, ProductDraft } from '@/types';

describe('ImageUrlResolver Suite', () => {
  it('1. Resolves Cloudinary secureUrl when present on ProductImageRecord', () => {
    const record: ProductImageRecord = {
      id: 'img_c1',
      originalPath: 'users/a/products/p/originals/c1.jpg',
      displayDownloadURL: 'https://emulator/photo.jpg',
      secureUrl: 'https://res.cloudinary.com/cloud/image/upload/v1/prod.jpg',
      fileName: 'c1.jpg',
      contentType: 'image/jpeg',
      originalSize: 1000,
      uploadStatus: 'completed',
      createdAt: '2026-09-16T12:00:00Z',
      provider: 'cloudinary',
    };

    expect(resolveProductImageUrl(record)).toBe('https://res.cloudinary.com/cloud/image/upload/v1/prod.jpg');
  });

  it('2. Falls back to displayDownloadURL if secureUrl is not present', () => {
    const record: ProductImageRecord = {
      id: 'img_legacy',
      originalPath: 'users/a/products/p/originals/c1.jpg',
      displayDownloadURL: 'https://storage.googleapis.com/bucket/display.webp',
      fileName: 'c1.jpg',
      contentType: 'image/jpeg',
      originalSize: 1000,
      uploadStatus: 'completed',
      createdAt: '2026-09-16T12:00:00Z',
    };

    expect(resolveProductImageUrl(record)).toBe('https://storage.googleapis.com/bucket/display.webp');
  });

  it('3. Resolves enhanced variant if requested and available', () => {
    const record: ProductImageRecord = {
      id: 'img_enh',
      originalPath: 'users/a/products/p/originals/c1.jpg',
      displayDownloadURL: 'https://storage.googleapis.com/bucket/display.webp',
      fileName: 'c1.jpg',
      contentType: 'image/jpeg',
      originalSize: 1000,
      uploadStatus: 'completed',
      createdAt: '2026-09-16T12:00:00Z',
      enhancement: {
        jobId: 'job_1',
        requestId: 'req_1',
        status: 'succeeded',
        approvalStatus: 'approved',
        selectedVariant: 'enhanced',
        enhancedDownloadURL: 'https://res.cloudinary.com/cloud/image/upload/v1/enhanced.png',
        updatedAt: '2026-09-16T12:00:00Z',
      },
    };

    expect(resolveProductImageUrl(record, { variant: 'enhanced' })).toBe(
      'https://res.cloudinary.com/cloud/image/upload/v1/enhanced.png'
    );
  });

  it('4. Resolves cover photo from ProductDraft images array matching primaryImageId', () => {
    const draft: Partial<ProductDraft> = {
      id: 'prod_cover',
      primaryImageId: 'img_2',
      images: [
        {
          id: 'img_1',
          originalPath: 'p1.jpg',
          secureUrl: 'https://res.cloudinary.com/cloud/1.jpg',
          fileName: '1.jpg',
          contentType: 'image/jpeg',
          originalSize: 1000,
          uploadStatus: 'completed',
          createdAt: '2026-09-16T12:00:00Z',
        },
        {
          id: 'img_2',
          originalPath: 'p2.jpg',
          secureUrl: 'https://res.cloudinary.com/cloud/2.jpg',
          fileName: '2.jpg',
          contentType: 'image/jpeg',
          originalSize: 1000,
          uploadStatus: 'completed',
          createdAt: '2026-09-16T12:00:00Z',
        },
      ],
    };

    expect(resolveProductCoverUrl(draft as ProductDraft)).toBe('https://res.cloudinary.com/cloud/2.jpg');
  });

  it('5. Falls back cleanly to FALLBACK_PRODUCT_IMAGE_URL when record has no valid URLs', () => {
    expect(resolveProductImageUrl(null)).toBe(FALLBACK_PRODUCT_IMAGE_URL);
    expect(resolveProductImageUrl(undefined)).toBe(FALLBACK_PRODUCT_IMAGE_URL);
    expect(resolveProductCoverUrl(null)).toBe(FALLBACK_PRODUCT_IMAGE_URL);
  });
});
