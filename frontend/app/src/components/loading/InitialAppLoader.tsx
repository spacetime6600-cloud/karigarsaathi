import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { KarigarLoader } from './KarigarLoader';
import { prefetchPublicRoutes } from './prefetchRoutes';

export interface InitialAppLoaderProps {
  children?: React.ReactNode;
}

/**
 * InitialAppLoader
 * Manages full-viewport initial startup presentation until Firebase authentication
 * and initial route decisions have completely resolved.
 *
 * Exit sequence:
 * 1. Auth & user profile resolution completes.
 * 2. Brand shifts upward by 5px.
 * 3. Opacity decreases from 1 -> 0 over 450ms.
 * 4. Destination page appears smoothly beneath.
 * 5. Overlay is completely unmounted.
 */
export const InitialAppLoader: React.FC<InitialAppLoaderProps> = ({ children }) => {
  const { isLoading } = useAuth();
  const [isDone, setIsDone] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!isLoading && !isDone) {
      setIsExiting(true);
      const timer = setTimeout(() => {
        setIsDone(true);
        setIsExiting(false);
        prefetchPublicRoutes();
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isDone]);

  return (
    <>
      {children}
      {!isDone && (
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
