import React, { useState, useEffect, useRef } from 'react';
import heroVideo from '@/assets/ecosystem/artisan-hero-video.mp4';
import heroPoster from '@/assets/ecosystem/artisan-hero-poster.webp';
import { clsx } from 'clsx';

export interface HeroBackgroundVideoProps {
  className?: string;
}

/**
 * HeroBackgroundVideo
 * High-performance, accessible hero background video player with:
 * - Clean visual stack (solid #001D36 theme backing -> 100% video -> readability veil -> soft bottom fade)
 * - Zero photograph ghosting: poster unmounts once the first playable frame is presented
 * - Seamless looping without flash or layer resets
 * - Preserved fallback for reduced-motion, save-data, and load errors
 */
export const HeroBackgroundVideo: React.FC<HeroBackgroundVideoProps> = ({ className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [hasPlayedFirstFrame, setHasPlayedFirstFrame] = useState(false);
  const [, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isSaveData, setIsSaveData] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(true);

  useEffect(() => {
    // 1. Check prefers-reduced-motion
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(motionQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    motionQuery.addEventListener('change', handleMotionChange);

    // 2. Check Data Saver
    interface NetworkInfo {
      saveData?: boolean;
    }
    const nav = typeof navigator !== 'undefined' ? (navigator as unknown as { connection?: NetworkInfo }) : null;
    if (nav?.connection?.saveData) {
      setIsSaveData(true);
    }

    // 3. Page Visibility API
    const handleVisibilityChange = () => {
      if (!videoRef.current) return;
      if (document.hidden) {
        videoRef.current.pause();
      } else if (!prefersReducedMotion && !isSaveData && isIntersecting) {
        videoRef.current.play().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 4. IntersectionObserver for viewport awareness (pause offscreen)
    let observer: IntersectionObserver | null = null;
    if (containerRef.current && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          const visible = entry?.isIntersecting ?? false;
          setIsIntersecting(visible);
          if (!videoRef.current) return;
          if (visible) {
            if (!document.hidden && !prefersReducedMotion && !isSaveData) {
              videoRef.current.play().catch(() => {});
            }
          } else {
            videoRef.current.pause();
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(containerRef.current);
    }

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      observer?.disconnect();
    };
  }, [prefersReducedMotion, isSaveData, isIntersecting]);

  const showFallbackPoster = !hasPlayedFirstFrame || prefersReducedMotion || isSaveData || hasError;

  return (
    <div
      ref={containerRef}
      className={clsx(
        'hero-media absolute inset-0 z-0 bg-[#001D36] select-none overflow-hidden',
        className
      )}
      style={{
        maskImage:
          'linear-gradient(to bottom, #000 0%, #000 76%, rgba(0, 0, 0, 0.92) 84%, rgba(0, 0, 0, 0.55) 92%, transparent 100%)',
        WebkitMaskImage:
          'linear-gradient(to bottom, #000 0%, #000 76%, rgba(0, 0, 0, 0.92) 84%, rgba(0, 0, 0, 0.55) 92%, transparent 100%)',
      }}
    >
      {/* Fallback Poster (Rendered only before first playable frame or when video disabled) */}
      {showFallbackPoster && (
        <picture>
          <img
            className="hero-media__poster absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
            style={{ objectPosition: 'center 20%' }}
            src={heroPoster}
            alt=""
            role="presentation"
            loading="eager"
            decoding="async"
          />
        </picture>
      )}

      {/* Semantic Video Element (Full opacity, seamless loop over solid backing) */}
      {!isSaveData && !prefersReducedMotion && !hasError && (
        <video
          ref={videoRef}
          className={clsx(
            'hero-media__video absolute inset-0 w-full h-full object-cover pointer-events-none z-[1] transition-opacity duration-300 ease-out',
            hasPlayedFirstFrame ? 'opacity-100' : 'opacity-0'
          )}
          style={{ objectPosition: 'center 20%' }}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          tabIndex={-1}
          disablePictureInPicture
          aria-hidden="true"
          onPlaying={() => {
            setIsPlaying(true);
            setHasPlayedFirstFrame(true);
          }}
          onTimeUpdate={() => {
            if (!hasPlayedFirstFrame && videoRef.current && videoRef.current.currentTime > 0) {
              setHasPlayedFirstFrame(true);
              setIsPlaying(true);
            }
          }}
          onError={() => setHasError(true)}
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
      )}

      {/* Navy Readability Veil (Restrained gradient over video) */}
      <div
        className="hero-media__veil absolute inset-0 pointer-events-none z-[2]"
        style={{
          background:
            'linear-gradient(90deg, rgba(0, 29, 54, 0.88) 0%, rgba(0, 29, 54, 0.62) 42%, rgba(0, 29, 54, 0.20) 78%, transparent 100%)',
        }}
      />

      {/* Soft Bottom Atmospheric Fade into Warm Cream Base */}
      <div
        className="absolute inset-0 pointer-events-none z-[3]"
        style={{
          background:
            'linear-gradient(180deg, rgba(0, 29, 54, 0.25) 0%, transparent 45%, rgba(255, 249, 239, 0.15) 75%, #FFF9EF 100%)',
        }}
      />
    </div>
  );
};
