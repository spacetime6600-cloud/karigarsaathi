import { CostBreakdown, PriceSuggestion } from '@/types';

export interface SuggestionParams {
  category?: string;
  subcategory?: string;
  craftType?: string;
  material?: string;
  materials?: string[];
  colour?: string;
  origin?: string;
  dimensions?: string;
  makingTime?: string;
}

export interface SuggestionResult<T> {
  data: T;
  isMock: true;
  generatedAt: string;
  confidenceScore: number;
}

/**
 * Normalizes and deduplicates tags.
 */
export function normalizeTags(rawTags: string[] | string): string[] {
  const items = Array.isArray(rawTags) ? rawTags : rawTags.split(',');
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const item of items) {
    const clean = item
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, ' ');

    if (clean.length >= 2 && clean.length <= 40) {
      const lower = clean.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        // Title Case for display
        const formatted = clean
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
        normalized.push(formatted);
      }
    }
  }

  return normalized;
}

/**
 * Catalogue Suggestion Service (Deterministic Rule-Based Mock)
 */
export const catalogueSuggestionService = {
  async suggestTitle(params: SuggestionParams): Promise<SuggestionResult<string>> {
    // Simulate brief deterministic delay
    await new Promise((resolve) => setTimeout(resolve, 200));

    const materialPart = params.material || (params.materials && params.materials[0]) || '';
    const craftPart = params.craftType || params.category || 'Craft Item';
    const colourPart = params.colour ? `${params.colour} ` : '';

    let title = '';
    if (materialPart && craftPart) {
      title = `${colourPart}Handcrafted ${materialPart} ${craftPart}`.trim();
    } else if (craftPart) {
      title = `${colourPart}Traditional Handcrafted ${craftPart}`.trim();
    } else {
      title = 'Handcrafted Heritage Artisan Product';
    }

    return {
      data: title,
      isMock: true,
      generatedAt: new Date().toISOString(),
      confidenceScore: 0.95,
    };
  },

  async suggestDescription(params: SuggestionParams): Promise<SuggestionResult<string>> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const craftPart = params.craftType || params.category || 'artisan craft piece';
    const materialPart = params.material || (params.materials && params.materials.join(' and ')) || 'authentic regional materials';
    const originPart = params.origin ? ` in ${params.origin}` : '';
    const makingPart = params.makingTime ? ` over ${params.makingTime}` : '';

    const description = `This authentic ${craftPart} is meticulously handcrafted using pure ${materialPart}${originPart}${makingPart}. Preserving centuries-old traditional artisan heritage with sustainable craft methods and timeless aesthetic elegance.`;

    return {
      data: description,
      isMock: true,
      generatedAt: new Date().toISOString(),
      confidenceScore: 0.92,
    };
  },

  async suggestTags(params: SuggestionParams): Promise<SuggestionResult<string[]>> {
    await new Promise((resolve) => setTimeout(resolve, 150));

    const rawList: string[] = [
      params.material || '',
      ...(params.materials || []),
      params.craftType || '',
      params.category || '',
      params.subcategory || '',
      params.colour || '',
      params.origin ? `${params.origin} Craft` : '',
      'Handmade',
      'Indian Craft',
      'Authentic Heritage',
      'Eco Friendly',
    ].filter(Boolean);

    const tags = normalizeTags(rawList);

    return {
      data: tags,
      isMock: true,
      generatedAt: new Date().toISOString(),
      confidenceScore: 0.96,
    };
  },
};

/**
 * Price Suggestion Service (Deterministic Pricing Calculator)
 */
export const priceSuggestionService = {
  suggestPricingTiers(costBreakdown: CostBreakdown): PriceSuggestion[] {
    const raw = costBreakdown.rawMaterials || 0;
    const labor = (costBreakdown.laborHours || 0) * (costBreakdown.hourlyRate || 0);
    const packaging = costBreakdown.packagingAndLogistics || 0;
    const totalCost = raw + labor + packaging;

    const baseCost = totalCost > 0 ? totalCost : 5000;

    const fairTradePrice = Math.round(baseCost * 1.35);
    const marketStandardPrice = Math.round(baseCost * 1.50);
    const premiumHeritagePrice = Math.round(baseCost * 1.75);

    return [
      {
        tier: 'fair_trade',
        price: fairTradePrice,
        label: 'Fair Trade Floor',
        sublabel: 'Guarantees 35% artisan dignity margin above materials & labor.',
        marginPercent: 35,
        isRecommended: true,
      },
      {
        tier: 'market_standard',
        price: marketStandardPrice,
        label: 'Market Competitive',
        sublabel: 'Balanced retail benchmark matching premium craft exhibitions.',
        marginPercent: 50,
      },
      {
        tier: 'premium_heritage',
        price: premiumHeritagePrice,
        label: 'Heritage Collector',
        sublabel: 'Captures maximum collector value for master-level craftsmanship.',
        marginPercent: 75,
      },
    ];
  },
};

/**
 * Image Enhancement Service Mock (Explicitly reports disabled AI)
 */
export const imageEnhancementService = {
  async enhanceImage(_photoId: string): Promise<{ available: false; enhanced: false; message: string }> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return {
      available: false,
      enhanced: false,
      message: 'AI image enhancement is disabled. KarigarSaathi preserves authentic, unmanipulated craft photographs.',
    };
  },
};
