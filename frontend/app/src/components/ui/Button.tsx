import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-bold tracking-tight rounded-md transition-[transform,background-color,border-color,box-shadow,opacity] duration-150 ease-out active:scale-[0.985] select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-fixed-dim focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 touch-target motion-reduce:transform-none motion-reduce:transition-none';

  const sizeStyles = {
    sm: 'text-xs px-3 py-2 min-h-[48px]',
    md: 'text-sm px-5 py-2.5 min-h-[48px]',
    lg: 'text-base px-6 py-3.5 min-h-[56px]',
  };

  const variantStyles = {
    primary:
      'bg-secondary hover:bg-secondary-hover text-on-secondary shadow-sm hover:shadow-md action-shadow',
    secondary:
      'bg-surface-container-lowest text-primary border-2 border-primary hover:bg-surface-container-low',
    tertiary:
      'bg-transparent text-primary hover:bg-surface-container-high border border-outline-variant',
    danger:
      'bg-error hover:bg-red-700 text-on-error shadow-sm',
    ghost:
      'bg-transparent text-on-surface-variant hover:text-primary hover:bg-surface-container-high',
  };

  return (
    <button
      className={clsx(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin mr-2 shrink-0" />
      ) : leftIcon ? (
        <span className="mr-2 inline-flex shrink-0">{leftIcon}</span>
      ) : null}

      <span className="inline-flex items-center justify-center gap-2.5 whitespace-nowrap">{children}</span>

      {!isLoading && rightIcon && (
        <span className="ml-2 inline-flex shrink-0">{rightIcon}</span>
      )}
    </button>
  );
};
