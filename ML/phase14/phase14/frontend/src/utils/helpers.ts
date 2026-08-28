import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    created: 'bg-gray-100 text-gray-800',
    awaiting_audio: 'bg-blue-100 text-blue-800',
    uploaded: 'bg-indigo-100 text-indigo-800',
    transcribing: 'bg-yellow-100 text-yellow-800',
    transcription_failed: 'bg-red-100 text-red-800',
    awaiting_transcript_review: 'bg-purple-100 text-purple-800',
    generating_catalogue: 'bg-orange-100 text-orange-800',
    clarification_required: 'bg-amber-100 text-amber-800',
    draft_ready: 'bg-green-100 text-green-800',
    approved: 'bg-emerald-100 text-emerald-800',
    failed: 'bg-red-100 text-red-800',
    source_deleted: 'bg-slate-100 text-slate-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getFieldStatusColor(status: string): string {
  const colors: Record<string, string> = {
    unknown: 'bg-gray-100 text-gray-800',
    low_confidence: 'bg-yellow-100 text-yellow-800',
    generated: 'bg-blue-100 text-blue-800',
    manually_corrected: 'bg-green-100 text-green-800',
    artisan_confirmed: 'bg-emerald-100 text-emerald-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getFieldStatusLabel(status: string, t: (key: string) => string): string {
  const labels: Record<string, string> = {
    unknown: t('catalogueReview.status.unknown'),
    low_confidence: t('catalogueReview.status.lowConfidence'),
    generated: t('catalogueReview.status.generated'),
    manually_corrected: t('catalogueReview.status.manuallyCorrected'),
    artisan_confirmed: t('catalogueReview.status.artisanConfirmed'),
  };
  return labels[status] || status;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function isValidUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  };
}

export function parseJsonSafe<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

export function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function revokeObjectURL(url: string | null): void {
  if (url) {
    URL.revokeObjectURL(url);
  }
}