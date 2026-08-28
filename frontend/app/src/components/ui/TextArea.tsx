import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, label, error, helperText, id, rows = 3, ...props }, ref) => {
    const generatedId = id || `textarea-${Math.random().toString(36).substring(2, 9)}`;

    return (
      <div className="w-full flex flex-col gap-1">
        {label && (
          <label htmlFor={generatedId} className="font-bold text-sm text-on-surface">
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={generatedId}
          rows={rows}
          aria-invalid={!!error}
          aria-describedby={error ? `${generatedId}-error` : helperText ? `${generatedId}-helper` : undefined}
          className={twMerge(
            clsx(
              'w-full bg-white border-[1.5px] rounded-md px-4 py-3 text-base text-on-surface transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-fixed-dim focus-visible:ring-offset-2',
              error ? 'border-error focus:border-error' : 'border-outline hover:border-on-surface-variant focus:border-primary',
              className
            )
          )}
          {...props}
        />

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

TextArea.displayName = 'TextArea';
