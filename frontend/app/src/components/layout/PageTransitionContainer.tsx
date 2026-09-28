import React from 'react';
import { useLocation } from 'react-router-dom';
import { clsx } from 'clsx';

export interface PageTransitionContainerProps {
  children?: React.ReactNode;
  className?: string;
  id?: string;
  transitionKey?: string;
}

/**
 * Lightweight, hardware-accelerated page transition container.
 * Animates a consistent short fade with slight vertical movement when top-level route or transitionKey changes.
 * Avoids re-animating on search query updates, form typing, or local state changes.
 * Fully honors prefers-reduced-motion by removing movement.
 */
export const PageTransitionContainer: React.FC<PageTransitionContainerProps> = ({
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
