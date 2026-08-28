import React from 'react';
import { clsx } from 'clsx';

// Ecosystem background assets
import heroPanoramaPng from '@/assets/ecosystem/craft-hero-panorama.png';
import heroPanorama1920 from '@/assets/ecosystem/craft-hero-panorama-1920.webp';
import heroPanorama1280 from '@/assets/ecosystem/craft-hero-panorama-1280.webp';
import heroPanorama768 from '@/assets/ecosystem/craft-hero-panorama-768.webp';

import workshopLightPng from '@/assets/ecosystem/craft-workshop-light.png';
import workshopLight1920 from '@/assets/ecosystem/craft-workshop-light-1920.webp';
import workshopLight1280 from '@/assets/ecosystem/craft-workshop-light-1280.webp';
import workshopLight768 from '@/assets/ecosystem/craft-workshop-light-768.webp';

import workshopNightPng from '@/assets/ecosystem/craft-workshop-night.png';
import workshopNight1920 from '@/assets/ecosystem/craft-workshop-night-1920.webp';
import workshopNight1280 from '@/assets/ecosystem/craft-workshop-night-1280.webp';
import workshopNight768 from '@/assets/ecosystem/craft-workshop-night-768.webp';

export type AtmosphereVariant = 'hero' | 'light' | 'dark' | 'subtle';

export interface PageAtmosphereProps {
  variant: AtmosphereVariant;
  position?: string;
  className?: string;
  fadeBottom?: boolean;
  fadeTop?: boolean;
  children: React.ReactNode;
}

export const PageAtmosphere: React.FC<PageAtmosphereProps> = ({
  variant,
  position = 'center',
  className = '',
  fadeBottom = false,
  fadeTop = false,
  children,
}) => {
  const isHero = variant === 'hero';
  const isLight = variant === 'light';
  const isDark = variant === 'dark';
  const isSubtle = variant === 'subtle';

  // Select responsive source set based on atmosphere variant
  let pngFallback = workshopLightPng;
  let webp1920 = workshopLight1920;
  let webp1280 = workshopLight1280;
  let webp768 = workshopLight768;

  if (isHero) {
    pngFallback = heroPanoramaPng;
    webp1920 = heroPanorama1920;
    webp1280 = heroPanorama1280;
    webp768 = heroPanorama768;
  } else if (isDark) {
    pngFallback = workshopNightPng;
    webp1920 = workshopNight1920;
    webp1280 = workshopNight1280;
    webp768 = workshopNight768;
  }

  return (
    <div
      className={clsx(
        'relative w-full overflow-visible',
        isHero && 'min-h-[640px] sm:min-h-[680px] lg:min-h-[740px]',
        isDark && 'bg-[#001D36] text-white',
        (isLight || isSubtle) && 'bg-[#FFF9EF] text-on-surface',
        className
      )}
    >
      {/* Background Image Layer (Independent, submerged, no layout shift) */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
        <picture>
          <source media="(max-width: 768px)" srcSet={webp768} type="image/webp" />
          <source media="(max-width: 1280px)" srcSet={webp1280} type="image/webp" />
          <source media="(min-width: 1281px)" srcSet={webp1920} type="image/webp" />
          <img
            src={pngFallback}
            alt=""
            role="presentation"
            loading={isHero ? 'eager' : 'lazy'}
            decoding="async"
            style={{ objectPosition: position }}
            className={clsx(
              'w-full h-full object-cover transition-opacity duration-300',
              isHero && 'opacity-90',
              isLight && 'opacity-16',
              isDark && 'opacity-38',
              isSubtle && 'opacity-12'
            )}
          />
        </picture>

        {/* Restrained Layered Color Veils Merged with Design Tokens */}
        {isHero && (
          <>
            {/* Left to right dark-to-light gradient for text readability */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(90deg, rgba(0, 29, 54, 0.84) 0%, rgba(0, 29, 54, 0.62) 42%, rgba(0, 29, 54, 0.22) 75%, rgba(0, 29, 54, 0.08) 100%)',
              }}
            />
            {/* Top translucent glass highlight */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(255, 249, 239, 0.05) 0%, transparent 40%, rgba(0, 29, 54, 0.40) 100%)',
              }}
            />
            {/* Bottom continuous long-fade into warm cream (#FFF9EF) */}
            <div
              className="absolute inset-x-0 bottom-0 pointer-events-none"
              style={{
                height: 'clamp(120px, 20vw, 240px)',
                background:
                  'linear-gradient(to bottom, transparent 0%, rgba(255, 249, 239, 0.15) 25%, rgba(255, 249, 239, 0.58) 60%, rgba(255, 249, 239, 0.92) 85%, #FFF9EF 100%)',
              }}
            />
          </>
        )}

        {isLight && (
          <>
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(255, 249, 239, 0.86) 0%, rgba(255, 249, 239, 0.88) 50%, rgba(255, 249, 239, 0.86) 100%)',
              }}
            />
            {fadeTop && (
              <div
                className="absolute inset-x-0 top-0 pointer-events-none"
                style={{
                  height: 'clamp(80px, 12vw, 160px)',
                  background:
                    'linear-gradient(to bottom, #FFF9EF 0%, rgba(255, 249, 239, 0.6) 50%, transparent 100%)',
                }}
              />
            )}
            {fadeBottom && (
              <div
                className="absolute inset-x-0 bottom-0 pointer-events-none"
                style={{
                  height: 'clamp(100px, 15vw, 200px)',
                  background:
                    'linear-gradient(to bottom, transparent 0%, rgba(255, 249, 239, 0.5) 40%, rgba(0, 29, 54, 0.85) 100%)',
                }}
              />
            )}
          </>
        )}

        {isDark && (
          <>
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(0, 29, 54, 0.72) 0%, rgba(0, 29, 54, 0.60) 50%, rgba(0, 29, 54, 0.84) 100%)',
              }}
            />
            {/* Optional top transition only if explicitly requested */}
            {fadeTop && (
              <div
                className="absolute inset-x-0 top-0 pointer-events-none"
                style={{
                  height: 'clamp(90px, 14vw, 180px)',
                  background:
                    'linear-gradient(to bottom, #FFF9EF 0%, rgba(255, 249, 239, 0.7) 20%, rgba(0, 29, 54, 0.4) 60%, transparent 100%)',
                }}
              />
            )}
          </>
        )}

        {isSubtle && (
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(255, 249, 239, 0.92) 0%, rgba(251, 248, 243, 0.94) 50%, rgba(255, 249, 239, 0.92) 100%)',
            }}
          />
        )}
      </div>

      {/* Foreground Content Container */}
      <div className="relative z-10 w-full overflow-visible">{children}</div>
    </div>
  );
};
