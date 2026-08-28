import React from 'react';
import { clsx } from 'clsx';
import { Check } from 'lucide-react';

export interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps?: number;
  steps?: string[];
  className?: string;
}

export const defaultProductSteps = [
  'Photographs',
  'Details',
  'Review Facts',
  'Choose Price',
  'Public Fields',
  'Approve',
  'Craft Passport',
  'Share & Export',
];

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps = 8,
  steps = defaultProductSteps,
  className,
}) => {
  const percent = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className={clsx('w-full flex flex-col gap-2', className)}>
      {/* Mobile Compact Progress (< 768px) */}
      <div className="flex md:hidden flex-col gap-1.5 w-full">
        <div className="flex justify-between items-center text-xs font-semibold text-on-surface-variant">
          <span>
            Step {currentStep} of {totalSteps}:{' '}
            <strong className="text-primary">{steps[currentStep - 1] || 'In Progress'}</strong>
          </span>
          <span className="font-mono font-bold text-primary">{percent}%</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-2 w-full bg-surface-variant rounded-full overflow-hidden"
        >
          <div
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Desktop Stepper (>= 768px) */}
      <div className="hidden md:flex items-center justify-between gap-2 w-full">
        {steps.map((label, idx) => {
          const stepNum = idx + 1;
          const isDone = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <div key={label} className="flex items-center flex-1 last:flex-none gap-2">
              <div className="flex items-center gap-2">
                <div
                  className={clsx(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0',
                    isDone && 'bg-primary text-white',
                    isCurrent && 'bg-secondary text-white shadow-sm ring-2 ring-secondary/30',
                    !isDone && !isCurrent && 'bg-surface-variant text-on-surface-variant'
                  )}
                >
                  {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : stepNum}
                </div>
                <span
                  className={clsx(
                    'text-xs whitespace-nowrap transition-colors',
                    isCurrent && 'font-bold text-primary',
                    isDone && 'font-medium text-on-surface',
                    !isDone && !isCurrent && 'text-on-surface-variant/70'
                  )}
                >
                  {label}
                </span>
              </div>

              {idx < steps.length - 1 && (
                <div
                  className={clsx(
                    'h-0.5 flex-1 transition-colors mx-1',
                    stepNum < currentStep ? 'bg-primary' : 'bg-surface-variant'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
