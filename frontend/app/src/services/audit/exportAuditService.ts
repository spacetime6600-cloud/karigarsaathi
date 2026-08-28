/**
 * Export & Sharing Audit Service for KarigarSaathi
 * Records idempotent audit trails for exports, shares, Passport activations and revocations.
 */

import { ExportAuditRecord, ExportFormat, ExportAction, MarketplaceChannel } from '@/types';
import { logger } from '@/services/logging/logger';

// In-memory debounce cache to prevent duplicate audit records on React re-renders
const recentAuditKeys = new Map<string, number>();

export const exportAuditService = {
  /**
   * Generates a deterministic idempotency key for an action.
   */
  getIdempotencyKey(ownerId: string, productId: string, format: ExportFormat, action: ExportAction): string {
    return `${ownerId}_${productId}_${format}_${action}`;
  },

  /**
   * Determines whether an action is a duplicate event within a 3-second window.
   */
  isDuplicate(key: string, cooldownMs = 3000): boolean {
    const now = Date.now();
    const lastTimestamp = recentAuditKeys.get(key);
    if (lastTimestamp && now - lastTimestamp < cooldownMs) {
      return true;
    }
    recentAuditKeys.set(key, now);
    return false;
  },

  /**
   * Creates an audit record payload.
   */
  createRecord(params: {
    ownerId: string;
    productId: string;
    passportId?: string;
    format: ExportFormat;
    channel?: MarketplaceChannel;
    action: ExportAction;
    status?: 'pending' | 'completed' | 'failed';
    adapterId?: string;
    schemaVersion?: string;
    checksum?: string;
    errorCode?: string;
    errorMessage?: string;
  }): ExportAuditRecord {
    const id = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    return {
      id,
      ownerId: params.ownerId,
      productId: params.productId,
      passportId: params.passportId,
      format: params.format,
      channel: params.channel,
      action: params.action,
      status: params.status || 'completed',
      adapterId: params.adapterId,
      schemaVersion: params.schemaVersion,
      checksum: params.checksum,
      errorCode: params.errorCode,
      errorMessage: params.errorMessage,
      createdAt: new Date().toISOString(),
    };
  },

  /**
   * Logs an audit record to console / memory and prepares for Firestore persistence.
   */
  logAudit(record: ExportAuditRecord): void {
    logger.info('INVENTORY', `Export audit record: [${record.format}] ${record.action} - ${record.status}`, {
      recordId: record.id,
      productId: record.productId,
      ownerId: record.ownerId,
      format: record.format,
      action: record.action,
      status: record.status,
    });
  },
};
