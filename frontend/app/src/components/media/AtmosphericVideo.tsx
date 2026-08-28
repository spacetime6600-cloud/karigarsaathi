import React, { useState, useEffect, useRef } from 'react';
import { clsx } from 'clsx';

export interface AtmosphericVideoProps {
  desktopMp4: string;
  desktopWebm?: string;
  mobileMp4?: string;
  poster: string;
  className?: string;
  objectPosition?: string;
  mobileObjectPosition?: string;
  veilVariant: 'homepage' | 'marketplace' | 'story';
  fadeTop?: boolean;
  fadeBottom?: boolean;
  priority?: boolean;
  onLoadedData?: () => void;
}

export const AtmosphericVideo: React.FC<AtmosphericVideoProps> = ({
  desktopMp4,
  desktopWebm,
  mobileMp4,
  poster,
  className,
  objectPosition = 'center center',
  mobileObjectPosition,
  veilVariant,
  fadeTop = false,
  fadeBottom = true,
  priority = false,
  onLoadedData,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isSaveData, setIsSaveData] = useState(false);

  // 1. Check user preferences: reduced motion and data saving
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (typeof window.matchMedia === 'function') {
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (motionQuery) {
          setIsReducedMotion(motionQuery.matches);

          const handleMotionChange = (e: MediaQueryListEvent) => {
            setIsReducedMotion(e.matches);
          };
          motionQuery.addEventListener?.('change', handleMotionChange);

          return () => {
            motionQuery.removeEventListener?.('change', handleMotionChange);
          };
        }
      }

      // Check Save-Data header preference
      const navConnection = (navigator as unknown as { connection?: { saveData?: boolean } })?.connection;
      if (navConnection?.saveData) {
        setIsSaveData(true);
      }
    }
  }, []);

  // 2. Viewport IntersectionObserver & Page Visibility API
  useEffect(() => {
    if (isReducedMotion || isSaveData || hasError) return;

    const videoEl = videoRef.current;
    const containerEl = containerRef.current;
    if (!videoEl || !containerEl) return;

    let isVisibleInViewport = true;
    let observer: IntersectionObserver | null = null;

    // Viewport IntersectionObserver
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        ([entry]) => {
          isVisibleInViewport = entry?.isIntersecting ?? false;
          if (entry?.isIntersecting && !document.hidden) {
            videoEl.play().catch(() => {
              // Autoplay policy fallback
            });
          } else {
            videoEl.pause();
          }
        },
        { threshold: 0.15 }
      );

      observer.observe(containerEl);
    }

    // Tab visibility handler
    const handleVisibilityChange = () => {
      if (document.hidden) {
        videoEl.pause();
      } else if (isVisibleInViewport) {
        videoEl.play().catch(() => {});
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      observer?.disconnect();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [isReducedMotion, isSaveData, hasError]);

  const handleVideoLoaded = () => {
    setIsVideoLoaded(true);
    onLoadedData?.();
  };

  const handleVideoError = () => {
    setHasError(true);
  };

  const shouldDisableVideo = isReducedMotion || isSaveData || hasError;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="atmospheric-video-container absolute inset-0 z-0 overflow-hidden pointer-events-none select-none"
    >
      {/* 1. Base Graded Poster Image (Always present for instant paint and fallback) */}
      <img
        src={poster}
        alt=""
        role="presentation"
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={clsx(
          'marketplace-hero__poster absolute inset-0 w-full h-full object-cover transition-opacity duration-700',
          shouldDisableVideo || !isVideoLoaded ? 'opacity-100' : 'opacity-0',
          className
        )}
        style={{
          objectPosition: mobileObjectPosition
            ? `var(--m-pos, ${objectPosition})`
            : objectPosition,
        }}
      />

      {/* 2. Optimized Semantic Video Element */}
      {!shouldDisableVideo && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload={priority ? 'auto' : 'metadata'}
          poster={poster}
          aria-hidden="true"
          tabIndex={-1}
          disablePictureInPicture
          onLoadedData={handleVideoLoaded}
          onError={handleVideoError}
          className={clsx(
            'marketplace-hero__video absolute inset-0 w-full h-full object-cover transition-opacity duration-700',
            isVideoLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          style={{
            objectPosition: objectPosition,
          }}
        >
          {desktopWebm && <source src={desktopWebm} type="video/webm" />}
          {mobileMp4 && (
            <source
              src={mobileMp4}
              type="video/mp4"
              media="(max-width: 768px)"
            />
          )}
          <source src={desktopMp4} type="video/mp4" />
        </video>
      )}

      {/* 3. Text Contrast Veil Variants */}
      {veilVariant === 'marketplace' && (
        <div className="marketplace-hero__video-veil marketplace-hero__veil absolute inset-0 pointer-events-none" />
      )}

      {veilVariant === 'homepage' && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, rgba(0, 29, 54, 0.88) 0%, rgba(0, 29, 54, 0.65) 45%, rgba(0, 29, 54, 0.20) 75%, transparent 100%)',
          }}
        />
      )}

      {veilVariant === 'story' && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(0, 29, 54, 0.4) 0%, rgba(0, 29, 54, 0.75) 100%)',
          }}
        />
      )}

      {/* 4. Spatial Top Fade */}
      {fadeTop && (
        <div
          className="absolute top-0 left-0 right-0 h-24 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, #FFF9EF 0%, rgba(255, 249, 239, 0.6) 50%, transparent 100%)',
          }}
        />
      )}

      {/* 5. Spatial Bottom Fade */}
      {fadeBottom && (
        <div
          className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, transparent 0%, rgba(255, 249, 239, 0.6) 50%, #FFF9EF 100%)',
          }}
        />
      )}
    </div>
  );
};
