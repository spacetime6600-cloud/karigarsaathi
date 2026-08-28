export interface UploadPhotoProgress {
  bytesTransferred: number;
  totalBytes: number;
  progressPercent: number;
}

export interface UploadPhotoResult {
  storagePath: string;
  downloadUrl: string;
}

export interface IProductPhotoStorage {
  uploadOriginal(
    ownerId: string,
    productId: string,
    file: File | Blob,
    onProgress?: (progress: UploadPhotoProgress) => void
  ): Promise<UploadPhotoResult>;
  getAuthorizedDisplayUrl(storagePath: string): Promise<string>;
  deleteOriginal(storagePath: string): Promise<void>;
}
