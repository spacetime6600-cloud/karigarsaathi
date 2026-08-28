import {
  IProductPhotoStorage,
  UploadPhotoProgress,
  UploadPhotoResult,
} from '@/repositories/interfaces/IProductPhotoStorage';
import { validateProductPhotograph } from '@/services/validation/imageValidation';

export class MockProductPhotoStorage implements IProductPhotoStorage {
  async uploadOriginal(
    ownerId: string,
    productId: string,
    file: File | Blob,
    onProgress?: (progress: UploadPhotoProgress) => void
  ): Promise<UploadPhotoResult> {
    const validation = validateProductPhotograph(file);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid photograph.');
    }

    if (onProgress) {
      onProgress({ bytesTransferred: file.size, totalBytes: file.size, progressPercent: 100 });
    }

    const fileId = `mock_${Date.now()}`;
    const storagePath = `users/${ownerId}/products/${productId}/originals/${fileId}`;
    const downloadUrl = URL.createObjectURL(file);

    return { storagePath, downloadUrl };
  }

  async getAuthorizedDisplayUrl(storagePath: string): Promise<string> {
    return storagePath.startsWith('blob:') || storagePath.startsWith('http')
      ? storagePath
      : 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80';
  }

  async deleteOriginal(_storagePath: string): Promise<void> {
    // Mock deletion no-op
  }
}
