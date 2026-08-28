/**
 * Domain types for Artisan Dashboard analytics, sales tracking, regional discovery,
 * and product price history.
 */

export type DateRangeOption = '7d' | '30d' | '90d' | 'custom';

export interface DateRange {
  option: DateRangeOption;
  startDate: string; // ISO string
  endDate: string;   // ISO string
  label: string;     // e.g. "30 Jul 2026 – 28 Aug 2026"
}

export type BuyerSector =
  | 'individual'
  | 'retailer'
  | 'wholesaler'
  | 'hospitality'
  | 'corporate_gifting'
  | 'other';

export interface RecordedSale {
  id: string;
  ownerId: string;
  productId: string;
  productTitle: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number; // in INR
  currency: string;
  refundedAmount?: number;
  returnedQuantity?: number;
  buyerRegionCode?: string; // 2-letter state code e.g. "MH", "KA", "WB", "DL"
  buyerRegionName?: string; // e.g. "Maharashtra", "Karnataka"
  buyerSector?: BuyerSector;
  recordedAt: string; // ISO timestamp
  source: 'manual' | 'enquiry_order' | 'marketplace';
  notes?: string;
}

export interface PriceHistoryEntry {
  id: string;
  productId: string;
  price: number;
  currency: string;
  effectiveDate: string; // ISO date
  reason?: string;
  aiSuggestedPrice?: number;
  aiSuggestedAt?: string;
  actualSalePrice?: number;
}

export interface DashboardSummaryMetrics {
  unitsSold: number;
  recordedSalesValue: number;
  liveProductsCount: number;
  newEnquiriesCount: number;
  unitsSoldComparisonPercent: number | null;
  salesValueComparisonPercent: number | null;
  hasPreviousPeriodData: boolean;
}

export interface DailySalesBucket {
  date: string; // YYYY-MM-DD
  label: string; // "Aug 12"
  salesValue: number;
  unitsSold: number;
  hasData: boolean;
}

export interface RegionSalesData {
  code: string; // e.g. "MH" or "UNKNOWN"
  name: string; // e.g. "Maharashtra"
  unitsSold: number;
  salesValue: number;
  orderCount: number;
  sharePercent: number;
}

export interface CategorySalesData {
  category: string;
  unitsSold: number;
  salesValue: number;
  sharePercent: number;
}

export interface SectorSalesData {
  sector: BuyerSector;
  label: string;
  unitsSold: number;
  salesValue: number;
  sharePercent: number;
}
