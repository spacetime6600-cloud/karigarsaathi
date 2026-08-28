/**
 * Secure Server-Authoritative Buyer Enquiry Submission Service for KarigarSaathi
 * Delegates submission to the trusted backend handler / Cloud Function.
 */

import {
  EnquirySubmissionPayload,
  EnquirySubmissionResult,
} from '@/types';
import { IPassportRepository } from '@/repositories/interfaces/IPassportRepository';
import { IProductRepository } from '@/repositories/interfaces/IProductRepository';
import { IEnquiryRepository } from '@/repositories/interfaces/IEnquiryRepository';
import { FirestorePassportRepository } from '@/repositories/firebase/FirestorePassportRepository';
import { FirestoreProductRepository } from '@/repositories/firebase/FirestoreProductRepository';
import { FirestoreEnquiryRepository } from '@/repositories/firebase/FirestoreEnquiryRepository';
import { MockPassportRepository } from '@/repositories/mock/MockPassportRepository';
import { MockProductRepository } from '@/repositories/mock/MockProductRepository';
import { MockEnquiryRepository } from '@/repositories/mock/MockEnquiryRepository';
import { TrustedEnquiryHandler, TRUSTED_ABUSE_CONFIG } from './trustedEnquiryHandler';

export const ENQUIRY_ABUSE_CONFIG = TRUSTED_ABUSE_CONFIG;

export class EnquirySubmissionService {
  private handler: TrustedEnquiryHandler;

  constructor(
    passportRepo?: IPassportRepository,
    productRepo?: IProductRepository,
    enquiryRepo?: IEnquiryRepository
  ) {
    const isMock = process.env.NODE_ENV === 'test' && typeof window === 'undefined' && !process.env.FIREBASE_EMULATOR_HUB;
    const pRepo = passportRepo || (isMock ? new MockPassportRepository() : new FirestorePassportRepository());
    const prRepo = productRepo || (isMock ? new MockProductRepository() : new FirestoreProductRepository());
    const eRepo = enquiryRepo || (isMock ? new MockEnquiryRepository() : new FirestoreEnquiryRepository());
    this.handler = new TrustedEnquiryHandler(pRepo, prRepo, eRepo);
  }

  /**
   * Submits a structured buyer enquiry via the trusted server endpoint.
   */
  async submitStructuredEnquiry(
    payload: EnquirySubmissionPayload,
    sourceIdentifier = 'anonymous_source'
  ): Promise<EnquirySubmissionResult> {
    return this.handler.handleSubmission(payload as unknown as Record<string, unknown>, sourceIdentifier);
  }
}

export const enquirySubmissionService = new EnquirySubmissionService();
