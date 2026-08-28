import { describe, it, expect } from 'vitest';
import {
  validateStatusTransition,
  createStatusHistoryEntry,
} from '@/domain/lifecycle';
import { ProductDraft } from '@/types';

const createMockDraft = (overrides: Partial<ProductDraft> = {}): ProductDraft => ({
  id: 'draft_test_101',
  artisanId: 'artisan_001',
  ownerId: 'artisan_001',
  title: 'Handloom Muga Silk Chador',
  category: 'Textiles',
  craftType: 'Muga Silk Weaving',
  materials: ['Pure Silk'],
  origin: 'Assam',
  story: 'Traditional handwoven craft',
  photos: [
    {
      id: 'p1',
      url: 'https://example.com/p1.jpg',
      name: 'p1.jpg',
      size: 1024,
      type: 'image/jpeg',
      uploadedAt: '2026-08-27T10:00:00Z',
      isCover: true,
    },
  ],
  primaryImageId: 'p1',
  coverPhotoIndex: 0,
  description: 'Authentic pure silk chador',
  dimensions: '2.5m x 1m',
  selectedPrice: 12000,
  stockQuantity: 2,
  confirmedFacts: [],
  needsReviewFacts: [],
  costBreakdown: {
    rawMaterials: 5000,
    laborHours: 20,
    hourlyRate: 250,
    packagingAndLogistics: 500,
    totalCost: 10500,
  },
  pricingStrategy: 'fair_trade',
  publicFields: {
    title: true,
    category: true,
    technique: true,
    materials: true,
    dimensions: true,
    origin: true,
    story: true,
    artisanName: true,
    workshopLocation: true,
    directContact: true,
    retailPrice: true,
    wholesaleAvailable: false,
  },
  technique: 'Handloom',
  status: 'draft',
  createdAt: '2026-08-27T10:00:00Z',
  updatedAt: '2026-08-27T10:00:00Z',
  ...overrides,
});

describe('Product Lifecycle State Machine Suite', () => {
  it('1. Allows draft -> ready when all 10 readiness criteria are met', () => {
    const readyDraft = createMockDraft();
    const result = validateStatusTransition('draft', 'ready', readyDraft);
    expect(result.allowed).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('2. Rejects draft -> ready when mandatory fields are missing', () => {
    const incompleteDraft = createMockDraft({
      title: '', // Missing title
      selectedPrice: 0,
    });
    const result = validateStatusTransition('draft', 'ready', incompleteDraft);
    expect(result.allowed).toBe(false);
    expect(result.error).toContain('Failed requirements');
  });

  it('3. Allows ready -> shared when craft passport is published', () => {
    const readyDraft = createMockDraft({ status: 'ready' });
    const result = validateStatusTransition('ready', 'shared', readyDraft);
    expect(result.allowed).toBe(true);
  });

  it('4. Allows ready/shared -> enquiry_received when buyer submits structured enquiry', () => {
    const sharedDraft = createMockDraft({ status: 'shared' });
    const result = validateStatusTransition('shared', 'enquiry_received', sharedDraft);
    expect(result.allowed).toBe(true);
  });

  it('5. Allows any active product to transition to archived', () => {
    const readyDraft = createMockDraft({ status: 'ready' });
    const result = validateStatusTransition('ready', 'archived', readyDraft);
    expect(result.allowed).toBe(true);
  });

  it('6. Blocks archived product from transitioning directly to shared or enquiry_received', () => {
    const archivedDraft = createMockDraft({ status: 'archived' });
    const resultShared = validateStatusTransition('archived', 'shared', archivedDraft);
    expect(resultShared.allowed).toBe(false);
    expect(resultShared.error).toContain('Archived crafts cannot transition directly');

    const resultEnquiry = validateStatusTransition('archived', 'enquiry_received', archivedDraft);
    expect(resultEnquiry.allowed).toBe(false);
    expect(resultEnquiry.error).toContain('Archived crafts cannot transition directly');
  });

  it('7. Allows archived product to transition back to draft on explicit restore', () => {
    const archivedDraft = createMockDraft({ status: 'archived' });
    const result = validateStatusTransition('archived', 'draft', archivedDraft);
    expect(result.allowed).toBe(true);
  });

  it('8. Generates complete, validated statusHistory audit entry', () => {
    const entry = createStatusHistoryEntry('shared', 'enquiry_received', {
      actorType: 'buyer',
      reason: 'Buyer submitted structured inquiry via passport',
      triggeringEnquiryId: 'enq_101',
      timestamp: '2026-08-27T12:00:00Z',
    });

    expect(entry.previousStatus).toBe('shared');
    expect(entry.newStatus).toBe('enquiry_received');
    expect(entry.actorType).toBe('buyer');
    expect(entry.reason).toBe('Buyer submitted structured inquiry via passport');
    expect(entry.triggeringEnquiryId).toBe('enq_101');
    expect(entry.timestamp).toBe('2026-08-27T12:00:00Z');
  });
});
