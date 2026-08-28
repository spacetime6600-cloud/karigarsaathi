import { ProductRecord } from '@/domain/products';
import { PriceHistoryEntry } from '@/domain/analytics';
import { storage } from '@/services/storage/localStorage';

const PRICE_HISTORY_STORAGE_KEY = 'artisan_product_price_history_';

export interface ProductPriceInsight {
  productId: string;
  productTitle: string;
  currentPrice: number;
  currency: string;
  lastChangeDate: string;
  previousPrice: number | null;
  priceDifference: number | null;
  percentChange: number | null;
  hasPriceHistory: boolean;
  historyEntries: PriceHistoryEntry[];
  aiSuggestedPrice?: number;
  aiSuggestedGeneratedAt?: string;
  costBreakdownTotal?: number;
}

export const priceHistoryService = {
  /**
   * Get complete price history and calculated step-line data for a product
   */
  getProductPriceHistory(product: ProductRecord): ProductPriceInsight {
    const key = `${PRICE_HISTORY_STORAGE_KEY}${product.id}`;
    let entries = storage.get<PriceHistoryEntry[]>(key, []);

    // If no recorded history exists in storage, check if product has initial creation date
    if (entries.length === 0) {
      const initialDate = product.createdAt || new Date().toISOString();
      const currentEntry: PriceHistoryEntry = {
        id: `ph_${product.id}_init`,
        productId: product.id,
        price: product.price,
        currency: product.currency || 'INR',
        effectiveDate: initialDate,
        reason: 'Initial catalogue listing',
      };
      entries = [currentEntry];
    }

    // Sort chronologically ascending
    entries.sort((a, b) => new Date(a.effectiveDate).getTime() - new Date(b.effectiveDate).getTime());

    const currentEntry = entries[entries.length - 1];
    const currentPrice = currentEntry ? currentEntry.price : product.price;
    const lastChangeDate = currentEntry ? currentEntry.effectiveDate : (product.updatedAt || product.createdAt);

    let previousPrice: number | null = null;
    let priceDifference: number | null = null;
    let percentChange: number | null = null;

    if (entries.length > 1) {
      const prevEntry = entries[entries.length - 2];
      previousPrice = prevEntry.price;
      priceDifference = currentPrice - previousPrice;
      if (previousPrice > 0) {
        percentChange = Math.round(((currentPrice - previousPrice) / previousPrice) * 100);
      }
    }

    // Check AI suggested price from cost breakdown or suggestion metadata
    let aiSuggestedPrice: number | undefined;
    let aiSuggestedGeneratedAt: string | undefined;
    let costBreakdownTotal: number | undefined;

    if (product.costBreakdown && product.costBreakdown.totalCost > 0) {
      costBreakdownTotal = product.costBreakdown.totalCost;
      // If a strategy is applied or fair trade standard is used
      aiSuggestedPrice = Math.round(product.costBreakdown.totalCost * 1.35); // 35% artisan fair margin
      aiSuggestedGeneratedAt = product.suggestionMetadata?.generatedAt || product.createdAt;
    }

    return {
      productId: product.id,
      productTitle: product.title,
      currentPrice,
      currency: product.currency || 'INR',
      lastChangeDate,
      previousPrice,
      priceDifference,
      percentChange,
      hasPriceHistory: entries.length > 1,
      historyEntries: entries,
      aiSuggestedPrice,
      aiSuggestedGeneratedAt,
      costBreakdownTotal,
    };
  },

  /**
   * Record a dated price update milestone for a product
   */
  recordPriceChange(
    productId: string,
    newPrice: number,
    effectiveDate: string = new Date().toISOString(),
    reason?: string,
    actualSalePrice?: number
  ): void {
    const key = `${PRICE_HISTORY_STORAGE_KEY}${productId}`;
    const current = storage.get<PriceHistoryEntry[]>(key, []);
    const newEntry: PriceHistoryEntry = {
      id: `ph_${productId}_${Date.now()}`,
      productId,
      price: newPrice,
      currency: 'INR',
      effectiveDate,
      reason: reason || 'Price revision',
      actualSalePrice,
    };
    storage.set(key, [...current, newEntry]);
  },

  /**
   * Seed demonstration price history for testing & visual verification
   */
  seedDemoPriceHistory(product: ProductRecord): void {
    const key = `${PRICE_HISTORY_STORAGE_KEY}${product.id}`;
    const now = new Date();
    const msInDay = 24 * 60 * 60 * 1000;

    const demoHistory: PriceHistoryEntry[] = [
      {
        id: `ph_${product.id}_1`,
        productId: product.id,
        price: Math.round(product.price * 0.88),
        currency: 'INR',
        effectiveDate: new Date(now.getTime() - 60 * msInDay).toISOString(),
        reason: 'Initial seasonal listing',
        actualSalePrice: Math.round(product.price * 0.88),
      },
      {
        id: `ph_${product.id}_2`,
        productId: product.id,
        price: Math.round(product.price * 0.95),
        currency: 'INR',
        effectiveDate: new Date(now.getTime() - 28 * msInDay).toISOString(),
        reason: 'Material cost adjustment (Silk yarn)',
        actualSalePrice: Math.round(product.price * 0.95),
      },
      {
        id: `ph_${product.id}_3`,
        productId: product.id,
        price: product.price,
        currency: 'INR',
        effectiveDate: new Date(now.getTime() - 7 * msInDay).toISOString(),
        reason: 'Fair trade certified pricing',
        actualSalePrice: product.price,
      },
    ];

    storage.set(key, demoHistory);
  },
};
