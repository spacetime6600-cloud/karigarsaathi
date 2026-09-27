/**
 * Safe, universal date formatting utility for KarigarSaathi.
 * Handles diverse timestamp representations without ever returning "Invalid Date":
 * - Firestore Timestamp instances (with .toDate() method)
 * - Raw Firestore serialized objects: { seconds: number; nanoseconds?: number } or { _seconds: number }
 * - ISO-8601 strings (e.g. "2026-08-28T10:30:00Z", "2026-08-28")
 * - Numeric timestamps (milliseconds or seconds)
 * - Native Date objects
 * - Undefined, null, empty strings, and corrupted values
 */

export interface DateFormatOptions {
  fallback?: string;
  locale?: string;
  includeTime?: boolean;
}

/**
 * Safely parses any date-like input into a valid Date object, or returns null.
 */
export function parseDateSafe(input: unknown): Date | null {
  if (input === null || input === undefined || input === '') {
    return null;
  }

  // Native Date instance
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }

  // Firestore Timestamp with .toDate() method
  if (typeof input === 'object' && input !== null && 'toDate' in input && typeof (input as { toDate: () => unknown }).toDate === 'function') {
    try {
      const d = (input as { toDate: () => Date }).toDate();
      if (d instanceof Date && !isNaN(d.getTime())) {
        return d;
      }
    } catch {
      // Fall through
    }
  }

  // Serialized Firestore object: { seconds: number } or { _seconds: number }
  if (typeof input === 'object' && input !== null) {
    const obj = input as { seconds?: unknown; _seconds?: unknown; nanoseconds?: unknown };
    const secs = typeof obj.seconds === 'number' ? obj.seconds : typeof obj._seconds === 'number' ? obj._seconds : null;
    if (secs !== null && !isNaN(secs)) {
      const d = new Date(secs * 1000);
      if (!isNaN(d.getTime())) {
        return d;
      }
    }
  }

  // Numeric timestamp (seconds or milliseconds)
  if (typeof input === 'number') {
    if (isNaN(input) || !isFinite(input)) return null;
    // Heuristic: seconds timestamps are < 100_000_000_000 (year 5138)
    const ms = input < 100_000_000_000 ? input * 1000 : input;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }

  // String input
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed || trimmed === 'Invalid Date') {
      return null;
    }

    // Check if numeric string
    if (/^\d+$/.test(trimmed)) {
      const num = Number(trimmed);
      const ms = num < 100_000_000_000 ? num * 1000 : num;
      const d = new Date(ms);
      if (!isNaN(d.getTime())) return d;
    }

    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return d;
    }
  }

  return null;
}

/**
 * Formats a date safely into a localized full or medium date string with optional time.
 * Example output: "28 Aug 2026, 10:30 am" or fallback if invalid.
 */
export function formatDateSafe(
  input: unknown,
  fallback = 'Recent',
  locale = 'en-IN'
): string {
  const d = parseDateSafe(input);
  if (!d) {
    // If the input was a non-empty human string like "Yesterday at 4:15 PM", return it directly
    if (typeof input === 'string' && input.trim() && input !== 'Invalid Date' && !input.startsWith('{')) {
      return input.trim();
    }
    return fallback;
  }

  try {
    return d.toLocaleString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return fallback;
  }
}

/**
 * Formats a date safely into a compact short string.
 * Example output: "28 Aug" or fallback if invalid.
 */
export function formatDateShortSafe(
  input: unknown,
  fallback = 'Recent',
  locale = 'en-IN'
): string {
  const d = parseDateSafe(input);
  if (!d) {
    if (typeof input === 'string' && input.trim() && input !== 'Invalid Date' && !input.startsWith('{') && input.length < 30) {
      return input.trim();
    }
    return fallback;
  }

  try {
    return d.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return fallback;
  }
}

/**
 * Returns human-friendly relative time (e.g. "Just now", "5 mins ago", "Yesterday", "3 days ago").
 */
export function formatRelativeTimeSafe(
  input: unknown,
  fallback = 'Recently'
): string {
  const d = parseDateSafe(input);
  if (!d) {
    if (typeof input === 'string' && input.trim() && input !== 'Invalid Date' && !input.startsWith('{')) {
      return input.trim();
    }
    return fallback;
  }

  try {
    const diffMs = Date.now() - d.getTime();
    if (diffMs < 0) return 'Just now'; // Future timestamps or clock skew

    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return d.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return fallback;
  }
}
