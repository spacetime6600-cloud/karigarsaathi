import React from 'react';
import { clsx } from 'clsx';

export interface CraftThreadMarkProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  isPaused?: boolean;
}

/**
 * CraftThreadMark
 * An original continuous artisan craft-thread SVG animation inspired by Indian handloom weaving
 * and potter's wheel motions.
 *
 * Sequence:
 * 1. Draws smoothly from left to right.
 * 2. Forms a restrained circular loom / potter's wheel motion around a terracotta point.
 * 3. Settles into a subtle baseline underline.
 * 4. Respects prefers-reduced-motion with a serene static rendering.
 */
export const CraftThreadMark: React.FC<CraftThreadMarkProps> = ({
  className,
  size = 'md',
  isPaused = false,
}) => {
  const sizeClasses = {
    sm: 'w-[64px] h-[32px]',
    md: 'w-[78px] sm:w-[92px] h-[38px] sm:h-[44px]',
    lg: 'w-[96px] sm:w-[110px] h-[48px] sm:h-[54px]',
  };

  return (
    <div
      aria-hidden="true"
      className={clsx(
        'craft-thread-wrapper relative flex items-center justify-center select-none',
        sizeClasses[size],
        className
      )}
    >
      <svg
        viewBox="0 0 100 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={clsx('w-full h-full overflow-visible', isPaused && 'craft-thread--paused')}
      >
        {/* Background Guide / Faint Powder Blue Trace */}
        <path
          d="M 8,24 C 22,24 32,10 50,10 C 64,10 74,18 74,26 C 74,34 64,38 50,38 C 36,38 36,24 50,24 C 62,24 76,24 92,24"
          fill="none"
          stroke="rgba(175, 201, 234, 0.22)"
          strokeWidth="1.5"
          strokeDasharray="3 3"
          strokeLinecap="round"
        />

        {/* Continuous Hand-Drawn Artisan Thread (Warm Cream) */}
        <path
          className="craft-thread-path"
          d="M 8,24 C 22,24 32,10 50,10 C 64,10 74,18 74,26 C 74,34 64,38 50,38 C 36,38 36,24 50,24 C 62,24 76,24 92,24"
          fill="none"
          stroke="#FFF9EF"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Central Terracotta Focal Point */}
        <circle
          cx="50"
          cy="24"
          r="3.5"
          fill="#A13F1C"
          className="craft-thread-dot"
        />

        {/* Grounding Underline Accent */}
        <line
          x1="32"
          y1="44"
          x2="68"
          y2="44"
          stroke="#A13F1C"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="craft-thread-underline"
        />
      </svg>
    </div>
  );
};
