import React from 'react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';

export interface BrandLogoProps {
  to?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  to = '/artisan/dashboard',
  size = 'md',
  showTagline = false,
  className,
}) => {
  const content = (
    <div className={clsx('flex items-center gap-2.5 select-none', className)}>
      <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-white font-bold text-lg shadow-sm border border-primary-container shrink-0">
        <span className="text-marigold">K</span>
        <span className="text-secondary-container text-xs ml-0.5">S</span>
      </div>

      <div className="flex flex-col">
        <span
          className={clsx(
            'font-bold tracking-tight text-primary leading-tight font-display',
            size === 'sm' && 'text-lg',
            size === 'md' && 'text-xl',
            size === 'lg' && 'text-2xl'
          )}
        >
          KarigarSaathi
        </span>
        {showTagline && (
          <span className="text-[11px] text-on-surface-variant font-medium tracking-wide">
            शिल्पकार साथी • Craft Passport
          </span>
        )}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-fixed-dim rounded-md">
        {content}
      </Link>
    );
  }

  return content;
};
