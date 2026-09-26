import { ProductImageRecord, PhotographItem } from '@/types';
import { logger } from '@/services/logging/logger';
import { storageUploadQueue } from '@/services/storage/storageUploadQueue';
import { mediaStorageService } from '@/services/media/mediaStorageService';

export const MAX_ORIGINAL_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_IMAGES_PER_PRODUCT = 6;
export const MAX_DISPLAY_DIMENSION_PX = 1600;
export const DISPLAY_IMAGE_QUALITY = 0.82;
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface CropCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageProcessingResult {
  displayBlob: Blob;
  width: number;
  height: number;
  displaySize: number;
}

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates an image file before upload.
 */
export function validateImageFile(file: File, currentImageCount = 0): ImageValidationResult {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  if (currentImageCount >= MAX_IMAGES_PER_PRODUCT) {
    return { valid: false, error: `Maximum of ${MAX_IMAGES_PER_PRODUCT} images allowed per product.` };
  }

  if (file.size <= 0) {
    return { valid: false, error: 'File is empty (0 bytes).' };
  }

  if (file.size > MAX_ORIGINAL_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return { valid: false, error: `File size (${sizeMb} MB) exceeds maximum limit of 10 MB.` };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: `Unsupported image format (${file.type || 'unknown'}). Please use JPEG, PNG, or WebP.` };
  }

  return { valid: true };
}

/**
 * Decodes an image file in the browser to confirm decodability and get original dimensions.
 */
export function decodeImageFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Corrupted or undecodable image file.'));
    };

    img.src = objectUrl;
  });
}

/**
 * Creates a display copy using HTML5 Canvas:
 * - Applies crop if provided
 * - Scales down to MAX_DISPLAY_DIMENSION_PX (1600px)
 * - Encodes deterministically to WebP (~0.82 quality)
 */
export async function processDisplayCopy(
  img: HTMLImageElement,
  crop?: CropCoordinates
): Promise<ImageProcessingResult> {
  const naturalWidth = img.naturalWidth || img.width;
  const naturalHeight = img.naturalHeight || img.height;

  // Source crop bounding box
  const sx = crop ? Math.max(0, crop.x) : 0;
  const sy = crop ? Math.max(0, crop.y) : 0;
  const sWidth = crop ? Math.min(naturalWidth - sx, crop.width) : naturalWidth;
  const sHeight = crop ? Math.min(naturalHeight - sy, crop.height) : naturalHeight;

  // Compute scaled target dimensions within MAX_DISPLAY_DIMENSION_PX
  let targetWidth = sWidth;
  let targetHeight = sHeight;

  if (targetWidth > MAX_DISPLAY_DIMENSION_PX || targetHeight > MAX_DISPLAY_DIMENSION_PX) {
    if (targetWidth >= targetHeight) {
      targetHeight = Math.round((targetHeight / targetWidth) * MAX_DISPLAY_DIMENSION_PX);
      targetWidth = MAX_DISPLAY_DIMENSION_PX;
    } else {
      targetWidth = Math.round((targetWidth / targetHeight) * MAX_DISPLAY_DIMENSION_PX);
      targetHeight = MAX_DISPLAY_DIMENSION_PX;
    }
  }

  // Create offscreen canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not available.');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);

  // Export to WebP blob (or JPEG fallback)
  const mimeType = 'image/webp';
  const displayBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to encode display image.'));
      },
      mimeType,
      DISPLAY_IMAGE_QUALITY
    );
  });

  return {
    displayBlob,
    width: targetWidth,
    height: targetHeight,
    displaySize: displayBlob.size,
  };
}

export interface UploadPhotographOptions {
  ownerId: string;
  productId: string;
  file: File;
  crop?: CropCoordinates;
  onProgress?: (percent: number) => void;
  directUpload?: boolean;
}

/**
 * Uploads both original and display copies to Cloud Storage and returns a ProductImageRecord.
 */
