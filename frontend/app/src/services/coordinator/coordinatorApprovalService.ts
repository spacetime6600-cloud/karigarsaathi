import { storage } from '@/services/storage/localStorage';
import { logger } from '@/services/logging/logger';
import { auth, db, getFirebaseConfig } from '@/config/firebase';
import { createUserWithEmailAndPassword, updateProfile as fbUpdateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { RegisterCoordinatorInput } from '@/domain/auth';

export type CoordinatorApprovalStatus = 'approved' | 'pending' | 'rejected' | 'none';

export interface CoordinatorRegistrationRecord {
  uid: string;
  email: string;
  displayName: string;
  agencyName?: string;
  phone?: string;
  status: CoordinatorApprovalStatus;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

const STORAGE_APPROVED_KEY = 'karigarsaathi_approved_coordinators';
const STORAGE_REGISTRATIONS_KEY = 'karigarsaathi_coordinator_registrations';

/**
 * Authoritative set of system pre-approved coordinator accounts.
 * These represent recognized government / agency cluster coordinators.
 */
const PRE_APPROVED_EMAILS: string[] = [
  'coordinator@karigarsaathi.gov.in',
  'priya@karigarsaathi.local',
  'vikram@karigarsaathi.local',
  'demo_coord_priya',
  'demo_coord_vikram',
];

export class CoordinatorApprovalService {
  private getApprovedSet(): Set<string> {
    const stored = storage.get<string[]>(STORAGE_APPROVED_KEY, []) || [];
    const set = new Set<string>(PRE_APPROVED_EMAILS.map((e) => e.toLowerCase().trim()));
    stored.forEach((item) => set.add(item.toLowerCase().trim()));
    return set;
  }

  private getRegistrations(): CoordinatorRegistrationRecord[] {
    return storage.get<CoordinatorRegistrationRecord[]>(STORAGE_REGISTRATIONS_KEY, []) || [];
  }

  private saveRegistrations(list: CoordinatorRegistrationRecord[]): void {
    storage.set(STORAGE_REGISTRATIONS_KEY, list);
  }

  private saveApprovedSet(set: Set<string>): void {
    storage.set(STORAGE_APPROVED_KEY, Array.from(set));
  }

  /**
   * Checks whether a coordinator identifier (email or UID) has been formally approved.
   */
  isApproved(emailOrUid?: string | null): boolean {
    if (!emailOrUid) return false;
    const normalized = emailOrUid.toLowerCase().trim();
    const approved = this.getApprovedSet();

    if (approved.has(normalized)) return true;

    // Check if approved via registration records
    const regs = this.getRegistrations();
    const match = regs.find(
      (r) => r.email.toLowerCase().trim() === normalized || r.uid.toLowerCase().trim() === normalized
    );
    return match?.status === 'approved';
  }

  /**
   * Retrieves the detailed registration/approval status for a coordinator account.
   */
  getRegistrationStatus(emailOrUid?: string | null): CoordinatorApprovalStatus {
    if (!emailOrUid) return 'none';
    const normalized = emailOrUid.toLowerCase().trim();

    if (this.isApproved(normalized)) {
      return 'approved';
    }

    const regs = this.getRegistrations();
    const match = regs.find(
      (r) => r.email.toLowerCase().trim() === normalized || r.uid.toLowerCase().trim() === normalized
    );

    if (match) {
      return match.status;
    }

    return 'none';
  }

  /**
   * Retrieves registration details if they exist.
   */
  getRegistration(emailOrUid?: string | null): CoordinatorRegistrationRecord | null {
    if (!emailOrUid) return null;
    const normalized = emailOrUid.toLowerCase().trim();
    const regs = this.getRegistrations();
    return (
      regs.find(
        (r) => r.email.toLowerCase().trim() === normalized || r.uid.toLowerCase().trim() === normalized
      ) || null
    );
  }

  /**
   * Registers a new coordinator candidate.
   * Creates the Firebase Authentication account and establishes an unapproved PENDING state.
   * CRITICAL SECURITY INVARIANT:
   * This method NEVER writes role: 'coordinator' to client-accessible collections,
   * completely blocking unauthorized access until trusted administrative approval.
   */
  async registerCoordinator(input: RegisterCoordinatorInput): Promise<CoordinatorRegistrationRecord> {
    const trimmedEmail = input.email.trim().toLowerCase();
    const trimmedName = input.displayName.trim();

    if (!trimmedName || trimmedName.length < 2) {
      throw new Error('Please enter a valid full name (at least 2 characters).');
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      throw new Error('Please provide a valid official email address.');
    }
    if (!input.password || input.password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    // Check if already registered in pending/approved store
    const existing = this.getRegistration(trimmedEmail);
    if (existing) {
      if (existing.status === 'pending') {
        throw new Error('A coordinator registration for this email is already pending approval.');
      }
      if (existing.status === 'approved') {
        throw new Error('This coordinator account is already registered and approved. Please sign in.');
      }
    }

    let uid = `coord_reg_${Date.now()}`;
    const now = new Date().toISOString();

    // Firebase Auth integration
    const { isValid, isEmulator } = getFirebaseConfig();
    if (isValid || isEmulator) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, input.password);
        uid = cred.user.uid;
        await fbUpdateProfile(cred.user, { displayName: trimmedName });

        // Create base user record conforming to firestore.rules (role must be 'artisan' or not coordinator)
        try {
          const userDocRef = doc(db, 'users', uid);
          await setDoc(userDocRef, {
            uid,
            role: 'artisan', // Security rule invariant: self-registration cannot write 'coordinator'
            displayName: trimmedName,
            email: trimmedEmail,
            phone: input.phone || '',
            preferredLanguage: 'en',
            createdAt: now,
            updatedAt: now,
          });
        } catch (dbErr) {
          logger.warn('COORDINATOR', 'Could not create private user doc; pending record maintained in registry', {
            error: dbErr instanceof Error ? dbErr.message : String(dbErr),
          });
        }
      } catch (authErr: unknown) {
        const code = (authErr as { code?: string })?.code;
        if (code === 'auth/email-already-in-use') {
          throw new Error('An account with this email address already exists. Please sign in or use another email.');
        }
        if (code === 'auth/weak-password') {
          throw new Error('The chosen password is too weak. Please use at least 6 characters.');
        }
        throw authErr instanceof Error ? authErr : new Error('Failed to create coordinator account.');
      }
    }

    // Record pending registration
    const record: CoordinatorRegistrationRecord = {
      uid,
      email: trimmedEmail,
      displayName: trimmedName,
      agencyName: input.agencyName?.trim() || 'Regional Handloom & Handicrafts Cluster',
      phone: input.phone?.trim() || undefined,
      status: 'pending',
      requestedAt: now,
    };

    const regs = this.getRegistrations();
    regs.push(record);
    this.saveRegistrations(regs);

    logger.info('COORDINATOR', 'New coordinator registered in PENDING status', {
      uid,
      email: trimmedEmail,
      agency: record.agencyName,
    });

    return record;
  }

  /**
   * Trusted administrative path to approve a pending coordinator.
   */
  approveRegistration(emailOrUid: string, approvedBy = 'system_admin'): CoordinatorRegistrationRecord {
    const normalized = emailOrUid.toLowerCase().trim();
    const regs = this.getRegistrations();
    const index = regs.findIndex(
      (r) => r.email.toLowerCase().trim() === normalized || r.uid.toLowerCase().trim() === normalized
    );

    const now = new Date().toISOString();

    if (index === -1) {
      // Create synthetic approved record if not in registry
      const synthetic: CoordinatorRegistrationRecord = {
        uid: normalized,
        email: normalized.includes('@') ? normalized : `${normalized}@karigarsaathi.local`,
        displayName: 'Approved Coordinator',
        status: 'approved',
        requestedAt: now,
        reviewedAt: now,
        reviewedBy: approvedBy,
      };
      regs.push(synthetic);
      this.saveRegistrations(regs);

      const approved = this.getApprovedSet();
      approved.add(normalized);
      this.saveApprovedSet(approved);

      logger.info('COORDINATOR', 'Coordinator approved (synthetic)', { id: normalized });
      return synthetic;
    }

    regs[index].status = 'approved';
    regs[index].reviewedAt = now;
    regs[index].reviewedBy = approvedBy;
    this.saveRegistrations(regs);

    const approved = this.getApprovedSet();
    approved.add(regs[index].email.toLowerCase().trim());
    approved.add(regs[index].uid.toLowerCase().trim());
    this.saveApprovedSet(approved);

    logger.info('COORDINATOR', 'Coordinator registration APPROVED', {
      uid: regs[index].uid,
      email: regs[index].email,
      approvedBy,
    });

    return regs[index];
  }

  /**
   * Trusted administrative path to reject a pending coordinator application.
   */
  rejectRegistration(emailOrUid: string, reason = 'Cluster verification criteria not met'): CoordinatorRegistrationRecord {
    const normalized = emailOrUid.toLowerCase().trim();
    const regs = this.getRegistrations();
    const index = regs.findIndex(
      (r) => r.email.toLowerCase().trim() === normalized || r.uid.toLowerCase().trim() === normalized
    );

    const now = new Date().toISOString();

    if (index === -1) {
      const synthetic: CoordinatorRegistrationRecord = {
        uid: normalized,
        email: normalized.includes('@') ? normalized : `${normalized}@karigarsaathi.local`,
        displayName: 'Rejected Applicant',
        status: 'rejected',
        requestedAt: now,
        reviewedAt: now,
        reviewedBy: 'system_admin',
        rejectionReason: reason,
      };
      regs.push(synthetic);
      this.saveRegistrations(regs);
      return synthetic;
    }

    regs[index].status = 'rejected';
    regs[index].reviewedAt = now;
    regs[index].reviewedBy = 'system_admin';
    regs[index].rejectionReason = reason;
    this.saveRegistrations(regs);

    const approved = this.getApprovedSet();
    approved.delete(regs[index].email.toLowerCase().trim());
    approved.delete(regs[index].uid.toLowerCase().trim());
    this.saveApprovedSet(approved);

    logger.info('COORDINATOR', 'Coordinator registration REJECTED', {
      uid: regs[index].uid,
      email: regs[index].email,
      reason,
    });

    return regs[index];
  }

  /**
   * Lists all pending coordinator applications.
   */
  listPendingRegistrations(): CoordinatorRegistrationRecord[] {
    return this.getRegistrations().filter((r) => r.status === 'pending');
  }

  /**
   * Resets local registrations and dynamic approvals (primarily for testing).
   */
  clearAll(): void {
    storage.remove(STORAGE_APPROVED_KEY);
    storage.remove(STORAGE_REGISTRATIONS_KEY);
  }
}

export const coordinatorApprovalService = new CoordinatorApprovalService();
