import React, { useState } from 'react';
import { DateRangeOption, DateRange } from '@/domain/analytics';
import { calculateDateRange } from '@/services/api/salesService';
import { Calendar } from 'lucide-react';
import { clsx } from 'clsx';

export interface DashboardDateSelectorProps {
  currentRange: DateRange;
  onRangeChange: (range: DateRange) => void;
}

export const DashboardDateSelector: React.FC<DashboardDateSelectorProps> = ({
  currentRange,
  onRangeChange,
}) => {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customStart, setCustomStart] = useState(() => currentRange.startDate.split('T')[0]);
  const [customEnd, setCustomEnd] = useState(() => currentRange.endDate.split('T')[0]);

  const handleSelectOption = (option: DateRangeOption) => {
    if (option === 'custom') {
      setShowCustomModal(true);
    } else {
      const newRange = calculateDateRange(option);
      onRangeChange(newRange);
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStart || !customEnd) return;
    const newRange = calculateDateRange('custom', customStart, customEnd);
    onRangeChange(newRange);
    setShowCustomModal(false);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
      {/* Segmented Period Tabs */}
      <div
        role="group"
        aria-label="Analytics date range selector"
        className="inline-flex items-center bg-surface-container-low/70 p-1 rounded-xl border border-surface-variant/60 shadow-2xs"
      >
        {(['7d', '30d', '90d', 'custom'] as DateRangeOption[]).map((opt) => {
          const labels: Record<DateRangeOption, string> = {
            '7d': '7 days',
            '30d': '30 days',
            '90d': '90 days',
            custom: 'Custom',
          };
          const isSelected = currentRange.option === opt;

          return (
            <button
              key={opt}
              type="button"
              onClick={() => handleSelectOption(opt)}
              aria-pressed={isSelected}
              className={clsx(
                'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955]',
                isSelected
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-on-surface-variant hover:text-primary hover:bg-white/60'
              )}
            >
              {labels[opt]}
            </button>
          );
        })}
      </div>

      {/* Date Range Badge */}
      <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium px-2.5 py-1 rounded-lg bg-surface-container-lowest/80 border border-surface-variant/40">
        <Calendar className="w-3.5 h-3.5 text-secondary shrink-0" aria-hidden="true" />
        <span>{currentRange.label}</span>
      </div>

      {/* Custom Date Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="custom-date-title"
            className="bg-white rounded-2xl border border-surface-variant shadow-xl max-w-sm w-full p-5 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <h3 id="custom-date-title" className="text-base font-bold text-primary">
                Select custom date range
              </h3>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="text-on-surface-variant hover:text-primary p-1 rounded-lg hover:bg-surface-container"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyCustom} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label htmlFor="start-date-input" className="text-xs font-semibold text-primary">
                  Start Date
                </label>
                <input
                  id="start-date-input"
                  type="date"
                  value={customStart}
                  max={customEnd}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-variant bg-surface focus:outline-none focus:ring-2 focus:ring-secondary/50"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="end-date-input" className="text-xs font-semibold text-primary">
                  End Date
                </label>
                <input
                  id="end-date-input"
                  type="date"
                  value={customEnd}
                  min={customStart}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-surface-variant bg-surface focus:outline-none focus:ring-2 focus:ring-secondary/50"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-variant/40">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-on-surface-variant hover:text-primary rounded-lg hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-secondary hover:bg-secondary-hover rounded-lg transition-colors shadow-xs"
                >
                  Apply range
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
