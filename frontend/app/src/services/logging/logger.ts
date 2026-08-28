type LogCategory =
  | 'AUTH'
  | 'FIRESTORE'
  | 'STORAGE'
  | 'APP_CHECK'
  | 'EMULATOR'
  | 'SYSTEM'
  | 'AUTOSAVE'
  | 'INVENTORY'
  | 'RECOVERY'
  | 'COORDINATOR'
  | 'ENQUIRY'
  | 'PERMISSION'
  | 'INDEXED_DB'
  | 'UPLOAD_QUEUE';

interface LogContext {
  op?: string;
  uid?: string;
  code?: string;
  category?: string;
  status?: string;
  path?: string;
  [key: string]: unknown;
}

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'accessToken',
  'idToken',
  'refreshToken',
  'secret',
  'apiKey',
  'bytes',
  'phone',
  'phoneNumber',
  'address',
]);

function sanitize(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map(sanitize);
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase()) || key.toLowerCase().includes('token') || key.toLowerCase().includes('pass')) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof val === 'object') {
      sanitized[key] = sanitize(val);
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

class SafeLogger {
  private isDev = typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';

  debug(category: LogCategory, message: string, context?: LogContext): void {
    if (this.isDev) {
      console.debug(`[${category}] ${message}`, context ? sanitize(context) : '');
    }
  }

  info(category: LogCategory, message: string, context?: LogContext): void {
    console.info(`[${category}] ${message}`, context ? sanitize(context) : '');
  }

  warn(category: LogCategory, message: string, context?: LogContext): void {
    console.warn(`[${category}] ${message}`, context ? sanitize(context) : '');
  }

  error(category: LogCategory, message: string, error?: unknown, context?: LogContext): void {
    const errorInfo = error instanceof Error
      ? { message: error.message, name: error.name }
      : { raw: String(error) };

    console.error(`[${category}] ${message}`, {
      error: errorInfo,
      ...(context ? (sanitize(context) as object) : {}),
    });
  }
}

export const logger = new SafeLogger();
