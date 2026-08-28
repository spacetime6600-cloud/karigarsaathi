import { describe, it, expect } from 'vitest';
import { marketplaceAdapters } from '@/services/adapters/marketplaceAdapters';
import { ProductDraft } from '@/types';

describe('Phase 10 — Marketplace Channel Adapters (Honest Preparation Only)', () => {
  const readyDraft: ProductDraft = {
    id: 'prod_adapter_test_101',
    artisanId: 'artisan_kamala_123',
    ownerId: 'artisan_kamala_123',
    title: 'Pure Mulberry Silk Chanderi Saree',
    category: 'Handloom Textiles',
    technique: 'Chanderi Weaving',
    materials: ['Mulberry Silk', 'Zari'],
    dimensions: '5.5m x 1.15m',
    origin: 'Kamrup, Assam',
    story: 'Woven over 18 days by master weaver.',
    photos: [
      { id: 'p1', name: 'photo1.jpg', size: 1024, type: 'image/jpeg', url: 'https://example.com/saree1.jpg', uploadedAt: '2026-08-27T10:00:00.000Z' },
    ],
    coverPhotoIndex: 0,
    stockQuantity: 3,
    sku: 'CHN-SILK-001',
    selectedPrice: 16500,
    currency: 'INR',
    pricingStrategy: 'fair_trade',
    publicFields: {
      title: true, category: true, technique: true, materials: true,
      dimensions: true, origin: true, story: true, artisanName: true,
      workshopLocation: true, directContact: true, retailPrice: true, wholesaleAvailable: false,
    },
    confirmedFacts: [],
    needsReviewFacts: [],
    costBreakdown: { rawMaterials: 5000, laborHours: 20, hourlyRate: 200, packagingAndLogistics: 500, totalCost: 9500 },
    status: 'ready',
    createdAt: '2026-08-27T10:00:00.000Z',
    updatedAt: '2026-08-27T10:00:00.000Z',
  };

  it('1. ONDC Adapter validates and prepares Beckn retail catalog format', async () => {
    const adapter = marketplaceAdapters.ondc;
    expect(adapter.displayName).toContain('ONDC');

    const validation = await adapter.validate(readyDraft);
    expect(validation.valid).toBe(true);

    const prepared = await adapter.prepare(readyDraft, undefined, 'https://karigarsaathi.web.app/passport/chn-001');
    expect(prepared.channel).toBe('ondc');
    expect(prepared.schemaVersion).toBe('beckn.retail/1.2.0');
    expect(prepared.payload).toHaveProperty('context');
    expect(prepared.payload).toHaveProperty('message');

    // Calling submit must return not_configured and never claim direct publication
    const submission = await adapter.submit!(prepared);
    expect(submission.success).toBe(false);
    expect(submission.status).toBe('not_configured');
    expect(submission.message).toContain('external submission not connected');
  });

  it('2. Indiahandmade Adapter prepares Ministry of Textiles batch specification', async () => {
    const adapter = marketplaceAdapters.indiahandmade;

    const validation = await adapter.validate(readyDraft);
    expect(validation.valid).toBe(true);

    const prepared = await adapter.prepare(readyDraft, undefined, 'https://karigarsaathi.web.app/passport/chn-001');
    expect(prepared.channel).toBe('indiahandmade');
    expect(prepared.payload).toHaveProperty('portal');

    const submission = await adapter.submit!(prepared);
    expect(submission.success).toBe(false);
    expect(submission.status).toBe('not_configured');
  });

  it('3. GeM ODOP Adapter prepares standardized government procurement format', async () => {
    const adapter = marketplaceAdapters.gem_odop;

    const validation = await adapter.validate(readyDraft);
    expect(validation.valid).toBe(true);

    const prepared = await adapter.prepare(readyDraft, undefined, 'https://karigarsaathi.web.app/passport/chn-001');
    expect(prepared.channel).toBe('gem_odop');
    expect(prepared.payload).toHaveProperty('governmentPortal');

    const submission = await adapter.submit!(prepared);
    expect(submission.success).toBe(false);
    expect(submission.status).toBe('not_configured');
  });

  it('4. Generic Adapter generates standard Schema.org JSON-LD', async () => {
    const adapter = marketplaceAdapters.generic;

    const prepared = await adapter.prepare(readyDraft);
    const payload = prepared.payload as Record<string, unknown>;
    expect(payload['@context']).toBe('https://schema.org/');
    expect(payload['@type']).toBe('Product');
    expect(payload['name']).toBe('Pure Mulberry Silk Chanderi Saree');

    const submission = await adapter.submit!(prepared);
    expect(submission.status).toBe('unsupported_capability');
  });
});
