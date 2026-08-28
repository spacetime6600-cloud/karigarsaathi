import React from 'react';

// Ecosystem responsive assets

import workshopLightPng from '@/assets/ecosystem/craft-workshop-light.png';
import workshopLight1920 from '@/assets/ecosystem/craft-workshop-light-1920.webp';
import workshopLight1280 from '@/assets/ecosystem/craft-workshop-light-1280.webp';
import workshopLight768 from '@/assets/ecosystem/craft-workshop-light-768.webp';

import craftMapAtmospherePng from '@/assets/ecosystem/craft-map-atmosphere.png';
import craftMapAtmosphere1920 from '@/assets/ecosystem/craft-map-atmosphere-1920.webp';
import craftMapAtmosphere1280 from '@/assets/ecosystem/craft-map-atmosphere-1280.webp';
import craftMapAtmosphere768 from '@/assets/ecosystem/craft-map-atmosphere-768.webp';

import workshopNightPng from '@/assets/ecosystem/craft-workshop-night.png';
import workshopNight1920 from '@/assets/ecosystem/craft-workshop-night-1920.webp';
import workshopNight1280 from '@/assets/ecosystem/craft-workshop-night-1280.webp';
import workshopNight768 from '@/assets/ecosystem/craft-workshop-night-768.webp';

import { HeroBackgroundVideo } from '@/components/hero/HeroBackgroundVideo';

/**
 * LandingAtmosphere
 * Continuous page-level background system with overlapping, vertically dissolving photographic layers.
 * Uses CSS transparency masks so images dissolve seamlessly into the page-level warm cream (#FFF9EF) base.
 */
export const LandingAtmosphere: React.FC<{ 'aria-hidden'?: boolean | 'true' | 'false' }> = (props) => {
  return (
    <div
      aria-hidden={props['aria-hidden'] ?? true}
      className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden"
    >
      {/* ========================================================================= */}
      {/* LAYER 1: HERO BACKGROUND VIDEO & POSTER (Top of page -> dissolves into workflow) */}
      {/* ========================================================================= */}
      <div className="absolute inset-x-0 top-0 h-[820px] sm:h-[920px] lg:h-[1050px] overflow-hidden pointer-events-none">
        <HeroBackgroundVideo />
      </div>

      {/* ========================================================================= */}
      {/* LAYER 2: LIGHT ARTISAN WORKSHOP (Workflow & Features sections)           */}
      {/* ========================================================================= */}
      <div
        className="absolute inset-x-0 top-[850px] sm:top-[950px] lg:top-[1080px] h-[1300px] sm:h-[1450px] lg:h-[1650px]"
        style={{
          maskImage:
            'linear-gradient(to bottom, transparent 0%, black 16%, black 84%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent 0%, black 16%, black 84%, transparent 100%)',
        }}
      >
        <picture>
          <source media="(max-width: 768px)" srcSet={workshopLight768} type="image/webp" />
          <source media="(max-width: 1280px)" srcSet={workshopLight1280} type="image/webp" />
          <source media="(min-width: 1281px)" srcSet={workshopLight1920} type="image/webp" />
          <img
            src={workshopLightPng}
            alt=""
            role="presentation"
            loading="lazy"
            decoding="async"
            style={{ objectPosition: 'center' }}
            className="w-full h-full object-cover opacity-18"
          />
        </picture>

        {/* Soft cream veil */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(255, 249, 239, 0.82) 0%, rgba(255, 249, 239, 0.88) 50%, rgba(255, 249, 239, 0.82) 100%)',
          }}
        />
      </div>

      {/* ========================================================================= */}
      {/* LAYER 3: NEW CRAFT-MAP ATMOSPHERE (Plaster wall center, craft flanks)     */}
      {/* ========================================================================= */}
      <div
        className="absolute inset-x-0 top-[1900px] sm:top-[2100px] lg:top-[2350px] h-[1350px] sm:h-[1500px] lg:h-[1700px]"
        style={{
          maskImage:
            'linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)',
        }}
      >
        <picture>
          <source media="(max-width: 768px)" srcSet={craftMapAtmosphere768} type="image/webp" />
          <source media="(max-width: 1280px)" srcSet={craftMapAtmosphere1280} type="image/webp" />
          <source media="(min-width: 1281px)" srcSet={craftMapAtmosphere1920} type="image/webp" />
          <img
            src={craftMapAtmospherePng}
            alt=""
            role="presentation"
            loading="lazy"
            decoding="async"
            style={{ objectPosition: 'center 45%' }}
            className="w-full h-full object-cover opacity-46"
          />
        </picture>

        {/* Soft cream veil so the warm plaster merges seamlessly with the page */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(255, 249, 239, 0.42) 0%, rgba(255, 249, 239, 0.35) 45%, rgba(255, 249, 239, 0.48) 100%)',
          }}
        />
      </div>

      {/* ========================================================================= */}
      {/* LAYER 4: EVENING WORKSHOP ATMOSPHERE (Artisan story, CTA & Footer)       */}
      {/* ========================================================================= */}
      <div
        className="absolute inset-x-0 top-[3200px] sm:top-[3500px] lg:top-[3850px] bottom-0"
        style={{
          maskImage:
            'linear-gradient(to bottom, transparent 0%, black 18%, black 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent 0%, black 18%, black 100%)',
        }}
      >
        <picture>
          <source media="(max-width: 768px)" srcSet={workshopNight768} type="image/webp" />
          <source media="(max-width: 1280px)" srcSet={workshopNight1280} type="image/webp" />
          <source media="(min-width: 1281px)" srcSet={workshopNight1920} type="image/webp" />
          <img
            src={workshopNightPng}
            alt=""
            role="presentation"
            loading="lazy"
            decoding="async"
            style={{ objectPosition: 'center top' }}
            className="w-full h-full object-cover opacity-40"
          />
        </picture>

        {/* Deep navy atmospheric veil for footer and CTA */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(0, 29, 54, 0.65) 0%, rgba(0, 29, 54, 0.82) 40%, rgba(0, 29, 54, 0.94) 100%)',
          }}
        />
      </div>
    </div>
  );
};
