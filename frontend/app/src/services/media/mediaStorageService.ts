/**
 * Provider-agnostic Media Storage Service.
 * Routes uploads, replacements, and deletions to either:
 * - Cloudinary (via authenticated FastAPI backend)
 * - Firebase Storage Emulator (for local offline dev / emulator tests)
 *
 * Secrets are never placed in frontend code.
 */

import { auth, storage as firebaseStorage } from '@/config/firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { logger } from '@/services/logging/logger';

export type MediaStorageProvider = 'cloudinary' | 'firebase_emulator';

export interface UploadMediaParams {
  file: Blob | File;
  productId: string;
  imageId: string;
  ownerId: string;
  variant?: 'original' | 'display' | 'enhanced' | 'thumbnail';
  filename?: string;
  mimeType?: string;
  idempotencyKey?: string;
  onProgress?: (percent: number) => void;
  customStoragePath?: string;
}

export interface ReplaceMediaParams extends UploadMediaParams {
  previousPublicId?: string;
  storagePath?: string;
}

export interface DeleteMediaParams {
  productId: string;
  imageId: string;
  ownerId: string;
  variant?: 'original' | 'display' | 'enhanced' | 'thumbnail';
  storagePath?: string;
  publicId?: string;
}

export interface UploadMediaResult {
  downloadUrl: string;
  provider: MediaStorageProvider;
  storagePath?: string;
  metadata: {
    provider: 'cloudinary' | 'firebase';
    publicId?: string;
    secureUrl?: string;
    version?: string | number;
    width?: number;
    height?: number;
    format?: string;
    bytes?: number;
    resourceType?: string;
    variant?: string;
    imageId?: string;
    productId?: string;
    checksum?: string;
    idempotencyKey?: string;
  };
}

class MediaStorageService {
  /**
   * Determine the current storage provider.
   * If VITE_MEDIA_STORAGE_PROVIDER is explicitly set, use it.
   * Otherwise, if emulators are enabled, use firebase_emulator; in production, default to cloudinary.
   */
  public getProvider(): MediaStorageProvider {
    const explicit = import.meta.env.VITE_MEDIA_STORAGE_PROVIDER;
    if (explicit === 'cloudinary') return 'cloudinary';
    if (explicit === 'firebase_emulator' || explicit === 'firebase') return 'firebase_emulator';

    const useEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS;
    if (useEmulators === 'true' || useEmulators === true) {
      return 'firebase_emulator';
    }

    return 'cloudinary';
  }

