import { describe, it, expect, beforeEach } from 'vitest';
import { storageUploadQueue } from '@/services/storage/storageUploadQueue';
import { idbClear, STORES } from '@/services/storage/indexedDbStore';

describe('StorageUploadQueue — Durable Offline Queue & Idempotency', () => {
  const testUserA = 'artisan_test_uid_a';
  const testUserB = 'artisan_test_uid_b';
  const testProductA = 'prod_test_001';

  beforeEach(async () => {
    await idbClear(STORES.UPLOAD_QUEUE);
    storageUploadQueue.setActiveUser(null);
  });

  it('1. Enqueues a photo upload with stable operationId and idempotency key', async () => {
    storageUploadQueue.setActiveUser(testUserA);

    const dummyBlob = new Blob(['sample-image-bytes'], { type: 'image/jpeg' });
    const item = await storageUploadQueue.enqueueUpload({
      ownerUid: testUserA,
      productId: testProductA,
      imageId: 'img_001',
      blob: dummyBlob,
      originalFilename: 'craft_sample.jpg',
      mimeType: 'image/jpeg',
      variantType: 'original',
    });

    expect(item.operationId).toBe(`op_up_${testUserA}_${testProductA}_img_001_original`);
    expect(item.idempotencyKey).toBe(`idemp_${testUserA}_${testProductA}_img_001_original`);
    expect(item.status).toBe('pending');
    expect(item.retryCount).toBe(0);
    expect(item.uploadDestination).toContain(`users/${testUserA}/products/${testProductA}/originals/`);

    const userQueue = await storageUploadQueue.getQueueForUser(testUserA);
    expect(userQueue.length).toBe(1);
    expect(userQueue[0].operationId).toBe(item.operationId);
  });

  it('2. Enqueuing identical item does not duplicate the queue entry (Idempotency)', async () => {
    storageUploadQueue.setActiveUser(testUserA);

    const dummyBlob = new Blob(['sample-bytes-1'], { type: 'image/jpeg' });
    const item1 = await storageUploadQueue.enqueueUpload({
      ownerUid: testUserA,
      productId: testProductA,
      imageId: 'img_001',
      blob: dummyBlob,
      variantType: 'original',
    });

    const item2 = await storageUploadQueue.enqueueUpload({
      ownerUid: testUserA,
      productId: testProductA,
      imageId: 'img_001',
      blob: dummyBlob,
      variantType: 'original',
    });

    expect(item1.operationId).toBe(item2.operationId);
    const userQueue = await storageUploadQueue.getQueueForUser(testUserA);
    expect(userQueue.length).toBe(1);
  });

  it('3. Strictly isolates queues between different authenticated owners (Tenant Isolation)', async () => {
    storageUploadQueue.setActiveUser(testUserA);
    await storageUploadQueue.enqueueUpload({
      ownerUid: testUserA,
      productId: testProductA,
      imageId: 'img_user_a',
      blob: new Blob(['a'], { type: 'image/jpeg' }),
    });

    storageUploadQueue.setActiveUser(testUserB);
    await storageUploadQueue.enqueueUpload({
      ownerUid: testUserB,
      productId: 'prod_test_002',
      imageId: 'img_user_b',
      blob: new Blob(['b'], { type: 'image/jpeg' }),
    });

    const queueA = await storageUploadQueue.getQueueForUser(testUserA);
    const queueB = await storageUploadQueue.getQueueForUser(testUserB);

    expect(queueA.length).toBe(1);
    expect(queueA[0].ownerUid).toBe(testUserA);
    expect(queueB.length).toBe(1);
    expect(queueB[0].ownerUid).toBe(testUserB);
  });

  it('4. Provides accurate summary counts for pending, uploading, and failed items', async () => {
    storageUploadQueue.setActiveUser(testUserA);

    await storageUploadQueue.enqueueUpload({
      ownerUid: testUserA,
      productId: testProductA,
      imageId: 'img_001',
      blob: new Blob(['1'], { type: 'image/jpeg' }),
    });
    await storageUploadQueue.enqueueUpload({
      ownerUid: testUserA,
      productId: testProductA,
      imageId: 'img_002',
      blob: new Blob(['2'], { type: 'image/jpeg' }),
    });

    const counts = await storageUploadQueue.getSummaryCounts(testUserA);
    expect(counts.pending).toBe(2);
    expect(counts.uploading).toBe(0);
    expect(counts.failed).toBe(0);
    expect(counts.total).toBe(2);
  });

  it('5. Canceling an item removes it cleanly from the queue', async () => {
    storageUploadQueue.setActiveUser(testUserA);

    const item = await storageUploadQueue.enqueueUpload({
      ownerUid: testUserA,
      productId: testProductA,
      imageId: 'img_cancel',
      blob: new Blob(['cancel'], { type: 'image/jpeg' }),
    });

    let queue = await storageUploadQueue.getQueueForUser(testUserA);
    expect(queue.length).toBe(1);

    await storageUploadQueue.cancelItem(testUserA, item.operationId);
    queue = await storageUploadQueue.getQueueForUser(testUserA);
    expect(queue.length).toBe(0);
  });

  it('6. Halts processing immediately upon logout (Active user set to null)', async () => {
    storageUploadQueue.setActiveUser(testUserA);
    await storageUploadQueue.enqueueUpload({
      ownerUid: testUserA,
      productId: testProductA,
      imageId: 'img_logout_test',
      blob: new Blob(['logout'], { type: 'image/jpeg' }),
    });

    // Simulate logout
    storageUploadQueue.setActiveUser(null);
    expect(storageUploadQueue.getActiveUser()).toBeNull();

    // Calling processQueue should exit immediately without processing
    await storageUploadQueue.processQueue();
    const queue = await storageUploadQueue.getQueueForUser(testUserA);
    expect(queue[0].status).toBe('pending');
  });

  it('7. Marks item as failed immediately on non-retryable provider error without retrying', async () => {
    const { mediaStorageService } = await import('@/services/media/mediaStorageService');
    const vi = (await import('vitest')).vi;

    const mockUpload = vi.spyOn(mediaStorageService, 'upload').mockImplementationOnce(() => {
      const err = new Error('Media upload failed (502) [AuthorizationRequired]: Invalid Signature');
      (err as any).status = 502;
      (err as any).retryable = false;
      return Promise.reject(err);
    });

    storageUploadQueue.setActiveUser(testUserA);
    await storageUploadQueue.enqueueUpload({
      ownerUid: testUserA,
      productId: testProductA,
      imageId: 'img_auth_fail',
      blob: new Blob(['bytes'], { type: 'image/jpeg' }),
    });

    await storageUploadQueue.processQueue();
    const queue = await storageUploadQueue.getQueueForUser(testUserA);
    expect(queue[0].status).toBe('failed');
    expect(queue[0].retryCount).toBe(0); // Did NOT retry
    expect(queue[0].lastError).toContain('AuthorizationRequired');

    mockUpload.mockRestore();
  });

  it('8. Halts queue processing when consecutive failures occur to prevent flooding Render', async () => {
    const { mediaStorageService } = await import('@/services/media/mediaStorageService');
    const vi = (await import('vitest')).vi;

    let uploadAttempts = 0;
    const mockUpload = vi.spyOn(mediaStorageService, 'upload').mockImplementation(() => {
      uploadAttempts++;
      const err = new Error('Media upload failed (500): Server error');
      (err as any).status = 500;
      (err as any).retryable = true;
      return Promise.reject(err);
    });

    storageUploadQueue.setActiveUser(testUserA);

    // Enqueue 4 items
    for (let i = 1; i <= 4; i++) {
      await storageUploadQueue.enqueueUpload({
        ownerUid: testUserA,
        productId: testProductA,
        imageId: `img_batch_${i}`,
        blob: new Blob([`bytes_${i}`], { type: 'image/jpeg' }),
      });
    }

    await storageUploadQueue.processQueue();
    // After 2 consecutive failures, queue pass should halt instead of attempting all 4 items!
    expect(uploadAttempts).toBe(2);

    mockUpload.mockRestore();
  });
});

