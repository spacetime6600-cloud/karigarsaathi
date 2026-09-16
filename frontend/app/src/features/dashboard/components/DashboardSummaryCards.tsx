import React from 'react';
import { Link } from 'react-router-dom';
import { DashboardSummaryMetrics } from '@/domain/analytics';
import { Package, IndianRupee, Globe2, MessageSquare, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface DashboardSummaryCardsProps {
  metrics: DashboardSummaryMetrics;
  currencySymbol?: string;
}

function formatINR(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(val);
}

export const DashboardSummaryCards: React.FC<DashboardSummaryCardsProps> = ({
  metrics,
  currencySymbol = '₹',
}) => {
  return (
    <section aria-label="Summary Performance Metrics" className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Metric 1: Units sold */}
        <div className="bg-white/95 backdrop-blur-xs rounded-2xl border border-surface-variant/80 p-5 shadow-xs flex flex-col justify-between gap-3 transition-all hover:border-primary/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant tracking-wide">
              Units sold
            </span>
            <div className="w-8 h-8 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
              <Package className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-2xl sm:text-3xl font-bold text-primary tracking-tight font-sans">
              {metrics.unitsSold}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-on-surface-variant">
              {metrics.hasPreviousPeriodData && metrics.unitsSoldComparisonPercent !== null ? (
                <>
                  {metrics.unitsSoldComparisonPercent > 0 ? (
                    <span className="inline-flex items-center text-success font-semibold">
                      <TrendingUp className="w-3 h-3 mr-0.5" />
                      +{metrics.unitsSoldComparisonPercent}%
                    </span>
                  ) : metrics.unitsSoldComparisonPercent < 0 ? (
                    <span className="inline-flex items-center text-error font-semibold">
                      <TrendingDown className="w-3 h-3 mr-0.5" />
                      {metrics.unitsSoldComparisonPercent}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-on-surface-variant font-semibold">
                      <Minus className="w-3 h-3 mr-0.5" />
                      0%
                    </span>
                  )}
                  <span>vs prev 30 days</span>
                </>
              ) : (
                <span className="text-on-surface-variant/75">No previous-period comparison</span>
              )}
            </div>
          </div>
        </div>

        {/* Metric 2: Recorded sales value */}
        <div className="bg-white/95 backdrop-blur-xs rounded-2xl border border-surface-variant/80 p-5 shadow-xs flex flex-col justify-between gap-3 transition-all hover:border-primary/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant tracking-wide">
              Recorded sales value
            </span>
            <div className="w-8 h-8 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
              <IndianRupee className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-2xl sm:text-3xl font-bold text-primary tracking-tight font-sans">
              {currencySymbol}{formatINR(metrics.recordedSalesValue)}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-on-surface-variant">
              {metrics.hasPreviousPeriodData && metrics.salesValueComparisonPercent !== null ? (
                <>
                  {metrics.salesValueComparisonPercent > 0 ? (
                    <span className="inline-flex items-center text-success font-semibold">
                      <TrendingUp className="w-3 h-3 mr-0.5" />
                      +{metrics.salesValueComparisonPercent}%
                    </span>
                  ) : metrics.salesValueComparisonPercent < 0 ? (
                    <span className="inline-flex items-center text-error font-semibold">
                      <TrendingDown className="w-3 h-3 mr-0.5" />
                      {metrics.salesValueComparisonPercent}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-on-surface-variant font-semibold">
                      <Minus className="w-3 h-3 mr-0.5" />
                      0%
                    </span>
                  )}
                  <span>vs prev 30 days</span>
                </>
              ) : (
                <span className="text-on-surface-variant/75">No previous-period comparison</span>
              )}
            </div>
          </div>
        </div>

        {/* Metric 3: Live products */}
        <div className="bg-white/95 backdrop-blur-xs rounded-2xl border border-surface-variant/80 p-5 shadow-xs flex flex-col justify-between gap-3 transition-all hover:border-primary/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant tracking-wide">
              Live products
            </span>
            <div className="w-8 h-8 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
              <Globe2 className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-2xl sm:text-3xl font-bold text-primary tracking-tight font-sans">
              {metrics.liveProductsCount}
            </span>
            <div className="text-[11px] font-medium text-on-surface-variant/80">
              <span>Current inventory snapshot</span>
            </div>
          </div>
        </div>

        {/* Metric 4: New enquiries */}
        <Link
          to="/artisan/enquiries"
          className="bg-white/95 backdrop-blur-xs rounded-2xl border border-surface-variant/80 p-5 shadow-xs flex flex-col justify-between gap-3 transition-all hover:border-secondary/40 hover:shadow-md active:scale-[0.99] group focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary touch-target block cursor-pointer"
          aria-label={`View ${metrics.newEnquiriesCount} new buyer enquiries`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant tracking-wide group-hover:text-primary transition-colors">
              New enquiries
            </span>
            <div className="w-8 h-8 rounded-xl bg-secondary/10 text-secondary group-hover:bg-secondary group-hover:text-white transition-colors flex items-center justify-center">
              <MessageSquare className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-2xl sm:text-3xl font-bold text-primary tracking-tight font-sans">
              {metrics.newEnquiriesCount}
            </span>
            <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-on-surface-variant/80">
              <span className="truncate">
                {metrics.newEnquiriesCount === 0
                  ? 'No unread enquiries'
                  : metrics.newEnquiriesCount === 1
                  ? '1 unread enquiry'
                  : `${metrics.newEnquiriesCount} unread enquiries`}
              </span>
              <span className="text-secondary font-bold shrink-0 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                View &rarr;
              </span>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
};
