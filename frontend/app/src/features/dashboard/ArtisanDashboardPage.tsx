import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { useProductDraft } from '@/app/providers/ProductDraftProvider';
import { useSync } from '@/app/providers/SyncProvider';
import { productRepository, enquiryRepository } from '@/repositories';
import { productRepository as legacyProductRepo } from '@/services/api/productRepository';
import { ProductRecord, draftToProductRecord } from '@/domain/products';
import { BuyerEnquiry } from '@/types';
import {
  RecordedSale,
  DateRange,
  DashboardSummaryMetrics,
  DailySalesBucket,
  RegionSalesData,
  CategorySalesData,
  SectorSalesData,
} from '@/domain/analytics';
import {
  salesService,
  calculateDateRange,
  getPreviousPeriodRange,
} from '@/services/api/salesService';
import { priceHistoryService } from '@/services/api/priceHistoryService';

// Dashboard UI Components
import { DashboardDateSelector } from './components/DashboardDateSelector';
import { DashboardSummaryCards } from './components/DashboardSummaryCards';
import { SalesOverviewChart } from './components/SalesOverviewChart';
import { SalesByRegionMap } from './components/SalesByRegionMap';
import { ProductPriceHistoryChart } from './components/ProductPriceHistoryChart';
import { CategorySectorBreakdownChart } from './components/CategorySectorBreakdownChart';
import { ArtisanEmptySalesState } from './components/ArtisanEmptySalesState';

import {
  Plus,
  Search,
  ArrowUpRight,
  Package,
  AlertTriangle,
  FileEdit,
  RotateCcw,
  CheckCircle2,
  Clock,
  X,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { clsx } from 'clsx';
import { logger } from '@/services/logging/logger';

const LOW_STOCK_THRESHOLD = 2;

type DashboardFilter = 'all' | 'drafts' | 'needs_attention';

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return 'Recently';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently';
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Recently';
  }
}

function getProductThumbnailUrl(product: ProductRecord): string | null {
  if (product.photoPaths && Array.isArray(product.photoPaths) && product.photoPaths.length > 0) {
    const first = product.photoPaths[0];
    if (first && typeof first === 'string' && first.trim().length > 0) {
      return first;
    }
  }

  if (product.thumbnailPath && typeof product.thumbnailPath === 'string' && product.thumbnailPath.trim().length > 0) {
    return product.thumbnailPath;
  }

  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    const primary = product.primaryImageId
      ? product.images.find((img) => img.id === product.primaryImageId)
      : null;
    const img = primary || product.images[0];
    if (img && (img.displayDownloadURL || img.originalDownloadURL)) {
      return img.displayDownloadURL || img.originalDownloadURL || null;
    }
  }

  return null;
}

