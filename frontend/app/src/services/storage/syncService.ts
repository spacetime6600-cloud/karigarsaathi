import { SyncState } from '@/types';
import { storage } from './localStorage';
import { storageUploadQueue, QueuedUploadItem } from './storageUploadQueue';

export interface PendingSyncItem {
  id: string;
  type: 'draft_save' | 'passport_creation' | 'enquiry_reply' | 'photo_upload';
  payload: unknown;
  createdAt: string;
}

export interface DetailedSyncStatus {
  canonicalState: 'saved' | 'pending' | 'syncing' | 'failed';
  isOnline: boolean;
  pendingCount: number;
  uploadingCount: number;
  failedCount: number;
  totalPending: number;
  queuedUploads: QueuedUploadItem[];
}

export const syncService = {
  getSyncState(_ownerUid?: string): SyncState {
    const isOnline = this.isOnline();
    const forceOffline = storage.get<boolean>('forceOfflineSimulation', false);

    if (forceOffline || !isOnline) {
      const queue = this.getQueue();
      return queue.length > 0 ? 'pending' : 'saved';
    }

    const queue = this.getQueue();
    if (queue.length > 0) return 'pending';

    return 'saved';
  },

  async getDetailedStatus(ownerUid?: string): Promise<DetailedSyncStatus> {
    const isOnline = this.isOnline();
    const genericQueue = this.getQueue();
    const uploadCounts = ownerUid
      ? await storageUploadQueue.getSummaryCounts(ownerUid)
      : { pending: 0, uploading: 0, failed: 0, completed: 0, total: 0 };
    const queuedUploads = ownerUid ? await storageUploadQueue.getQueueForUser(ownerUid) : [];

    const pendingCount = genericQueue.length + uploadCounts.pending;
    const uploadingCount = uploadCounts.uploading;
    const failedCount = uploadCounts.failed;
    const totalPending = pendingCount + uploadingCount + failedCount;

    let canonicalState: 'saved' | 'pending' | 'syncing' | 'failed' = 'saved';

    if (failedCount > 0) {
      canonicalState = 'failed';
    } else if (uploadingCount > 0) {
      canonicalState = 'syncing';
    } else if (totalPending > 0 || !isOnline) {
      canonicalState = 'pending';
    } else {
      canonicalState = 'saved';
    }

    return {
      canonicalState,
      isOnline,
      pendingCount,
      uploadingCount,
      failedCount,
      totalPending,
      queuedUploads,
    };
  },

  isOnline(): boolean {
    const forceOffline = storage.get<boolean>('forceOfflineSimulation', false);
    if (forceOffline) return false;
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  },

  getQueue(): PendingSyncItem[] {
    return storage.get<PendingSyncItem[]>('syncQueue', []);
  },

  addToQueue(type: PendingSyncItem['type'], payload: unknown): void {
    const queue = this.getQueue();
    queue.push({
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      payload,
      createdAt: new Date().toISOString(),
    });
    storage.set('syncQueue', queue);
  },

  clearQueue(): void {
    storage.set('syncQueue', []);
  },

  setForceOffline(offline: boolean): void {
    storage.set('forceOfflineSimulation', offline);
  },

  getForceOffline(): boolean {
    return storage.get<boolean>('forceOfflineSimulation', false);
  },
};
