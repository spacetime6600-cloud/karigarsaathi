# Phase 12 — Offline Architecture & Storage Queue Design

## 1. Executive Summary & Problem Statement

Rural Indian artisans operating in remote handloom clusters (such as Assam, Odisha, Bengal, and Andhra Pradesh) frequently face intermittent cellular networks, high latency, spotty 2G/3G connectivity, and low-memory Android devices.

While Firestore provides native offline persistence for structured document reads and writes through client-side IndexedDB caching, **Firebase Cloud Storage does NOT provide native offline write queueing**. Attempts to upload binary photograph blobs during connectivity drops fail immediately with network errors.

Phase 12 bridges this architectural gap by implementing:
1. **Multi-Tab Modular Firestore Persistent Cache** (`persistentLocalCache` with `persistentMultipleTabManager`).
2. **Durable IndexedDB Binary Storage Upload Queue** (`storageUploadQueue`) with auth-tenant isolation, idempotency keys, single-flight locking, exponential backoff, and background execution.
3. **Truthful 4-State Sync Hierarchy** (`saved`, `pending`, `syncing`, `failed`) guaranteeing that no in-memory state is falsely reported as server-persisted.

```
+-----------------------------------------------------------------------------------+
|                              KarigarSaathi Client                                 |
+-----------------------------------------------------------------------------------+
             |                                                  |
     [Firestore Writes]                                [Photograph Uploads]
             v                                                  v
+-----------------------------+                    +--------------------------------+
|  Firestore Local Cache      |                    |  storageUploadQueue (IndexedDB)|
|  - Tab-safe persistent store|                    |  - ownerUid isolation          |
|  - Queued mutation pipeline |                    |  - Idempotency keys            |
|  - Graceful memory fallback |                    |  - Exponential backoff         |
+-----------------------------+                    +--------------------------------+
             |                                                  |
     (When Connected)                                   (When Connected)
             v                                                  v
+-----------------------------+                    +--------------------------------+
|    Cloud Firestore API      |                    |     Cloud Storage Bucket       |
+-----------------------------+                    +--------------------------------+
```

---

## 2. Firestore Multi-Tab Persistent Cache Configuration

In `src/config/firebase.ts`, Firestore is initialized using the Firebase Web SDK v10/v11 modular API:

```typescript
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
} from 'firebase/firestore';

export const db = (() => {
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch (err) {
    // Graceful fallback for non-IndexedDB/jsdom environments
    return initializeFirestore(app, {
      localCache: memoryLocalCache(),
    });
  }
})();
```

### Key Architectural Properties:
- **Zero-Config Read Availability**: Previously fetched products, profiles, and passorts are served instantly from disk when offline.
- **Offline Mutation Pipeline**: Mutations made offline are queued by Firestore and synced automatically upon reconnection without manual code intervention.
- **Safe Tab Sharing**: Multi-tab synchronization is managed via Web Locks and IndexedDB without locking collisions.

---

## 3. Durable Storage Upload Queue (`storageUploadQueue`)

The `storageUploadQueue` manages photographic assets that must survive browser reloads, power loss, and memory evictions.

### 3.1 Data Model & Store Structure
Queued items are stored in IndexedDB store `upload_queue` with schema:

```typescript
export interface QueuedUploadItem {
  operationId: string;        // op_up_${ownerUid}_${productId}_${imageId}_${variantType}
  idempotencyKey: string;     // idemp_${ownerUid}_${productId}_${imageId}_${variantType}
  ownerUid: string;           // Strict tenant isolation
  productId: string;
  imageId: string;
  blob: Blob;                 // Persisted binary data
  originalFilename: string;
  mimeType: string;
  variantType: 'original' | 'processed';
  customStoragePath?: string;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  queuedAt: string;
  lastAttemptAt?: string;
}
```

### 3.2 Key Operating Guarantees
1. **Idempotency**: Operation IDs and idempotency keys are deterministically generated based on `(ownerUid, productId, imageId, variantType)`. Re-enqueuing an existing photo updates the entry rather than creating duplicates.
2. **Tenant Isolation**: Processing is strictly gated on the active user UID (`storageUploadQueue.setActiveUser(uid)`). On logout or switch, in-flight operations are cancelled and queue processing stops immediately.
3. **Sequential Bounded Concurrency**: Only 1 upload is processed at a time to prevent saturating rural 2G/3G bandwidth and triggering out-of-memory errors on 2GB–3GB RAM Android devices.
4. **Exponential Backoff with Jitter**:
   $$\text{Delay} = \min\left(30000\text{ms},\; 1000\text{ms} \times 2^{\text{retryCount}} + \text{jitter}(0\text{--}1000\text{ms})\right)$$
5. **Error Classification**:
   - *Retryable Errors* (network drops, timeout, server 5xx): increment retry count up to 5 attempts.
   - *Permanent Errors* (permission-denied, invalid MIME type): immediately marked `failed` to prevent infinite loops.

---

## 4. Truthful User-Facing Sync States

KarigarSaathi strictly displays 4 canonical user-facing states:

| Sync State | Visual Indicator | Meaning & Criteria | User Action Available |
|:---|:---|:---|:---|
| `SAVED` | Green Checkmark | All drafts, records, and photos are confirmed by the server. | None needed |
| `PENDING` | Amber Clock | Device is offline or writes/uploads are stored safely on disk awaiting sync. | "Sync Now" trigger |
| `SYNCING` | Blue Spinning Ring | Background upload or server synchronization request is in-flight. | None (in progress) |
| `FAILED` | Red Alert Triangle | An upload or write failed after max retries or permanent error. | "Retry Failed" / "Cancel" |

### State Evaluation Hierarchy:
1. If `failedCount > 0` $\to$ `'failed'`
2. If `uploadingCount > 0` $\to$ `'syncing'`
3. If `pendingCount > 0` OR device is `offline` $\to$ `'pending'`
4. Otherwise $\to$ `'saved'`

---

## 5. Offline Draft & Manual Craft Passport Workflow

1. **Step 1 — Offline Photo Selection**: Artisan captures or selects photos offline. Images are processed locally on HTML5 Canvas into 1600px WebP display copies and queued into IndexedDB. Local preview URLs (`blob:`) allow immediate visual inspection.
2. **Step 2–6 — Product Details & Pricing**: Artisan inputs title, category, materials, dimensions, and fair pricing. All fields are saved locally to `draftRecoveryService`.
3. **Step 7 — 10-Point Readiness Quality Gate**: Deterministic client-side validation verifies all 10 readiness rules (score 10/10) completely offline.
4. **Step 8 — Non-AI Passport Generation**: Deterministic manual Craft Passport and scannable QR code are generated offline and stored in Firestore cache for background replication.

