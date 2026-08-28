import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'error' | 'neutral' | 'indigo' | 'terracotta';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  icon,
  children,
  ...props
}) => {
  const variants = {
    success: 'bg-success-container text-on-success-container border-green-200',
    warning: 'bg-warning-container text-on-warning-container border-amber-200',
    error: 'bg-error-container text-on-error-container border-red-200',
    neutral: 'bg-surface-container text-on-surface-variant border-surface-variant',
    indigo: 'bg-primary-fixed text-on-primary-fixed border-primary-fixed-dim',
    terracotta: 'bg-secondary-fixed text-on-secondary-fixed border-secondary-container',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border select-none',
          variants[variant],
          className
        )
      )}
      {...props}
    >
      {icon && <span className="shrink-0 text-sm">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
