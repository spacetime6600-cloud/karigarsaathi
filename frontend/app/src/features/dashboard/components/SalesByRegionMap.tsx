import React, { useState, useMemo, useId } from 'react';
import { RegionSalesData } from '@/domain/analytics';
import { VERIFIED_INDIA_MAP_PATHS } from '@/data/indiaMapPaths';
import { MapPin, RotateCcw, Package, IndianRupee } from 'lucide-react';
import { clsx } from 'clsx';

export interface SalesByRegionMapProps {
  regionalSales: RegionSalesData[];
  currencySymbol?: string;
}

function formatINR(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(val);
}

export const SalesByRegionMap: React.FC<SalesByRegionMapProps> = ({
  regionalSales,
  currencySymbol = '₹',
}) => {
  const [metric, setMetric] = useState<'units' | 'value'>('units');
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const tooltipId = useId();

  // Create lookup map for fast code access
  const salesByCode = useMemo(() => {
    const map = new Map<string, RegionSalesData>();
    for (const r of regionalSales) {
      map.set(r.code, r);
    }
    return map;
  }, [regionalSales]);

  // Max value for color scaling
  const maxMetricValue = useMemo(() => {
    const values = regionalSales.map((r) => (metric === 'units' ? r.unitsSold : r.salesValue));
    return Math.max(...values, 1);
  }, [regionalSales, metric]);

  // Color generator for map regions based on intensity
  const getRegionFillColor = (code: string, isSelected: boolean, isHovered: boolean) => {
    if (isSelected) return '#A13F1C'; // Terracotta selection
    if (isHovered) return '#819ABA';

    const data = salesByCode.get(code);
    if (!data || (data.unitsSold === 0 && data.salesValue === 0)) {
      return '#EDF4FF'; // Zero sales: quiet muted surface
    }

    const val = metric === 'units' ? data.unitsSold : data.salesValue;
    const ratio = Math.min(1, Math.max(0.2, val / maxMetricValue));

    // Gradient from powder blue #AFC9EA to deep indigo #001D36
    if (ratio < 0.35) return '#AFC9EA';
    if (ratio < 0.7) return '#47607E';
    return '#17324D';
  };

  const activeRegion = (hoveredCode && salesByCode.get(hoveredCode)) ||
                       (selectedCode && salesByCode.get(selectedCode)) ||
                       null;

  const totalUnits = useMemo(() => regionalSales.reduce((acc, r) => acc + r.unitsSold, 0), [regionalSales]);
  const totalValue = useMemo(() => regionalSales.reduce((acc, r) => acc + r.salesValue, 0), [regionalSales]);

  // Top regions ranking (top 4 states + others/unknown)
  const topRegions = useMemo(() => {
    return regionalSales.slice(0, 4);
  }, [regionalSales]);

  const unknownDestinations = useMemo(() => {
    return regionalSales.find((r) => r.code === 'UNKNOWN');
  }, [regionalSales]);

  return (
    <div className="bg-white rounded-2xl border border-surface-variant/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between gap-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-surface-variant/40">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-primary tracking-tight">
            Where your buyers are
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Regional distribution across Indian states & UTs
          </p>
        </div>

        {/* Metric Switcher */}
        <div
          role="group"
          aria-label="Select regional metric"
          className="inline-flex items-center bg-surface-container-low/70 p-1 rounded-xl border border-surface-variant/60 self-start sm:self-auto"
        >
          <button
            type="button"
            onClick={() => setMetric('units')}
            aria-pressed={metric === 'units'}
            className={clsx(
              'flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955]',
              metric === 'units'
                ? 'bg-primary text-white shadow-xs'
                : 'text-on-surface-variant hover:text-primary'
            )}
          >
            <Package className="w-3 h-3" />
            <span>Units</span>
          </button>

          <button
            type="button"
            onClick={() => setMetric('value')}
            aria-pressed={metric === 'value'}
            className={clsx(
              'flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955]',
              metric === 'value'
                ? 'bg-primary text-white shadow-xs'
                : 'text-on-surface-variant hover:text-primary'
            )}
          >
            <IndianRupee className="w-3 h-3" />
            <span>Value</span>
          </button>
        </div>
      </div>

      {/* Map & Ranking Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* SVG India Map (7 cols on tablet/desktop) */}
        <div className="md:col-span-7 relative flex items-center justify-center p-1 bg-surface-container-lowest rounded-xl">
          <svg
            viewBox="0 0 650 650"
            className="w-full max-w-[280px] sm:max-w-[320px] h-auto overflow-visible select-none"
            role="region"
            aria-label="Interactive India buyer sales map"
          >
            <g>
              {VERIFIED_INDIA_MAP_PATHS.map((region) => {
                const isSelected = selectedCode === region.code;
                const isHovered = hoveredCode === region.code;
                const fillColor = getRegionFillColor(region.code, isSelected, isHovered);
                const salesData = salesByCode.get(region.code);

                return (
                  <path
                    key={region.code}
                    d={region.d}
                    fill={fillColor}
                    stroke={isSelected ? '#A13F1C' : '#001D36'}
                    strokeWidth={isSelected ? '2' : '0.65'}
                    strokeLinejoin="round"
                    className="cursor-pointer transition-colors duration-150 focus:outline-none"
                    tabIndex={0}
                    role="button"
                    aria-label={`${region.name}: ${salesData ? `${salesData.unitsSold} units, ${currencySymbol}${formatINR(salesData.salesValue)}` : 'No recorded sales'}`}
                    onMouseEnter={() => setHoveredCode(region.code)}
                    onMouseLeave={() => setHoveredCode(null)}
                    onClick={() => setSelectedCode(selectedCode === region.code ? null : region.code)}
                    onFocus={() => setHoveredCode(region.code)}
                    onBlur={() => setHoveredCode(null)}
                  />
                );
              })}
            </g>
          </svg>

          {/* Map Tooltip Overlay */}
          {activeRegion && (
            <div
              id={tooltipId}
              className="absolute bottom-2 left-2 z-20 bg-primary/95 text-white text-xs rounded-xl px-3 py-2 shadow-lg border border-white/20 pointer-events-none animate-in fade-in duration-150 max-w-[200px]"
            >
              <div className="flex items-center gap-1 font-bold text-[12px] text-white">
                <MapPin className="w-3.5 h-3.5 text-[#FFB955] shrink-0" />
                <span className="truncate">{activeRegion.name}</span>
              </div>
              <div className="flex items-center justify-between gap-3 pt-1 text-[11px] text-white/90">
                <span>{activeRegion.unitsSold} units</span>
                <span className="font-semibold text-[#FFB955]">
                  {currencySymbol}{formatINR(activeRegion.salesValue)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Regional Ranking List (5 cols) */}
        <div className="md:col-span-5 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-primary">
            <span>Top Buyer Destinations</span>
            {selectedCode && (
              <button
                type="button"
                onClick={() => setSelectedCode(null)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-secondary hover:underline"
              >
                <RotateCcw className="w-3 h-3" />
                <span>All regions</span>
              </button>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            {topRegions.length > 0 ? (
              topRegions.map((r, idx) => {
                const isSelected = selectedCode === r.code;
                return (
                  <button
                    key={r.code}
                    type="button"
                    onClick={() => setSelectedCode(isSelected ? null : r.code)}
                    className={clsx(
                      'flex items-center justify-between p-2 rounded-xl text-xs transition-all text-left border focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955]',
                      isSelected
                        ? 'bg-secondary/10 border-secondary text-primary font-bold shadow-2xs'
                        : 'bg-surface hover:bg-surface-container border-surface-variant/40 text-on-surface-variant'
                    )}
                  >
                    <div className="flex items-center gap-2 truncate min-w-0">
                      <span className="w-4 text-[11px] font-bold text-on-surface-variant/60">
                        0{idx + 1}
                      </span>
                      <span className="truncate text-primary font-medium">{r.name}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-bold text-primary">
                        {metric === 'units' ? `${r.unitsSold} units` : `${currencySymbol}${formatINR(r.salesValue)}`}
                      </span>
                      <span className="text-[10px] text-on-surface-variant/70 bg-white px-1.5 py-0.5 rounded-md border border-surface-variant/40">
                        {r.sharePercent}%
                      </span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-on-surface-variant bg-surface rounded-xl border border-surface-variant/40">
                No recorded regional buyer destinations in this period.
              </div>
            )}

            {/* Unknown or Outside-India destinations accounting */}
            {unknownDestinations && unknownDestinations.unitsSold > 0 && (
              <div className="flex items-center justify-between p-2 rounded-xl text-[11px] bg-surface-container-low/50 text-on-surface-variant border border-dashed border-surface-variant/60">
                <span>Location unspecified</span>
                <span className="font-semibold text-primary">
                  {metric === 'units'
                    ? `${unknownDestinations.unitsSold} units`
                    : `${currencySymbol}${formatINR(unknownDestinations.salesValue)}`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend & Summary */}
      <div className="pt-2 border-t border-surface-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-on-surface-variant">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="font-semibold text-primary">Map key:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#EDF4FF] border border-[#001D36]/20" />
            <span className="text-[10px]">0</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#AFC9EA] border border-[#001D36]/20" />
            <span className="text-[10px]">Moderate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#17324D] border border-[#001D36]/20" />
            <span className="text-[10px]">Highest</span>
          </div>
        </div>

        <span className="text-[11px]">
          Total: <strong className="text-primary font-bold">{totalUnits}</strong> units ({currencySymbol}{formatINR(totalValue)})
        </span>
      </div>
    </div>
  );
};
