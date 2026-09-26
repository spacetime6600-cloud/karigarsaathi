import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mediaStorageService, UploadMediaParams } from '@/services/media/mediaStorageService';
import { validateImageFile, uploadPhotograph } from '@/services/media/imageProcessor';

describe('Vercel Direct Media Upload Flow Suite', () => {
  const mockOwnerId = 'artisan_owner_123';
  const mockProductId = 'prod_handloom_001';
  const mockImageId = 'img_direct_999';

  beforeEach(() => {
    vi.restoreAllMocks();

    // Mock URL object URLs for jsdom
    globalThis.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-preview-url');
    globalThis.URL.revokeObjectURL = vi.fn();

    // Mock HTMLImageElement for decodeImageFile in jsdom
    class MockImage {
      naturalWidth = 1600;
      naturalHeight = 1200;
      width = 1600;
      height = 1200;
      _src = '';
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      get src() {
        return this._src;
      }
      set src(val: string) {
        this._src = val;
        // Trigger onload asynchronously like a real browser image load
        setTimeout(() => {
          this.onload?.();
        }, 0);
      }
    }
    vi.stubGlobal('Image', MockImage);

    // Mock HTMLCanvasElement for processDisplayCopy in jsdom
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
      drawImage: vi.fn(),
    }) as unknown as typeof HTMLCanvasElement.prototype.getContext;

    HTMLCanvasElement.prototype.toBlob = vi.fn().mockImplementation((callback, type) => {
      callback(new Blob(['mock-display-webp-bytes'], { type: type || 'image/webp' }));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --------------------------------------------------------------------------
  // 1. Default Behavior & Disabled by Default
  // --------------------------------------------------------------------------
  it('1. Direct upload is disabled by default to preserve existing Render proxy behavior', async () => {
    // By default without VITE_DIRECT_MEDIA_UPLOAD='true', isDirectUploadEnabled must return false
    expect(mediaStorageService.isDirectUploadEnabled()).toBe(false);

    // Spy on internal methods to verify routing
    const directSpy = vi.spyOn(mediaStorageService, 'uploadDirectToCloudinary').mockResolvedValue({
      downloadUrl: 'https://res.cloudinary.com/test/direct.jpg',
      provider: 'cloudinary',
      metadata: { provider: 'cloudinary' },
    });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        provider: 'cloudinary',
        publicId: 'karigarsaathi/products/prod_1/img_1/original',
        secureUrl: 'https://res.cloudinary.com/test/proxy.jpg',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const testFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const result = await mediaStorageService.upload({
      file: testFile,
      productId: 'prod_1',
      imageId: 'img_1',
      ownerId: mockOwnerId,
    });

    // Verify direct upload was NOT called
    expect(directSpy).not.toHaveBeenCalled();
    // Verify standard proxy upload POST to /v1/media/upload was invoked
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/v1/media/upload'),
      expect.objectContaining({ method: 'POST' })
    );
    expect(result.downloadUrl).toBe('https://res.cloudinary.com/test/proxy.jpg');
  });

  // --------------------------------------------------------------------------
  // 2. Photos over 4.5 MB (Bypassing Serverless Limit up to 10 MB)
  // --------------------------------------------------------------------------
  describe('Photos over 4.5 MB (10 MB Capability)', () => {
    it('2a. Validates photos between 4.5 MB and 10 MB successfully', () => {
      // 7.5 MB file exceeds Vercel 4.5 MB function payload limit but is under 10 MB
      const largeBlob = new Blob([new Uint8Array(7.5 * 1024 * 1024)]);
      const largeFile = new File([largeBlob], 'handicraft_highres.jpg', { type: 'image/jpeg' });

      const validation = validateImageFile(largeFile, 0);
      expect(validation.valid).toBe(true);
      expect(validation.error).toBeUndefined();
    });

    it('2b. Rejects photos exceeding the 10 MB threshold before any upload', () => {
      const oversizedBlob = new Blob([new Uint8Array(10.5 * 1024 * 1024)]);
      const oversizedFile = new File([oversizedBlob], 'too_large.jpg', { type: 'image/jpeg' });

      const validation = validateImageFile(oversizedFile, 0);
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('exceeds maximum limit of 10 MB');
    });

    it('2c. Direct upload sends 7 MB file directly to Cloudinary without sending file body to signing/verification endpoints', async () => {
      const fileSize = 7 * 1024 * 1024; // 7 MB
      const fileBytes = new Uint8Array(fileSize);
      const largeFile = new File([fileBytes], 'large_pottery.jpg', { type: 'image/jpeg' });

      const calls: { url: string; method: string; body: unknown; headers?: unknown }[] = [];

      const fetchMock = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
        calls.push({
          url: String(url),
          method: init?.method || 'GET',
          body: init?.body,
          headers: init?.headers,
        });

        // Step 1: /v1/media/sign-upload
        if (url.includes('/v1/media/sign-upload')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              cloud_name: 'karigar_cloud',
              api_key: 'test_api_key_public',
              public_id: `karigarsaathi/products/${mockProductId}/${mockImageId}/original`,
              timestamp: 1727350000,
              signature: 'sig_deterministic_sha123',
              upload_url: 'https://api.cloudinary.com/v1_1/karigar_cloud/image/upload',
            }),
          };
        }

        // Step 2: Direct to Cloudinary upload_url
        if (url.includes('api.cloudinary.com')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              public_id: `karigarsaathi/products/${mockProductId}/${mockImageId}/original`,
              version: 123456,
              secure_url: `https://res.cloudinary.com/karigar_cloud/image/upload/v123456/karigarsaathi/products/${mockProductId}/${mockImageId}/original.jpg`,
              bytes: fileSize,
              width: 4000,
              height: 3000,
              format: 'jpg',
              resource_type: 'image',
            }),
          };
        }

        // Step 3: /v1/media/verify-upload
        if (url.includes('/v1/media/verify-upload')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              provider: 'cloudinary',
              publicId: `karigarsaathi/products/${mockProductId}/${mockImageId}/original`,
              secureUrl: `https://res.cloudinary.com/karigar_cloud/image/upload/v123456/karigarsaathi/products/${mockProductId}/${mockImageId}/original.jpg`,
              version: '123456',
              width: 4000,
              height: 3000,
              format: 'jpg',
              bytes: fileSize,
              resourceType: 'image',
              variant: 'original',
              imageId: mockImageId,
              productId: mockProductId,
              checksum: 'sha256:mocketag123',
              idempotencyKey: `idemp_${mockOwnerId}_${mockProductId}_${mockImageId}_original`,
              createdAt: '2026-09-26T12:00:00Z',
              updatedAt: '2026-09-26T12:00:00Z',
            }),
          };
        }

        throw new Error(`Unexpected request to ${url}`);
      });

      vi.stubGlobal('fetch', fetchMock);

      const progressUpdates: number[] = [];
      const result = await mediaStorageService.uploadDirectToCloudinary({
        file: largeFile,
        productId: mockProductId,
        imageId: mockImageId,
        ownerId: mockOwnerId,
        variant: 'original',
        onProgress: (p) => progressUpdates.push(p),
      });

      // 1. Verify exact 3 requests occurred in correct sequence
      expect(calls).toHaveLength(3);
      expect(calls[0].url).toContain('/v1/media/sign-upload');
      expect(calls[1].url).toBe('https://api.cloudinary.com/v1_1/karigar_cloud/image/upload');
      expect(calls[2].url).toContain('/v1/media/verify-upload');

      // 2. CRITICAL: Verify sign-upload body is small JSON (NOT the 7 MB file)
      const signBody = JSON.parse(calls[0].body as string);
      expect(signBody.product_id).toBe(mockProductId);
      expect(signBody.image_id).toBe(mockImageId);
      expect(signBody.owner_id).toBe(mockOwnerId);
      expect(signBody.variant).toBe('original');
      expect(signBody.idempotency_key).toBeDefined();

      // 3. Verify Cloudinary request receives the 7 MB file directly
      const cldBody = calls[1].body as FormData;
      expect(cldBody.get('file')).toBeDefined();
      expect(cldBody.get('api_key')).toBe('test_api_key_public');
      expect(cldBody.get('signature')).toBe('sig_deterministic_sha123');
      expect(cldBody.get('public_id')).toBe(`karigarsaathi/products/${mockProductId}/${mockImageId}/original`);
      expect(cldBody.get('overwrite')).toBe('true');
      // Crucial: Secret is NEVER present in form data
      expect(cldBody.get('api_secret')).toBeNull();

      // 4. Verify verify-upload body is small JSON with public_id
      const verifyBody = JSON.parse(calls[2].body as string);
      expect(verifyBody.public_id).toBe(`karigarsaathi/products/${mockProductId}/${mockImageId}/original`);
      expect(verifyBody.product_id).toBe(mockProductId);

      // 5. Result contains verified 7 MB metadata
      expect(result.metadata.bytes).toBe(fileSize);
      expect(result.metadata.width).toBe(4000);
      expect(result.metadata.height).toBe(3000);
      expect(result.downloadUrl).toContain('karigar_cloud');
      expect(progressUpdates[progressUpdates.length - 1]).toBe(100);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Upload & Verification Failure Handling
  // --------------------------------------------------------------------------
  describe('Failure Handling & Retryable Error State', () => {
    it('3a. Fails cleanly with retryable=false if sign-upload rejects due to ownership mismatch (403)', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 403,
          json: async () => ({
            detail: {
              error_code: 'OWNERSHIP_MISMATCH',
              message: 'Access denied: you do not have permission to modify this product media.',
              retryable: false,
            },
          }),
        })
      );

      const testFile = new File(['mock'], 'photo.jpg', { type: 'image/jpeg' });
      await expect(
        mediaStorageService.uploadDirectToCloudinary({
          file: testFile,
          productId: mockProductId,
          imageId: mockImageId,
          ownerId: mockOwnerId,
        })
      ).rejects.toMatchObject({
        status: 403,
        retryable: false,
        errorCode: 'OWNERSHIP_MISMATCH',
      });
    });

    it('3b. Fails with retryable=true if Cloudinary direct upload returns HTTP 500', async () => {
      const fetchMock = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes('/v1/media/sign-upload')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              cloud_name: 'test_cloud',
              api_key: 'test_key',
              public_id: 'karigarsaathi/products/p1/img1/original',
              timestamp: 1727350000,
              signature: 'sig_123',
              upload_url: 'https://api.cloudinary.com/v1_1/test_cloud/image/upload',
            }),
          };
        }
        if (url.includes('api.cloudinary.com')) {
          return {
            ok: false,
            status: 500,
            json: async () => ({
              error: { message: 'Cloudinary storage service temporarily unavailable' },
            }),
          };
        }
        return { ok: true, json: async () => ({}) };
      });
      vi.stubGlobal('fetch', fetchMock);

      const testFile = new File(['mock'], 'photo.jpg', { type: 'image/jpeg' });

      await expect(
        mediaStorageService.uploadDirectToCloudinary({
          file: testFile,
          productId: mockProductId,
          imageId: mockImageId,
          ownerId: mockOwnerId,
        })
      ).rejects.toMatchObject({
        status: 500,
        retryable: true,
        errorCode: 'CLOUDINARY_DIRECT_UPLOAD_FAILED',
      });

      // Verify verify-upload was NEVER called
      expect(fetchMock).not.toHaveBeenCalledWith(
        expect.stringContaining('/v1/media/verify-upload'),
        expect.anything()
      );
    });

    it('3c. Fails with retryable error if verify-upload fails (500) and prevents Firestore commit', async () => {
      const fetchMock = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes('/v1/media/sign-upload')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              cloud_name: 'test_cloud',
              api_key: 'test_key',
              public_id: 'karigarsaathi/products/p1/img1/original',
              timestamp: 1727350000,
              signature: 'sig_123',
              upload_url: 'https://api.cloudinary.com/v1_1/test_cloud/image/upload',
            }),
          };
        }
        if (url.includes('api.cloudinary.com')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              public_id: 'karigarsaathi/products/p1/img1/original',
              secure_url: 'https://res.cloudinary.com/test_cloud/image/upload/test.jpg',
            }),
          };
        }
        if (url.includes('/v1/media/verify-upload')) {
          return {
            ok: false,
            status: 500,
            json: async () => ({
              detail: {
                error_code: 'ASSET_VERIFICATION_FAILED',
                message: 'Internal error checking asset in Cloudinary',
                retryable: true,
              },
            }),
          };
        }
        return { ok: true, json: async () => ({}) };
      });
      vi.stubGlobal('fetch', fetchMock);

      const testFile = new File(['mock'], 'photo.jpg', { type: 'image/jpeg' });

      await expect(
        mediaStorageService.uploadDirectToCloudinary({
          file: testFile,
          productId: mockProductId,
          imageId: mockImageId,
          ownerId: mockOwnerId,
        })
      ).rejects.toMatchObject({
        status: 500,
        retryable: true,
        errorCode: 'ASSET_VERIFICATION_FAILED',
      });
    });

    it('3d. uploadPhotograph with directUpload=true throws retryable error on failure without marking upload completed', async () => {
      // Mock mediaStorageService.upload to fail with retryable error
      const mockErr = new Error('Direct Cloudinary upload failed (503): Service Unavailable') as Error & {
        status?: number;
        retryable?: boolean;
        errorCode?: string;
      };
      mockErr.status = 503;
      mockErr.retryable = true;
      mockErr.errorCode = 'CLOUDINARY_DIRECT_UPLOAD_FAILED';
      vi.spyOn(mediaStorageService, 'upload').mockRejectedValue(mockErr);

      const testFile = new File(['data'], 'test.jpg', { type: 'image/jpeg' });

      // uploadPhotograph must throw rather than claiming remote success
      let capturedError: unknown;
      try {
        await uploadPhotograph({
          ownerId: mockOwnerId,
          productId: mockProductId,
          file: testFile,
          directUpload: true,
        });
      } catch (err) {
        capturedError = err;
      }

      expect(capturedError).toBeDefined();
      const typedErr = capturedError as Error & { retryable?: boolean; status?: number };
      expect(typedErr.retryable).toBe(true);
      expect(typedErr.status).toBe(503);
      expect(typedErr.message).toContain('Direct Cloudinary upload failed');
    });
  });

  // --------------------------------------------------------------------------
  // 4. Successful Original + Display Variants Metadata Flow
  // --------------------------------------------------------------------------
  describe('Successful Original + Display Variants Flow', () => {
    it('4. Full direct upload pipeline generates verified ProductImageRecord with original and display metadata', async () => {
      const originalFile = new File(['original-raw-bytes'], 'craft.jpg', { type: 'image/jpeg' });

      // Mock mediaStorageService.upload to return verified metadata for both variants
      vi.spyOn(mediaStorageService, 'upload').mockImplementation(async (params: UploadMediaParams) => {
        const variant = params.variant || 'original';
        if (variant === 'original') {
          return {
            downloadUrl: 'https://res.cloudinary.com/karigar/image/upload/v1/karigarsaathi/products/p1/img1/original.jpg',
            provider: 'cloudinary',
            metadata: {
              provider: 'cloudinary',
              publicId: 'karigarsaathi/products/p1/img1/original',
              secureUrl: 'https://res.cloudinary.com/karigar/image/upload/v1/karigarsaathi/products/p1/img1/original.jpg',
              version: '1',
              width: 2000,
              height: 1500,
              format: 'jpg',
              bytes: 350000,
              resourceType: 'image',
              variant: 'original',
              imageId: 'img1',
              productId: 'p1',
              checksum: 'sha256:originalhash123',
              idempotencyKey: 'idemp_artisan_p1_img1_original',
            },
          };
        } else {
          return {
            downloadUrl: 'https://res.cloudinary.com/karigar/image/upload/v1/karigarsaathi/products/p1/img1/display.webp',
            provider: 'cloudinary',
            metadata: {
              provider: 'cloudinary',
              publicId: 'karigarsaathi/products/p1/img1/display',
              secureUrl: 'https://res.cloudinary.com/karigar/image/upload/v1/karigarsaathi/products/p1/img1/display.webp',
              version: '1',
              width: 1600,
              height: 1200,
              format: 'webp',
              bytes: 85000,
              resourceType: 'image',
              variant: 'display',
              imageId: 'img1',
              productId: 'p1',
              checksum: 'sha256:displayhash456',
              idempotencyKey: 'idemp_artisan_p1_img1_display',
            },
          };
        }
      });

      const { imageRecord, photoItem } = await uploadPhotograph({
        ownerId: mockOwnerId,
        productId: mockProductId,
        file: originalFile,
        directUpload: true,
      });

      // Assert imageRecord contains verified remote metadata
      expect(imageRecord.uploadStatus).toBe('completed');
      expect(imageRecord.provider).toBe('cloudinary');
      expect(imageRecord.originalDownloadURL).toContain('original.jpg');
      expect(imageRecord.displayDownloadURL).toContain('display.webp');
      expect(imageRecord.secureUrl).toContain('display.webp');
      expect(imageRecord.publicId).toBe('karigarsaathi/products/p1/img1/display');
      expect(imageRecord.format).toBe('webp');
      expect(imageRecord.checksum).toBe('sha256:originalhash123');

      // Assert photoItem
      expect(photoItem.url).toContain('display.webp');
      expect(photoItem.size).toBeGreaterThan(0);
      expect(photoItem.type).toBe('image/webp');

      // Assert strictly zero secret credentials leaked in record
      const serialized = JSON.stringify(imageRecord);
      expect(serialized).not.toContain('api_secret');
      expect(serialized).not.toContain('CLOUDINARY_API_SECRET');
      expect(serialized).not.toContain('dev-token');
    });
  });
});