export async function uploadPhotograph({
  ownerId,
  productId,
  file,
  crop,
  onProgress,
  directUpload,
}: UploadPhotographOptions): Promise<{ imageRecord: ProductImageRecord; photoItem: PhotographItem }> {
  // 1. Validate file
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid image file.');
  }

  // 2. Decode image to verify integrity
  const img = await decodeImageFile(file);

  // 3. Process display copy locally
  const processed = await processDisplayCopy(img, crop);

  // 4. Generate unique IDs and storage paths
  const imageId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const ext = file.name.split('.').pop() || 'jpg';
  const originalPath = `users/${ownerId}/products/${productId}/originals/${imageId}.${ext}`;
  const displayPath = `users/${ownerId}/products/${productId}/display/${imageId}.webp`;

  // 5. Upload to Cloud Storage if online, or enqueue to durable storage queue if offline
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  if (!isOnline) {
    logger.info('STORAGE', 'Device offline: queueing photo uploads for background sync', { imageId, productId });
    await storageUploadQueue.enqueueUpload({
      ownerUid: ownerId,
      productId,
      imageId,
      blob: file,
      originalFilename: file.name,
      mimeType: file.type,
      variantType: 'original',
      customStoragePath: originalPath,
    });
    await storageUploadQueue.enqueueUpload({
      ownerUid: ownerId,
      productId,
      imageId,
      blob: processed.displayBlob,
      originalFilename: `${imageId}.webp`,
      mimeType: 'image/webp',
      variantType: 'processed',
      customStoragePath: displayPath,
    });

    const localPreviewUrl = URL.createObjectURL(processed.displayBlob);
    const now = new Date().toISOString();

    const imageRecord: ProductImageRecord = {
      id: imageId,
      ownerId,
      originalPath,
      displayPath,
      originalDownloadURL: localPreviewUrl,
      displayDownloadURL: localPreviewUrl,
      fileName: file.name,
      contentType: file.type,
      originalSize: file.size,
      displaySize: processed.displaySize,
      width: processed.width,
      height: processed.height,
      cropInfo: crop,
      uploadStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    const photoItem: PhotographItem = {
      id: imageId,
      url: localPreviewUrl,
      name: file.name,
      size: processed.displaySize,
      type: 'image/webp',
      uploadedAt: now,
      isCover: false,
    };

    return { imageRecord, photoItem };
  }

  try {
    const isDirect = directUpload ?? mediaStorageService.isDirectUploadEnabled();

    // 5a. Upload original
    const originalResult = await mediaStorageService.upload({
      file,
      productId,
      imageId,
      ownerId,
      variant: 'original',
      filename: file.name,
      mimeType: file.type,
      customStoragePath: originalPath,
      idempotencyKey: `idemp_${ownerId}_${productId}_${imageId}_original`,
      directUpload: isDirect,
      onProgress: (pct) => onProgress?.(Math.round(pct * 0.5)),
    });
    const originalDownloadURL = originalResult.downloadUrl;

    // 5b. Upload display copy
    const displayResult = await mediaStorageService.upload({
      file: processed.displayBlob,
      productId,
      imageId,
      ownerId,
      variant: 'display',
      filename: `${imageId}.webp`,
      mimeType: 'image/webp',
      customStoragePath: displayPath,
      idempotencyKey: `idemp_${ownerId}_${productId}_${imageId}_display`,
      directUpload: isDirect,
      onProgress: (pct) => onProgress?.(50 + Math.round(pct * 0.5)),
    });
    const displayDownloadURL = displayResult.downloadUrl;

    logger.info('STORAGE', 'Uploaded dual product photos', {
      imageId,
      originalPath,
      displayPath,
      originalSize: file.size,
      displaySize: processed.displaySize,
      provider: displayResult.provider,
    });

    const now = new Date().toISOString();

    const imageRecord: ProductImageRecord = {
      id: imageId,
      ownerId,
      originalPath,
      displayPath,
      originalDownloadURL,
      displayDownloadURL,
      fileName: file.name,
      contentType: file.type,
      originalSize: file.size,
      displaySize: processed.displaySize,
      width: processed.width,
      height: processed.height,
      cropInfo: crop,
      uploadStatus: 'completed',
      createdAt: now,
      updatedAt: now,
      provider: displayResult.metadata?.provider || originalResult.metadata?.provider,
      publicId: displayResult.metadata?.publicId || originalResult.metadata?.publicId,
      secureUrl: displayDownloadURL || originalDownloadURL,
      version: displayResult.metadata?.version,
      format: displayResult.metadata?.format,
      bytes: processed.displaySize,
      resourceType: displayResult.metadata?.resourceType || 'image',
      variant: 'display',
      checksum: originalResult.metadata?.checksum,
      idempotencyKey: originalResult.metadata?.idempotencyKey,
    };

    const photoItem: PhotographItem = {
      id: imageId,
      url: displayDownloadURL || originalDownloadURL,
      name: file.name,
      size: processed.displaySize,
      type: 'image/webp',
      uploadedAt: now,
      isCover: false,
    };

    return { imageRecord, photoItem };
  } catch (err) {
    const isDirect = directUpload ?? mediaStorageService.isDirectUploadEnabled();
    const errorMsg = err instanceof Error ? err.message : String(err);
    const errorCode =
      (err as { code?: string; errorCode?: string })?.code ||
      (err as { errorCode?: string })?.errorCode ||
      '';
    const isPermissionError =
      errorCode === 'storage/unauthorized' ||
      errorCode === 'storage/canceled' ||
      errorCode === 'storage/invalid-argument' ||
      errorCode === 'AUTHENTICATION_REQUIRED' ||
      errorCode === 'OWNERSHIP_MISMATCH' ||
      (err as { status?: number })?.status === 401 ||
      (err as { status?: number })?.status === 403 ||
      errorMsg.includes('permission-denied') ||
      errorMsg.includes('PERMISSION_DENIED') ||
      errorMsg.includes('unauthorized') ||
      errorMsg.includes('User does not have permission');

    if (isPermissionError) {
      logger.error('STORAGE', 'Permission denied or unauthorized during photo upload', err, {
        storagePath: originalPath,
        ownerId,
      });
      const permErr = new Error(
        `Upload permission denied: ${errorMsg}. Please verify you are signed in to your artisan account.`
      ) as Error & { status?: number; retryable?: boolean; errorCode?: string };
      permErr.status = (err as { status?: number })?.status || 403;
      permErr.retryable = false;
      permErr.errorCode = errorCode || 'PERMISSION_DENIED';
      throw permErr;
    }

    if (isDirect) {
      logger.error('STORAGE', 'Direct photo upload or verification failed', err, {
        productId,
        imageId,
        ownerId,
      });
      const uploadErr = (err instanceof Error ? err : new Error(errorMsg)) as Error & {
        status?: number;
        retryable?: boolean;
        errorCode?: string;
      };
      if ((err as { retryable?: boolean })?.retryable !== undefined) {
        uploadErr.retryable = (err as { retryable?: boolean }).retryable;
      } else {
        uploadErr.retryable = true;
      }
      if ((err as { status?: number })?.status !== undefined) {
        uploadErr.status = (err as { status?: number }).status;
      }
      if (errorCode) {
        uploadErr.errorCode = errorCode;
      }
      throw uploadErr;
    }

    logger.warn('STORAGE', 'Network error during photo upload; falling back to durable queue', {
      error: errorMsg,
    });

    await storageUploadQueue.enqueueUpload({
      ownerUid: ownerId,
      productId,
      imageId,
      blob: file,
      originalFilename: file.name,
      mimeType: file.type,
      variantType: 'original',
      customStoragePath: originalPath,
    });
    await storageUploadQueue.enqueueUpload({
      ownerUid: ownerId,
      productId,
      imageId,
      blob: processed.displayBlob,
      originalFilename: `${imageId}.webp`,
      mimeType: 'image/webp',
      variantType: 'processed',
      customStoragePath: displayPath,
    });

    const localPreviewUrl = URL.createObjectURL(processed.displayBlob);
    const now = new Date().toISOString();

    const imageRecord: ProductImageRecord = {
      id: imageId,
      ownerId,
      originalPath,
      displayPath,
      originalDownloadURL: localPreviewUrl,
      displayDownloadURL: localPreviewUrl,
      fileName: file.name,
      contentType: file.type,
      originalSize: file.size,
      displaySize: processed.displaySize,
      width: processed.width,
      height: processed.height,
      cropInfo: crop,
      uploadStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    const photoItem: PhotographItem = {
      id: imageId,
      url: localPreviewUrl,
      name: file.name,
      size: processed.displaySize,
      type: 'image/webp',
      uploadedAt: now,
      isCover: false,
    };

    return { imageRecord, photoItem };
  }
}
