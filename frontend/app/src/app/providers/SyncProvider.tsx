import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { syncService, DetailedSyncStatus } from '@/services/storage/syncService';
import { storageUploadQueue, QueuedUploadItem } from '@/services/storage/storageUploadQueue';
import { useAuth } from '@/app/providers/AuthProvider';

interface SyncContextType {
  syncState: 'saved' | 'pending' | 'syncing' | 'failed';
  isOnline: boolean;
  pendingCount: number;
  uploadingCount: number;
  failedCount: number;
  totalPending: number;
  queuedUploads: QueuedUploadItem[];
  triggerSync: () => Promise<void>;
  retryFailed: (operationId?: string) => Promise<void>;
  cancelUpload: (operationId: string) => Promise<void>;
  clearCompleted: () => Promise<void>;
  toggleSimulatedOffline: (offline: boolean) => void;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [detailedStatus, setDetailedStatus] = useState<DetailedSyncStatus>({
    canonicalState: 'saved',
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pendingCount: 0,
    uploadingCount: 0,
    failedCount: 0,
    totalPending: 0,
    queuedUploads: [],
  });

  const refreshState = useCallback(async () => {
    const status = await syncService.getDetailedStatus(user?.id);
    setDetailedStatus(status);
  }, [user?.id]);

  // Set active user in upload queue manager
  useEffect(() => {
    storageUploadQueue.setActiveUser(user?.id || null);
    refreshState();
  }, [user?.id, refreshState]);

  // Listen to queue changes and network status
  useEffect(() => {
    const handleOnline = () => {
      refreshState();
      storageUploadQueue.processQueue();
    };
    const handleOffline = () => refreshState();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribeQueue = storageUploadQueue.subscribe(() => {
      refreshState();
    });

    const interval = setInterval(refreshState, 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribeQueue();
      clearInterval(interval);
    };
  }, [refreshState]);

  const triggerSync = async () => {
    if (!detailedStatus.isOnline) return;
    setDetailedStatus((prev) => ({ ...prev, canonicalState: 'syncing' }));

    // Process storage uploads
    await storageUploadQueue.processQueue();

    // Process generic pending sync items
    syncService.clearQueue();

    await refreshState();
  };

  const retryFailed = async (operationId?: string) => {
    if (!user?.id) return;
    if (operationId) {
      await storageUploadQueue.retryItem(user.id, operationId);
    } else {
      await storageUploadQueue.retryAllFailed(user.id);
    }
    await refreshState();
  };

  const cancelUpload = async (operationId: string) => {
    if (!user?.id) return;
    await storageUploadQueue.cancelItem(user.id, operationId);
    await refreshState();
  };

  const clearCompleted = async () => {
    if (!user?.id) return;
    await storageUploadQueue.clearCompleted(user.id);
    await refreshState();
  };

  const toggleSimulatedOffline = (offline: boolean) => {
    syncService.setForceOffline(offline);
    refreshState();
  };

  return (
    <SyncContext.Provider
      value={{
        syncState: detailedStatus.canonicalState,
        isOnline: detailedStatus.isOnline,
        pendingCount: detailedStatus.pendingCount,
        uploadingCount: detailedStatus.uploadingCount,
        failedCount: detailedStatus.failedCount,
        totalPending: detailedStatus.totalPending,
        queuedUploads: detailedStatus.queuedUploads,
        triggerSync,
        retryFailed,
        cancelUpload,
        clearCompleted,
        toggleSimulatedOffline,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = (): SyncContextType => {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used within SyncProvider');
  return ctx;
};
