/**
 * Centralized Image URL Resolver for KarigarSaathi.
 * Unifies resolution across Cloudinary assets and Firebase Storage emulator URLs.
 * Ensures consistent backward-compatibility and clean fallback handling.
 */

import { ProductImageRecord, PhotographItem, ProductDraft } from '@/types';
import { ProductRecord } from '@/domain/products';

export const FALLBACK_PRODUCT_IMAGE_URL =
  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80';

export interface ImageUrlOptions {
  variant?: 'original' | 'display' | 'enhanced' | 'thumbnail';
  fallback?: string;
}

/**
 * Resolves a displayable image URL from a ProductImageRecord or PhotographItem.
 * Supports both Cloudinary records (secureUrl, publicId) and legacy Firebase Storage records.
 */
export function resolveProductImageUrl(
  image: ProductImageRecord | PhotographItem | string | null | undefined,
  options: ImageUrlOptions = {}
): string {
  const fallback = options.fallback || FALLBACK_PRODUCT_IMAGE_URL;

  if (!image) return fallback;

  if (typeof image === 'string') {
    if (image.trim().startsWith('http://') || image.trim().startsWith('https://') || image.trim().startsWith('data:') || image.trim().startsWith('blob:')) {
      return image.trim();
    }
    return fallback;
  }

  // Handle PhotographItem
  if ('url' in image && typeof image.url === 'string' && image.url.length > 0) {
    if (options.variant === 'enhanced' && 'enhancedUrl' in image && image.enhancedUrl) {
      return image.enhancedUrl;
    }
    if (options.variant === 'original' && 'rawOriginalUrl' in image && image.rawOriginalUrl) {
      return image.rawOriginalUrl;
    }
    return image.url;
  }

  // Handle ProductImageRecord
  const record = image as ProductImageRecord;

  // 1. If enhancement requested and approved
  if (options.variant === 'enhanced' && record.enhancement?.enhancedDownloadURL) {
    return record.enhancement.enhancedDownloadURL;
  }

  // 2. Cloudinary metadata
  if (record.secureUrl && record.secureUrl.startsWith('http')) {
    return record.secureUrl;
  }

  // 3. Display copy
  if (record.displayDownloadURL && record.displayDownloadURL.length > 0) {
    return record.displayDownloadURL;
  }

  // 4. Original download URL
  if (record.originalDownloadURL && record.originalDownloadURL.length > 0) {
    return record.originalDownloadURL;
  }

  // 5. Check if paths are full URLs
  if (record.displayPath && record.displayPath.startsWith('http')) {
    return record.displayPath;
  }
  if (record.originalPath && record.originalPath.startsWith('http')) {
    return record.originalPath;
  }

  return fallback;
}

/**
 * Resolves the primary cover photograph URL for a product or draft.
 */
export function resolveProductCoverUrl(
  product: ProductRecord | ProductDraft | null | undefined,
  options: ImageUrlOptions = {}
): string {
  const fallback = options.fallback || FALLBACK_PRODUCT_IMAGE_URL;
  if (!product) return fallback;

  // 1. Check images array
  if (product.images && product.images.length > 0) {
    const primary = product.primaryImageId
      ? product.images.find((img: ProductImageRecord) => img.id === product.primaryImageId)
      : null;
    const coverImage = primary || product.images[0];
    return resolveProductImageUrl(coverImage, options);
  }

  // 2. Check photos array
  if ('photos' in product && Array.isArray((product as ProductDraft).photos) && (product as ProductDraft).photos.length > 0) {
    const photos = (product as ProductDraft).photos;
    const coverPhoto = photos.find((p: PhotographItem) => p.isCover) || photos[0];
    return resolveProductImageUrl(coverPhoto, options);
  }

  // 3. Check photoPaths array
  if ('photoPaths' in product && Array.isArray(product.photoPaths) && product.photoPaths.length > 0) {
    const first = product.photoPaths[0];
    if (typeof first === 'string' && (first.startsWith('http') || first.startsWith('data:') || first.startsWith('blob:'))) {
      return first;
    }
  }

  return fallback;
}

/**
 * Image error event handler for React img elements to apply fallback gracefully.
 */
export function handleImageFallback(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackUrl: string = FALLBACK_PRODUCT_IMAGE_URL
): void {
  const target = event.currentTarget;
  if (target.src !== fallbackUrl) {
    target.src = fallbackUrl;
  }
}
