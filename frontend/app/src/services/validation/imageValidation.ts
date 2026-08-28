export const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 MiB
export const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
export const MAX_PHOTOS_PER_PRODUCT = 10;

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export function validateProductPhotograph(file: File | Blob): ImageValidationResult {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }

  if (file.size === 0) {
    return { valid: false, error: 'The selected image is empty.' };
  }

  if (file.size > MAX_PHOTO_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `The image size (${sizeMb} MB) exceeds the 10 MB limit.`,
    };
  }

  const type = file.type?.toLowerCase();
  if (!type || !ALLOWED_MIME_TYPES.has(type)) {
    return {
      valid: false,
      error: `Unsupported image format (${type || 'unknown'}). Please select a JPEG, PNG, or WebP photo.`,
    };
  }

  return { valid: true };
}

export function validatePhotoCount(currentCount: number, additionalCount: number): ImageValidationResult {
  if (currentCount + additionalCount > MAX_PHOTOS_PER_PRODUCT) {
    return {
      valid: false,
      error: `Maximum ${MAX_PHOTOS_PER_PRODUCT} photos allowed per product. You currently have ${currentCount}.`,
    };
  }
  return { valid: true };
}
