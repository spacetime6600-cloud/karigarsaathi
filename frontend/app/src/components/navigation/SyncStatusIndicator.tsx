import React, { useState } from 'react';
import { CheckCircle2, RefreshCw, Clock, WifiOff, AlertTriangle, Cloud, RotateCcw, XCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { useSync } from '@/app/providers/SyncProvider';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export interface SyncStatusIndicatorProps {
  showLabel?: boolean;
  className?: string;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  showLabel = true,
  className,
}) => {
  const {
    syncState,
    isOnline,
    pendingCount,
    failedCount,
    totalPending,
    queuedUploads,
    triggerSync,
    retryFailed,
    cancelUpload,
    toggleSimulatedOffline,
  } = useSync();

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Map to canonical user-facing states
  let label = 'SAVED';
  let Icon = CheckCircle2;
  let colorClasses = 'text-success bg-success-container/90 border-success/40';

  if (!isOnline) {
    label = totalPending > 0 ? `${totalPending} PENDING (OFFLINE)` : 'OFFLINE (SAVED)';
    Icon = WifiOff;
    colorClasses = 'text-amber-900 bg-amber-100 border-amber-300';
  } else if (syncState === 'failed' || failedCount > 0) {
    label = `${failedCount} FAILED`;
    Icon = AlertTriangle;
    colorClasses = 'text-error bg-error-container/90 border-error/40 animate-pulse';
  } else if (syncState === 'syncing') {
    label = 'SYNCING';
    Icon = RefreshCw;
    colorClasses = 'text-secondary bg-secondary-container/90 border-secondary/40';
  } else if (syncState === 'pending' || totalPending > 0) {
    label = `${totalPending} PENDING`;
    Icon = Clock;
    colorClasses = 'text-amber-900 bg-amber-100 border-amber-300';
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsDetailsOpen(true)}
        role="status"
        aria-live="polite"
        aria-label={`Sync Status: ${label}. Click to view queue details.`}
        aria-haspopup="dialog"
        aria-expanded={isDetailsOpen}
        className={clsx(
          'inline-flex items-center gap-1.5 px-2.5 py-1 min-h-[36px] rounded-full text-[11px] font-bold tracking-wider border select-none transition-all duration-200 shrink-0 cursor-pointer shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          colorClasses,
          className
        )}
        title={
          syncState === 'saved' && isOnline
            ? 'All drafts and records are saved and confirmed by the server.'
            : !isOnline
            ? 'Working offline. All changes are stored safely on your device.'
            : syncState === 'failed'
            ? 'One or more items failed to synchronize. Click to inspect and retry.'
            : syncState === 'syncing'
            ? 'Syncing changes with server...'
            : `${totalPending} changes stored locally, waiting to synchronize.`
        }
      >
        <Icon
          className={clsx(
            'w-3.5 h-3.5 shrink-0',
            syncState === 'syncing' && 'animate-spin'
          )}
        />
        {showLabel && <span className="uppercase">{label}</span>}
      </button>

      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="Sync & Storage Queue"
        description="Inspect offline draft status and background image upload queue."
      >
        <div className="flex flex-col gap-4 text-on-surface">
          {/* Connectivity Status Bar */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container border border-outline-variant">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <>
                  <Cloud className="w-5 h-5 text-success" />
                  <span className="font-semibold text-sm">Connected to Server</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5 text-error" />
                  <span className="font-semibold text-sm">Offline Mode</span>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => toggleSimulatedOffline(isOnline)}
              className="text-xs px-2.5 py-1 rounded bg-surface-container-high border border-outline-variant hover:bg-surface-container-highest transition-colors"
            >
              {isOnline ? 'Simulate Offline' : 'Go Online'}
            </button>
          </div>

          {/* Status Metric Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-lg bg-surface-container border border-outline-variant text-center">
              <span className="block text-xs text-on-surface-variant">Pending</span>
              <span className="text-lg font-bold text-amber-700">{pendingCount}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-container border border-outline-variant text-center">
              <span className="block text-xs text-on-surface-variant">Failed</span>
              <span className="text-lg font-bold text-error">{failedCount}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-container border border-outline-variant text-center">
              <span className="block text-xs text-on-surface-variant">Total Queued</span>
              <span className="text-lg font-bold text-primary">{queuedUploads.length}</span>
            </div>
          </div>

          {/* Upload Queue List */}
          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Queued Photo Uploads ({queuedUploads.length})
            </h4>

            {queuedUploads.length === 0 ? (
              <p className="text-xs text-on-surface-variant p-3 bg-surface-container-low rounded-lg text-center">
                No storage uploads in queue. All photos are fully synchronized.
              </p>
            ) : (
              <div className="max-h-48 overflow-y-auto flex flex-col gap-1.5 pr-1">
                {queuedUploads.map((item) => (
                  <div
                    key={item.operationId}
                    className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low border border-outline-variant text-xs"
                  >
                    <div className="flex flex-col overflow-hidden max-w-[65%]">
                      <span className="font-semibold truncate">{item.originalFilename}</span>
                      <span className="text-[10px] text-on-surface-variant truncate">
                        {(item.size / 1024).toFixed(1)} KB • {item.variantType} • {item.status}
                      </span>
                      {item.lastError && (
                        <span className="text-[10px] text-error truncate">{item.lastError}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {item.status === 'failed' && (
                        <button
                          type="button"
                          onClick={() => retryFailed(item.operationId)}
                          className="p-1 rounded hover:bg-surface-container text-primary"
                          title="Retry upload"
                          aria-label={`Retry upload for ${item.originalFilename}`}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => cancelUpload(item.operationId)}
                        className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-error"
                        title="Cancel upload"
                        aria-label={`Cancel upload for ${item.originalFilename}`}
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant">
            {failedCount > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => retryFailed()}
                className="text-xs"
              >
                Retry All Failed
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={triggerSync}
              disabled={!isOnline || syncState === 'syncing'}
              className="text-xs"
            >
              {syncState === 'syncing' ? 'Syncing...' : 'Sync Now'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
