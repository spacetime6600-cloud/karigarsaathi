/**
 * Durable Storage Upload Queue for KarigarSaathi.
 * Persists upload jobs to IndexedDB with exponential backoff, single-flight locks,
 * auth-owner isolation, and truthful sync states.
 */
import { idbPut, idbGet, idbGetAll, idbDelete, STORES } from './indexedDbStore';
import { logger } from '@/services/logging/logger';
import { mediaStorageService } from '@/services/media/mediaStorageService';

export type QueueItemStatus = 'pending' | 'uploading' | 'completed' | 'failed';
export type QueueVariantType = 'original' | 'processed' | 'thumbnail';

export interface QueuedUploadItem {
  operationId: string;
  idempotencyKey: string;
  ownerUid: string;
  artisanId: string;
  productId: string;
  draftId?: string;
  imageId: string;
  blob: Blob;
  originalFilename: string;
  mimeType: string;
  size: number;
  uploadDestination: string; // storagePath: users/{ownerUid}/products/{productId}/originals/{filename}
  variantType: QueueVariantType;
  retryCount: number;
  maxRetries: number;
  status: QueueItemStatus;
  createdAt: string;
  updatedAt: string;
  lastError?: string;
  downloadUrl?: string;
}

export interface EnqueueUploadInput {
  ownerUid: string;
  artisanId?: string;
  productId: string;
  draftId?: string;
  imageId: string;
  blob: Blob;
  originalFilename?: string;
  mimeType?: string;
  variantType?: QueueVariantType;
  customStoragePath?: string;
}

export interface QueueSummaryCounts {
  pending: number;
  uploading: number;
  failed: number;
  completed: number;
  total: number;
}

type QueueListener = (items: QueuedUploadItem[]) => void;

class StorageUploadQueueManager {
  private activeOwnerUid: string | null = null;
  private isProcessing = false;
  private inFlightOperations = new Set<string>();
  private listeners = new Set<QueueListener>();
  private processingTimeout: NodeJS.Timeout | null = null;

  /**
   * Set active authenticated owner.
   * When user logs out or switches, active processing is halted immediately.
   */
  setActiveUser(ownerUid: string | null): void {
    if (this.activeOwnerUid !== ownerUid) {
      this.activeOwnerUid = ownerUid;
      if (this.processingTimeout) {
        clearTimeout(this.processingTimeout);
        this.processingTimeout = null;
      }
      this.inFlightOperations.clear();
      this.isProcessing = false;
      logger.info('UPLOAD_QUEUE', 'Active user updated for upload queue', { ownerUid });

      if (ownerUid) {
        this.scheduleProcessing(500);
      }
    }
  }

  getActiveUser(): string | null {
    return this.activeOwnerUid;
  }

