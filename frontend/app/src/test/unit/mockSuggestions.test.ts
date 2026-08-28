import { describe, it, expect } from 'vitest';
import {
  catalogueSuggestionService,
  priceSuggestionService,
  imageEnhancementService,
  normalizeTags,
} from '@/services/suggestions/mockSuggestionService';

describe('Deterministic Mock Suggestion Services (Zero External AI)', () => {
  it('generates deterministic title suggestions based on material and craft', async () => {
    const res1 = await catalogueSuggestionService.suggestTitle({
      material: 'Mulberry Silk',
      craftType: 'Jamdani Weave',
      colour: 'Crimson Red',
    });

    expect(res1.isMock).toBe(true);
    expect(res1.data).toBe('Crimson Red Handcrafted Mulberry Silk Jamdani Weave');

    const res2 = await catalogueSuggestionService.suggestTitle({
      category: 'Pottery',
    });
    expect(res2.data).toBe('Traditional Handcrafted Pottery');
  });

  it('generates deterministic craft description with cultural grounding', async () => {
    const res = await catalogueSuggestionService.suggestDescription({
      craftType: 'Pochampally Ikat',
      material: 'Organic Cotton',
      origin: 'Telangana, India',
      makingTime: '14 days',
    });

    expect(res.isMock).toBe(true);
    expect(res.data).toContain('Pochampally Ikat');
    expect(res.data).toContain('Organic Cotton');
    expect(res.data).toContain('Telangana, India');
    expect(res.data).toContain('14 days');
    expect(res.data).toContain('Preserving centuries-old traditional artisan heritage');
  });

  it('normalizes, deduplicates, and formats search tags', async () => {
    const rawTags = ['silk', 'SILK ', 'Handmade!!', 'Assam Craft', '  eco-friendly  ', 'a'];
    const normalized = normalizeTags(rawTags);

    expect(normalized).toContain('Silk');
    expect(normalized).toContain('Handmade');
    expect(normalized).toContain('Assam Craft');
    expect(normalized).toContain('Eco-friendly');
    expect(normalized).not.toContain('a'); // <2 chars rejected
    expect(normalized.filter((t) => t.toLowerCase() === 'silk').length).toBe(1); // deduplicated
  });

  it('suggests fair-trade pricing tiers accurately from cost breakdown', () => {
    const tiers = priceSuggestionService.suggestPricingTiers({
      rawMaterials: 3000,
      laborHours: 20,
      hourlyRate: 200,
      packagingAndLogistics: 500,
      totalCost: 7500,
    });

    expect(tiers).toHaveLength(3);
    const fairTrade = tiers.find((t) => t.tier === 'fair_trade');
    expect(fairTrade).toBeDefined();
    expect(fairTrade?.price).toBe(Math.round(7500 * 1.35));
    expect(fairTrade?.isRecommended).toBe(true);

    const premium = tiers.find((t) => t.tier === 'premium_heritage');
    expect(premium?.price).toBe(Math.round(7500 * 1.75));
  });

  it('explicitly reports AI enhancement as unavailable / disabled', async () => {
    const res = await imageEnhancementService.enhanceImage('img_123');
    expect(res.available).toBe(false);
    expect(res.enhanced).toBe(false);
    expect(res.message).toContain('AI image enhancement is disabled');
  });
});
