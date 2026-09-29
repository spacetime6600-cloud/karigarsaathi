import React from 'react';
import { useLocation } from 'react-router-dom';
import { clsx } from 'clsx';

export interface PageTransitionProps {
  children?: React.ReactNode;
  className?: string;
  id?: string;
  transitionKey?: string;
}

/**
 * PageTransition
 * High-performance, hardware-accelerated route content transition wrapper.
 *
 * Entrance:
 * - Opacity: 0 -> 1
 * - Translate Y: 10px -> 0
 * - Scale: 0.995 -> 1
 * - Duration: 480ms (ease-out)
 *
 * Fully respects prefers-reduced-motion with instant rendering.
 */
export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className,
  id,
  transitionKey,
}) => {
  const location = useLocation();
  const effectiveKey = transitionKey ?? location.pathname;

  return (
    <div
      key={effectiveKey}
      id={id}
      className={clsx(
        'page-transition-enter w-full motion-reduce:transform-none motion-reduce:animate-none',
        className
      )}
    >
      {children}
    </div>
  );
};
