import {
  RecordedSale,
  DateRange,
  DateRangeOption,
  DashboardSummaryMetrics,
  DailySalesBucket,
  RegionSalesData,
  CategorySalesData,
  SectorSalesData,
  BuyerSector,
} from '@/domain/analytics';
import { ProductRecord } from '@/domain/products';
import { BuyerEnquiry } from '@/types';
import { storage } from '@/services/storage/localStorage';

const SALES_STORAGE_KEY_PREFIX = 'artisan_recorded_sales_';

export function calculateDateRange(option: DateRangeOption, customStart?: string, customEnd?: string): DateRange {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  let start = new Date(end);

  if (option === '7d') {
    start.setDate(end.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  } else if (option === '30d') {
    start.setDate(end.getDate() - 29);
    start.setHours(0, 0, 0, 0);
  } else if (option === '90d') {
    start.setDate(end.getDate() - 89);
    start.setHours(0, 0, 0, 0);
  } else if (option === 'custom' && customStart && customEnd) {
    start = new Date(customStart);
    start.setHours(0, 0, 0, 0);
    const customEndDate = new Date(customEnd);
    customEndDate.setHours(23, 59, 59, 999);
    end.setTime(customEndDate.getTime());
  } else {
    // Default to 30d
    start.setDate(end.getDate() - 29);
    start.setHours(0, 0, 0, 0);
  }

  const formatShort = (d: Date) =>
    d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return {
    option,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    label: `${formatShort(start)} – ${formatShort(end)}`,
  };
}

export function getPreviousPeriodRange(currentRange: DateRange): { startDate: string; endDate: string } {
  const curStart = new Date(currentRange.startDate);
  const curEnd = new Date(currentRange.endDate);
  const durationMs = curEnd.getTime() - curStart.getTime();

  const prevEnd = new Date(curStart.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - durationMs);

  return {
    startDate: prevStart.toISOString(),
    endDate: prevEnd.toISOString(),
  };
}

export const salesService = {
  /**
   * List recorded sales synchronously from local storage cache
   */
  listArtisanSalesSync(ownerId: string, dateRange?: DateRange): RecordedSale[] {
    if (!ownerId) return [];
    try {
      const key = `${SALES_STORAGE_KEY_PREFIX}${ownerId}`;
      const allSales = storage.get<RecordedSale[]>(key, []);

      if (!dateRange) return allSales;

      const startMs = new Date(dateRange.startDate).getTime();
      const endMs = new Date(dateRange.endDate).getTime();

      return allSales.filter((s) => {
        const saleMs = new Date(s.recordedAt).getTime();
        return saleMs >= startMs && saleMs <= endMs;
      });
    } catch {
      return [];
    }
  },

  /**
   * List recorded sales for a specific artisan within an optional date range
   */
  async listArtisanSales(ownerId: string, dateRange?: DateRange): Promise<RecordedSale[]> {
    return this.listArtisanSalesSync(ownerId, dateRange);
  },

  /**
   * Record a new confirmed sale
   */
  async recordSale(sale: RecordedSale): Promise<RecordedSale> {
    const key = `${SALES_STORAGE_KEY_PREFIX}${sale.ownerId}`;
    const current = storage.get<RecordedSale[]>(key, []);
    const updated = [sale, ...current.filter((s) => s.id !== sale.id)];
    storage.set(key, updated);
    return sale;
  },

  /**
   * Seed demonstration sales fixtures strictly for test / isolated presentation mode
   */
  seedDemoSales(ownerId: string): void {
    const key = `${SALES_STORAGE_KEY_PREFIX}${ownerId}`;
    const now = new Date();
    const msInDay = 24 * 60 * 60 * 1000;

    const demoSales: RecordedSale[] = [
      {
        id: 'sale_001',
        ownerId,
        productId: 'prod_jamdani_01',
        productTitle: 'Indigo & Terracotta Silk Jamdani Saree',
        category: 'Textiles',
        quantity: 2,
        unitPrice: 14243,
        totalAmount: 28486,
        currency: 'INR',
        buyerRegionCode: 'MH',
        buyerRegionName: 'Maharashtra',
        buyerSector: 'retailer',
        recordedAt: new Date(now.getTime() - 2 * msInDay).toISOString(),
        source: 'enquiry_order',
      },
      {
        id: 'sale_002',
        ownerId,
        productId: 'prod_jamdani_01',
        productTitle: 'Indigo & Terracotta Silk Jamdani Saree',
        category: 'Textiles',
        quantity: 1,
        unitPrice: 14243,
        totalAmount: 14243,
        currency: 'INR',
        buyerRegionCode: 'KA',
        buyerRegionName: 'Karnataka',
        buyerSector: 'individual',
        recordedAt: new Date(now.getTime() - 5 * msInDay).toISOString(),
        source: 'marketplace',
      },
      {
        id: 'sale_003',
        ownerId,
        productId: 'prod_pottery_02',
        productTitle: 'Terracotta Glazed Water Vessel',
        category: 'Pottery',
        quantity: 4,
        unitPrice: 2800,
        totalAmount: 11200,
        currency: 'INR',
        buyerRegionCode: 'DL',
        buyerRegionName: 'Delhi',
        buyerSector: 'hospitality',
        recordedAt: new Date(now.getTime() - 9 * msInDay).toISOString(),
        source: 'enquiry_order',
      },
      {
        id: 'sale_004',
        ownerId,
        productId: 'prod_basket_03',
        productTitle: 'Natural Fiber Handwoven Basket Set',
        category: 'Handicraft',
        quantity: 6,
        unitPrice: 1850,
        totalAmount: 11100,
        currency: 'INR',
        buyerRegionCode: 'WB',
        buyerRegionName: 'West Bengal',
        buyerSector: 'corporate_gifting',
        recordedAt: new Date(now.getTime() - 14 * msInDay).toISOString(),
        source: 'manual',
      },
      {
        id: 'sale_005',
        ownerId,
        productId: 'prod_jamdani_01',
        productTitle: 'Indigo & Terracotta Silk Jamdani Saree',
        category: 'Textiles',
        quantity: 1,
        unitPrice: 13500,
        totalAmount: 13500,
        currency: 'INR',
        buyerRegionCode: 'TN',
        buyerRegionName: 'Tamil Nadu',
        buyerSector: 'individual',
        recordedAt: new Date(now.getTime() - 21 * msInDay).toISOString(),
        source: 'marketplace',
      },
      {
        id: 'sale_006',
        ownerId,
        productId: 'prod_wood_04',
        productTitle: 'Carved Sheesham Tea Box',
        category: 'Woodcraft',
        quantity: 2,
        unitPrice: 3200,
        totalAmount: 6400,
        currency: 'INR',
        buyerRegionCode: 'GJ',
        buyerRegionName: 'Gujarat',
        buyerSector: 'retailer',
        recordedAt: new Date(now.getTime() - 25 * msInDay).toISOString(),
        source: 'enquiry_order',
      },
    ];

    storage.set(key, demoSales);
  },

  /**
   * Compute Summary 4 Metrics with Truthful Comparisons
   */
  computeSummaryMetrics(
    currentSales: RecordedSale[],
    previousSales: RecordedSale[],
    products: ProductRecord[],
    enquiries: BuyerEnquiry[],
    dateRange: DateRange
  ): DashboardSummaryMetrics {
    // 1. Units Sold (Adjusted for returns)
    const unitsSold = currentSales.reduce((acc, s) => {
      const netQty = Math.max(0, s.quantity - (s.returnedQuantity || 0));
      return acc + netQty;
    }, 0);

    // 2. Recorded Sales Value (Adjusted for refunds)
    const recordedSalesValue = currentSales.reduce((acc, s) => {
      const netAmount = Math.max(0, s.totalAmount - (s.refundedAmount || 0));
      return acc + netAmount;
    }, 0);

    // 3. Live Products (Current snapshot: published or ready)
    const liveProductsCount = products.filter(
      (p) => p.status === 'published' || p.status === 'ready' || (p.status as string) === 'active'
    ).length;

    // 4. New Enquiries (Received in current date range)
    const startMs = new Date(dateRange.startDate).getTime();
    const endMs = new Date(dateRange.endDate).getTime();
    const newEnquiriesCount = enquiries.filter((e) => {
      const enqMs = new Date(e.createdAt || e.receivedAt).getTime();
      return enqMs >= startMs && enqMs <= endMs;
    }).length;

    // Comparisons with previous period
    const prevUnits = previousSales.reduce((acc, s) => acc + Math.max(0, s.quantity - (s.returnedQuantity || 0)), 0);
    const prevValue = previousSales.reduce((acc, s) => acc + Math.max(0, s.totalAmount - (s.refundedAmount || 0)), 0);

    const hasPreviousPeriodData = previousSales.length > 0 && prevUnits > 0;

    let unitsSoldComparisonPercent: number | null = null;
    let salesValueComparisonPercent: number | null = null;

    if (hasPreviousPeriodData) {
      if (prevUnits > 0) {
        unitsSoldComparisonPercent = Math.round(((unitsSold - prevUnits) / prevUnits) * 100);
      }
      if (prevValue > 0) {
        salesValueComparisonPercent = Math.round(((recordedSalesValue - prevValue) / prevValue) * 100);
      }
    }

    return {
      unitsSold,
      recordedSalesValue,
      liveProductsCount,
      newEnquiriesCount,
      unitsSoldComparisonPercent,
      salesValueComparisonPercent,
      hasPreviousPeriodData,
    };
  },

  /**
   * Aggregate daily time buckets for the trend line chart
   */
  computeDailyBuckets(sales: RecordedSale[], dateRange: DateRange): DailySalesBucket[] {
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    const buckets: DailySalesBucket[] = [];

    const cur = new Date(start);
    cur.setHours(0, 0, 0, 0);
    const endDay = new Date(end);
    endDay.setHours(0, 0, 0, 0);

    // Map sales by YYYY-MM-DD
    const map = new Map<string, { value: number; units: number }>();
    for (const s of sales) {
      const dateStr = s.recordedAt.split('T')[0];
      const netQty = Math.max(0, s.quantity - (s.returnedQuantity || 0));
      const netVal = Math.max(0, s.totalAmount - (s.refundedAmount || 0));
      const existing = map.get(dateStr) || { value: 0, units: 0 };
      map.set(dateStr, {
        value: existing.value + netVal,
        units: existing.units + netQty,
      });
    }

    while (cur <= endDay) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const d = String(cur.getDate()).padStart(2, '0');
      const dateKey = `${y}-${m}-${d}`;
      const entry = map.get(dateKey);

      const label = cur.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      buckets.push({
        date: dateKey,
        label,
        salesValue: entry ? entry.value : 0,
        unitsSold: entry ? entry.units : 0,
        hasData: !!entry,
      });

      cur.setDate(cur.getDate() + 1);
    }

    return buckets;
  },

  /**
   * Aggregate sales by buyer state / region
   */
  computeRegionalSales(sales: RecordedSale[], metric: 'units' | 'value' = 'units'): RegionSalesData[] {
    const regionMap = new Map<string, { name: string; units: number; value: number; count: number }>();

    for (const s of sales) {
      const code = s.buyerRegionCode || 'UNKNOWN';
      const name = s.buyerRegionName || (code === 'UNKNOWN' ? 'Unknown destination' : code);
      const netQty = Math.max(0, s.quantity - (s.returnedQuantity || 0));
      const netVal = Math.max(0, s.totalAmount - (s.refundedAmount || 0));

      const existing = regionMap.get(code) || { name, units: 0, value: 0, count: 0 };
      regionMap.set(code, {
        name,
        units: existing.units + netQty,
        value: existing.value + netVal,
        count: existing.count + 1,
      });
    }

    const total = Array.from(regionMap.values()).reduce(
      (acc, r) => acc + (metric === 'units' ? r.units : r.value),
      0
    );

    const result: RegionSalesData[] = [];
    for (const [code, r] of regionMap.entries()) {
      const metricVal = metric === 'units' ? r.units : r.value;
      const share = total > 0 ? Math.round((metricVal / total) * 100) : 0;
      result.push({
        code,
        name: r.name,
        unitsSold: r.units,
        salesValue: r.value,
        orderCount: r.count,
        sharePercent: share,
      });
    }

    return result.sort((a, b) => {
      const valA = metric === 'units' ? a.unitsSold : a.salesValue;
      const valB = metric === 'units' ? b.unitsSold : b.salesValue;
      return valB - valA;
    });
  },

  /**
   * Aggregate sales by product craft category
   */
  computeCategorySales(sales: RecordedSale[], metric: 'units' | 'value' = 'units'): CategorySalesData[] {
    const catMap = new Map<string, { units: number; value: number }>();

    for (const s of sales) {
      const cat = s.category || 'Other / Uncategorized';
      const netQty = Math.max(0, s.quantity - (s.returnedQuantity || 0));
      const netVal = Math.max(0, s.totalAmount - (s.refundedAmount || 0));

      const existing = catMap.get(cat) || { units: 0, value: 0 };
      catMap.set(cat, {
        units: existing.units + netQty,
        value: existing.value + netVal,
      });
    }

    const total = Array.from(catMap.values()).reduce(
      (acc, c) => acc + (metric === 'units' ? c.units : c.value),
      0
    );

    const result: CategorySalesData[] = [];
    for (const [category, c] of catMap.entries()) {
      const metricVal = metric === 'units' ? c.units : c.value;
      const share = total > 0 ? Math.round((metricVal / total) * 100) : 0;
      result.push({
        category,
        unitsSold: c.units,
        salesValue: c.value,
        sharePercent: share,
      });
    }

    return result.sort((a, b) => {
      const valA = metric === 'units' ? a.unitsSold : a.salesValue;
      const valB = metric === 'units' ? b.unitsSold : b.salesValue;
      return valB - valA;
    });
  },

  /**
   * Aggregate sales by buyer sector if recorded
   */
  computeSectorSales(sales: RecordedSale[], metric: 'units' | 'value' = 'units'): SectorSalesData[] {
    const sectorLabels: Record<BuyerSector, string> = {
      individual: 'Individual customers',
      retailer: 'Retailers & Boutiques',
      wholesaler: 'Wholesalers',
      hospitality: 'Hospitality & Decor',
      corporate_gifting: 'Corporate gifting',
      other: 'Other / Unspecified',
    };

    const sectorMap = new Map<BuyerSector, { units: number; value: number }>();

    for (const s of sales) {
      const sec: BuyerSector = s.buyerSector || 'other';
      const netQty = Math.max(0, s.quantity - (s.returnedQuantity || 0));
      const netVal = Math.max(0, s.totalAmount - (s.refundedAmount || 0));

      const existing = sectorMap.get(sec) || { units: 0, value: 0 };
      sectorMap.set(sec, {
        units: existing.units + netQty,
        value: existing.value + netVal,
      });
    }

    const total = Array.from(sectorMap.values()).reduce(
      (acc, s) => acc + (metric === 'units' ? s.units : s.value),
      0
    );

    const result: SectorSalesData[] = [];
    for (const [sector, s] of sectorMap.entries()) {
      const metricVal = metric === 'units' ? s.units : s.value;
      const share = total > 0 ? Math.round((metricVal / total) * 100) : 0;
      result.push({
        sector,
        label: sectorLabels[sector] || sector,
        unitsSold: s.units,
        salesValue: s.value,
        sharePercent: share,
      });
    }

    return result.sort((a, b) => {
      const valA = metric === 'units' ? a.unitsSold : a.salesValue;
      const valB = metric === 'units' ? b.unitsSold : b.salesValue;
      return valB - valA;
    });
  },
};
