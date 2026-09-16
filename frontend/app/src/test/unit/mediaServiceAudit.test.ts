import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mediaService, DEMO_FIXTURE_PHOTOS } from '@/services/media/mediaService';
import { mediaStorageService } from '@/services/media/mediaStorageService';
import { draftToProductRecord } from '@/domain/products';
import { ProductDraft } from '@/types';

describe('MediaService Production Audit Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // --------------------------------------------------------------------------
  // 1. Sample Images Exist Only in Explicit Demo Mode
  // --------------------------------------------------------------------------
  it('1. createMockPhoto throws error in production when explicit demo mode is not enabled', () => {
    expect(() => {
      mediaService.createMockPhoto(0, { allowDemo: false });
    }).toThrow(/Sample fixture images are prohibited in production/i);
  });

  it('2. createMockPhoto succeeds when allowDemo is explicitly true', () => {
    const photo = mediaService.createMockPhoto(0, { allowDemo: true });
    expect(photo.id).toMatch(/^fixture_photo_/);
    expect(photo.url).toBe(DEMO_FIXTURE_PHOTOS[0]);
    expect(photo.name).toBe('craft_photo_1.jpg');
    expect(photo.type).toBe('image/jpeg');
  });

  // --------------------------------------------------------------------------
  // 2. Production Uploads Never Persist data: URLs
  // --------------------------------------------------------------------------
  it('3. processFileUpload rejects if storage provider returns a data: URL', async () => {
    const fakeFile = new File(['fake craft image data'], 'craft.jpg', { type: 'image/jpeg' });
    vi.spyOn(mediaStorageService, 'upload').mockResolvedValueOnce({
      downloadUrl: 'data:image/jpeg;base64,invalidDataUrlPayload',
      provider: 'cloudinary',
      metadata: {
        provider: 'cloudinary',
        publicId: 'invalid',
        secureUrl: 'data:image/jpeg;base64,invalidDataUrlPayload',
      },
    });

    await expect(
      mediaService.processFileUpload(fakeFile, {
        ownerId: 'artisan_123',
        productId: 'prod_456',
      })
    ).rejects.toThrow(/Security violation: Storage provider returned a data URL/i);
  });

  it('4. draftToProductRecord strips out any data: URLs from photoPaths and thumbnailPath', () => {
    const mockDraft: Partial<ProductDraft> = {
      id: 'prod_test',
      title: 'Handmade Silk Shawl',
      status: 'draft',
      photos: [
        {
          id: 'photo_1',
          url: 'data:image/jpeg;base64,largeBase64PayloadThatShouldNotBePersisted',
          name: 'p1.jpg',
          size: 1000,
          type: 'image/jpeg',
          uploadedAt: '2026-09-16T12:00:00.000Z',
        },
        {
          id: 'photo_2',
          url: 'https://res.cloudinary.com/cloud/image/upload/v1/prod_test/photo_2/original.jpg',
          name: 'p2.jpg',
          size: 2000,
          type: 'image/jpeg',
          uploadedAt: '2026-09-16T12:00:00.000Z',
        },
      ],
      photoPaths: ['data:image/png;base64,anotherDataUrl', 'https://res.cloudinary.com/cloud/image/upload/v1/prod_test/cover.jpg'],
    };

    const record = draftToProductRecord(mockDraft as ProductDraft, 'artisan_123');

    // Asserts no data: URLs in photoPaths
    expect(record.photoPaths.every((path) => !path.startsWith('data:'))).toBe(true);
    expect(record.photoPaths).toContain('https://res.cloudinary.com/cloud/image/upload/v1/prod_test/photo_2/original.jpg');
    expect(record.thumbnailPath?.startsWith('data:')).toBe(false);
  });

  // --------------------------------------------------------------------------
  // 3. Production Uploads Use the Authenticated Backend Cloudinary Adapter
  // --------------------------------------------------------------------------
  it('5. processFileUpload invokes mediaStorageService.upload with authenticated parameters', async () => {
    const fakeFile = new File(['valid craft photo content'], 'pottery.jpg', { type: 'image/jpeg' });
    const uploadSpy = vi.spyOn(mediaStorageService, 'upload').mockResolvedValueOnce({
      downloadUrl: 'https://res.cloudinary.com/demo/image/upload/v1/karigarsaathi/products/prod_100/img_200/original.jpg',
      provider: 'cloudinary',
      metadata: {
        provider: 'cloudinary',
        publicId: 'karigarsaathi/products/prod_100/img_200/original',
        secureUrl: 'https://res.cloudinary.com/demo/image/upload/v1/karigarsaathi/products/prod_100/img_200/original.jpg',
      },
    });

    const result = await mediaService.processFileUpload(fakeFile, {
      ownerId: 'artisan_77',
      productId: 'prod_100',
      imageId: 'img_200',
      variant: 'original',
    });

    expect(uploadSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: 'artisan_77',
        productId: 'prod_100',
        imageId: 'img_200',
        variant: 'original',
        filename: 'pottery.jpg',
        mimeType: 'image/jpeg',
      })
    );
    expect(result.photoItem.url).toBe(
      'https://res.cloudinary.com/demo/image/upload/v1/karigarsaathi/products/prod_100/img_200/original.jpg'
    );
    expect(result.photoItem.url.startsWith('data:')).toBe(false);
  });

  // --------------------------------------------------------------------------
  // 4. Stored Provider Metadata Resolution
  // --------------------------------------------------------------------------
  it('6. mediaService exposes resolveImageUrl and resolveCoverUrl matching provider metadata', () => {
    const cloudinaryRecord = {
      id: 'img_test',
      ownerId: 'artisan_1',
      provider: 'cloudinary' as const,
      secureUrl: 'https://res.cloudinary.com/demo/image/upload/v1/item.jpg',
      originalPath: 'users/artisan_1/item.jpg',
      displayPath: 'users/artisan_1/display.webp',
      fileName: 'item.jpg',
      contentType: 'image/jpeg',
      originalSize: 50000,
      displaySize: 25000,
      width: 800,
      height: 600,
      uploadStatus: 'completed' as const,
      createdAt: '2026-09-16T12:00:00.000Z',
      updatedAt: '2026-09-16T12:00:00.000Z',
    };

    expect(mediaService.resolveImageUrl(cloudinaryRecord)).toBe(
      'https://res.cloudinary.com/demo/image/upload/v1/item.jpg'
    );
  });

  // --------------------------------------------------------------------------
  // 5. No Sample Fallback Silently Hides Failed Uploads
  // --------------------------------------------------------------------------
  it('7. processFileUpload throws and does NOT silently fall back to mock photos when upload fails', async () => {
    const fakeFile = new File(['valid craft bytes'], 'sculpture.png', { type: 'image/png' });
    vi.spyOn(mediaStorageService, 'upload').mockRejectedValueOnce(
      new Error('Cloudinary upstream connection timeout')
    );

    await expect(
      mediaService.processFileUpload(fakeFile, {
        ownerId: 'artisan_fail_test',
        productId: 'prod_fail',
      })
    ).rejects.toThrow('Cloudinary upstream connection timeout');
  });
});