import React, { useState, useEffect, useCallback, useRef } from 'react';
import { clsx } from 'clsx';
import { AlertCircle, RotateCcw, ArrowRight } from 'lucide-react';
import workshopNightPng from '@/assets/ecosystem/craft-workshop-night.png';

export interface KarigarIntroProps {
  appReady?: boolean;
  onComplete?: () => void;
  forceShow?: boolean;
  className?: string;
}

export const INTRO_SESSION_KEY = 'karigarsaathi-intro-seen';

type IntroStage = 'init' | 'drawing' | 'settling' | 'brand' | 'settled' | 'revealing' | 'done';

/**
 * KarigarIntro
 * Fullscreen artisan opening experience before the website appears.
 *
 * Sequence:
 * 1. Deep navy radial background (#001D36) softly appears.
 * 2. Terracotta central point appears (0-250ms).
 * 3. Warm cream thread draws minimal pottery/loom silhouette (200-1250ms).
 * 4. Shape settles into brand baseline underline (1050-1550ms).
 * 5. "KarigarSaathi" text fades upward into view (1250-1850ms).
 * 6. "ARTISAN DIGITISATION" appears beneath in terracotta uppercase.
 * 7. Supporting line: "Crafted by hand. Carried forward digitally."
 * 8. Soft expanding circular mask transition reveals the underlying application (650-800ms).
 */
