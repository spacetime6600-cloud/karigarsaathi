import { cn } from '@/utils/helpers';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
}

export function Progress({
  value,
  max = 100,
  className,
  showLabel = false,
  variant = 'default',
  size = 'md',
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const variantStyles = {
    default: 'bg-primary-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-500',
    error: 'bg-red-600',
  };

  const sizeStyles = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'w-full bg-gray-200 rounded-full overflow-hidden',
          sizeStyles[size]
        )}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={showLabel ? `${Math.round(percentage)}%` : undefined}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300 ease-out',
            variantStyles[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span>{Math.round(percentage)}%</span>
          <span>100%</span>
        </div>
      )}
    </div>
  );
}

interface StepperProps {
  steps: Array<{ label: string; description?: string }>;
  currentStep: number;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export function Stepper({
  steps,
  currentStep,
  className,
  orientation = 'horizontal',
}: StepperProps) {
  return (
    <div
      className={cn(
        'relative',
        orientation === 'horizontal' ? 'flex items-center' : 'flex flex-col items-start',
        className
      )}
    >
      {orientation === 'horizontal' && (
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -z-10" />
      )}
      {orientation === 'vertical' && (
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 -z-10" />
      )}
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        return (
          <div
            key={index}
            className={cn(
              'relative flex items-center',
              orientation === 'horizontal' ? 'flex-1' : 'w-full'
            )}
          >
            <div
              className={cn(
                'relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all',
                isActive
                  ? 'bg-primary-600 border-primary-600 text-white'
                  : isCompleted
                  ? 'bg-green-600 border-green-600 text-white'
                  : 'bg-white border-gray-300 text-gray-400'
              )}
            >
              {isCompleted ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>
            <div
              className={cn(
                orientation === 'horizontal' ? 'ml-3' : 'ml-12 mt-2'
              )}
            >
              <p className={cn('font-medium text-sm', isActive ? 'text-gray-900' : 'text-gray-600')}>
                {step.label}
              </p>
              {step.description && (
                <p className={cn('text-xs', isActive ? 'text-gray-500' : 'text-gray-400')}>
                  {step.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showValue?: boolean;
}

export function CircularProgress({
  value,
  max = 100,
  size = 60,
  strokeWidth = 6,
  className,
  showValue = true,
}: CircularProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#0ea5e9"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
          style={{ filter: 'drop-shadow(0 2px 4px rgba(14, 165, 233, 0.3))' }}
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-gray-900">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
}