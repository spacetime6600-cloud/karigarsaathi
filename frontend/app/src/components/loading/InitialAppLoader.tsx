import React, { useState, useEffect } from 'react';
import { useOptionalAuth } from '@/app/providers/AuthProvider';
import { KarigarIntro, INTRO_SESSION_KEY } from './KarigarIntro';
import { KarigarLoader } from './KarigarLoader';
import { prefetchPublicRoutes } from './prefetchRoutes';

export interface InitialAppLoaderProps {
  children?: React.ReactNode;
}

/**
 * InitialAppLoader
 * Manages the opening animation sequence on initial session entry or full reload,
 * synchronizing with Firebase authentication readiness and profile resolution.
 *
 * Sequence:
 * 1. Session start: Fullscreen KarigarIntro plays handcrafted artisan thread drawing.
 * 2. Underlying application and public header mount simultaneously.
 * 3. Once animation + auth resolution complete, an organic radial mask reveals the homepage.
 * 4. Subsequent navigations within session bypass the intro via sessionStorage.
 */
export const InitialAppLoader: React.FC<InitialAppLoaderProps> = ({ children }) => {
  const auth = useOptionalAuth();
  const isAuthLoading = auth ? auth.isLoading : false;

  // Check if session has already seen the opening intro
  const [hasSeenIntro, setHasSeenIntro] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        return sessionStorage.getItem(INTRO_SESSION_KEY) === 'true';
      }
    } catch {
      // ignore storage error
    }
    return false;
  });

  const [isIntroComplete, setIsIntroComplete] = useState<boolean>(hasSeenIntro);
  const [isDone, setIsDone] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // When intro completes, store session mark and prefetch public routes
  const handleIntroComplete = () => {
    setIsIntroComplete(true);
    setHasSeenIntro(true);
    prefetchPublicRoutes();
  };

  // If intro has already been seen in this session, fallback to standard loader if auth is still resolving
  useEffect(() => {
    if (hasSeenIntro && !isAuthLoading && !isDone) {
      setIsExiting(true);
      const timer = setTimeout(() => {
        setIsDone(true);
        setIsExiting(false);
        prefetchPublicRoutes();
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [hasSeenIntro, isAuthLoading, isDone]);

  // First session visit: Display handcrafted KarigarIntro
  if (!isIntroComplete) {
    return (
      <>
        {children}
        <KarigarIntro
          appReady={!isAuthLoading}
          onComplete={handleIntroComplete}
        />
      </>
    );
  }

  // Subsequent route / session loads: Gracefully fade standard loader if auth is pending
  return (
    <>
      {children}
      {!isDone && isAuthLoading && (
        <KarigarLoader
          visible={!isExiting}
          variant="initial"
          className={`transition-all duration-450 ease-out ${
            isExiting ? 'opacity-0 -translate-y-1.5 pointer-events-none' : 'opacity-100 translate-y-0'
          }`}
        />
      )}
    </>
  );
};
