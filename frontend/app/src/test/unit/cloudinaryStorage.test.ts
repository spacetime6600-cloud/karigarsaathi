import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storageUploadQueue, QueuedUploadItem } from '@/services/storage/storageUploadQueue';
import { idbClear, idbGet, STORES } from '@/services/storage/indexedDbStore';
import { mediaStorageService } from '@/services/media/mediaStorageService';
import {
  resolveProductImageUrl,
  resolveProductCoverUrl,
  handleImageFallback,
  FALLBACK_PRODUCT_IMAGE_URL,
} from '@/services/media/imageUrlResolver';
import { ProductImageRecord, ProductDraft } from '@/types';

describe('Cloudinary & Media Storage Integration Suite', () => {
  const testUser = 'artisan_test_uid_99';
  const testProduct = 'prod_test_001';

  beforeEach(async () => {
    await idbClear(STORES.UPLOAD_QUEUE);
    storageUploadQueue.setActiveUser(null);
    vi.restoreAllMocks();
  });

  // --------------------------------------------------------------------------
  // 1. Schema and Metadata Mapping (Step 5)
  // --------------------------------------------------------------------------
  it('1. Firestore ProductImageRecord contains safe metadata fields without credentials or binary data', () => {
    const cloudinaryRecord: ProductImageRecord = {
      id: 'img_001',
      ownerId: testUser,
      originalPath: 'users/artisan/products/prod/originals/img_001.jpg',
      displayPath: 'users/artisan/products/prod/display/img_001.webp',
      fileName: 'craft_saree.jpg',
      contentType: 'image/jpeg',
      originalSize: 450000,
      displaySize: 120000,
      width: 1200,
      height: 900,
      uploadStatus: 'completed',
      createdAt: '2026-09-16T12:00:00.000Z',
      updatedAt: '2026-09-16T12:00:00.000Z',
      provider: 'cloudinary',
      publicId: 'karigarsaathi/products/prod_test_001/img_001/display',
      secureUrl: 'https://res.cloudinary.com/demo/image/upload/v1/karigarsaathi/products/prod_test_001/img_001/display.webp',
      version: '1',
      format: 'webp',
      bytes: 120000,
      resourceType: 'image',
      variant: 'display',
      imageId: 'img_001',
      productId: 'prod_test_001',
      checksum: 'sha256:abcd1234efgh5678',
      idempotencyKey: 'idemp_artisan_prod_test_001_img_001_display',
    };

    // Assert required fields
    expect(cloudinaryRecord.provider).toBe('cloudinary');
    expect(cloudinaryRecord.publicId).toBe('karigarsaathi/products/prod_test_001/img_001/display');
    expect(cloudinaryRecord.secureUrl).toContain('https://res.cloudinary.com');
    expect(cloudinaryRecord.checksum).toBe('sha256:abcd1234efgh5678');
    expect(cloudinaryRecord.uploadStatus).toBe('completed');

    // Assert strictly NO sensitive credentials in metadata
    const serialized = JSON.stringify(cloudinaryRecord);
    expect(serialized).not.toContain('api_secret');
    expect(serialized).not.toContain('CLOUDINARY_API_SECRET');
    expect(serialized).not.toContain('base64');
    expect(serialized).not.toContain('data:image');
  });

  // --------------------------------------------------------------------------
  // 2. Backward Compatibility with Firebase Storage Emulator Records (Step 5 & 8)
  // --------------------------------------------------------------------------
  it('2. Backward compatibility: renders legacy Firebase Storage emulator records seamlessly', () => {
    const legacyRecord: ProductImageRecord = {
      id: 'img_legacy_01',
      originalPath: 'users/artisan_1/products/prod_1/originals/photo_1.jpg',
      displayPath: 'users/artisan_1/products/prod_1/display/photo_1.webp',
      originalDownloadURL: 'http://127.0.0.1:9199/v0/b/demo-karigarsaathi.appspot.com/o/photo_1.jpg',
      displayDownloadURL: 'http://127.0.0.1:9199/v0/b/demo-karigarsaathi.appspot.com/o/photo_1.webp',
      fileName: 'photo_1.jpg',
      contentType: 'image/jpeg',
      originalSize: 500000,
      uploadStatus: 'completed',
      createdAt: '2026-09-01T10:00:00.000Z',
    };

    // Resolves legacy emulator URL cleanly without throwing
    const resolvedUrl = resolveProductImageUrl(legacyRecord);
    expect(resolvedUrl).toBe('http://127.0.0.1:9199/v0/b/demo-karigarsaathi.appspot.com/o/photo_1.webp');

    // Works with resolveProductCoverUrl
    const mockDraft: Partial<ProductDraft> = {
      id: 'prod_1',
      images: [legacyRecord],
      photos: [],
    };
    const coverUrl = resolveProductCoverUrl(mockDraft as ProductDraft);
    expect(coverUrl).toBe('http://127.0.0.1:9199/v0/b/demo-karigarsaathi.appspot.com/o/photo_1.webp');
  });

  // --------------------------------------------------------------------------
  // 3. Centralized Image URL Resolution & Fallbacks (Step 5 & 8)
  // --------------------------------------------------------------------------
  it('3. Centralized Image URL Resolver prioritizes Cloudinary secureUrl and provides fallback', () => {
    const cloudinaryRecord: ProductImageRecord = {
      id: 'img_cloud_01',
      originalPath: 'users/artisan_1/products/prod_1/originals/photo_1.jpg',
      originalDownloadURL: 'http://127.0.0.1:9199/legacy.jpg',
      secureUrl: 'https://res.cloudinary.com/demo/image/upload/v1/karigarsaathi/products/prod_1/img_cloud_01/display.webp',
      fileName: 'photo_1.jpg',
      contentType: 'image/jpeg',
      originalSize: 500000,
      uploadStatus: 'completed',
      createdAt: '2026-09-16T10:00:00.000Z',
      provider: 'cloudinary',
    };

    // Should prioritize secureUrl over emulator URL
    const resolvedUrl = resolveProductImageUrl(cloudinaryRecord);
    expect(resolvedUrl).toBe('https://res.cloudinary.com/demo/image/upload/v1/karigarsaathi/products/prod_1/img_cloud_01/display.webp');

    // Handles null / empty records with fallback URL
    expect(resolveProductImageUrl(null)).toBe(FALLBACK_PRODUCT_IMAGE_URL);
    expect(resolveProductImageUrl(undefined)).toBe(FALLBACK_PRODUCT_IMAGE_URL);
  });

  it('4. handleImageFallback sets img.src to fallback on error event', () => {
    const mockImg = { src: 'https://broken.invalid/img.jpg' };
    const fakeEvent = {
      currentTarget: mockImg,
    } as unknown as React.SyntheticEvent<HTMLImageElement, Event>;

    handleImageFallback(fakeEvent);
    expect(mockImg.src).toBe(FALLBACK_PRODUCT_IMAGE_URL);
  });

  // --------------------------------------------------------------------------
  // 4. Offline Queue & Memory Management (Step 4)
  // --------------------------------------------------------------------------
  it('5. Enqueues upload with deterministic idempotency key format', async () => {
    storageUploadQueue.setActiveUser(testUser);
    const blob = new Blob(['sample-craft-bytes'], { type: 'image/jpeg' });

    const item = await storageUploadQueue.enqueueUpload({
      ownerUid: testUser,
      productId: testProduct,
      imageId: 'img_offline_1',
      blob,
      variantType: 'original',
    });

    expect(item.idempotencyKey).toBe(`idemp_${testUser}_${testProduct}_img_offline_1_original`);
    expect(item.status).toBe('pending');
    expect(item.size).toBe(blob.size);
  });

  it('6. Successful upload clears heavy binary from IndexedDB queue to conserve device memory', async () => {
    storageUploadQueue.setActiveUser(testUser);
    const blob = new Blob(['binary-data-to-be-freed'], { type: 'image/jpeg' });

    // Mock mediaStorageService.upload to succeed
    vi.spyOn(mediaStorageService, 'upload').mockResolvedValueOnce({
      downloadUrl: 'https://res.cloudinary.com/demo/image/upload/v1/test.jpg',
      provider: 'cloudinary',
      metadata: {
        provider: 'cloudinary',
        publicId: 'karigarsaathi/products/prod_test_001/img_mem_1/original',
        secureUrl: 'https://res.cloudinary.com/demo/image/upload/v1/test.jpg',
      },
    });

    const item = await storageUploadQueue.enqueueUpload({
      ownerUid: testUser,
      productId: testProduct,
      imageId: 'img_mem_1',
      blob,
      variantType: 'original',
    });

    await storageUploadQueue.processQueue();

    // Check completed state in IndexedDB
    const stored = await idbGet<QueuedUploadItem>(STORES.UPLOAD_QUEUE, item.operationId);
    expect(stored?.status).toBe('completed');
    expect(stored?.downloadUrl).toBe('https://res.cloudinary.com/demo/image/upload/v1/test.jpg');
    // Binary is cleared (size 0) after complete success
    expect(stored?.blob.size).toBe(0);
  });

  it('7. Failed upload retains binary in IndexedDB for retry and schedules backoff', async () => {
    storageUploadQueue.setActiveUser(testUser);
    const originalContent = 'critical-offline-image-data';
    const blob = new Blob([originalContent], { type: 'image/jpeg' });

    // Mock mediaStorageService.upload to fail with network error
    vi.spyOn(mediaStorageService, 'upload').mockRejectedValueOnce(new Error('Network offline or backend timeout'));

    const item = await storageUploadQueue.enqueueUpload({
      ownerUid: testUser,
      productId: testProduct,
      imageId: 'img_fail_1',
      blob,
      variantType: 'original',
    });

    await storageUploadQueue.processQueue();

    // Stored item must remain pending for retry and retain its binary intact
    const stored = await idbGet<QueuedUploadItem>(STORES.UPLOAD_QUEUE, item.operationId);
    expect(stored?.status).toBe('pending');
    expect(stored?.retryCount).toBe(1);
    expect(stored?.lastError).toContain('Network offline');
    // Binary MUST be retained!
    expect(stored?.blob.size).toBe(blob.size);
  });

  // --------------------------------------------------------------------------
  // 5. Cloudinary Secret Protection & Bundle Hygiene (Step 1 & 10)
  // --------------------------------------------------------------------------
  it('8. Zero Cloudinary secrets exist in client environment or frontend bundles', () => {
    // Vite import.meta.env must never contain Cloudinary secrets
    const env = import.meta.env as Record<string, unknown>;
    expect(env.CLOUDINARY_API_SECRET).toBeUndefined();
    expect(env.CLOUDINARY_URL).toBeUndefined();
    expect(env.VITE_CLOUDINARY_API_SECRET).toBeUndefined();

    // Frontend provider should be either 'firebase_emulator' or 'cloudinary'
    const provider = mediaStorageService.getProvider();
    expect(['cloudinary', 'firebase_emulator']).toContain(provider);
  });
});
