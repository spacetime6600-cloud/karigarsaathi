import React, { useState, useMemo, useRef } from 'react';
import { DailySalesBucket } from '@/domain/analytics';
import { IndianRupee, Package, Calendar } from 'lucide-react';
import { clsx } from 'clsx';

export interface SalesOverviewChartProps {
  buckets: DailySalesBucket[];
  currencySymbol?: string;
}

function formatINR(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(val);
}

export const SalesOverviewChart: React.FC<SalesOverviewChartProps> = ({
  buckets,
  currencySymbol = '₹',
}) => {
  const [metricType, setMetricType] = useState<'value' | 'units'>('value');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const chartRef = useRef<SVGSVGElement>(null);

  const totalUnits = useMemo(() => buckets.reduce((acc, b) => acc + b.unitsSold, 0), [buckets]);
  const totalValue = useMemo(() => buckets.reduce((acc, b) => acc + b.salesValue, 0), [buckets]);

  // Chart dimensions & scaling
  const width = 640;
  const height = 220;
  const padding = { top: 20, right: 24, bottom: 35, left: 50 };

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const dataValues = useMemo(() => {
    return buckets.map((b) => (metricType === 'value' ? b.salesValue : b.unitsSold));
  }, [buckets, metricType]);

  const maxValue = useMemo(() => {
    const max = Math.max(...dataValues, 1);
    // Add 15% headroom
    return Math.ceil(max * 1.15);
  }, [dataValues]);

  // Generate SVG coordinates
  const points = useMemo(() => {
    if (buckets.length === 0) return [];
    if (buckets.length === 1) {
      return [{ x: padding.left + innerWidth / 2, y: padding.top + innerHeight / 2, index: 0 }];
    }

    const step = innerWidth / (buckets.length - 1);
    return buckets.map((b, i) => {
      const val = metricType === 'value' ? b.salesValue : b.unitsSold;
      const x = padding.left + i * step;
      const y = padding.top + innerHeight - (val / maxValue) * innerHeight;
      return { x, y, index: i };
    });
  }, [buckets, metricType, maxValue, innerWidth, innerHeight, padding.left, padding.top]);

  // Build SVG Path strings
  const { linePath, areaPath } = useMemo(() => {
    if (points.length === 0) return { linePath: '', areaPath: '' };
    if (points.length === 1) {
      const p = points[0];
      return {
        linePath: `M ${p.x - 10} ${p.y} L ${p.x + 10} ${p.y}`,
        areaPath: `M ${p.x - 10} ${p.y} L ${p.x + 10} ${p.y} L ${p.x + 10} ${padding.top + innerHeight} L ${p.x - 10} ${padding.top + innerHeight} Z`,
      };
    }

    const line = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    const bottomY = padding.top + innerHeight;
    const area = `${line} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;

    return { linePath: line, areaPath: area };
  }, [points, padding.top, innerHeight]);

  // Y-axis grid ticks (4 ticks)
  const yTicks = useMemo(() => {
    const ticks = [];
    const count = 4;
    for (let i = 0; i <= count; i++) {
      const val = Math.round((maxValue / count) * i);
      const y = padding.top + innerHeight - (val / maxValue) * innerHeight;
      ticks.push({ val, y });
    }
    return ticks;
  }, [maxValue, innerHeight, padding.top]);

  // X-axis label indices (e.g. 4-5 spaced points)
  const xLabelIndices = useMemo(() => {
    if (buckets.length <= 5) return buckets.map((_, i) => i);
    const step = Math.floor((buckets.length - 1) / 4);
    const indices = [0, step, step * 2, step * 3, buckets.length - 1];
    return Array.from(new Set(indices));
  }, [buckets]);

  const activeBucket = activeIndex !== null ? buckets[activeIndex] : null;
  const activePoint = activeIndex !== null ? points[activeIndex] : null;

  return (
    <div className="bg-white rounded-2xl border border-surface-variant/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between gap-4">
      {/* Header & Metric Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-surface-variant/40">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-primary tracking-tight">
            Sales overview
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Confirmed sales performance (Last 30 days)
          </p>
        </div>

        {/* Metric Switcher */}
        <div
          role="group"
          aria-label="Select sales chart metric"
          className="inline-flex items-center bg-surface-container-low/70 p-1 rounded-xl border border-surface-variant/60 self-start sm:self-auto"
        >
          <button
            type="button"
            onClick={() => setMetricType('value')}
            aria-pressed={metricType === 'value'}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955]',
              metricType === 'value'
                ? 'bg-primary text-white shadow-xs'
                : 'text-on-surface-variant hover:text-primary'
            )}
          >
            <IndianRupee className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Sales value</span>
          </button>

          <button
            type="button"
            onClick={() => setMetricType('units')}
            aria-pressed={metricType === 'units'}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955]',
              metricType === 'units'
                ? 'bg-primary text-white shadow-xs'
                : 'text-on-surface-variant hover:text-primary'
            )}
          >
            <Package className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Units sold</span>
          </button>
        </div>
      </div>

      {/* SVG Chart Canvas */}
      <div className="relative w-full overflow-hidden">
        <svg
          ref={chartRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none overflow-visible"
          role="region"
          aria-label={`Sales over time chart showing ${metricType === 'value' ? 'sales value' : 'units sold'}`}
          onMouseLeave={() => setActiveIndex(null)}
        >
          <defs>
            <linearGradient id="salesAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#A13F1C" stopOpacity="0.18" />
              <stop offset="85%" stopColor="#001D36" stopOpacity="0.02" />
              <stop offset="100%" stopColor="#001D36" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines and Y-axis labels */}
          {yTicks.map((t, idx) => (
            <g key={idx}>
              <line
                x1={padding.left}
                y1={t.y}
                x2={width - padding.right}
                y2={t.y}
                stroke="#E4EFFD"
                strokeDasharray={idx === 0 ? 'none' : '3 3'}
                strokeWidth="1"
              />
              <text
                x={padding.left - 8}
                y={t.y + 3.5}
                textAnchor="end"
                fontSize="10"
                fill="#74777E"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontWeight="500"
              >
                {metricType === 'value' ? `${currencySymbol}${formatINR(t.val)}` : t.val}
              </text>
            </g>
          ))}

          {/* Area Fill */}
          {areaPath && <path d={areaPath} fill="url(#salesAreaGradient)" />}

          {/* Primary Trend Line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#001D36"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points and Hit Areas */}
          {points.map((p) => {
            const b = buckets[p.index];
            const isActive = activeIndex === p.index;

            return (
              <g key={p.index}>
                {/* Visible Point Dot */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isActive ? 5.5 : 3}
                  fill={isActive ? '#A13F1C' : '#001D36'}
                  stroke="#FFFFFF"
                  strokeWidth={isActive ? '2.5' : '1.5'}
                  className="transition-all duration-150"
                />

                {/* Invisible Touch/Hover Target */}
                <rect
                  x={p.x - 12}
                  y={padding.top}
                  width="24"
                  height={innerHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setActiveIndex(p.index)}
                  onTouchStart={() => setActiveIndex(p.index)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${b.label}: ${b.unitsSold} units, ${currencySymbol}${formatINR(b.salesValue)}`}
                  onFocus={() => setActiveIndex(p.index)}
                  onBlur={() => setActiveIndex(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowRight' && p.index < points.length - 1) {
                      setActiveIndex(p.index + 1);
                    } else if (e.key === 'ArrowLeft' && p.index > 0) {
                      setActiveIndex(p.index - 1);
                    }
                  }}
                />
              </g>
            );
          })}

          {/* Active Highlight Vertical Crosshair */}
          {activePoint && (
            <line
              x1={activePoint.x}
              y1={padding.top}
              x2={activePoint.x}
              y2={padding.top + innerHeight}
              stroke="#A13F1C"
              strokeWidth="1.2"
              strokeDasharray="2 2"
              pointerEvents="none"
            />
          )}

          {/* X-axis Labels */}
          {xLabelIndices.map((idx) => {
            const p = points[idx];
            const b = buckets[idx];
            if (!p || !b) return null;
            return (
              <text
                key={idx}
                x={p.x}
                y={height - 10}
                textAnchor="middle"
                fontSize="10"
                fill="#43474D"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontWeight="500"
              >
                {b.label}
              </text>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {activeBucket && activePoint && (
          <div
            className="absolute z-20 pointer-events-none bg-primary text-white text-xs rounded-xl px-3 py-2 shadow-lg border border-white/20 transform -translate-x-1/2 -translate-y-full -mt-2 transition-all duration-100"
            style={{
              left: `${(activePoint.x / width) * 100}%`,
              top: `${(activePoint.y / height) * 100}%`,
            }}
          >
            <div className="flex items-center gap-1 text-[11px] text-white/80 pb-1 border-b border-white/15">
              <Calendar className="w-3 h-3" />
              <span>{activeBucket.label}</span>
            </div>
            <div className="flex flex-col gap-0.5 pt-1 text-[11px]">
              <span className="font-bold text-[#FFB955]">
                {currencySymbol}{formatINR(activeBucket.salesValue)}
              </span>
              <span className="text-white/90">
                {activeBucket.unitsSold} {activeBucket.unitsSold === 1 ? 'unit' : 'units'} sold
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Summary Narrative Footer */}
      <div className="pt-2 border-t border-surface-variant/40 flex items-center justify-between text-xs text-on-surface-variant">
        <p>
          <strong className="text-primary font-bold">{totalUnits}</strong> {totalUnits === 1 ? 'unit' : 'units'} sold over the last 30 days totaling <strong className="text-primary font-bold">{currencySymbol}{formatINR(totalValue)}</strong>.
        </p>
      </div>
    </div>
  );
};
