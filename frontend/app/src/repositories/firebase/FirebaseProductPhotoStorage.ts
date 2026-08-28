import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from '@/config/firebase';
import {
  IProductPhotoStorage,
  UploadPhotoProgress,
  UploadPhotoResult,
} from '@/repositories/interfaces/IProductPhotoStorage';
import { validateProductPhotograph } from '@/services/validation/imageValidation';
import { logger } from '@/services/logging/logger';

export class FirebaseProductPhotoStorage implements IProductPhotoStorage {
  async uploadOriginal(
    ownerId: string,
    productId: string,
    file: File | Blob,
    onProgress?: (progress: UploadPhotoProgress) => void
  ): Promise<UploadPhotoResult> {
    // 1. Client-side UX validation
    const validation = validateProductPhotograph(file);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid photograph.');
    }

    // Determine extension safely
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const fileId = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const storagePath = `users/${ownerId}/products/${productId}/originals/${fileId}`;

    logger.info('STORAGE', 'Starting photograph upload', { storagePath });

    const photoRef = ref(storage, storagePath);

    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(photoRef, file, {
        contentType: file.type || 'image/jpeg',
        customMetadata: {
          ownerId,
          productId,
        },
      });

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (onProgress && snapshot.totalBytes > 0) {
            onProgress({
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              progressPercent: Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
            });
          }
        },
        (error) => {
          logger.error('STORAGE', 'Photograph upload failed', error, { storagePath });
          reject(this.normalizeError(error));
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            logger.info('STORAGE', 'Photograph upload completed', { storagePath });
            resolve({
              storagePath,
              downloadUrl,
            });
          } catch (err) {
            reject(this.normalizeError(err));
          }
        }
      );
    });
  }

  async getAuthorizedDisplayUrl(storagePath: string): Promise<string> {
    try {
      const photoRef = ref(storage, storagePath);
      return await getDownloadURL(photoRef);
    } catch (err) {
      logger.error('STORAGE', 'Failed to obtain download URL', err, { storagePath });
      throw this.normalizeError(err);
    }
  }

  async deleteOriginal(storagePath: string): Promise<void> {
    try {
      const photoRef = ref(storage, storagePath);
      await deleteObject(photoRef);
      logger.info('STORAGE', 'Deleted photograph from storage', { storagePath });
    } catch (err) {
      logger.error('STORAGE', 'Failed to delete photograph', err, { storagePath });
      throw this.normalizeError(err);
    }
  }

  private normalizeError(err: unknown): Error {
    if (err instanceof Error) {
      if (err.message.includes('unauthorized') || err.message.includes('permission-denied') || (err as { code?: string }).code === 'storage/unauthorized') {
        return new Error('Access denied: You do not have permission to upload or access this photograph.');
      }
      if ((err as { code?: string }).code === 'storage/canceled') {
        return new Error('Photograph upload was cancelled.');
      }
      return err;
    }
    return new Error('An error occurred during photograph storage.');
  }
}
