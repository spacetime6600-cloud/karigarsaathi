import React from 'react';
import { useSync } from '@/app/providers/SyncProvider';
import { WifiOff, HardDrive, RefreshCw, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const OfflineBanner: React.FC = () => {
  const { syncState, totalPending, failedCount, isOnline, triggerSync, retryFailed } = useSync();

  if (syncState === 'saved' && isOnline) return null;

  return (
    <aside
      aria-label="Network and synchronization status"
      className="w-full bg-surface-container-high border-b border-surface-variant px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-primary"
    >
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <WifiOff className="w-4 h-4 text-secondary shrink-0" />
        ) : syncState === 'failed' ? (
          <AlertTriangle className="w-4 h-4 text-error shrink-0" />
        ) : (
          <HardDrive className="w-4 h-4 text-warning shrink-0" />
        )}
        <span className="font-semibold">
          {!isOnline
            ? 'Offline Mode Active: Your changes are safely stored in browser local storage and IndexedDB.'
            : syncState === 'failed'
            ? `${failedCount} operation(s) failed to synchronize. Please retry.`
            : `${totalPending} item(s) saved locally awaiting synchronization.`}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {syncState === 'failed' && (
          <button
            type="button"
            onClick={() => retryFailed()}
            className="inline-flex items-center gap-1 font-bold text-error hover:underline"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry Failed
          </button>
        )}
        {syncState === 'pending' && isOnline && (
          <button
            type="button"
            onClick={triggerSync}
            className="inline-flex items-center gap-1 font-bold text-secondary hover:underline"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Sync Now
          </button>
        )}
        <Link
          to="/dev/states"
          className="text-on-surface-variant hover:text-primary underline text-[11px]"
        >
          Recovery States Sandbox
        </Link>
      </div>
    </aside>
  );
};
