import { ProductDraft } from '@/types';
import { storage } from '@/services/storage/localStorage';
import { logger } from '@/services/logging/logger';

const RECOVERY_PREFIX = 'karigar_draft_recovery_';

export interface RecoveredDraftRecord {
  draft: ProductDraft;
  savedAt: string;
  ownerId: string;
  revision: number;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  localIsNewer: boolean;
  localSavedAt: string;
  cloudUpdatedAt: string;
  timeDiffSeconds: number;
}

export const draftRecoveryService = {
  getStorageKey(ownerId: string, draftId: string): string {
    return `${RECOVERY_PREFIX}${ownerId}_${draftId}`;
  },

  saveLocalRecovery(ownerId: string, draft: ProductDraft, revision = 1): void {
    if (!ownerId || !draft.id) return;

    try {
      const now = new Date().toISOString();
      // Sanitize photos to prevent large data: or blob: payloads in localStorage
      const cleanPhotos = (draft.photos || []).map((p) => ({
        ...p,
        url: p.url.startsWith('data:image') && p.url.length > 500 ? '' : p.url,
      }));

      const record: RecoveredDraftRecord = {
        draft: {
          ...draft,
          photos: cleanPhotos,
          lastAutosavedAt: now,
        },
        savedAt: now,
        ownerId,
        revision,
      };

      storage.set(this.getStorageKey(ownerId, draft.id), record);
      logger.debug('RECOVERY', 'Saved local recovery draft to device storage', {
        draftId: draft.id,
        ownerId,
        savedAt: now,
      });
    } catch (err) {
      logger.warn('RECOVERY', 'Failed to save local recovery draft', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },

  getLocalRecovery(ownerId: string, draftId: string): RecoveredDraftRecord | null {
    if (!ownerId || !draftId) return null;
    return storage.get<RecoveredDraftRecord | null>(this.getStorageKey(ownerId, draftId), null);
  },

  clearLocalRecovery(ownerId: string, draftId: string): void {
    if (!ownerId || !draftId) return;
    storage.remove(this.getStorageKey(ownerId, draftId));
    logger.debug('RECOVERY', 'Cleared local recovery draft', { draftId, ownerId });
  },

  detectConflict(cloudDraft: ProductDraft, localRecord: RecoveredDraftRecord | null): ConflictCheckResult {
    if (!localRecord) {
      return {
        hasConflict: false,
        localIsNewer: false,
        localSavedAt: '',
        cloudUpdatedAt: cloudDraft.updatedAt || '',
        timeDiffSeconds: 0,
      };
    }

    const localTime = new Date(localRecord.savedAt).getTime();
    const cloudTime = new Date(cloudDraft.updatedAt || 0).getTime();

    const timeDiffSeconds = Math.round((localTime - cloudTime) / 1000);

    // If local version is at least 3 seconds newer than cloud version and has distinct edits
    const hasMeaningfulEdits = localRecord.draft.title !== cloudDraft.title ||
      localRecord.draft.story !== cloudDraft.story ||
      localRecord.draft.selectedPrice !== cloudDraft.selectedPrice;

    const localIsNewer = localTime > cloudTime + 2000;
    const hasConflict = localIsNewer && hasMeaningfulEdits;

    return {
      hasConflict,
      localIsNewer,
      localSavedAt: localRecord.savedAt,
      cloudUpdatedAt: cloudDraft.updatedAt || '',
      timeDiffSeconds,
    };
  },
};
