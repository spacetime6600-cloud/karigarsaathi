/**
 * Mock In-Memory Implementation of IPassportRepository
 * Used for offline isolation and client tests.
 */

import { IPassportRepository } from '@/repositories/interfaces/IPassportRepository';
import {
  CraftPassport,
  PublicCraftPassport,
  ConsentRecord,
  ExportAuditRecord,
  BuyerEnquiry,
  CraftPassportStatus,
} from '@/types';

export class MockPassportRepository implements IPassportRepository {
  private passports = new Map<string, CraftPassport>();
  private publicPassports = new Map<string, PublicCraftPassport>();
  private consentRecords = new Map<string, ConsentRecord>();
  private auditRecords: ExportAuditRecord[] = [];
  private enquiries: BuyerEnquiry[] = [];

  constructor() {
    // Seed initial dummy public passport for KP_01_7721
    const defaultSlug = 'chanderi-silk-saree-kamrup-7721';
    const mockPublic: PublicCraftPassport = {
      passportId: 'KP_01_7721',
      productId: 'prod_kamrup_saree_01',
      ownerId: 'artisan_001',
      slug: defaultSlug,
      status: 'active',
      snapshotVersion: 1,
      publicData: {
        title: 'Chanderi Zari Mulberry Silk Saree',
        titleHindi: 'चंदेरी जरी रेशम साड़ी',
        description: 'Authentic pure silk saree handwoven on traditional pit loom over 18 days.',
        photos: [
          'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800',
          'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800',
        ],
        category: 'Handloom Textiles',
        technique: 'Jamdani & Zari Weaving',
        materials: ['Mulberry Silk', 'Zari Gold Thread'],
        dimensions: '5.5m x 1.15m',
        careInstructions: 'Dry clean only. Store in muslin cloth.',
        tags: ['Silk', 'Zari', 'Handloom'],
        price: 14500,
        currency: 'INR',
        artisanName: 'Kamala Devi',
        artisanStory: 'Fourth-generation master weaver preserving traditional motifs.',
        state: 'Assam',
        district: 'Kamrup',
        workshopName: 'Kamala Handlooms',
        contactOption: true,
        verificationHash: 'SHA256:4f8e91c7a2b0e6d53891fc928a',
      },
      activatedAt: '2026-08-27T10:00:00.000Z',
      updatedAt: '2026-08-27T10:00:00.000Z',
    };
    this.publicPassports.set(defaultSlug, mockPublic);
    this.publicPassports.set('KP_01_7721', mockPublic);
  }

  async createPassport(passport: CraftPassport): Promise<CraftPassport> {
    this.passports.set(passport.id, passport);
    return passport;
  }

  async getPassportById(_ownerId: string, passportId: string): Promise<CraftPassport | null> {
    return this.passports.get(passportId) || null;
  }

  async getPassportByProductId(ownerId: string, productId: string): Promise<CraftPassport | null> {
    for (const p of this.passports.values()) {
      if (p.productId === productId && p.ownerId === ownerId) {
        return p;
      }
    }
    return null;
  }

  async updatePassportStatus(
    _ownerId: string,
    passportId: string,
    status: CraftPassportStatus,
    metadata: Partial<CraftPassport> = {}
  ): Promise<void> {
    const existing = this.passports.get(passportId);
    if (existing) {
      this.passports.set(passportId, {
        ...existing,
        ...metadata,
        status,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  async revokePassport(ownerId: string, passportId: string): Promise<void> {
    const passport = await this.getPassportById(ownerId, passportId);
    if (passport) {
      passport.status = 'revoked';
      passport.revokedAt = new Date().toISOString();
      if (passport.publicSlug) {
        await this.revokePublicPassport(passport.publicSlug);
      }
    }
  }

  async createOrUpdatePublicPassport(publicPassport: PublicCraftPassport): Promise<void> {
    this.publicPassports.set(publicPassport.slug, publicPassport);
  }

  async getPublicPassportBySlug(slug: string): Promise<PublicCraftPassport | null> {
    return this.publicPassports.get(slug) || null;
  }

  async revokePublicPassport(slug: string): Promise<void> {
    const existing = this.publicPassports.get(slug);
    if (existing) {
      this.publicPassports.set(slug, {
        ...existing,
        status: 'revoked',
        publicData: {
          title: '',
          photos: [],
        },
        revokedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  async recordConsent(consent: ConsentRecord): Promise<ConsentRecord> {
    this.consentRecords.set(consent.id, consent);
    return consent;
  }

  async getConsentRecord(_ownerId: string, consentId: string): Promise<ConsentRecord | null> {
    return this.consentRecords.get(consentId) || null;
  }

  async recordAudit(audit: ExportAuditRecord): Promise<ExportAuditRecord> {
    this.auditRecords.unshift(audit);
    return audit;
  }

  async listAuditRecords(ownerId: string, productId?: string): Promise<ExportAuditRecord[]> {
    return this.auditRecords.filter(
      (a) => a.ownerId === ownerId && (!productId || a.productId === productId)
    );
  }

  async submitBuyerEnquiry(enquiryInput: Omit<BuyerEnquiry, 'id' | 'receivedAt' | 'replies'>): Promise<BuyerEnquiry> {
    const now = new Date().toISOString();
    const newEnquiry: BuyerEnquiry = {
      ...enquiryInput,
      id: `enq_${Date.now()}`,
      receivedAt: now,
      createdAt: now,
      status: 'new',
      replies: [],
    };
    this.enquiries.unshift(newEnquiry);
    return newEnquiry;
  }

  async listBuyerEnquiries(artisanId: string): Promise<BuyerEnquiry[]> {
    return this.enquiries.filter((e) => !e.artisanId || e.artisanId === artisanId);
  }

  async getBuyerEnquiryById(enquiryId: string): Promise<BuyerEnquiry | null> {
    return this.enquiries.find((e) => e.id === enquiryId) || null;
  }
}