export const KarigarIntro: React.FC<KarigarIntroProps> = ({
  appReady = true,
  onComplete,
  forceShow = false,
  className,
}) => {
  const [stage, setStage] = useState<IntroStage>('init');
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const completedRef = useRef(false);
  const appReadyRef = useRef(appReady);

  useEffect(() => {
    appReadyRef.current = appReady;
  }, [appReady]);

  // Check reduced motion safely
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      try {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (mediaQuery) {
          setPrefersReducedMotion(mediaQuery.matches);

          const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
          if (typeof mediaQuery.addEventListener === 'function') {
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
          } else if ('addListener' in mediaQuery && typeof (mediaQuery as { addListener: (cb: (e: MediaQueryListEvent) => void) => void }).addListener === 'function') {
            const legacyQuery = mediaQuery as {
              addListener: (cb: (e: MediaQueryListEvent) => void) => void;
              removeListener: (cb: (e: MediaQueryListEvent) => void) => void;
            };
            legacyQuery.addListener(handleChange);
            return () => legacyQuery.removeListener(handleChange);
          }
        }
      } catch {
        // ignore matchMedia error
      }
    }
  }, []);

  const finishIntro = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(INTRO_SESSION_KEY, 'true');
      }
    } catch {
      // ignore storage error
    }
    setStage('done');
    onComplete?.();
  }, [onComplete]);

  // Reduced motion fast-path
  useEffect(() => {
    if (!prefersReducedMotion) return;

    // Immediately show brand, wait for appReady, then reveal
    setStage('brand');
    const timer = setTimeout(() => {
      if (appReadyRef.current) {
        setStage('revealing');
      } else {
        setStage('settled');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [prefersReducedMotion]);

  // Main animation orchestrator for normal motion
  useEffect(() => {
    if (prefersReducedMotion) return;

    // Stage 1: Drawing starts at 100ms
    const t1 = setTimeout(() => {
      setStage('drawing');
    }, 100);

    // Stage 2: Settling starts at 1050ms
    const t2 = setTimeout(() => {
      setStage('settling');
    }, 1050);

    // Stage 3: Brand text reveals at 1350ms
    const t3 = setTimeout(() => {
      setStage('brand');
    }, 1350);

    // Stage 4: Animation completes at 2050ms -> Check if app is ready
    const t4 = setTimeout(() => {
      if (appReadyRef.current) {
        setStage('revealing');
      } else {
        setStage('settled');
      }
    }, 2050);

    // Safety timeout: 8.5s fallback
    const tTimeout = setTimeout(() => {
      if (!completedRef.current) {
        setIsTimedOut(true);
      }
    }, 8500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(tTimeout);
    };
  }, [prefersReducedMotion]);

  // If we were waiting in 'settled' state and appReady becomes true, trigger reveal
  useEffect(() => {
    if (stage === 'settled' && appReady && !completedRef.current) {
      setStage('revealing');
    }
  }, [stage, appReady]);

  // Dedicated timer for the revealing mask transition
  useEffect(() => {
    if (stage === 'revealing' && !completedRef.current) {
      const revealDuration = prefersReducedMotion ? 400 : 750;
      const timer = setTimeout(finishIntro, revealDuration);
      return () => clearTimeout(timer);
    }
  }, [stage, prefersReducedMotion, finishIntro]);

  if (stage === 'done') {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="KarigarSaathi is preparing"
      data-intro-stage={stage}
      className={clsx(
        'karigar-intro fixed inset-0 z-[99999] flex flex-col items-center justify-center select-none overflow-hidden',
        stage === 'revealing' && 'karigar-intro--revealing',
        className
      )}
      style={{
        backgroundColor: '#001D36',
        backgroundImage:
          'radial-gradient(circle at 50% 46%, rgba(161, 63, 28, 0.14) 0%, rgba(0, 29, 54, 0.95) 45%, #001D36 100%)',
      }}
    >
      {/* Subtle workshop texture backdrop */}
      <img
        src={workshopNightPng}
        alt=""
        role="presentation"
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-[0.045] mix-blend-luminosity"
      />

      {/* Screen-reader announcement */}
      <span className="sr-only">KarigarSaathi - Artisan Digitisation. Preparing your experience.</span>

      {/* Center Animated Branded Composition */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-md px-6 text-center">
        {/* Continuous Handcrafted SVG Thread Animation */}
        <div
          aria-hidden="true"
          className="karigar-intro__thread-box relative w-[130px] sm:w-[150px] h-[64px] sm:h-[72px] mb-4 flex items-center justify-center"
        >
          <svg
            viewBox="0 0 120 56"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full overflow-visible"
          >
            {/* Guide curve trace */}
            <path
              d="M 10,28 C 26,28 36,12 60,12 C 78,12 90,20 90,30 C 90,40 78,44 60,44 C 42,44 42,28 60,28 C 76,28 92,28 110,28"
              fill="none"
              stroke="rgba(175, 201, 234, 0.20)"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              strokeLinecap="round"
            />

            {/* Continuous Hand-Drawn Artisan Thread */}
            <path
              className={clsx(
                'karigar-intro__path',
                (stage === 'drawing' || stage === 'settling' || stage === 'brand' || stage === 'settled' || stage === 'revealing') &&
                  'karigar-intro__path--active'
              )}
              d="M 10,28 C 26,28 36,12 60,12 C 78,12 90,20 90,30 C 90,40 78,44 60,44 C 42,44 42,28 60,28 C 76,28 92,28 110,28"
              fill="none"
              stroke="#FFF9EF"
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Central Terracotta Focal Point */}
            <circle
              cx="60"
              cy="28"
              r="4"
              fill="#A13F1C"
              className={clsx(
                'karigar-intro__dot',
                stage !== 'init' && 'karigar-intro__dot--visible'
              )}
            />

            {/* Grounding Baseline Underline */}
            <line
              x1="36"
              y1="52"
              x2="84"
              y2="52"
              stroke="#A13F1C"
              strokeWidth="1.75"
              strokeLinecap="round"
              className={clsx(
                'karigar-intro__underline',
                (stage === 'settling' || stage === 'brand' || stage === 'settled' || stage === 'revealing') &&
                  'karigar-intro__underline--drawn'
              )}
            />
          </svg>
        </div>

        {/* Brand Typography & Subtitles */}
        <div
          className={clsx(
            'karigar-intro__text-group flex flex-col items-center transition-all duration-700 ease-out',
            stage === 'brand' || stage === 'settled' || stage === 'revealing'
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-3 pointer-events-none'
          )}
        >
          {/* Brand Name */}
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#FFF9EF] tracking-tight leading-none drop-shadow-sm">
            KarigarSaathi
          </h1>

          {/* Subtitle Badge */}
          <span className="font-sans text-[11px] sm:text-[12px] font-bold text-[#A13F1C] tracking-[0.22em] uppercase mt-2.5">
            ARTISAN DIGITISATION
          </span>

          {/* Supporting Philosophy Line */}
          <p className="font-sans text-[13px] sm:text-[14px] font-normal text-[#FFF9EF]/75 text-center mt-3 max-w-xs leading-relaxed">
            Crafted by hand. Carried forward digitally.
          </p>

          {/* Calming readiness indicator if app is taking a moment */}
          {stage === 'settled' && !isTimedOut && (
            <div className="flex items-center gap-2 mt-5 text-xs text-[#FFF9EF]/60 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-[#A13F1C]" />
              <span>Preparing your experience…</span>
            </div>
          )}
        </div>

        {/* Timeout / Slow Connection Recovery UI */}
        {isTimedOut && (
          <div className="flex flex-col items-center gap-3 mt-6 p-4 rounded-xl bg-white/5 border border-white/10 text-center animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-xs text-[#FFF9EF]/80">
              <AlertCircle className="w-4 h-4 text-[#A13F1C]" />
              <span>Connecting to the workshop is taking longer than usual</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[#FFF9EF] text-xs font-semibold transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reload</span>
              </button>
              <button
                type="button"
                onClick={finishIntro}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#A13F1C] hover:bg-[#A13F1C]/90 text-white text-xs font-semibold shadow-md transition-colors"
              >
                <span>Enter site</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Subtle Skip control in top right for dev / testing access */}
      {forceShow && (
        <button
          type="button"
          onClick={finishIntro}
          className="fixed top-6 right-6 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[#FFF9EF]/80 hover:text-white text-xs font-medium backdrop-blur-sm border border-white/15 transition-colors"
        >
          Skip Intro ✕
        </button>
      )}
    </div>
  );
};
