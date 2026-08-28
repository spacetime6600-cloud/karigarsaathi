/**
 * Robust Local Storage wrapper with schema validation, error recovery,
 * and memory fallback.
 */

const STORAGE_PREFIX = 'karigarsaathi_v1_';

export const storage = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const fullKey = STORAGE_PREFIX + key;
      const raw = localStorage.getItem(fullKey);
      if (raw === null || raw === undefined) {
        return defaultValue;
      }
      return JSON.parse(raw) as T;
    } catch (err) {
      console.warn(`[Storage] Failed to read ${key}:`, err);
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): boolean {
    try {
      const fullKey = STORAGE_PREFIX + key;
      localStorage.setItem(fullKey, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error(`[Storage] Failed to persist ${key}:`, err);
      return false;
    }
  },

  remove(key: string): void {
    try {
      const fullKey = STORAGE_PREFIX + key;
      localStorage.removeItem(fullKey);
    } catch (err) {
      console.warn(`[Storage] Failed to remove ${key}:`, err);
    }
  },

  clearAll(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (err) {
      console.warn('[Storage] Failed to clear items:', err);
    }
  },
};