  /**
   * Enqueue a new photo / asset upload for durable background persistence.
   */
  async enqueueUpload(input: EnqueueUploadInput): Promise<QueuedUploadItem> {
    const ext = input.mimeType === 'image/png' ? 'png' : input.mimeType === 'image/webp' ? 'webp' : 'jpg';
    const filename = input.originalFilename || `photo_${Date.now()}_${input.imageId}.${ext}`;
    const variant = input.variantType || 'original';
    const destination =
      input.customStoragePath ||
      `users/${input.ownerUid}/products/${input.productId}/${variant === 'original' ? 'originals' : 'processed'}/${filename}`;

    const operationId = `op_up_${input.ownerUid}_${input.productId}_${input.imageId}_${variant}`;
    const idempotencyKey = `idemp_${input.ownerUid}_${input.productId}_${input.imageId}_${variant}`;
    const now = new Date().toISOString();

    // Check if item already exists in queue to preserve idempotency
    const existing = await idbGet<QueuedUploadItem>(STORES.UPLOAD_QUEUE, operationId);
    if (existing && (existing.status === 'completed' || existing.status === 'uploading')) {
      return existing;
    }

    const item: QueuedUploadItem = {
      operationId,
      idempotencyKey,
      ownerUid: input.ownerUid,
      artisanId: input.artisanId || input.ownerUid,
      productId: input.productId,
      draftId: input.draftId,
      imageId: input.imageId,
      blob: input.blob,
      originalFilename: filename,
      mimeType: input.mimeType || input.blob.type || 'image/jpeg',
      size: input.blob.size,
      uploadDestination: destination,
      variantType: variant,
      retryCount: 0,
      maxRetries: 5,
      status: 'pending',
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    await idbPut(STORES.UPLOAD_QUEUE, item);
    logger.info('UPLOAD_QUEUE', 'Enqueued storage upload item', {
      operationId,
      destination,
      size: item.size,
    });

    this.notifyListeners();
    this.scheduleProcessing(200);

    return item;
  }

  /**
   * Retrieve all queued items for a specific owner UID (auth isolation).
   */
  async getQueueForUser(ownerUid: string): Promise<QueuedUploadItem[]> {
    if (!ownerUid) return [];
    const all = await idbGetAll<QueuedUploadItem>(STORES.UPLOAD_QUEUE);
    return all.filter((item) => item.ownerUid === ownerUid);
  }

  /**
   * Get summary counts for a user.
   */
  async getSummaryCounts(ownerUid: string): Promise<QueueSummaryCounts> {
    const userItems = await this.getQueueForUser(ownerUid);
    return {
      pending: userItems.filter((i) => i.status === 'pending').length,
      uploading: userItems.filter((i) => i.status === 'uploading').length,
      failed: userItems.filter((i) => i.status === 'failed').length,
      completed: userItems.filter((i) => i.status === 'completed').length,
      total: userItems.length,
    };
  }

  /**
   * Manual retry of a specific failed item or all failed items for the active user.
   */
  async retryItem(ownerUid: string, operationId: string): Promise<void> {
    if (this.activeOwnerUid !== ownerUid) return;
    const item = await idbGet<QueuedUploadItem>(STORES.UPLOAD_QUEUE, operationId);
    if (item && item.ownerUid === ownerUid) {
      item.status = 'pending';
      item.retryCount = 0;
      item.lastError = undefined;
      item.updatedAt = new Date().toISOString();
      await idbPut(STORES.UPLOAD_QUEUE, item);
      this.notifyListeners();
      this.scheduleProcessing(100);
    }
  }

  async retryAllFailed(ownerUid: string): Promise<void> {
    if (this.activeOwnerUid !== ownerUid) return;
    const items = await this.getQueueForUser(ownerUid);
    const failedItems = items.filter((i) => i.status === 'failed');

    for (const item of failedItems) {
      item.status = 'pending';
      item.retryCount = 0;
      item.lastError = undefined;
      item.updatedAt = new Date().toISOString();
      await idbPut(STORES.UPLOAD_QUEUE, item);
    }

    if (failedItems.length > 0) {
      this.notifyListeners();
      this.scheduleProcessing(100);
    }
  }

  /**
   * Cancel and remove an item from the queue.
   */
  async cancelItem(ownerUid: string, operationId: string): Promise<void> {
    const item = await idbGet<QueuedUploadItem>(STORES.UPLOAD_QUEUE, operationId);
    if (item && item.ownerUid === ownerUid) {
      this.inFlightOperations.delete(operationId);
      await idbDelete(STORES.UPLOAD_QUEUE, operationId);
      this.notifyListeners();
    }
  }

  /**
   * Remove completed items to clean up local storage.
   */
  async clearCompleted(ownerUid: string): Promise<void> {
    const items = await this.getQueueForUser(ownerUid);
    const completed = items.filter((i) => i.status === 'completed');
    for (const item of completed) {
      await idbDelete(STORES.UPLOAD_QUEUE, item.operationId);
    }
    this.notifyListeners();
  }

  /**
   * Remove failed items to clean up local queue.
   */
  async clearFailed(ownerUid: string): Promise<void> {
    const items = await this.getQueueForUser(ownerUid);
    const failed = items.filter((i) => i.status === 'failed');
    for (const item of failed) {
      await idbDelete(STORES.UPLOAD_QUEUE, item.operationId);
    }
    this.notifyListeners();
  }

  /**
   * Main Queue Processing Loop.
   * Sequential execution (1 upload at a time) to conserve memory on mobile devices.
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    if (!this.activeOwnerUid) return;

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (!isOnline) {
      logger.info('UPLOAD_QUEUE', 'Device is offline, delaying upload queue processing');
      return;
    }

    this.isProcessing = true;

    try {
      const items = await this.getQueueForUser(this.activeOwnerUid);
      const pendingItems = items.filter((i) => i.status === 'pending');

      for (const item of pendingItems) {
        // Double-check active user hasn't changed
        if (this.activeOwnerUid !== item.ownerUid) break;

        // Skip if already in flight
        if (this.inFlightOperations.has(item.operationId)) continue;

        await this.uploadSingleItem(item);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Upload single item with error classification and exponential backoff.
   */
  private async uploadSingleItem(item: QueuedUploadItem): Promise<void> {
    this.inFlightOperations.add(item.operationId);

    // Update status to uploading
    item.status = 'uploading';
    item.updatedAt = new Date().toISOString();
    await idbPut(STORES.UPLOAD_QUEUE, item);
    this.notifyListeners();

    try {
      const uploadResult = await mediaStorageService.upload({
        file: item.blob,
        productId: item.productId,
        imageId: item.imageId,
        ownerId: item.ownerUid,
        variant: item.variantType === 'processed' ? 'display' : item.variantType,
        filename: item.originalFilename,
        mimeType: item.mimeType,
        idempotencyKey: item.idempotencyKey,
        customStoragePath: item.uploadDestination,
      });

      // Mark completed
      item.status = 'completed';
      item.downloadUrl = uploadResult.downloadUrl;
      item.updatedAt = new Date().toISOString();
      item.lastError = undefined;
      // Step 4: IndexedDB binary is removed only after the full operation succeeds
      item.blob = new Blob([], { type: item.mimeType });
      await idbPut(STORES.UPLOAD_QUEUE, item);
      logger.info('UPLOAD_QUEUE', 'Completed upload for item', { operationId: item.operationId, destination: item.uploadDestination, provider: uploadResult.provider });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const isRetryable = this.isErrorRetryable(err);

      logger.warn('UPLOAD_QUEUE', 'Upload failed for item', {
        operationId: item.operationId,
        error: errorMsg,
        isRetryable,
        retryCount: item.retryCount,
      });

      if (isRetryable && item.retryCount < item.maxRetries) {
        item.retryCount += 1;
        item.status = 'pending';
        item.lastError = errorMsg;
        item.updatedAt = new Date().toISOString();
        await idbPut(STORES.UPLOAD_QUEUE, item);

        // Exponential backoff with jitter
        const backoffMs = Math.min(30000, 1000 * Math.pow(2, item.retryCount) + Math.random() * 500);
        this.scheduleProcessing(backoffMs);
      } else {
        // Mark failed
        item.status = 'failed';
        item.lastError = isRetryable ? `Max retries exceeded (${item.maxRetries}): ${errorMsg}` : errorMsg;
        item.updatedAt = new Date().toISOString();
        await idbPut(STORES.UPLOAD_QUEUE, item);
      }
    } finally {
      this.inFlightOperations.delete(item.operationId);
      this.notifyListeners();
    }
  }

  private isErrorRetryable(err: unknown): boolean {
    if (!err) return true;
    const msg = err instanceof Error ? err.message : String(err);
    const code = (err as { code?: string })?.code || '';

    // Non-retryable: permission-denied, unauthenticated, quota exceeded, invalid argument, 401/403
    if (
      code === 'storage/unauthorized' ||
      code === 'storage/unauthenticated' ||
      code === 'storage/canceled' ||
      code === 'storage/invalid-argument' ||
      code === 'storage/quota-exceeded' ||
      msg.includes('permission-denied') ||
      msg.includes('PERMISSION_DENIED') ||
      msg.includes('unauthorized') ||
      msg.includes('UNAUTHORIZED') ||
      msg.includes('User does not have permission') ||
      msg.includes('Ownership mismatch') ||
      msg.includes('403') ||
      msg.includes('401')
    ) {
      return false;
    }

    // Default network / timeout errors are retryable
    return true;
  }

  private scheduleProcessing(delayMs = 300): void {
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
    }
    this.processingTimeout = setTimeout(() => {
      this.processingTimeout = null;
      this.processQueue().catch((err) => {
        logger.warn('UPLOAD_QUEUE', 'Error in background queue processor', err);
      });
    }, delayMs);
  }

  subscribe(listener: QueueListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private async notifyListeners(): Promise<void> {
    if (!this.activeOwnerUid || this.listeners.size === 0) return;
    const items = await this.getQueueForUser(this.activeOwnerUid);
    for (const listener of this.listeners) {
      try {
        listener(items);
      } catch (err) {
        logger.warn('UPLOAD_QUEUE', 'Error in queue listener', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }
}

export const storageUploadQueue = new StorageUploadQueueManager();

