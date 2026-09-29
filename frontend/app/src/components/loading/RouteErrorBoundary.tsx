import React, { useEffect } from 'react';
import { useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { KarigarLoader } from './KarigarLoader';
import { logger } from '@/services/logging/logger';

export interface RouteErrorBoundaryProps {
  error?: Error | null;
  onRetry?: () => void;
}

/**
 * RouteErrorBoundary
 * Captures routing, lazy-chunk download, and component rendering failures.
 *
 * Prevents the loader from hanging indefinitely by displaying a warm, branded
 * recovery view with "Try again" and "Return home" actions while logging diagnostics safely.
 */
export const RouteErrorBoundary: React.FC<RouteErrorBoundaryProps> = ({
  error: manualError,
  onRetry,
}) => {
  let routerError: unknown;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    routerError = useRouteError();
  } catch {
    routerError = null;
  }

  const activeError = manualError || routerError;

  useEffect(() => {
    if (activeError) {
      logger.error('SYSTEM', 'Route boundary caught loading failure', activeError);
    }
  }, [activeError]);

  let errorMessage = 'Unable to open this section';
  if (isRouteErrorResponse(routerError)) {
    errorMessage = `${routerError.status} — ${routerError.statusText || 'Page unavailable'}`;
  } else if (activeError instanceof Error) {
    // Sanitize technical details: do not leak credentials or stack traces
    errorMessage = activeError.message.includes('dynamically imported module')
      ? 'A network issue prevented loading this section. Please verify your connection.'
      : 'A technical error occurred while opening this page.';
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#FFF9EF] p-4">
      <KarigarLoader
        visible={true}
        variant="route"
        error={errorMessage}
        onRetry={onRetry || (() => window.location.reload())}
      />
    </div>
  );
};
