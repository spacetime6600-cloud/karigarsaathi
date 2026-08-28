/**
 * Centralized Product Lifecycle State Machine for KarigarSaathi
 * Controls deterministic transitions across business lifecycle states:
 *   draft -> ready -> shared -> enquiry_received -> archived
 */

import { ProductLifecycleStatus, ProductStatusHistoryEntry, ProductDraft } from '@/types';
import { ProductRecord } from '@/domain/products';
import { validateProductForReadiness } from '@/domain/products/validation';

export interface StatusTransitionContext {
  actorType: 'artisan' | 'buyer' | 'system' | 'coordinator';
  actorUid?: string;
  reason?: string;
  triggeringEnquiryId?: string;
  timestamp?: string;
}

export interface TransitionValidationResult {
  allowed: boolean;
  error?: string;
}

/**
 * Validates if a proposed product lifecycle status transition is legal according to domain rules.
 */
export function validateStatusTransition(
  currentStatus: ProductLifecycleStatus | undefined,
  targetStatus: ProductLifecycleStatus,
  productDraftOrRecord: ProductDraft | ProductRecord
): TransitionValidationResult {
  const current = currentStatus || (productDraftOrRecord.status as ProductLifecycleStatus) || 'draft';

  // 1. Idempotent self-transition is always allowed
  if (current === targetStatus) {
    return { allowed: true };
  }

  // 2. Archived State Rules:
  // Archived products are immutable to external/buyer operations and cannot silently move to enquiry_received or shared.
  if (current === 'archived') {
    if (targetStatus === 'draft') {
      return { allowed: true }; // Explicit artisan restore
    }
    return {
      allowed: false,
      error: `Archived crafts cannot transition directly to "${targetStatus}". They must first be restored to "draft".`,
    };
  }

  // 3. Draft State Rules:
  // Can only transition to 'ready' (via 10-point readiness validation) or 'archived'
  if (current === 'draft') {
    if (targetStatus === 'ready') {
      const readiness = validateProductForReadiness(productDraftOrRecord as ProductDraft);
      if (!readiness.isReady) {
        const issues = readiness.errors.map((e) => e.message).join(', ');
        return {
          allowed: false,
          error: `Product cannot transition from "draft" to "ready": Failed requirements (${issues})`,
        };
      }
      return { allowed: true };
    }
    if (targetStatus === 'archived') {
      return { allowed: true };
    }
    return {
      allowed: false,
      error: `Draft products cannot transition directly to "${targetStatus}". They must first pass readiness validation to become "ready".`,
    };
  }

  // 4. Ready State Rules:
  // Can transition to 'shared', 'enquiry_received', 'draft', or 'archived'
  if (current === 'ready') {
    if (['shared', 'enquiry_received', 'draft', 'archived'].includes(targetStatus)) {
      return { allowed: true };
    }
    return {
      allowed: false,
      error: `Invalid transition from "ready" to "${targetStatus}".`,
    };
  }

  // 5. Shared State Rules:
  // Can transition to 'enquiry_received', 'ready', 'draft', or 'archived'
  if (current === 'shared') {
    if (['enquiry_received', 'ready', 'draft', 'archived'].includes(targetStatus)) {
      return { allowed: true };
    }
    return {
      allowed: false,
      error: `Invalid transition from "shared" to "${targetStatus}".`,
    };
  }

  // 6. Enquiry Received State Rules:
  // Can receive additional enquiries, be re-shared, edited to draft, or archived
  if (current === 'enquiry_received') {
    if (['shared', 'ready', 'draft', 'archived', 'enquiry_received'].includes(targetStatus)) {
      return { allowed: true };
    }
    return {
      allowed: false,
      error: `Invalid transition from "enquiry_received" to "${targetStatus}".`,
    };
  }

  return { allowed: true };
}

/**
 * Creates a validated status history entry for auditing.
 */
export function createStatusHistoryEntry(
  previousStatus: ProductLifecycleStatus,
  newStatus: ProductLifecycleStatus,
  context: StatusTransitionContext
): ProductStatusHistoryEntry {
  return {
    previousStatus,
    newStatus,
    timestamp: context.timestamp || new Date().toISOString(),
    actorType: context.actorType,
    actorUid: context.actorUid,
    reason: context.reason,
    triggeringEnquiryId: context.triggeringEnquiryId,
  };
}
