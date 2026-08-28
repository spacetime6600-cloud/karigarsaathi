import { productPhotoStorage } from '@/repositories';
import { UploadPhotoProgress, UploadPhotoResult } from '@/repositories/interfaces/IProductPhotoStorage';
import { validateProductPhotograph } from '@/services/validation/imageValidation';
import { logger } from '@/services/logging/logger';

export interface UploadOptions {
  ownerId: string;
  productId: string;
  file: File | Blob;
  onProgress?: (progress: UploadPhotoProgress) => void;
}

export class ProductPhotoUploadService {
  async uploadPhoto(options: UploadOptions): Promise<UploadPhotoResult> {
    const { ownerId, productId, file, onProgress } = options;

    // 1. Client UX Validation
    const validation = validateProductPhotograph(file);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid photo file.');
    }

    logger.info('STORAGE', 'Initiating photograph upload via service', { ownerId, productId });

    try {
      const result = await productPhotoStorage.uploadOriginal(ownerId, productId, file, onProgress);
      return result;
    } catch (err) {
      logger.error('STORAGE', 'Photograph upload service failure', err, { ownerId, productId });
      throw err;
    }
  }

  async cleanupFailedUpload(storagePath: string): Promise<void> {
    try {
      await productPhotoStorage.deleteOriginal(storagePath);
      logger.info('STORAGE', 'Cleaned up orphaned photograph after failure', { storagePath });
    } catch (err) {
      logger.warn('STORAGE', 'Could not delete orphaned photograph', {
        storagePath,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

export const photoUploadService = new ProductPhotoUploadService();
