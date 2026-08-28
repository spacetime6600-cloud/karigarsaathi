import { describe, it, expect, beforeEach } from 'vitest';
import { syncService } from '@/services/storage/syncService';
import { storageUploadQueue } from '@/services/storage/storageUploadQueue';
import { idbClear, STORES } from '@/services/storage/indexedDbStore';

describe('SyncService — Canonical User-Facing Sync States', () => {
  const testUser = 'artisan_sync_test_user';

  beforeEach(async () => {
    syncService.clearQueue();
    syncService.setForceOffline(false);
    await idbClear(STORES.UPLOAD_QUEUE);
    storageUploadQueue.setActiveUser(testUser);
  });

  it('1. Returns "saved" when online and all queues are empty', async () => {
    const status = await syncService.getDetailedStatus(testUser);
    expect(status.canonicalState).toBe('saved');
    expect(status.isOnline).toBe(true);
    expect(status.totalPending).toBe(0);
  });

  it('2. Returns "pending" when simulated offline or items are in queue', async () => {
    syncService.setForceOffline(true);
    let status = await syncService.getDetailedStatus(testUser);
    expect(status.canonicalState).toBe('pending');
    expect(status.isOnline).toBe(false);

    syncService.setForceOffline(false);
    syncService.addToQueue('draft_save', { draftId: 'draft_123' });
    status = await syncService.getDetailedStatus(testUser);
    expect(status.canonicalState).toBe('pending');
    expect(status.totalPending).toBe(1);
  });

  it('3. Returns "failed" when one or more storage upload operations have failed', async () => {
    await storageUploadQueue.enqueueUpload({
      ownerUid: testUser,
      productId: 'prod_fail_test',
      imageId: 'img_fail',
      blob: new Blob(['bad-data'], { type: 'image/jpeg' }),
    });

    // Artificially simulate failed state in IndexedDB
    const stored = (await storageUploadQueue.getQueueForUser(testUser))[0];
    stored.status = 'failed';
    stored.lastError = 'Storage quota exceeded or permanent permission error';
    await storageUploadQueue.retryItem(testUser, stored.operationId); // will reset to pending, but let's test failed

    // Set directly to failed
    stored.status = 'failed';
    const { idbPut } = await import('@/services/storage/indexedDbStore');
    await idbPut(STORES.UPLOAD_QUEUE, stored);

    const status = await syncService.getDetailedStatus(testUser);
    expect(status.canonicalState).toBe('failed');
    expect(status.failedCount).toBe(1);
  });

  it('4. Retries failed items cleanly and transitions back to pending', async () => {
    await storageUploadQueue.enqueueUpload({
      ownerUid: testUser,
      productId: 'prod_retry_test',
      imageId: 'img_retry',
      blob: new Blob(['data'], { type: 'image/jpeg' }),
    });

    const stored = (await storageUploadQueue.getQueueForUser(testUser))[0];
    stored.status = 'failed';
    stored.lastError = 'Network timeout';
    const { idbPut } = await import('@/services/storage/indexedDbStore');
    await idbPut(STORES.UPLOAD_QUEUE, stored);

    let status = await syncService.getDetailedStatus(testUser);
    expect(status.canonicalState).toBe('failed');

    await storageUploadQueue.retryAllFailed(testUser);
    status = await syncService.getDetailedStatus(testUser);
    expect(status.canonicalState).toBe('pending');
    expect(status.failedCount).toBe(0);
  });
});

