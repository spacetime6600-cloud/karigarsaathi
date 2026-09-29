import React from 'react';
import { useLocation } from 'react-router-dom';
import { KarigarLoader } from './KarigarLoader';
import { useLoaderFlicker } from './useLoaderFlicker';

export interface SuspenseRouteLoaderProps {
  destination?: string;
  variant?: 'route' | 'auth';
  displayThresholdMs?: number;
  minVisibleDurationMs?: number;
}

/**
 * SuspenseRouteLoader
 * Smart Suspense fallback equipped with anti-flicker protection.
 *
 * Prevents the loader from flashing on instantaneous cached route transitions (< 150ms)
 * while smoothly presenting the artisan craft-thread atmospheric loader on slower networks.
 */
export const SuspenseRouteLoader: React.FC<SuspenseRouteLoaderProps> = ({
  destination,
  variant = 'route',
  displayThresholdMs = 150,
  minVisibleDurationMs = 380,
}) => {
  const location = useLocation();
  const targetDestination = destination || location.pathname;

  const isVisible = useLoaderFlicker({
    isPending: true,
    displayThresholdMs,
    minVisibleDurationMs,
  });

  if (!isVisible) {
    // Render zero-height accessible live region placeholder while waiting on threshold
    return (
      <div
        role="status"
        aria-live="polite"
        className="w-full min-h-[40vh] flex items-center justify-center opacity-0 pointer-events-none"
      >
        <span className="sr-only">Preparing page content...</span>
      </div>
    );
  }

  return (
    <KarigarLoader
      visible={true}
      variant={variant}
      destination={targetDestination}
    />
  );
};
