/**
 * prefetchRoutes
 * Uses requestIdleCallback to preload likely public route chunks in the background
 * without competing with primary thread rendering or initial data queries.
 */
let hasPrefetched = false;

export function prefetchPublicRoutes(): void {
  if (typeof window === 'undefined' || hasPrefetched) return;
  hasPrefetched = true;

  const schedulePrefetch =
    'requestIdleCallback' in window
      ? (window as unknown as { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void }).requestIdleCallback
      : (cb: () => void) => setTimeout(cb, 1800);

  schedulePrefetch(
    () => {
      // Idle prefetch of primary public routes
      try {
        import('@/features/about/AboutPage');
        import('@/features/marketplace/MarketplacePage');
        import('@/features/reviews/ReviewsPage');
        import('@/features/authentication');
      } catch {
        // Safe silence if offline or in test environment
      }
    },
    { timeout: 3000 }
  );
}
