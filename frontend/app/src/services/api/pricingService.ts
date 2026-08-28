import { CostBreakdown, PriceSuggestion } from '@/types';

export const pricingService = {
  calculateTotalCost(breakdown: CostBreakdown): number {
    const raw = Number(breakdown.rawMaterials) || 0;
    const hours = Number(breakdown.laborHours) || 0;
    const rate = Number(breakdown.hourlyRate) || 0;
    const logistics = Number(breakdown.packagingAndLogistics) || 0;
    return raw + hours * rate + logistics;
  },

  getSuggestions(totalCost: number): PriceSuggestion[] {
    const safeCost = Math.max(totalCost, 500);

    return [
      {
        tier: 'fair_trade',
        price: Math.round(safeCost * 1.35),
        label: 'Fair Trade Floor',
        sublabel: 'Ensures living wage and 35% artisan profit margin.',
        marginPercent: 35,
        isRecommended: true,
      },
      {
        tier: 'market_standard',
        price: Math.round(safeCost * 1.65),
        label: 'Market Competitive',
        sublabel: 'Aligned with retail handicraft stores and boutique exhibitions.',
        marginPercent: 65,
      },
      {
        tier: 'premium_heritage',
        price: Math.round(safeCost * 2.10),
        label: 'Heritage & Collector',
        sublabel: 'For master-crafted authentic GI/Jamdani collector editions.',
        marginPercent: 110,
      },
    ];
  },

  isPriceBelowCost(price: number, totalCost: number): boolean {
    return price > 0 && price < totalCost;
  },
};
