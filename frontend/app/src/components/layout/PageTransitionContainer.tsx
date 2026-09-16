import React from 'react';
import { useLocation } from 'react-router-dom';
import { clsx } from 'clsx';

interface PageTransitionContainerProps {
  children?: React.ReactNode;
  className?: string;
  id?: string;
}

/**
 * Lightweight, hardware-accelerated page transition container.
 * Animates only when the top-level route pathname changes.
 * Avoids re-animating on search query updates, form typing, or local state changes.
 */
export const PageTransitionContainer: React.FC<PageTransitionContainerProps> = ({
  children,
  className,
  id,
}) => {
  const location = useLocation();

  return (
    <div
      key={location.pathname}
      id={id}
      className={clsx('page-transition-enter w-full', className)}
    >
      {children}
    </div>
  );
};
