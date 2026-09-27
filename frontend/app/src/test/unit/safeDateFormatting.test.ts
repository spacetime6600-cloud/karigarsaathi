import { describe, it, expect } from 'vitest';
import {
  parseDateSafe,
  formatDateSafe,
  formatDateShortSafe,
  formatRelativeTimeSafe,
} from '@/utils/formatDate';

describe('formatDate utility - Robust Date Parsing & Zero "Invalid Date" Guarantees', () => {
  it('1. Correctly parses and formats ISO string timestamps', () => {
    const iso = '2026-08-28T10:30:00Z';
    const parsed = parseDateSafe(iso);
    expect(parsed).toBeInstanceOf(Date);
    expect(parsed?.getUTCFullYear()).toBe(2026);

    const formatted = formatDateSafe(iso);
    expect(formatted).not.toContain('Invalid Date');
    expect(formatted).toContain('2026');

    const shortFormatted = formatDateShortSafe(iso);
    expect(shortFormatted).not.toContain('Invalid Date');
    expect(shortFormatted).toContain('Aug');
  });

  it('2. Correctly parses Firestore serialized timestamp objects { seconds, nanoseconds }', () => {
    // 1724841000 seconds = 2024-08-28T10:30:00Z
    const firestoreObj = { seconds: 1724841000, nanoseconds: 0 };
    const parsed = parseDateSafe(firestoreObj);
    expect(parsed).toBeInstanceOf(Date);
    expect(parsed?.getTime()).toBe(1724841000 * 1000);

    const formatted = formatDateSafe(firestoreObj);
    expect(formatted).not.toContain('Invalid Date');
    expect(formatted).toContain('2024');

    const shortFormatted = formatDateShortSafe(firestoreObj);
    expect(shortFormatted).not.toContain('Invalid Date');
  });

  it('3. Correctly parses Firestore serialized object with _seconds property', () => {
    const firestorePrivateSecs = { _seconds: 1724841000 };
    const parsed = parseDateSafe(firestorePrivateSecs);
    expect(parsed).toBeInstanceOf(Date);
    expect(parsed?.getTime()).toBe(1724841000 * 1000);

    const formatted = formatDateSafe(firestorePrivateSecs);
    expect(formatted).not.toContain('Invalid Date');
  });

  it('4. Correctly parses Firestore Timestamp instances with toDate()', () => {
    const targetDate = new Date('2026-09-20T12:00:00Z');
    const mockTimestamp = {
      toDate: () => targetDate,
    };

    const parsed = parseDateSafe(mockTimestamp);
    expect(parsed).toBe(targetDate);

    const formatted = formatDateSafe(mockTimestamp);
    expect(formatted).not.toContain('Invalid Date');
    expect(formatted).toContain('2026');
  });

  it('5. Correctly parses numeric timestamps (both seconds and milliseconds)', () => {
    const msTime = 1724841000000;
    const secTime = 1724841000;

    const parsedMs = parseDateSafe(msTime);
    expect(parsedMs?.getTime()).toBe(msTime);

    const parsedSec = parseDateSafe(secTime);
    expect(parsedSec?.getTime()).toBe(msTime);

    expect(formatDateSafe(msTime)).not.toContain('Invalid Date');
    expect(formatDateSafe(secTime)).not.toContain('Invalid Date');
  });

  it('6. Safely handles null, undefined, empty string, and corrupted values without throwing or returning "Invalid Date"', () => {
    expect(parseDateSafe(null)).toBeNull();
    expect(parseDateSafe(undefined)).toBeNull();
    expect(parseDateSafe('')).toBeNull();
    expect(parseDateSafe('   ')).toBeNull();
    expect(parseDateSafe('not-a-valid-date-xyz')).toBeNull();
    expect(parseDateSafe('Invalid Date')).toBeNull();

    expect(formatDateSafe(null, 'Recent')).toBe('Recent');
    expect(formatDateSafe(undefined, 'Recent')).toBe('Recent');
    expect(formatDateSafe('', 'Recent')).toBe('Recent');
    expect(formatDateSafe('Invalid Date', 'Recent')).toBe('Recent');
    expect(formatDateSafe('gibberish', 'Recent')).toBe('gibberish');

    expect(formatDateShortSafe(null, 'Recent')).toBe('Recent');
    expect(formatDateShortSafe(undefined, 'Recent')).toBe('Recent');
    expect(formatDateShortSafe('', 'Recent')).toBe('Recent');

    expect(formatRelativeTimeSafe(null, 'Recently')).toBe('Recently');
    expect(formatRelativeTimeSafe(undefined, 'Recently')).toBe('Recently');
  });

  it('7. Preserves human-readable relative strings like "Yesterday at 4:15 PM"', () => {
    const humanStr = 'Yesterday at 4:15 PM';
    expect(formatDateSafe(humanStr)).toBe(humanStr);
    expect(formatDateShortSafe(humanStr)).toBe(humanStr);
    expect(formatRelativeTimeSafe(humanStr)).toBe(humanStr);
  });
});
