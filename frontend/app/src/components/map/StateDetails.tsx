import React, { useState, useEffect } from 'react';
import { CraftRegion } from '@/data/indiaCraftMapData';
import { ArrowLeft, ExternalLink, ChevronDown, ImageOff } from 'lucide-react';

interface StateDetailsProps {
  region: CraftRegion;
  onBack: () => void;
}

export const StateDetails: React.FC<StateDetailsProps> = ({ region, onBack }) => {
  const [heroImageError, setHeroImageError] = useState(false);
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);
  const [displayedHeroSrc, setDisplayedHeroSrc] = useState(region.heroImage.src);
  const [isCrossfading, setIsCrossfading] = useState(false);
  const [craftImageErrors, setCraftImageErrors] = useState<Record<number, boolean>>({});

  // Crossfade image & reset state when selected region changes
  useEffect(() => {
    setHeroImageError(false);
    setCraftImageErrors({});

    // Start transition
    setIsCrossfading(true);
    const img = new Image();
    img.src = region.heroImage.src;
    img.onload = () => {
      setDisplayedHeroSrc(region.heroImage.src);
      setHeroImageLoaded(true);
      setIsCrossfading(false);
    };
    img.onerror = () => {
      setDisplayedHeroSrc(region.heroImage.src);
      setHeroImageError(true);
      setHeroImageLoaded(true);
      setIsCrossfading(false);
    };
  }, [region.code, region.heroImage.src]);

  return (
    <div
      role="region"
      aria-label={`${region.name} craft details`}
      className="state-details w-full bg-[#FFF9EF]/82 backdrop-blur-[16px] rounded-[22px] border border-white/60 shadow-[0_14px_38px_rgba(0,29,54,0.08)] p-5 sm:p-7 flex flex-col gap-6 text-[#001D36] transition-all duration-300"
    >
      {/* 1. Small "Back to India" Link Action */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#001D36] hover:text-[#A13F1C] transition-colors py-1.5 px-1 -ml-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955] touch-target group cursor-pointer"
          aria-label="Back to India map"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to India</span>
        </button>
      </div>

      {/* 2. Primary Cultural Hero Image */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[3/2] lg:aspect-[16/9] bg-[#FFF4E8] rounded-2xl overflow-hidden border border-[#001D36]/10 shadow-2xs">
        {heroImageError ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[#FFF4E8] text-[#001D36]/50">
            <ImageOff className="w-6 h-6" />
            <span className="text-xs font-semibold">Image unavailable</span>
          </div>
        ) : (
          <img
            src={displayedHeroSrc}
            alt={region.heroImage.alt}
            onLoad={() => setHeroImageLoaded(true)}
            onError={() => setHeroImageError(true)}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isCrossfading ? 'opacity-40' : heroImageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}
      </div>

      {/* 3. Header & Introduction */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-col">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#001D36] tracking-tight leading-tight">
            {region.name}
          </h2>
          <span className="text-xs sm:text-sm font-semibold text-[#001D36]/65 mt-0.5">
            {region.geographicRegion}
          </span>
        </div>

        <p className="text-xs sm:text-sm text-[#001D36]/85 leading-relaxed font-medium mt-1">
          {region.introduction}
        </p>
      </div>

      {/* 4. Featured Crafts Rows (Exactly 3) */}
      <div className="flex flex-col gap-3.5 pt-2 border-t border-[#001D36]/8">
        <h3 className="font-display text-sm font-bold text-[#001D36] tracking-tight">
          Featured crafts
        </h3>

        <div className="flex flex-col gap-3">
          {region.featuredCrafts.slice(0, 3).map((craft, idx) => {
            const hasError = craftImageErrors[idx];
            return (
              <div
                key={craft.name}
                className="flex items-center gap-3.5 sm:gap-4 group"
              >
                {/* 64–84px Craft Image with Softly Rounded Corners */}
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl bg-[#FFF4E8] border border-[#001D36]/10 overflow-hidden shrink-0 shadow-2xs relative">
                  {hasError ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#FFF4E8] text-[#001D36]/40 p-1 text-center">
                      <span className="text-[9px] font-semibold leading-tight">Image unavailable</span>
                    </div>
                  ) : (
                    <img
                      src={craft.image.src}
                      alt={craft.image.alt || craft.name}
                      onError={() => setCraftImageErrors((prev) => ({ ...prev, [idx]: true }))}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  )}
                </div>

                {/* Craft Name & Concise Description */}
                <div className="flex flex-col min-w-0 justify-center">
                  <h4 className="font-display text-xs sm:text-sm font-bold text-[#001D36] leading-snug group-hover:text-[#A13F1C] transition-colors">
                    {craft.name}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-[#001D36]/75 leading-relaxed mt-0.5 font-normal">
                    {craft.shortDescription}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Plain Text Metadata Lines */}
      <div className="flex flex-col gap-2 pt-3 border-t border-[#001D36]/8 text-xs leading-relaxed">
        <div>
          <span className="font-bold text-[#001D36]">Materials</span>
          <span className="text-[#001D36]/70"> · {region.materials.join(', ')}</span>
        </div>
        <div>
          <span className="font-bold text-[#001D36]">Communities</span>
          <span className="text-[#001D36]/70"> · {region.communities.join(', ')}</span>
        </div>
      </div>

      {/* 6. Why It Matters */}
      <div className="flex flex-col gap-1 pt-3 border-t border-[#001D36]/8">
        <h4 className="font-display text-xs font-bold text-[#001D36]">
          Why it matters
        </h4>
        <p className="text-xs text-[#001D36]/80 leading-relaxed font-normal">
          {region.whyItMatters}
        </p>
      </div>

      {/* 7. Collapsible Sources (Collapsed by default) */}
      {region.sources && region.sources.length > 0 && (
        <details className="pt-3 border-t border-[#001D36]/8 text-xs group">
          <summary className="font-semibold text-[#001D36]/75 cursor-pointer hover:text-[#001D36] transition-colors flex items-center justify-between select-none py-1">
            <span>Sources and GI records</span>
            <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180 text-[#001D36]/60" />
          </summary>
          <div className="flex flex-col gap-1.5 mt-2.5 pl-2">
            {region.sources.map((source) => (
              <a
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-[#A13F1C] hover:underline inline-flex items-center gap-1 font-medium truncate"
              >
                <span>{source.title}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            ))}
          </div>
        </details>
      )}
    </div>
  );
};
