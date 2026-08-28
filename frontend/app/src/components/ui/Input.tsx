import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
    const generatedId = id || `input-${Math.random().toString(36).substring(2, 9)}`;

    return (
      <div className="w-full flex flex-col gap-1">
        {label && (
          <label htmlFor={generatedId} className="font-bold text-sm text-on-surface">
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3.5 text-on-surface-variant pointer-events-none flex items-center">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={generatedId}
            aria-invalid={!!error}
            aria-describedby={error ? `${generatedId}-error` : helperText ? `${generatedId}-helper` : undefined}
            className={twMerge(
              clsx(
                'w-full bg-white border-[1.5px] rounded-md px-4 py-3 text-base text-on-surface transition-colors min-h-[48px] touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-fixed-dim focus-visible:ring-offset-2',
                error ? 'border-error focus:border-error' : 'border-outline hover:border-on-surface-variant focus:border-primary',
                leftIcon && 'pl-11',
                rightIcon && 'pr-11',
                className
              )
            )}
            {...props}
          />

          {rightIcon && (
            <span className="absolute right-3.5 text-on-surface-variant flex items-center">
              {rightIcon}
            </span>
          )}
        </div>

        {error ? (
          <p id={`${generatedId}-error`} className="text-xs text-error font-medium mt-0.5">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${generatedId}-helper`} className="text-xs text-on-surface-variant mt-0.5">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
