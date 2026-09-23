import React, { useState, useMemo } from 'react';
import { CategorySalesData, SectorSalesData } from '@/domain/analytics';
import { Package, IndianRupee } from 'lucide-react';
import { clsx } from 'clsx';

export interface CategorySectorBreakdownChartProps {
  categories: CategorySalesData[];
  sectors?: SectorSalesData[];
  currencySymbol?: string;
}

function formatINR(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(val);
}

export const CategorySectorBreakdownChart: React.FC<CategorySectorBreakdownChartProps> = ({
  categories,
  sectors = [],
  currencySymbol = '₹',
}) => {
  // If sector data is populated, default to categories but allow switching or render categories
  const hasSectorData = useMemo(() => sectors.some((s) => s.unitsSold > 0), [sectors]);
  const [viewType, setViewType] = useState<'categories' | 'sectors'>(() => (hasSectorData ? 'categories' : 'categories'));
  const [metric, setMetric] = useState<'units' | 'value'>('units');

  const activeData = useMemo(() => {
    if (viewType === 'sectors' && hasSectorData) {
      return sectors.map((s) => ({
        label: s.label,
        unitsSold: s.unitsSold,
        salesValue: s.salesValue,
        sharePercent: s.sharePercent,
      }));
    }
    return categories.map((c) => ({
      label: c.category,
      unitsSold: c.unitsSold,
      salesValue: c.salesValue,
      sharePercent: c.sharePercent,
    }));
  }, [viewType, hasSectorData, sectors, categories]);

  const totalUnits = useMemo(() => activeData.reduce((acc, d) => acc + d.unitsSold, 0), [activeData]);
  const totalValue = useMemo(() => activeData.reduce((acc, d) => acc + d.salesValue, 0), [activeData]);

  return (
    <div className="analytics-module-card flex flex-col justify-between gap-5 h-full">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#001D36]/8">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-primary tracking-tight">
            {viewType === 'sectors' ? 'Buyer sectors' : 'Sales by craft category'}
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {viewType === 'sectors'
              ? 'Distribution across customer and business types'
              : 'Performance across product craft disciplines'}
          </p>
        </div>

        {/* View & Metric Switchers */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {hasSectorData && (
            <div
              role="group"
              aria-label="Toggle breakdown mode"
              className="inline-flex items-center bg-surface-container-low/70 p-1 rounded-xl border border-surface-variant/60"
            >
              <button
                type="button"
                onClick={() => setViewType('categories')}
                className={clsx(
                  'px-2.5 py-1 text-xs font-semibold rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955]',
                  viewType === 'categories' ? 'bg-primary text-white shadow-xs' : 'text-on-surface-variant'
                )}
              >
                Crafts
              </button>
              <button
                type="button"
                onClick={() => setViewType('sectors')}
                className={clsx(
                  'px-2.5 py-1 text-xs font-semibold rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955]',
                  viewType === 'sectors' ? 'bg-primary text-white shadow-xs' : 'text-on-surface-variant'
                )}
              >
                Sectors
              </button>
            </div>
          )}

          {/* Metric Toggle */}
          <div
            role="group"
            aria-label="Select breakdown metric"
            className="inline-flex items-center bg-surface-container-low/70 p-1 rounded-xl border border-surface-variant/60"
          >
            <button
              type="button"
              onClick={() => setMetric('units')}
              aria-pressed={metric === 'units'}
              className={clsx(
                'p-1 text-xs font-semibold rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955]',
                metric === 'units' ? 'bg-primary text-white shadow-xs' : 'text-on-surface-variant'
              )}
              title="Units sold"
            >
              <Package className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setMetric('value')}
              aria-pressed={metric === 'value'}
              className={clsx(
                'p-1 text-xs font-semibold rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955]',
                metric === 'value' ? 'bg-primary text-white shadow-xs' : 'text-on-surface-variant'
              )}
              title="Sales value"
            >
              <IndianRupee className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Bar Items */}
      <div className="flex flex-col gap-3">
        {activeData.length > 0 ? (
          activeData.map((item, idx) => {
            const metricVal = metric === 'units' ? item.unitsSold : item.salesValue;
            const maxVal = Math.max(...activeData.map((d) => (metric === 'units' ? d.unitsSold : d.salesValue)), 1);
            const barWidthPercent = Math.max(8, Math.round((metricVal / maxVal) * 100));

            return (
              <div key={idx} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-primary truncate max-w-[200px]">
                    {item.label}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-primary">
                      {metric === 'units' ? `${item.unitsSold} units` : `${currencySymbol}${formatINR(item.salesValue)}`}
                    </span>
                    <span className="text-[10px] text-on-surface-variant/75 w-8 text-right font-medium">
                      {item.sharePercent}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar Container */}
                <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="h-full bg-secondary rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${barWidthPercent}%` }}
                    role="progressbar"
                    aria-valuenow={item.sharePercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${item.label}: ${item.sharePercent}% of total`}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-6 text-center text-xs text-on-surface-variant bg-[#FFF9EF]/80 rounded-xl border border-[#001D36]/8 my-auto">
            No craft category sales recorded in this period.
          </div>
        )}
      </div>

      {/* Footer Total */}
      <div className="pt-3 border-t border-[#001D36]/8 flex items-center justify-between text-xs text-on-surface-variant">
        <span>Total accounting:</span>
        <span className="font-bold text-primary font-sans">
          {totalUnits} units ({currencySymbol}{formatINR(totalValue)})
        </span>
      </div>
    </div>
  );
};