  /**
   * Base URL for the backend microservice hosting Cloudinary media endpoints.
   */
  public getBackendBaseUrl(): string {
    const configured = import.meta.env.VITE_AI_SERVICE_URL;
    if (configured) return configured;

    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname;
      if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return `${window.location.protocol}//${hostname}:8000`;
      }
    }
    return 'http://localhost:8000';
  }

  /**
   * Get auth token for backend requests.
   */
  private async getAuthToken(): Promise<string> {
    try {
      if (auth?.currentUser) {
        const idToken = await auth.currentUser.getIdToken();
        if (idToken) return idToken;
      }
    } catch {
      // Fall through to dev token
    }
    return import.meta.env.VITE_AI_DEV_BEARER_TOKEN || 'your-dev-token-here';
  }

  /**
   * Upload image using the active provider.
   */
  public async upload(params: UploadMediaParams): Promise<UploadMediaResult> {
    const provider = this.getProvider();

    if (provider === 'cloudinary') {
      return this.uploadToCloudinary(params);
    } else {
      return this.uploadToFirebaseStorage(params);
    }
  }

  /**
   * Upload to Cloudinary via backend FastAPI endpoint.
   */
  private async uploadToCloudinary(params: UploadMediaParams): Promise<UploadMediaResult> {
    const baseUrl = this.getBackendBaseUrl();
    const token = await this.getAuthToken();
    const variant = params.variant || 'original';
    const filename = params.filename || `${params.imageId}.${params.mimeType?.includes('png') ? 'png' : params.mimeType?.includes('webp') ? 'webp' : 'jpg'}`;

    const formData = new FormData();
    const fileToUpload = params.file instanceof File
      ? params.file
      : new File([params.file], filename, { type: params.mimeType || params.file.type || 'image/jpeg' });

    formData.append('file', fileToUpload);
    formData.append('product_id', params.productId);
    formData.append('image_id', params.imageId);
    formData.append('owner_id', params.ownerId);
    formData.append('variant', variant);
    if (params.idempotencyKey) {
      formData.append('idempotency_key', params.idempotencyKey);
    }

    if (params.onProgress) params.onProgress(30);

    const response = await fetch(`${baseUrl}/v1/media/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (params.onProgress) params.onProgress(90);

    if (!response.ok) {
      let errDetail = 'Failed to upload to Cloudinary.';
      let isRetryable = response.status >= 500 && response.status !== 502;
      let errorCode = 'STORAGE_UPLOAD_ERROR';
      let providerErrorType = '';
      try {
        const errJson = await response.json();
        const detail = errJson.detail;
        if (typeof detail === 'object' && detail !== null) {
          errDetail = detail.message || errDetail;
          if (detail.retryable !== undefined) {
            isRetryable = Boolean(detail.retryable);
          }
          if (detail.error_code) {
            errorCode = detail.error_code;
          }
          if (detail.provider_error_type) {
            providerErrorType = detail.provider_error_type;
          }
        } else if (typeof detail === 'string') {
          errDetail = detail;
        } else if (errJson.message) {
          errDetail = errJson.message;
        }
      } catch {
        // use default
      }
      const errorMsg = providerErrorType
        ? `Media upload failed (${response.status}) [${providerErrorType}]: ${errDetail}`
        : `Media upload failed (${response.status}): ${errDetail}`;
      const err = new Error(errorMsg) as Error & { status?: number; retryable?: boolean; errorCode?: string };
      err.status = response.status;
      err.retryable = isRetryable;
      err.errorCode = errorCode;
      throw err;
    }

    const data = await response.json();
    if (params.onProgress) params.onProgress(100);

    logger.info('STORAGE', 'Cloudinary upload succeeded', {
      publicId: data.publicId,
      secureUrl: data.secureUrl,
      variant,
    });

    return {
      downloadUrl: data.secureUrl,
      provider: 'cloudinary',
      metadata: {
        provider: 'cloudinary',
        publicId: data.publicId,
        secureUrl: data.secureUrl,
        version: data.version,
        width: data.width,
        height: data.height,
        format: data.format,
        bytes: data.bytes,
        resourceType: data.resourceType,
        variant: data.variant,
        imageId: data.imageId,
        productId: data.productId,
        checksum: data.checksum,
        idempotencyKey: data.idempotencyKey,
      },
    };
  }

  /**
   * Upload to Firebase Storage emulator directly.
   */
  private async uploadToFirebaseStorage(params: UploadMediaParams): Promise<UploadMediaResult> {
    const variant = params.variant || 'original';
    const ext = params.mimeType?.includes('png') ? 'png' : params.mimeType?.includes('webp') ? 'webp' : 'jpg';
    const filename = params.filename || `photo_${Date.now()}_${params.imageId}.${ext}`;
    const destination =
      params.customStoragePath ||
      `users/${params.ownerId}/products/${params.productId}/${variant === 'original' ? 'originals' : 'display'}/${filename}`;

    const storageRef = ref(firebaseStorage, destination);
    const uploadTask = uploadBytesResumable(storageRef, params.file, {
      contentType: params.mimeType || params.file.type || 'image/jpeg',
      customMetadata: {
        ownerId: params.ownerId,
        productId: params.productId,
        imageId: params.imageId,
        variant,
        idempotencyKey: params.idempotencyKey || '',
      },
    });

    if (params.onProgress) {
      uploadTask.on('state_changed', (snapshot) => {
        const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        params.onProgress?.(percent);
      });
    }

    await uploadTask;
    const downloadUrl = await getDownloadURL(storageRef).catch(() => destination);

    return {
      downloadUrl,
      provider: 'firebase_emulator',
      storagePath: destination,
      metadata: {
        provider: 'firebase',
        variant,
        imageId: params.imageId,
        productId: params.productId,
        bytes: params.file.size,
      },
    };
  }

  /**
   * Replace an image with a new file.
   */
  public async replace(params: ReplaceMediaParams): Promise<UploadMediaResult> {
    const provider = this.getProvider();
    if (provider === 'cloudinary') {
      const baseUrl = this.getBackendBaseUrl();
      const token = await this.getAuthToken();
      const variant = params.variant || 'original';
      const filename = params.filename || `${params.imageId}.jpg`;

      const formData = new FormData();
      const fileToUpload = params.file instanceof File
        ? params.file
        : new File([params.file], filename, { type: params.mimeType || 'image/jpeg' });

      formData.append('file', fileToUpload);
      formData.append('product_id', params.productId);
      formData.append('image_id', params.imageId);
      formData.append('owner_id', params.ownerId);
      formData.append('variant', variant);
      if (params.previousPublicId) {
        formData.append('previous_public_id', params.previousPublicId);
      }
      if (params.idempotencyKey) {
        formData.append('idempotency_key', params.idempotencyKey);
      }

      const response = await fetch(`${baseUrl}/v1/media/replace`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Media replacement failed (${response.status})`);
      }

      const data = await response.json();
      return {
        downloadUrl: data.secureUrl,
        provider: 'cloudinary',
        metadata: {
          provider: 'cloudinary',
          publicId: data.publicId,
          secureUrl: data.secureUrl,
          version: data.version,
          width: data.width,
          height: data.height,
          format: data.format,
          bytes: data.bytes,
          resourceType: data.resourceType,
          variant: data.variant,
          imageId: data.imageId,
          productId: data.productId,
          checksum: data.checksum,
          idempotencyKey: data.idempotencyKey,
        },
      };
    } else {
      // In Firebase emulator mode, upload replacement and delete old if path differs
      const result = await this.uploadToFirebaseStorage(params);
      if (params.customStoragePath && params.storagePath && params.customStoragePath !== params.storagePath) {
        try {
          await deleteObject(ref(firebaseStorage, params.storagePath));
        } catch {
          // recoverable cleanup
        }
      }
      return result;
    }
  }

  /**
   * Delete an image from storage.
   */
  public async delete(params: DeleteMediaParams): Promise<{ success: boolean }> {
    const provider = this.getProvider();
    const variant = params.variant || 'original';

    if (provider === 'cloudinary') {
      const baseUrl = this.getBackendBaseUrl();
      const token = await this.getAuthToken();
      const url = `${baseUrl}/v1/media/${encodeURIComponent(params.productId)}/${encodeURIComponent(params.imageId)}/${encodeURIComponent(variant)}?owner_id=${encodeURIComponent(params.ownerId)}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok && response.status !== 404) {
        throw new Error(`Cloudinary delete failed (${response.status})`);
      }
      return { success: true };
    } else {
      if (params.storagePath) {
        try {
          await deleteObject(ref(firebaseStorage, params.storagePath));
        } catch (err) {
          logger.warn('STORAGE', 'Firebase storage delete warning', { error: String(err) });
        }
      }
      return { success: true };
    }
  }
}

export const mediaStorageService = new MediaStorageService();
