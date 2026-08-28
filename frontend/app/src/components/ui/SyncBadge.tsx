import React from 'react';
import { useSync } from '@/app/providers/SyncProvider';
import { CloudOff, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';

export const SyncBadge: React.FC<{ className?: string }> = ({ className }) => {
  const { syncState, totalPending, failedCount, isOnline, triggerSync } = useSync();

  return (
    <button
      type="button"
      onClick={triggerSync}
      title={
        syncState === 'saved' && isOnline
          ? 'All workshop changes are synchronized and confirmed by the server.'
          : !isOnline
          ? 'Working offline. Changes are saved locally on this device.'
          : syncState === 'failed'
          ? `${failedCount} operations failed. Click to retry synchronization.`
          : syncState === 'syncing'
          ? 'Synchronization in progress...'
          : `${totalPending} changes saved locally, awaiting sync.`
      }
      aria-label={`Sync status: ${syncState}`}
      className={clsx(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase border transition-all duration-150 touch-target cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        syncState === 'saved' && isOnline && 'bg-surface-container-high text-primary border-surface-variant hover:bg-surface-container-highest',
        syncState === 'pending' && 'bg-warning-container text-on-warning-container border-amber-300 animate-pulse',
        syncState === 'syncing' && 'bg-primary-fixed text-on-primary-fixed border-primary-fixed-dim',
        syncState === 'failed' && 'bg-error-container text-on-error-container border-error animate-pulse',
        !isOnline && 'bg-surface-dim text-on-surface-variant border-outline-variant',
        className
      )}
    >
      {syncState === 'saved' && isOnline && <CheckCircle2 className="w-3.5 h-3.5 text-success" />}
      {syncState === 'pending' && <RefreshCw className="w-3.5 h-3.5 text-warning" />}
      {syncState === 'syncing' && <RefreshCw className="w-3.5 h-3.5 animate-spin text-secondary" />}
      {syncState === 'failed' && <AlertTriangle className="w-3.5 h-3.5 text-error" />}
      {!isOnline && <CloudOff className="w-3.5 h-3.5" />}

      <span>
        {syncState === 'saved' && isOnline && 'SAVED'}
        {syncState === 'pending' && `PENDING (${totalPending})`}
        {syncState === 'syncing' && 'SYNCING...'}
        {syncState === 'failed' && `FAILED (${failedCount})`}
        {!isOnline && (totalPending > 0 ? `OFFLINE (${totalPending})` : 'OFFLINE')}
      </span>
    </button>
  );
};
