import React from 'react';
import { clsx } from 'clsx';

export interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  required = false,
  className,
}) => {
  return (
    <label
      className={clsx(
        'flex items-center justify-between p-3.5 rounded-lg transition-colors cursor-pointer select-none min-h-[52px]',
        disabled ? 'cursor-not-allowed opacity-75' : 'hover:bg-surface-container-low',
        className
      )}
    >
      <div className="flex flex-col pr-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-on-surface">{label}</span>
          {required && (
            <span className="text-[10px] uppercase font-bold text-primary px-2 py-0.5 rounded bg-primary-fixed">
              Required
            </span>
          )}
        </div>
        {description && (
          <span className="text-xs text-on-surface-variant mt-0.5">{description}</span>
        )}
      </div>

      <div className={clsx('toggle-switch', disabled && 'disabled-toggle')}>
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => !disabled && onChange?.(e.target.checked)}
          className="sr-only"
        />
        <span className="toggle-slider" />
      </div>
    </label>
  );
};
