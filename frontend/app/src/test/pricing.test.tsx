import { describe, it, expect } from 'vitest';
import { pricingService } from '@/services/api/pricingService';

describe('Pricing Service & Below-Cost Safety Gates', () => {
  it('calculates total cost accurately from materials, labor and packaging', () => {
    const total = pricingService.calculateTotalCost({
      rawMaterials: 3000,
      laborHours: 40,
      hourlyRate: 150,
      packagingAndLogistics: 500,
      totalCost: 0,
    });
    // 3000 + (40 * 150 = 6000) + 500 = 9500
    expect(total).toBe(9500);
  });

  it('generates 3-tier price recommendations with fair artisan margins', () => {
    const cost = 10000;
    const suggestions = pricingService.getSuggestions(cost);

    expect(suggestions).toHaveLength(3);
    const fairTrade = suggestions.find((s) => s.tier === 'fair_trade');
    const market = suggestions.find((s) => s.tier === 'market_standard');
    const premium = suggestions.find((s) => s.tier === 'premium_heritage');

    expect(fairTrade?.price).toBe(13500); // 35% margin
    expect(market?.price).toBe(16500); // 65% margin
    expect(premium?.price).toBe(21000); // 110% margin
    expect(fairTrade?.isRecommended).toBe(true);
  });

  it('flags prices entered below total creation cost', () => {
    const cost = 10000;
    expect(pricingService.isPriceBelowCost(8500, cost)).toBe(true);
    expect(pricingService.isPriceBelowCost(10500, cost)).toBe(false);
    expect(pricingService.isPriceBelowCost(10000, cost)).toBe(false);
  });
});
