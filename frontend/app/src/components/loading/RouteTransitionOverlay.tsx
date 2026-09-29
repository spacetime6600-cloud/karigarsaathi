import React from 'react';
import { useLocation } from 'react-router-dom';
import { KarigarLoader } from './KarigarLoader';
import { useLoaderFlicker } from './useLoaderFlicker';
import { useSafeNavigation } from './useSafeNavigation';

export interface RouteTransitionOverlayProps {
  displayThresholdMs?: number;
  minVisibleDurationMs?: number;
}

/**
 * RouteTransitionOverlay
 * Observes React Router navigation state (`useNavigation`).
 *
 * Provides a seamless atmospheric veil over the current page while a destination route
 * is being loaded. Features:
 * - Anti-flicker protection (only appears if navigation exceeds 150ms).
 * - Ignores same-page hash / section anchor scrolling.
 * - Leaves the persistent top navigation header accessible & stable.
 */
export const RouteTransitionOverlay: React.FC<RouteTransitionOverlayProps> = ({
  displayThresholdMs = 150,
  minVisibleDurationMs = 380,
}) => {
  const navigation = useSafeNavigation();
  const location = useLocation();

  const isNavigating = navigation.state !== 'idle';
  const nextPath = navigation.location?.pathname;

  // Ignore in-page hash changes, same-path query updates, or non-navigation
  const isGenuineRouteTransition =
    isNavigating &&
    nextPath !== undefined &&
    nextPath !== location.pathname;

  const isVisible = useLoaderFlicker({
    isPending: isGenuineRouteTransition,
    displayThresholdMs,
    minVisibleDurationMs,
  });

  if (!isVisible) {
    return null;
  }

  return (
    <KarigarLoader
      visible={true}
      variant="route"
      destination={nextPath || location.pathname}
    />
  );
};
