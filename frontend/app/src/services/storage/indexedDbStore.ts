/**
 * Lightweight, robust, typed IndexedDB store for KarigarSaathi offline persistence.
 * Operates safely with fallback in environments where IndexedDB is blocked or restricted.
 */
import { logger } from '@/services/logging/logger';

const DB_NAME = 'karigarsaathi_offline_db';
const DB_VERSION = 1;

export const STORES = {
  UPLOAD_QUEUE: 'upload_queue',
  DRAFT_RECOVERY: 'draft_recovery',
} as const;

let dbPromise: Promise<IDBDatabase | null> | null = null;
const memoryStoreFallback = new Map<string, Map<string, unknown>>();

function getMemoryStore(storeName: string): Map<string, unknown> {
  if (!memoryStoreFallback.has(storeName)) {
    memoryStoreFallback.set(storeName, new Map());
  }
  return memoryStoreFallback.get(storeName)!;
}

export function isIndexedDbSupported(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window && indexedDB !== null;
}

export async function getOfflineDb(): Promise<IDBDatabase | null> {
  if (!isIndexedDbSupported()) return null;
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase | null>((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Upload Queue Store
        if (!db.objectStoreNames.contains(STORES.UPLOAD_QUEUE)) {
          const uploadStore = db.createObjectStore(STORES.UPLOAD_QUEUE, { keyPath: 'operationId' });
          uploadStore.createIndex('ownerUid', 'ownerUid', { unique: false });
          uploadStore.createIndex('status', 'status', { unique: false });
          uploadStore.createIndex('productId', 'productId', { unique: false });
          uploadStore.createIndex('idempotencyKey', 'idempotencyKey', { unique: false });
          uploadStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Draft Recovery Store
        if (!db.objectStoreNames.contains(STORES.DRAFT_RECOVERY)) {
          const draftStore = db.createObjectStore(STORES.DRAFT_RECOVERY, { keyPath: 'draftKey' });
          draftStore.createIndex('ownerId', 'ownerId', { unique: false });
          draftStore.createIndex('savedAt', 'savedAt', { unique: false });
        }
      };

      request.onsuccess = () => {
        logger.info('INDEXED_DB', 'IndexedDB initialized successfully');
        resolve(request.result);
      };

      request.onerror = () => {
        logger.warn('INDEXED_DB', 'Failed to open IndexedDB, falling back to in-memory store');
        resolve(null);
      };

      request.onblocked = () => {
        logger.warn('INDEXED_DB', 'IndexedDB open request was blocked by an open connection in another tab');
      };
    } catch (err) {
      logger.warn('INDEXED_DB', 'Exception opening IndexedDB', {
        error: err instanceof Error ? err.message : String(err),
      });
      resolve(null);
    }
  });

  return dbPromise;
}

export async function idbPut<T>(storeName: string, value: T, customKey?: IDBValidKey): Promise<void> {
  const db = await getOfflineDb();
  if (!db) {
    const memStore = getMemoryStore(storeName);
    const key = customKey !== undefined
      ? String(customKey)
      : ((value as { operationId?: string; draftKey?: string }).operationId || (value as { draftKey?: string }).draftKey || `k_${Date.now()}`);
    memStore.set(key, value);
    return;
  }

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = customKey !== undefined ? store.put(value, customKey) : store.put(value);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    } catch (err) {
      reject(err);
    }
  });
}

export async function idbGet<T>(storeName: string, key: IDBValidKey): Promise<T | null> {
  const db = await getOfflineDb();
  if (!db) {
    const memStore = getMemoryStore(storeName);
    return (memStore.get(String(key)) as T) || null;
  }

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T) || null);
      req.onerror = () => reject(req.error);
    } catch (err) {
      reject(err);
    }
  });
}

export async function idbGetAll<T>(storeName: string): Promise<T[]> {
  const db = await getOfflineDb();
  if (!db) {
    const memStore = getMemoryStore(storeName);
    return Array.from(memStore.values()) as T[];
  }

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as T[]) || []);
      req.onerror = () => reject(req.error);
    } catch (err) {
      reject(err);
    }
  });
}

export async function idbGetByIndex<T>(
  storeName: string,
  indexName: string,
  key: IDBValidKey | IDBKeyRange
): Promise<T[]> {
  const db = await getOfflineDb();
  if (!db) {
    const memStore = getMemoryStore(storeName);
    const results: T[] = [];
    for (const val of memStore.values()) {
      const obj = val as Record<string, unknown>;
      if (obj[indexName] === key) {
        results.push(val as T);
      }
    }
    return results;
  }

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const index = store.index(indexName);
      const req = index.getAll(key);
      req.onsuccess = () => resolve((req.result as T[]) || []);
      req.onerror = () => reject(req.error);
    } catch (err) {
      reject(err);
    }
  });
}

export async function idbDelete(storeName: string, key: IDBValidKey): Promise<void> {
  const db = await getOfflineDb();
  if (!db) {
    const memStore = getMemoryStore(storeName);
    memStore.delete(String(key));
    return;
  }

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    } catch (err) {
      reject(err);
    }
  });
}

export async function idbClear(storeName: string): Promise<void> {
  const db = await getOfflineDb();
  if (!db) {
    const memStore = getMemoryStore(storeName);
    memStore.clear();
    return;
  }

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    } catch (err) {
      reject(err);
    }
  });
}