export const ArtisanDashboardPage: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { resetDraft, loadDraft } = useProductDraft();
  const { syncState, failedCount, retryFailed } = useSync();
  const navigate = useNavigate();

  const ownerId = user?.id || 'artisan_001';
  const [dateRange, setDateRange] = useState<DateRange>(() => calculateDateRange('30d'));

  // Products & Analytics State
  const [products, setProducts] = useState<ProductRecord[]>(() => {
    return legacyProductRepo.listProducts().map((d) => draftToProductRecord(d, ownerId));
  });
  const [enquiries, setEnquiries] = useState<BuyerEnquiry[]>([]);
  const [sales, setSales] = useState<RecordedSale[]>(() => {
    return salesService.listArtisanSalesSync(ownerId, calculateDateRange('30d'));
  });
  const [previousSales, setPreviousSales] = useState<RecordedSale[]>(() => {
    const prevRangeDates = getPreviousPeriodRange(calculateDateRange('30d'));
    const prevRange: DateRange = {
      option: '30d',
      startDate: prevRangeDates.startDate,
      endDate: prevRangeDates.endDate,
      label: 'Previous Period',
    };
    return salesService.listArtisanSalesSync(ownerId, prevRange);
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Filters & State
  const [activeFilter, setActiveFilter] = useState<DashboardFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRetryingUpload, setIsRetryingUpload] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // Fetch all artisan products & enquiries
  const fetchData = useCallback(async () => {
    if (isAuthLoading) return;
    setIsLoading(true);
    // 1. Products
    try {
      const records = await productRepository.listAllArtisanProducts(ownerId);
      if (records && records.length > 0) {
        setProducts(records);
      } else {
        const fallback = legacyProductRepo.listProducts().map((d) => draftToProductRecord(d, ownerId));
        if (fallback.length > 0) {
          setProducts(fallback);
        }
      }
    } catch (err) {
      const fallback = legacyProductRepo.listProducts().map((d) => draftToProductRecord(d, ownerId));
      if (fallback.length > 0) {
        setProducts(fallback);
      }
      logger.warn('FIRESTORE', 'Using fallback data for dashboard', {
        ownerId,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    // 2. Enquiries
    try {
      const enqList = await enquiryRepository.listArtisanEnquiries(ownerId);
      setEnquiries(enqList || []);
    } catch {
      setEnquiries([]);
    }

    // 3. Sales for current and previous period
    try {
      const currentPeriodSales = await salesService.listArtisanSales(ownerId, dateRange);
      setSales(currentPeriodSales || []);

      const prevRangeDates = getPreviousPeriodRange(dateRange);
      const prevRange: DateRange = {
        option: dateRange.option,
        startDate: prevRangeDates.startDate,
        endDate: prevRangeDates.endDate,
        label: 'Previous Period',
      };
      const prevPeriodSales = await salesService.listArtisanSales(ownerId, prevRange);
      setPreviousSales(prevPeriodSales || []);
    } catch {
      setSales([]);
      setPreviousSales([]);
    } finally {
      setIsLoading(false);
    }
  }, [ownerId, isAuthLoading, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Demo Mode Toggle (Strictly isolated demonstration fixture)
  const handleToggleDemoMode = () => {
    if (isDemoMode) {
      setIsDemoMode(false);
      fetchData();
    } else {
      salesService.seedDemoSales(ownerId);
      if (products.length > 0) {
        priceHistoryService.seedDemoPriceHistory(products[0]);
      }
      setIsDemoMode(true);
      fetchData();
    }
  };

  // Operational & Analytics Summary Metrics
  const summaryMetrics: DashboardSummaryMetrics = useMemo(() => {
    return salesService.computeSummaryMetrics(sales, previousSales, products, enquiries, dateRange);
  }, [sales, previousSales, products, enquiries, dateRange]);

  // Inventory count badges
  const inventoryCounts = useMemo(() => {
    const activeProducts = products.filter((p) => p.status !== 'archived');
    const drafts = products.filter((p) => p.status === 'draft');
    const lowStock = activeProducts.filter(
      (p) => typeof p.stockQuantity === 'number' && p.stockQuantity <= LOW_STOCK_THRESHOLD
    );
    const needsAttention = activeProducts.filter(
      (p) =>
        (typeof p.stockQuantity === 'number' && p.stockQuantity <= LOW_STOCK_THRESHOLD) ||
        (p.status === 'draft' && p.needsReviewFacts && p.needsReviewFacts.length > 0)
    );

    return {
      totalActive: activeProducts.length,
      draftCount: drafts.length,
      lowStockCount: lowStock.length,
      needsAttentionCount: needsAttention.length,
    };
  }, [products]);

  // Daily time buckets for Sales Overview Chart
  const dailyBuckets: DailySalesBucket[] = useMemo(() => {
    return salesService.computeDailyBuckets(sales, dateRange);
  }, [sales, dateRange]);

  // Regional distribution for Sales by Region Map
  const regionalSales: RegionSalesData[] = useMemo(() => {
    return salesService.computeRegionalSales(sales);
  }, [sales]);

  // Category and Sector breakdowns
  const categorySales: CategorySalesData[] = useMemo(() => {
    return salesService.computeCategorySales(sales);
  }, [sales]);

  const sectorSales: SectorSalesData[] = useMemo(() => {
    return salesService.computeSectorSales(sales);
  }, [sales]);

  // Resumable draft: most recently updated draft
  const latestDraft = useMemo(() => {
    const draftList = products.filter((p) => p.status === 'draft');
    if (draftList.length === 0) return null;
    return draftList.sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    })[0];
  }, [products]);

  // Filtered & searched product list (up to 8 rows on dashboard)
  const visibleProducts = useMemo(() => {
    let list = products.filter((p) => p.status !== 'archived');

    if (activeFilter === 'drafts') {
      list = list.filter((p) => p.status === 'draft');
    } else if (activeFilter === 'needs_attention') {
      list = list.filter(
        (p) =>
          (typeof p.stockQuantity === 'number' && p.stockQuantity <= LOW_STOCK_THRESHOLD) ||
          (p.status === 'draft' && p.needsReviewFacts && p.needsReviewFacts.length > 0)
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => {
        const titleMatch = (p.title || '').toLowerCase().includes(q);
        const craftMatch = (p.craftType || p.technique || '').toLowerCase().includes(q);
        const categoryMatch = (p.category || '').toLowerCase().includes(q);
        return titleMatch || craftMatch || categoryMatch;
      });
    }

    return list
      .sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      })
      .slice(0, 8);
  }, [products, activeFilter, searchQuery]);

  // Actions
  const handleStartNewProduct = () => {
    resetDraft();
    navigate('/artisan/products/new/photos');
  };

  const handleResumeDraft = async (draftToResume: ProductRecord | null) => {
    if (draftToResume) {
      try {
        await loadDraft(draftToResume.id);
        navigate('/artisan/products/new/photos');
      } catch (err) {
        logger.warn('FIRESTORE', 'Could not load target draft, starting fresh', {
          error: err instanceof Error ? err.message : String(err),
        });
        resetDraft();
        navigate('/artisan/products/new/photos');
      }
    } else {
      resetDraft();
      navigate('/artisan/products/new/photos');
    }
  };

  const handleEditProduct = async (product: ProductRecord) => {
    try {
      await loadDraft(product.id);
      navigate('/artisan/products/new/photos');
    } catch {
      navigate('/artisan/inventory');
    }
  };

  const handleRetryFailedUpload = async () => {
    setIsRetryingUpload(true);
    try {
      await retryFailed();
    } finally {
      setIsRetryingUpload(false);
    }
  };

  const hasFailedUploads = failedCount > 0 || syncState === 'failed';
  const greetingName = user?.name?.trim() || 'Ravi Kumar';
  const hasSalesData = sales.length > 0;

  return (
    <div className="w-full max-w-[1240px] mx-auto flex flex-col gap-6 sm:gap-7 animate-in fade-in duration-200">
      {/* 1. Welcome Header, Date Selector & Primary Action Area */}
      <section
        aria-label="Workshop Welcome Header"
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-1"
      >
        <div className="flex flex-col">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-sans text-2xl sm:text-3xl font-bold text-primary tracking-tight">
              Namaste, {greetingName}
            </h1>
            {isDemoMode && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FFDDB5] text-[#2A1800] border border-[#FFB955]">
                <Sparkles className="w-3 h-3" />
                Demonstration Fixture Data
              </span>
            )}
          </div>
          <p className="text-sm text-on-surface-variant mt-0.5 font-normal">
            Your craft, your customers, your progress. Manage your products, stock and enquiries.
          </p>
        </div>

        {/* Date Selector & Primary Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 self-start lg:self-auto flex-wrap">
          <DashboardDateSelector
            currentRange={dateRange}
            onRangeChange={(newRange) => setDateRange(newRange)}
          />

          {latestDraft && (
            <button
              type="button"
              onClick={() => handleResumeDraft(latestDraft)}
              className="text-sm font-semibold text-secondary hover:text-secondary-hover hover:underline px-2 py-1.5 touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955] rounded-lg"
            >
              Continue draft
            </button>
          )}

          <button
            type="button"
            onClick={handleStartNewProduct}
            className="h-11 sm:h-12 px-5 sm:px-6 bg-secondary hover:bg-secondary-hover text-white font-bold text-sm sm:text-base rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955] shrink-0"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            <span>Add product</span>
          </button>
        </div>
      </section>

      {/* 2. Four Compact Summary Metric Cards */}
      <DashboardSummaryCards metrics={summaryMetrics} />

      {/* 3. Operational Strip (Products / Drafts / Low Stock Filter summary) */}
      <section aria-label="Operational Metrics Summary" className="w-full">
        <div className="bg-white/95 backdrop-blur-xs rounded-2xl border border-surface-variant/80 p-3 sm:p-4 shadow-xs grid grid-cols-3 divide-x divide-surface-variant/70">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={clsx(
              'flex flex-col items-center sm:items-start text-center sm:text-left px-3 sm:px-5 group transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955] rounded-lg',
              activeFilter === 'all' ? 'text-primary' : 'text-on-surface-variant hover:text-primary'
            )}
            aria-label={`View all ${inventoryCounts.totalActive} active products`}
          >
            <span className="text-xl sm:text-2xl font-bold text-primary tracking-tight font-sans">
              {inventoryCounts.totalActive}
            </span>
            <span className="text-xs font-medium text-on-surface-variant mt-0.5">
              {inventoryCounts.totalActive === 1 ? 'Product' : 'Products'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('drafts')}
            className={clsx(
              'flex flex-col items-center sm:items-start text-center sm:text-left px-3 sm:px-5 group transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955] rounded-lg',
              activeFilter === 'drafts' ? 'text-primary' : 'text-on-surface-variant hover:text-primary'
            )}
            aria-label={`View ${inventoryCounts.draftCount} draft listings`}
          >
            <span className="text-xl sm:text-2xl font-bold text-primary tracking-tight font-sans">
              {inventoryCounts.draftCount}
            </span>
            <span className="text-xs font-medium text-on-surface-variant mt-0.5">
              {inventoryCounts.draftCount === 1 ? 'Draft' : 'Drafts'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('needs_attention')}
            className={clsx(
              'flex flex-col items-center sm:items-start text-center sm:text-left px-3 sm:px-5 group transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955] rounded-lg',
              activeFilter === 'needs_attention' ? 'text-amber-900' : 'text-on-surface-variant hover:text-amber-900'
            )}
            aria-label={`View ${inventoryCounts.lowStockCount} low stock items`}
          >
            <span
              className={clsx(
                'text-xl sm:text-2xl font-bold tracking-tight font-sans',
                inventoryCounts.lowStockCount > 0 ? 'text-amber-700' : 'text-primary'
              )}
            >
              {inventoryCounts.lowStockCount}
            </span>
            <span className="text-xs font-medium text-on-surface-variant mt-0.5 flex items-center gap-1">
              Low stock
              {inventoryCounts.lowStockCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 hidden sm:inline-block" />
              )}
            </span>
          </button>
        </div>
      </section>

      {/* 4. Sales Overview & Regional Buyer Discovery Grid (Row 1) */}
      {hasSalesData ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Sales Overview Chart (Approx 7/12 width on desktop) */}
          <div className="lg:col-span-7">
            <SalesOverviewChart buckets={dailyBuckets} />
          </div>

          {/* Regional Discovery Map (Approx 5/12 width on desktop) */}
          <div className="lg:col-span-5">
            <SalesByRegionMap regionalSales={regionalSales} />
          </div>
        </div>
      ) : (
        <ArtisanEmptySalesState onAddProduct={handleStartNewProduct} />
      )}

      {/* 5. Product Price History & Category Breakdown Grid (Row 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Product Price History Step Chart (Approx 7/12 width) */}
        <div className="lg:col-span-7">
          <ProductPriceHistoryChart products={products} />
        </div>

        {/* Craft Category & Sector Breakdown (Approx 5/12 width) */}
        <div className="lg:col-span-5">
          <CategorySectorBreakdownChart
            categories={categorySales}
            sectors={sectorSales}
          />
        </div>
      </div>

      {/* 6. Contextual Notices (Failed upload retry / resumable draft) */}
      {(latestDraft || hasFailedUploads) && (
        <section aria-label="Actionable Workspace Notices" className="flex flex-col gap-2.5">
          {hasFailedUploads && (
            <div className="bg-rose-50/90 border border-rose-200 text-rose-950 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-rose-950">
                    Photograph upload incomplete
                  </span>
                  <span className="text-xs text-rose-800">
                    {failedCount > 0 ? `${failedCount} file(s) pending sync.` : 'Connection interrupted during upload.'} Your authentic original photo is safely stored.
                  </span>
                </div>
              </div>

              <button
                onClick={handleRetryFailedUpload}
                disabled={isRetryingUpload}
                className="self-end sm:self-center px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50"
              >
                {isRetryingUpload ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" />
                )}
                <span>Retry Upload</span>
              </button>
            </div>
          )}

          {latestDraft && !hasFailedUploads && (
            <div className="bg-[#FFF9F2] border border-[#EEDCC7] text-primary rounded-xl px-4 py-3.5 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                  <FileEdit className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-on-surface-variant font-medium">
                      Continue your latest draft:
                    </span>
                    <span className="text-sm font-bold text-primary truncate max-w-[280px] sm:max-w-[400px]">
                      {latestDraft.title || 'Untitled product'}
                    </span>
                  </div>
                  <span className="text-xs text-on-surface-variant">
                    Edited {formatRelativeTime(latestDraft.updatedAt || latestDraft.createdAt)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {inventoryCounts.draftCount > 1 && (
                  <Link
                    to="/artisan/inventory?tab=draft"
                    className="text-xs font-semibold text-on-surface-variant hover:text-primary px-2.5 py-1.5 rounded-md hover:bg-black/5 transition-colors"
                  >
                    View drafts ({inventoryCounts.draftCount})
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => handleResumeDraft(latestDraft)}
                  className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg transition-colors touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955]"
                >
                  Continue
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* 7. Main "Your products" Inventory Workspace Panel */}
      <section aria-label="Product Catalogue Workspace" className="w-full">
        <div className="bg-white rounded-2xl border border-surface-variant/80 shadow-xs overflow-hidden flex flex-col">
          {/* Panel Header */}
          <div className="p-5 sm:p-6 border-b border-surface-variant/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
            <div className="flex items-baseline gap-2.5">
              <h2 className="text-lg sm:text-xl font-bold text-primary tracking-tight">
                Your products
              </h2>
              <span className="text-xs sm:text-sm text-on-surface-variant font-medium">
                ({inventoryCounts.totalActive} {inventoryCounts.totalActive === 1 ? 'product' : 'products'})
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Test / Demo Fixture Toggle */}
              <button
                type="button"
                onClick={handleToggleDemoMode}
                className="text-[11px] font-semibold text-on-surface-variant hover:text-primary px-2 py-1 rounded-md border border-surface-variant/60 hover:bg-surface-container-low"
              >
                {isDemoMode ? 'Reset to live data' : 'Demo populated data'}
              </button>

              <Link
                to="/artisan/inventory"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-secondary hover:text-secondary-hover hover:underline transition-colors self-start sm:self-auto touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955] rounded-md px-1 py-0.5"
              >
                <span>View inventory</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Search & Compact Filter Segmented Controls */}
          <div className="px-4 sm:px-6 py-3 bg-surface-container-low/40 border-b border-surface-variant/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:max-w-md">
              <Search className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by title, craft, category..."
                className="w-full bg-white border border-surface-variant/80 rounded-xl pl-9 pr-8 py-2 text-sm text-primary placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all"
                aria-label="Search products"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search input"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant hover:text-primary rounded-full hover:bg-surface-container"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Segmented Filter Tabs */}
            <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl border border-surface-variant/60 self-start md:self-auto overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955]',
                  activeFilter === 'all'
                    ? 'bg-white text-primary shadow-xs font-bold'
                    : 'text-on-surface-variant hover:text-primary'
                )}
              >
                All ({inventoryCounts.totalActive})
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('drafts')}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955]',
                  activeFilter === 'drafts'
                    ? 'bg-white text-primary shadow-xs font-bold'
                    : 'text-on-surface-variant hover:text-primary'
                )}
              >
                Drafts ({inventoryCounts.draftCount})
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('needs_attention')}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955] flex items-center gap-1.5',
                  activeFilter === 'needs_attention'
                    ? 'bg-white text-amber-900 shadow-xs font-bold'
                    : 'text-on-surface-variant hover:text-amber-900'
                )}
              >
                Needs attention ({inventoryCounts.needsAttentionCount})
                {inventoryCounts.needsAttentionCount > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                )}
              </button>
            </div>
          </div>

          {/* Desktop Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-2.5 bg-surface-container-low/70 text-xs font-semibold text-on-surface-variant uppercase tracking-wider border-b border-surface-variant/40">
            <span className="col-span-5">Product</span>
            <span className="col-span-2">Price</span>
            <span className="col-span-2">Stock</span>
            <span className="col-span-2">Listing status</span>
            <span className="col-span-1 text-right">Action</span>
          </div>

          {/* Product List Content */}
          <div className="flex flex-col divide-y divide-surface-variant/40">
            {isLoading && products.length === 0 ? (
              /* Loading Skeletons */
              <div className="p-6 flex flex-col gap-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex items-center gap-4 animate-pulse">
                    <div className="w-14 h-14 bg-surface-container rounded-xl shrink-0" />
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="w-1/3 h-4 bg-surface-container rounded-md" />
                      <div className="w-1/4 h-3 bg-surface-container-low rounded-md" />
                    </div>
                    <div className="w-20 h-4 bg-surface-container rounded-md hidden md:block" />
                    <div className="w-20 h-4 bg-surface-container rounded-md hidden md:block" />
                  </div>
                ))}
              </div>
            ) : visibleProducts.length === 0 ? (
              /* Empty States */
              <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center gap-3">
                {searchQuery ? (
                  <>
                    <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
                      <Search className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-primary">No products match your search</h3>
                    <p className="text-xs sm:text-sm text-on-surface-variant max-w-sm">
                      Try searching with a different craft technique, material, or clear your query.
                    </p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-2 text-xs font-bold text-secondary hover:underline px-3 py-1.5"
                    >
                      Clear search
                    </button>
                  </>
                ) : activeFilter !== 'all' ? (
                  <>
                    <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
                      <Package className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-primary">
                      No {activeFilter === 'drafts' ? 'drafts' : 'items needing attention'} recorded
                    </h3>
                    <p className="text-xs sm:text-sm text-on-surface-variant max-w-sm">
                      All your craft listings are active and in healthy stock.
                    </p>
                    <button
                      onClick={() => setActiveFilter('all')}
                      className="mt-2 text-xs font-bold text-secondary hover:underline px-3 py-1.5"
                    >
                      View all products
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                      <Package className="w-6 h-6" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-primary">
                      Your first product starts here.
                    </h3>
                    <p className="text-xs sm:text-sm text-on-surface-variant max-w-md">
                      Add a photo and a few details to create your catalogue and generate verifiable Craft Passports.
                    </p>
                    <button
                      onClick={handleStartNewProduct}
                      className="mt-2 px-5 py-2.5 bg-secondary hover:bg-secondary-hover text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors"
                    >
                      Add your first product
                    </button>
                  </>
                )}
              </div>
            ) : (
              /* Structured Product Rows */
              visibleProducts.map((product) => {
                const thumbnailUrl = getProductThumbnailUrl(product);
                const isLow =
                  typeof product.stockQuantity === 'number' &&
                  product.stockQuantity <= LOW_STOCK_THRESHOLD;
                const formattedPrice =
                  typeof product.price === 'number' && product.price > 0
                    ? `₹${product.price.toLocaleString('en-IN')}`
                    : '—';
                const craftSubtitle =
                  product.craftType || product.category || 'Handloom Craft';
                const locationText = product.state || product.origin || '';

                return (
                  <div
                    key={product.id}
                    className="p-4 sm:p-5 hover:bg-[#FAF8F5] transition-colors group flex flex-col md:grid md:grid-cols-12 gap-3.5 md:gap-4 md:items-center"
                  >
                    {/* Product Cell (Thumbnail + Title + Craft) */}
                    <div className="col-span-5 flex items-center gap-3.5 min-w-0">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-surface-container border border-surface-variant/70 shrink-0 flex items-center justify-center">
                        {thumbnailUrl ? (
                          <img
                            src={thumbnailUrl}
                            alt={product.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-on-surface-variant/40" />
                        )}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <button
                          type="button"
                          onClick={() => handleEditProduct(product)}
                          className="text-left font-semibold text-sm sm:text-base text-primary group-hover:text-secondary transition-colors truncate focus:outline-none focus-visible:underline"
                        >
                          {product.title || 'Untitled Craft'}
                        </button>
                        <span className="text-xs text-on-surface-variant truncate mt-0.5">
                          {craftSubtitle}
                          {locationText ? ` • ${locationText}` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Mobile Metas Row */}
                    <div className="flex md:hidden items-center justify-between pt-1 border-t border-surface-variant/30 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-primary text-sm">{formattedPrice}</span>
                        <span
                          className={clsx(
                            'font-medium',
                            isLow ? 'text-amber-700 font-bold' : 'text-on-surface-variant'
                          )}
                        >
                          {product.stockQuantity ?? 0} units
                          {isLow && ' (Low stock)'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <StatusBadge status={product.status} />
                        <button
                          type="button"
                          onClick={() => handleEditProduct(product)}
                          className="px-3 py-1 bg-white border border-surface-variant rounded-lg text-xs font-bold text-primary hover:border-primary transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    </div>

                    {/* Desktop Columns */}
                    <div className="hidden md:block col-span-2 text-sm font-bold text-primary font-sans">
                      {formattedPrice}
                    </div>

                    <div className="hidden md:flex col-span-2 items-center gap-1.5 text-xs text-primary">
                      <span className={clsx('font-medium', isLow && 'text-amber-800 font-bold')}>
                        {product.stockQuantity ?? 0} units
                      </span>
                      {isLow && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <AlertTriangle className="w-2.5 h-2.5" /> Low
                        </span>
                      )}
                    </div>

                    <div className="hidden md:block col-span-2">
                      <StatusBadge status={product.status} />
                    </div>

                    <div className="hidden md:flex col-span-1 justify-end items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditProduct(product)}
                        className="px-3 py-1.5 bg-white hover:bg-surface-container-low border border-surface-variant hover:border-primary rounded-lg text-xs font-bold text-primary transition-colors touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955]"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

interface StatusBadgeProps {
  status: ProductRecord['status'];
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'ready':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200 select-none">
          <CheckCircle2 className="w-3 h-3 text-blue-600" />
          <span>Ready</span>
        </span>
      );
    case 'published':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          <span>Published</span>
        </span>
      );
    case 'archived':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-600 border border-stone-200 select-none">
          <span>Archived</span>
        </span>
      );
    case 'draft':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-container-high text-on-surface-variant border border-surface-variant/70 select-none">
          <Clock className="w-3 h-3 text-on-surface-variant/70" />
          <span>Draft</span>
        </span>
      );
  }
};
