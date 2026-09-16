import React, { useState, useMemo } from 'react';
import { ProductRecord } from '@/domain/products';
import { priceHistoryService, ProductPriceInsight } from '@/services/api/priceHistoryService';
import { TrendingUp, TrendingDown, Tag, Sparkles } from 'lucide-react';

export interface ProductPriceHistoryChartProps {
  products: ProductRecord[];
  currencySymbol?: string;
}

function formatINR(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(val);
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Recently';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return 'Recently';
  }
}

export const ProductPriceHistoryChart: React.FC<ProductPriceHistoryChartProps> = ({
  products,
  currencySymbol = '₹',
}) => {
  const activeProducts = useMemo(() => products.filter((p) => p.status !== 'archived'), [products]);
  const [selectedProductId, setSelectedProductId] = useState<string>(() => {
    return activeProducts[0]?.id || '';
  });
  const [hoveredEntryIndex, setHoveredEntryIndex] = useState<number | null>(null);

  const selectedProduct = useMemo(() => {
    return activeProducts.find((p) => p.id === selectedProductId) || activeProducts[0] || null;
  }, [activeProducts, selectedProductId]);

  const priceInsight: ProductPriceInsight | null = useMemo(() => {
    if (!selectedProduct) return null;
    return priceHistoryService.getProductPriceHistory(selectedProduct);
  }, [selectedProduct]);

  // SVG dimensions for step-line chart
  const width = 640;
  const height = 200;
  const padding = { top: 20, right: 24, bottom: 35, left: 60 };

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const entries = useMemo(() => priceInsight?.historyEntries || [], [priceInsight?.historyEntries]);

  const maxPrice = useMemo(() => {
    if (!priceInsight) return 1000;
    const prices = entries.map((e) => e.price);
    if (priceInsight.aiSuggestedPrice) prices.push(priceInsight.aiSuggestedPrice);
    const max = Math.max(...prices, 100);
    return Math.ceil(max * 1.15);
  }, [entries, priceInsight]);

  const minPrice = useMemo(() => {
    if (!priceInsight) return 0;
    const prices = entries.map((e) => e.price);
    if (priceInsight.aiSuggestedPrice) prices.push(priceInsight.aiSuggestedPrice);
    const min = Math.min(...prices, 0);
    return Math.max(0, Math.floor(min * 0.85));
  }, [entries, priceInsight]);

  // Step points calculation: creates horizontal step plateaus between dated milestones
  const { stepPath, milestones } = useMemo(() => {
    if (entries.length === 0) return { stepPath: '', milestones: [] };

    const priceRange = maxPrice - minPrice || 1;
    const getY = (price: number) =>
      padding.top + innerHeight - ((price - minPrice) / priceRange) * innerHeight;

    if (entries.length === 1) {
      const y = getY(entries[0].price);
      return {
        stepPath: `M ${padding.left} ${y} L ${padding.left + innerWidth} ${y}`,
        milestones: [{ x: padding.left + innerWidth / 2, y, entry: entries[0], index: 0 }],
      };
    }

    const stepWidth = innerWidth / (entries.length - 1);
    let path = '';
    const calculatedMilestones = [];

    for (let i = 0; i < entries.length; i++) {
      const current = entries[i];
      const x = padding.left + i * stepWidth;
      const y = getY(current.price);
      calculatedMilestones.push({ x, y, entry: current, index: i });

      if (i === 0) {
        path = `M ${x} ${y}`;
      } else {
        const prev = entries[i - 1];
        const prevY = getY(prev.price);
        // Step line: horizontal from previous milestone to current X, then vertical jump to new Y
        path += ` L ${x} ${prevY} L ${x} ${y}`;
      }
    }

    return { stepPath: path, milestones: calculatedMilestones };
  }, [entries, maxPrice, minPrice, innerWidth, innerHeight, padding.left, padding.top]);

  // AI-suggested reference line coordinate
  const aiLineY = useMemo(() => {
    if (!priceInsight?.aiSuggestedPrice) return null;
    const priceRange = maxPrice - minPrice || 1;
    return padding.top + innerHeight - ((priceInsight.aiSuggestedPrice - minPrice) / priceRange) * innerHeight;
  }, [priceInsight?.aiSuggestedPrice, maxPrice, minPrice, innerHeight, padding.top]);

  const activeMilestone = hoveredEntryIndex !== null ? milestones[hoveredEntryIndex] : null;

  return (
    <div className="bg-white rounded-2xl border border-surface-variant/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between gap-4">
      {/* Header & Product Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-surface-variant/40">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-primary tracking-tight">
            Your product price history
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Step-line changes across recorded catalogue pricing
          </p>
        </div>

        {/* Product Dropdown Selector */}
        {activeProducts.length > 0 && (
          <div className="relative self-start sm:self-auto min-w-[200px] max-w-[280px]">
            <label htmlFor="product-price-select" className="sr-only">
              Select product for price history
            </label>
            <select
              id="product-price-select"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full bg-surface-container-low/70 border border-surface-variant/70 text-primary text-xs font-semibold rounded-xl px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-secondary/50 truncate cursor-pointer"
            >
              {activeProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({currencySymbol}{formatINR(p.price)})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {priceInsight ? (
        <div className="flex flex-col gap-4">
          {/* Key Metrics Strip for Selected Product */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-surface-container-low/40 border border-surface-variant/50">
            {/* Current Price */}
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-on-surface-variant">Current listed price</span>
              <span className="text-lg sm:text-xl font-bold text-primary font-sans mt-0.5">
                {currencySymbol}{formatINR(priceInsight.currentPrice)}
              </span>
            </div>

            {/* Last Changed */}
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-on-surface-variant">Last updated</span>
              <span className="text-xs sm:text-sm font-semibold text-primary mt-0.5">
                {formatDate(priceInsight.lastChangeDate)}
              </span>
            </div>

            {/* Price Change Delta */}
            <div className="flex flex-col col-span-2 sm:col-span-1">
              <span className="text-[11px] font-medium text-on-surface-variant">Previous change</span>
              <div className="flex items-center gap-1 mt-0.5">
                {priceInsight.hasPriceHistory && priceInsight.priceDifference !== null ? (
                  priceInsight.priceDifference > 0 ? (
                    <span className="inline-flex items-center text-xs font-bold text-success">
                      <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                      +{currencySymbol}{formatINR(priceInsight.priceDifference)} ({priceInsight.percentChange}%)
                    </span>
                  ) : priceInsight.priceDifference < 0 ? (
                    <span className="inline-flex items-center text-xs font-bold text-error">
                      <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                      -{currencySymbol}{formatINR(Math.abs(priceInsight.priceDifference))} ({priceInsight.percentChange}%)
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-on-surface-variant">No change</span>
                  )
                ) : (
                  <span className="text-xs text-on-surface-variant/80 font-medium">
                    Initial listed price
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* SVG Step-Line Chart or Honest Single-Price Notice */}
          {priceInsight.hasPriceHistory ? (
            <div className="relative w-full overflow-hidden">
              <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-auto select-none overflow-visible"
                role="region"
                aria-label={`Price history step chart for ${priceInsight.productTitle}`}
                onMouseLeave={() => setHoveredEntryIndex(null)}
              >
                {/* Y-Axis Grid Lines */}
                {[minPrice, Math.round((minPrice + maxPrice) / 2), maxPrice].map((pVal, idx) => {
                  const y = padding.top + innerHeight - ((pVal - minPrice) / (maxPrice - minPrice || 1)) * innerHeight;
                  return (
                    <g key={idx}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={width - padding.right}
                        y2={y}
                        stroke="#E4EFFD"
                        strokeDasharray="3 3"
                        strokeWidth="1"
                      />
                      <text
                        x={padding.left - 8}
                        y={y + 3.5}
                        textAnchor="end"
                        fontSize="10"
                        fill="#74777E"
                        fontFamily="Plus Jakarta Sans, sans-serif"
                        fontWeight="500"
                      >
                        {currencySymbol}{formatINR(pVal)}
                      </text>
                    </g>
                  );
                })}

                {/* AI-Suggested Reference Dotted Line */}
                {aiLineY !== null && (
                  <g>
                    <line
                      x1={padding.left}
                      y1={aiLineY}
                      x2={width - padding.right}
                      y2={aiLineY}
                      stroke="#FFB955"
                      strokeDasharray="4 4"
                      strokeWidth="1.5"
                    />
                    <text
                      x={width - padding.right}
                      y={aiLineY - 5}
                      textAnchor="end"
                      fontSize="9"
                      fill="#633F00"
                      fontWeight="bold"
                    >
                      AI suggested baseline: {currencySymbol}{formatINR(priceInsight.aiSuggestedPrice!)}
                    </text>
                  </g>
                )}

                {/* Step Line */}
                {stepPath && (
                  <path
                    d={stepPath}
                    fill="none"
                    stroke="#001D36"
                    strokeWidth="2.5"
                    strokeLinecap="square"
                  />
                )}

                {/* Milestone Points */}
                {milestones.map((m) => {
                  const isHovered = hoveredEntryIndex === m.index;
                  return (
                    <g key={m.index}>
                      <circle
                        cx={m.x}
                        cy={m.y}
                        r={isHovered ? 5.5 : 4}
                        fill={isHovered ? '#A13F1C' : '#001D36'}
                        stroke="#FFFFFF"
                        strokeWidth="2"
                        className="transition-all duration-150 cursor-pointer"
                        tabIndex={0}
                        role="button"
                        aria-label={`${formatDate(m.entry.effectiveDate)}: ${currencySymbol}${formatINR(m.entry.price)} (${m.entry.reason || 'Price change'})`}
                        onMouseEnter={() => setHoveredEntryIndex(m.index)}
                        onFocus={() => setHoveredEntryIndex(m.index)}
                        onBlur={() => setHoveredEntryIndex(null)}
                      />

                      {/* X-axis Date label */}
                      <text
                        x={m.x}
                        y={height - 10}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#43474D"
                        fontWeight="500"
                      >
                        {formatDate(m.entry.effectiveDate).split(',')[0]}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Floating Tooltip */}
              {activeMilestone && (
                <div
                  className="absolute z-20 pointer-events-none bg-primary text-white text-xs rounded-xl px-3 py-2 shadow-lg border border-white/20 transform -translate-x-1/2 -translate-y-full -mt-2 transition-all duration-100"
                  style={{
                    left: `${(activeMilestone.x / width) * 100}%`,
                    top: `${(activeMilestone.y / height) * 100}%`,
                  }}
                >
                  <span className="text-[10px] text-white/70 block">
                    {formatDate(activeMilestone.entry.effectiveDate)}
                  </span>
                  <span className="font-bold text-[#FFB955] text-xs block">
                    {currencySymbol}{formatINR(activeMilestone.entry.price)}
                  </span>
                  {activeMilestone.entry.reason && (
                    <span className="text-[10px] text-white/90 block mt-0.5">
                      {activeMilestone.entry.reason}
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Truthful single price banner */
            <div className="p-5 rounded-2xl bg-surface border border-surface-variant/60 flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
              <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                <Tag className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <p className="text-xs text-on-surface-variant font-medium">
                  Price history will appear after recorded price changes.
                </p>
                <span className="text-xs font-bold text-primary">
                  Current listed price: {currencySymbol}{formatINR(priceInsight.currentPrice)} (listed {formatDate(priceInsight.lastChangeDate)})
                </span>
              </div>
            </div>
          )}

          {/* AI Fair Price Assistant Reference if available */}
          {priceInsight.aiSuggestedPrice && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FFF9EF] border border-[#FFDDB5] text-xs text-[#2A1800]">
              <Sparkles className="w-4 h-4 text-[#FFB955] shrink-0" />
              <span>
                <strong>AI-suggested range:</strong> Generated from verified raw material and labour breakdown ({currencySymbol}{formatINR(priceInsight.costBreakdownTotal || 0)} base cost).
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center text-xs text-on-surface-variant">
          No product selected for price history inspection.
        </div>
      )}
    </div>
  );
};
