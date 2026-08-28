/**
 * Interface for Craft Passport, Consent Records, Audit Records, and Public Projections.
 */

import {
  CraftPassport,
  PublicCraftPassport,
  ConsentRecord,
  ExportAuditRecord,
  BuyerEnquiry,
  CraftPassportStatus,
} from '@/types';

export interface IPassportRepository {
  // Private Passport operations
  createPassport(passport: CraftPassport): Promise<CraftPassport>;
  getPassportById(ownerId: string, passportId: string): Promise<CraftPassport | null>;
  getPassportByProductId(ownerId: string, productId: string): Promise<CraftPassport | null>;
  updatePassportStatus(ownerId: string, passportId: string, status: CraftPassportStatus, metadata?: Partial<CraftPassport>): Promise<void>;
  revokePassport(ownerId: string, passportId: string): Promise<void>;

  // Public Sanitized Projection operations
  createOrUpdatePublicPassport(publicPassport: PublicCraftPassport): Promise<void>;
  getPublicPassportBySlug(slug: string): Promise<PublicCraftPassport | null>;
  revokePublicPassport(slug: string): Promise<void>;

  // Consent & Audit operations
  recordConsent(consent: ConsentRecord): Promise<ConsentRecord>;
  getConsentRecord(ownerId: string, consentId: string): Promise<ConsentRecord | null>;
  recordAudit(audit: ExportAuditRecord): Promise<ExportAuditRecord>;
  listAuditRecords(ownerId: string, productId?: string): Promise<ExportAuditRecord[]>;

  // Buyer Enquiries
  submitBuyerEnquiry(enquiry: Omit<BuyerEnquiry, 'id' | 'receivedAt' | 'replies'>): Promise<BuyerEnquiry>;
  listBuyerEnquiries(artisanId: string): Promise<BuyerEnquiry[]>;
  getBuyerEnquiryById(enquiryId: string): Promise<BuyerEnquiry | null>;
}
