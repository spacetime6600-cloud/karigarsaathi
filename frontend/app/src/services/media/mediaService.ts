/**
 * Canonical Media Service for KarigarSaathi.
 *
 * Enforces production media architecture:
 * 1. Sample images exist strictly in explicit demo/fixture mode.
 * 2. Production uploads never persist or return data: URLs.
 * 3. Production uploads use the authenticated backend Cloudinary adapter (via mediaStorageService).
 * 4. Stored provider metadata is resolved consistently for catalogue, inventory, AI, and passports.
 * 5. No sample fallback silently hides failed uploads.
 */

import { PhotographItem } from '@/types';
import { mediaStorageService, UploadMediaResult } from './mediaStorageService';
import {
  resolveProductImageUrl,
  resolveProductCoverUrl,
  handleImageFallback,
  FALLBACK_PRODUCT_IMAGE_URL,
} from './imageUrlResolver';
import { validateImageFile } from './imageProcessor';
import { logger } from '@/services/logging/logger';

export const DEMO_FIXTURE_PHOTOS = [
  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80',
];

export interface MediaUploadOptions {
  ownerId: string;
  productId: string;
  imageId?: string;
  variant?: 'original' | 'display' | 'enhanced';
  onProgress?: (percent: number) => void;
  allowDemo?: boolean;
}

export function isDemoFixtureModeEnabled(): boolean {
  return typeof import.meta !== 'undefined' && import.meta.env?.VITE_DEMO_FIXTURES === 'true';
}

export const mediaService = {
  /**
   * Generates a fixture photo for tests and explicit demo mode.
   * Throws an error in production if called without explicit demo authorization.
   */
  createMockPhoto(index = 0, options: { allowDemo?: boolean } = {}): PhotographItem {
    if (!options.allowDemo && !isDemoFixtureModeEnabled()) {
      throw new Error(
        'Sample fixture images are prohibited in production. Explicit demo mode (allowDemo: true or VITE_DEMO_FIXTURES=true) is required.'
      );
    }

    const url = DEMO_FIXTURE_PHOTOS[index % DEMO_FIXTURE_PHOTOS.length];
    return {
      id: `fixture_photo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      url,
      name: `craft_photo_${index + 1}.jpg`,
      size: 2100000 + Math.floor(Math.random() * 500000),
      type: 'image/jpeg',
      uploadedAt: new Date().toISOString(),
    };
  },

  /**
   * Uploads a product photograph file using the authenticated storage provider.
   * NEVER persists or returns base64 data: URLs.
   * Never hides upload failures with sample fallbacks.
   */
  async processFileUpload(
    file: File,
    options: MediaUploadOptions
  ): Promise<{ photoItem: PhotographItem; uploadResult?: UploadMediaResult }> {
    if (!file) {
      throw new Error('No file provided for upload.');
    }

    // Explicit demo/fixture mode bypass: for unit tests or presentation mode without storage
    if ((options.allowDemo || isDemoFixtureModeEnabled()) && (!options.ownerId || !options.productId)) {
      logger.warn('STORAGE', 'Processing file in explicit demo fixture mode (no remote persistence)');
      const objectUrl = URL.createObjectURL(file);
      const photoItem: PhotographItem = {
        id: options.imageId || `demo_photo_${Date.now()}`,
        url: objectUrl,
        name: file.name,
        size: file.size,
        type: file.type || 'image/jpeg',
        uploadedAt: new Date().toISOString(),
      };
      return { photoItem };
    }

    if (!options.ownerId || !options.productId) {
      throw new Error('Cannot upload image: ownerId and productId are required for production storage.');
    }

    const validation = validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid image file.');
    }

    const imageId = options.imageId || `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const variant = options.variant || 'original';

    try {
      const uploadResult = await mediaStorageService.upload({
        file,
        ownerId: options.ownerId,
        productId: options.productId,
        imageId,
        variant,
        filename: file.name,
        mimeType: file.type,
        onProgress: options.onProgress,
      });

      // Confirm uploadResult is NOT a data URL
      if (uploadResult.downloadUrl.startsWith('data:')) {
        throw new Error('Security violation: Storage provider returned a data URL.');
      }

      const photoItem: PhotographItem = {
        id: imageId,
        url: uploadResult.downloadUrl,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
      };

      return { photoItem, uploadResult };
    } catch (error) {
      // CRITICAL: Never silently fall back to mock photos or Unsplash URLs on failure!
      logger.error('STORAGE', 'Production media upload failed', error, {
        ownerId: options.ownerId,
        productId: options.productId,
        imageId,
        variant,
      });
      throw error;
    }
  },

  /**
   * Resolves display URL honoring stored provider metadata (Cloudinary/Firebase).
   */
  resolveImageUrl: resolveProductImageUrl,

  /**
   * Resolves cover photo URL honoring stored provider metadata.
   */
  resolveCoverUrl: resolveProductCoverUrl,

  /**
   * Image element error handler.
   */
  handleImageFallback,

  /**
   * Fallback image constant.
   */
  fallbackImageUrl: FALLBACK_PRODUCT_IMAGE_URL,
};
