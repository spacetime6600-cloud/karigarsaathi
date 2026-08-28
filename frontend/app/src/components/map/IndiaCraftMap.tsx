import React, { useState, useId, useRef, useEffect, useCallback } from 'react';
import { INDIA_CRAFT_REGIONS, CraftRegion } from '@/data/indiaCraftMapData';
import { VERIFIED_INDIA_MAP_PATHS } from '@/data/indiaMapPaths';
import { StateDetails } from '@/components/map/StateDetails';
import { Search } from 'lucide-react';
import { clsx } from 'clsx';

export const IndiaCraftMap: React.FC = () => {
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<CraftRegion | null>(null);
  const [focusedRegion, setFocusedRegion] = useState<CraftRegion | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number; flipX: boolean; flipY: boolean }>({
    x: 0,
    y: 0,
    flipX: false,
    flipY: false,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const selectorId = useId();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const previousSelectedRef = useRef<string | null>(null);
  const rafRef = useRef<number | null>(null);

  // Active tooltip target (hovered or keyboard focused)
  const activeTooltipRegion = hoveredRegion || focusedRegion;

  // Selected region data object
  const selectedRegion = selectedCode
    ? INDIA_CRAFT_REGIONS.find((r) => r.code === selectedCode) || null
    : null;

  // Pointer move tracker with auto-clamping & requestAnimationFrame
  const handlePointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      // Auto-flip tooltip if approaching right/bottom boundaries (tooltip width: ~315px, height: ~100px)
      const flipX = x > rect.width - 340;
      const flipY = y > rect.height - 125;
      setTooltipPos({ x, y, flipX, flipY });
    });
  }, []);

  const handleSelect = (code: string) => {
    previousSelectedRef.current = code;
    setSelectedCode(code);
  };

  const handleClearSelection = useCallback(() => {
    const prevCode = selectedCode;
    setSelectedCode(null);
    setFocusedRegion(null);
    // Restore focus to previously selected map path if available
    if (prevCode) {
      setTimeout(() => {
        const elem = document.querySelector(`[data-state-code="${prevCode}"]`) as HTMLElement;
        elem?.focus();
      }, 50);
    }
  }, [selectedCode]);

  // Keyboard escape listener to close expanded details
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedCode) {
        handleClearSelection();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCode, handleClearSelection]);

  // Scroll to details on mobile when selection happens
  useEffect(() => {
    if (selectedCode && window.innerWidth < 1024 && detailsRef.current) {
      detailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedCode]);

  // Format region and materials line for tooltip
  const getRegionMaterialLine = (region: CraftRegion) => {
    const regionName = region.geographicRegion || (region.region === 'Island' ? 'Island Territory' : `${region.region} India`);
    const materialsStr = region.materials.slice(0, 2).join(' · ');
    return `${regionName} · ${materialsStr}`;
  };

  // Format craft line for tooltip
  const getCraftLine = (region: CraftRegion) => {
    if (region.featuredCrafts && region.featuredCrafts.length >= 2) {
      return `${region.featuredCrafts[0].name} & ${region.featuredCrafts[1].name}`;
    }
    if (region.crafts && region.crafts.length >= 2) {
      return `${region.crafts[0]} & ${region.crafts[1]}`;
    }
    return region.hallmarkCraft || region.featuredCrafts?.[0]?.name || '';
  };

  return (
    <div
      className="w-full flex flex-col gap-6 overflow-visible"
      id="craft-map"
      data-selected={Boolean(selectedRegion)}
    >
      {/* Screen Reader Announcement Region */}
      <div className="sr-only" aria-live="polite">
        {selectedRegion
          ? `Selected region: ${selectedRegion.name}. ${selectedRegion.geographicRegion}. Introduction: ${selectedRegion.introduction}`
          : 'No region selected. Showing full India craft map.'}
      </div>

      {/* Lightweight Compact Search & Accessibility Selector Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-[860px] mx-auto w-full px-2">
        <div className="flex items-center gap-2 bg-white/75 backdrop-blur-xs border border-[#001D36]/12 rounded-full px-3.5 py-1.5 w-full sm:w-72 shadow-2xs">
          <Search className="w-3.5 h-3.5 text-[#001D36]/60 shrink-0" />
          <input
            type="text"
            placeholder="Search state, UT, or craft..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-semibold text-[#001D36] placeholder:text-[#001D36]/50 focus:outline-none bg-transparent"
            aria-label="Filter states or crafts"
          />
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <label htmlFor={selectorId} className="text-xs font-bold text-[#001D36]/70 shrink-0">
            Select State/UT:
          </label>
          <select
            id={selectorId}
            value={selectedCode || ''}
            onChange={(e) => {
              if (e.target.value) {
                handleSelect(e.target.value);
              } else {
                handleClearSelection();
              }
            }}
            className="text-xs font-bold text-[#001D36] bg-white/85 border border-[#001D36]/15 rounded-full px-3 py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955] shadow-2xs cursor-pointer"
          >
            <option value="">-- Choose a Region --</option>
            <optgroup label="28 States">
              {INDIA_CRAFT_REGIONS.filter(
                (r) =>
                  r.type === 'state' &&
                  (searchQuery === '' ||
                    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    r.featuredCrafts.some((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    (r.crafts && r.crafts.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()))))
              ).map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="8 Union Territories">
              {INDIA_CRAFT_REGIONS.filter(
                (r) =>
                  r.type === 'union-territory' &&
                  (searchQuery === '' ||
                    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    r.featuredCrafts.some((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    (r.crafts && r.crafts.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()))))
              ).map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name} (UT)
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* Main Transparent Map Shell */}
      <section
        aria-label="Interactive India Craft Explorer"
        className={clsx(
          'relative w-full max-w-[1140px] mx-auto bg-transparent border-0 rounded-none shadow-none overflow-visible transition-all duration-300 ease-out',
          selectedRegion
            ? 'grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start'
            : 'flex flex-col items-center justify-center'
        )}
      >
        {/* Map Stage Container */}
        <div
          ref={mapContainerRef}
          className={clsx(
            'map-stage relative bg-transparent border-0 rounded-none shadow-none p-0 flex flex-col items-center justify-center transition-all duration-380 ease-[cubic-bezier(0.22,1,0.36,1)] w-full overflow-visible',
            selectedRegion
              ? 'lg:col-span-5 max-w-[480px] lg:scale-[0.96] lg:-translate-x-[2%]'
              : 'max-w-[760px] scale-100 translate-x-0'
          )}
        >
          {/* Lightweight Inline Metadata Row */}
          <div className="w-full flex flex-col sm:flex-row items-center justify-between text-xs text-[#001D36]/70 mb-2 px-1 gap-1 text-center sm:text-left">
            <span className="font-semibold text-[#001D36] text-[11px] sm:text-xs">
              Survey of India administrative boundaries
            </span>
            <span className="text-[11px] text-[#A13F1C] font-medium">
              {selectedRegion ? 'Click state or back button' : 'Hover to preview · Select to explore'}
            </span>
          </div>

          {/* SVG Canvas */}
          <div className="relative w-full aspect-[650/720] flex items-center justify-center overflow-visible">
            <svg
              viewBox="0 0 650 720"
              onPointerMove={handlePointerMove}
              onPointerLeave={() => {
                setHoveredRegion(null);
              }}
              className="w-full h-full select-none bg-transparent overflow-visible"
              role="img"
              aria-label="Accurate Map of India with 28 states and 8 union territories"
            >
              {VERIFIED_INDIA_MAP_PATHS.map((item) => {
                const regionData = INDIA_CRAFT_REGIONS.find((r) => r.code === item.code);
                const isSelected = selectedCode === item.code;
                const isHovered = hoveredRegion?.code === item.code || focusedRegion?.code === item.code;

                return (
                  <path
                    key={item.code}
                    d={item.d}
                    data-state-code={item.code}
                    tabIndex={0}
                    role="button"
                    vectorEffect="non-scaling-stroke"
                    aria-label={`${item.name} (${regionData?.type === 'state' ? 'State' : 'Union Territory'})`}
                    aria-pressed={isSelected}
                    onClick={() => handleSelect(item.code)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelect(item.code);
                      }
                    }}
                    onPointerEnter={() => regionData && setHoveredRegion(regionData)}
                    onMouseEnter={() => regionData && setHoveredRegion(regionData)}
                    onMouseOver={() => regionData && setHoveredRegion(regionData)}
                    onMouseLeave={() => setHoveredRegion(null)}
                    onMouseOut={() => setHoveredRegion(null)}
                    onFocus={() => {
                      if (regionData) {
                        setFocusedRegion(regionData);
                        setTooltipPos({ x: item.cx, y: item.cy, flipX: item.cx > 350, flipY: item.cy > 400 });
                      }
                    }}
                    onBlur={() => setFocusedRegion(null)}
                    className={clsx(
                      'cursor-pointer transition-all duration-140 focus:outline-none focus-visible:stroke-[#FFB955] focus-visible:stroke-2',
                      isSelected
                        ? 'fill-[#C65A35] stroke-[#001D36] stroke-[1.6px] filter drop-shadow-xs z-10'
                        : isHovered
                        ? 'fill-[#BADBF7] stroke-[#001D36] stroke-[1.2px]'
                        : 'fill-[#DDEBF8]/85 stroke-[#001D36]/25 stroke-[0.8px] hover:fill-[#BADBF7]'
                    )}
                  />
                );
              })}
            </svg>

            {/* Compact Glass Hover Tooltip */}
            {activeTooltipRegion && (
              <div
                style={{
                  top: `${tooltipPos.y + (tooltipPos.flipY ? -108 : 14)}px`,
                  left: `${tooltipPos.x + (tooltipPos.flipX ? -325 : 14)}px`,
                }}
                className="absolute pointer-events-none z-30 w-[315px] min-h-[98px] p-3 rounded-[20px] bg-[#FFF9EF]/90 backdrop-blur-[16px] border border-white/80 shadow-[0_8px_24px_rgba(0,29,54,0.12)] flex items-center gap-3 transition-opacity duration-120 animate-in fade-in select-none"
              >
                {/* Cultural craft photograph thumbnail */}
                <div className="w-[60px] h-[60px] rounded-[14px] bg-[#FFF4E8] border border-[#001D36]/10 overflow-hidden shrink-0 flex items-center justify-center p-0.5 shadow-2xs relative">
                  <img
                    src={activeTooltipRegion.heroImage?.src || activeTooltipRegion.cultureImage?.src}
                    alt=""
                    role="presentation"
                    loading="eager"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                    className="w-full h-full object-cover rounded-[12px]"
                  />
                </div>

                {/* 3-line Text Hierarchy */}
                <div className="flex flex-col min-w-0 justify-center">
                  <span className="text-[17px] font-semibold text-[#001D36] tracking-tight truncate leading-tight">
                    {activeTooltipRegion.name}
                  </span>
                  <span className="text-[13.5px] font-medium text-[#A13F1C] truncate mt-0.5 leading-snug">
                    {getCraftLine(activeTooltipRegion)}
                  </span>
                  <span className="text-[11.5px] font-normal text-[#001D36]/75 truncate mt-0.5">
                    {getRegionMaterialLine(activeTooltipRegion)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Lightweight Inline Legend */}
          <div className="w-full flex items-center justify-center gap-6 text-[11px] text-[#001D36]/70 pt-2 mt-1">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C65A35]" /> Selected Region
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-[#DDEBF8] border border-[#001D36]/30" /> 28 States & 8 Union Territories
            </span>
          </div>
        </div>

        {/* Selected Region Deep Dive Details Panel */}
        {selectedRegion && (
          <div
            ref={detailsRef}
            className="lg:col-span-7 w-full animate-in fade-in slide-in-from-right-4 duration-380 ease-[cubic-bezier(0.22,1,0.36,1)]"
          >
            <StateDetails region={selectedRegion} onBack={handleClearSelection} />
          </div>
        )}
      </section>
    </div>
  );
};
