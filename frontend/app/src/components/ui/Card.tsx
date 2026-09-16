import React from 'react';
import { clsx } from 'clsx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: 0 | 1 | 2;
  highlighted?: boolean;
  selected?: boolean;
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  elevation = 1,
  highlighted = false,
  selected = false,
  interactive = false,
  className,
  ...props
}) => {
  return (
    <div
      className={clsx(
        'rounded-lg bg-surface-container-lowest transition-all duration-200',
        elevation === 0 && 'bg-surface-container-low border border-surface-variant',
        elevation === 1 && 'card-shadow border border-surface-variant/70',
        elevation === 2 && 'card-shadow-2 border border-surface-variant',
        highlighted && 'border-2 border-secondary bg-surface-container-lowest',
        selected && 'border-2 border-secondary ring-2 ring-secondary/20 bg-surface-container-low',
        interactive && 'motion-card-interactive cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
