import { useState, useEffect, useRef } from 'react';

export interface UseLoaderFlickerOptions {
  isPending: boolean;
  displayThresholdMs?: number; // 120-180ms delay before showing loader
  minVisibleDurationMs?: number; // 350-450ms minimum display time once visible
}

/**
 * useLoaderFlicker
 * Prevents loader flickering on fast network responses while guaranteeing visual
 * intentionality for slower operations.
 *
 * Rules:
 * 1. If operation completes before `displayThresholdMs` (default 150ms), loader never appears.
 * 2. If operation exceeds `displayThresholdMs`, loader shows and stays visible for at least
 *    `minVisibleDurationMs` (default 380ms) to avoid jarring quick flashes.
 * 3. Safely cleans up all timers upon unmount.
 */
export function useLoaderFlicker({
  isPending,
  displayThresholdMs = 150,
  minVisibleDurationMs = 380,
}: UseLoaderFlickerOptions): boolean {
  const [isVisible, setIsVisible] = useState(false);
  const shownAtRef = useRef<number | null>(null);
  const thresholdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const minDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isPending) {
      // Clear any pending exit timers if a new pending operation arrives
      if (minDurationTimerRef.current) {
        clearTimeout(minDurationTimerRef.current);
        minDurationTimerRef.current = null;
      }

      // If already visible, maintain visible state
      if (isVisible) return;

      // Start threshold timer
      thresholdTimerRef.current = setTimeout(() => {
        setIsVisible(true);
        shownAtRef.current = Date.now();
      }, displayThresholdMs);
    } else {
      // Operation finished: clear threshold timer if it hadn't fired yet
      if (thresholdTimerRef.current) {
        clearTimeout(thresholdTimerRef.current);
        thresholdTimerRef.current = null;
      }

      // If loader was shown, enforce minimum visible duration
      if (isVisible && shownAtRef.current) {
        const elapsed = Date.now() - shownAtRef.current;
        const remaining = Math.max(0, minVisibleDurationMs - elapsed);

        if (remaining > 0) {
          minDurationTimerRef.current = setTimeout(() => {
            setIsVisible(false);
            shownAtRef.current = null;
          }, remaining);
        } else {
          setIsVisible(false);
          shownAtRef.current = null;
        }
      }
    }

    return () => {
      if (thresholdTimerRef.current) clearTimeout(thresholdTimerRef.current);
      if (minDurationTimerRef.current) clearTimeout(minDurationTimerRef.current);
    };
  }, [isPending, isVisible, displayThresholdMs, minVisibleDurationMs]);

  return isVisible;
}
