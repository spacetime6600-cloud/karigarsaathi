import React, { useState, useRef, useCallback } from 'react';
import { QualityMetrics } from '@/types';
import { Sparkles, Image as ImageIcon, Sliders, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';

interface ImageComparisonViewerProps {
  originalUrl: string;
  enhancedUrl: string;
  metrics?: QualityMetrics;
  warnings?: string[];
  className?: string;
}

export const ImageComparisonViewer: React.FC<ImageComparisonViewerProps> = ({
  originalUrl,
  enhancedUrl,
  metrics,
  warnings,
  className,
}) => {
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage 0-100
  const [viewMode, setViewMode] = useState<'split' | 'original' | 'enhanced'>('split');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSliderMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && viewMode === 'split') {
      handleSliderMove(e.clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (viewMode === 'split' && e.touches.length > 0) {
      handleSliderMove(e.touches[0].clientX);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (viewMode !== 'split') return;
    if (e.key === 'ArrowLeft') {
      setSliderPosition((prev) => Math.max(0, prev - 5));
    } else if (e.key === 'ArrowRight') {
      setSliderPosition((prev) => Math.min(100, prev + 5));
    }
  };

  return (
    <div className={clsx('flex flex-col gap-4', className)}>
      {/* View Mode Toggle Controls */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 bg-surface-container-high rounded-xl border border-surface-variant">
          <button
            type="button"
            onClick={() => setViewMode('original')}
            aria-pressed={viewMode === 'original'}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 touch-target',
              viewMode === 'original'
                ? 'bg-primary text-white shadow-xs'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface'
            )}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Original Only</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('split')}
            aria-pressed={viewMode === 'split'}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 touch-target',
              viewMode === 'split'
                ? 'bg-secondary text-white shadow-xs'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface'
            )}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Split Comparison</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('enhanced')}
            aria-pressed={viewMode === 'enhanced'}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 touch-target',
              viewMode === 'enhanced'
                ? 'bg-primary text-white shadow-xs'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface'
            )}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Enhanced Only</span>
          </button>
        </div>

        {viewMode === 'split' && (
          <div className="text-[11px] text-on-surface-variant font-medium hidden sm:block">
            Drag slider or use <kbd className="px-1.5 py-0.5 bg-surface-container rounded border text-[10px]">←</kbd> <kbd className="px-1.5 py-0.5 bg-surface-container rounded border text-[10px]">→</kbd> to compare
          </div>
        )}
      </div>

      {/* Main Image Viewport Area */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        className="relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden bg-slate-900 border border-surface-variant select-none cursor-ew-resize shadow-inner"
        tabIndex={viewMode === 'split' ? 0 : undefined}
        onKeyDown={handleKeyDown}
        role={viewMode === 'split' ? 'slider' : 'region'}
        aria-label="Image before and after comparison slider"
        aria-valuenow={viewMode === 'split' ? Math.round(sliderPosition) : undefined}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {/* Full Bottom Layer: Enhanced Image */}
        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-radial from-slate-800 to-slate-950">
          <img
            src={viewMode === 'original' ? originalUrl : enhancedUrl}
            alt="Enhanced product photograph"
            className="w-full h-full object-contain pointer-events-none"
          />
          <div className="absolute top-3 right-3 bg-secondary/90 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>Enhanced (512×512)</span>
          </div>
        </div>

        {/* Top Clipped Layer: Original Image (when in split mode) */}
        {viewMode === 'split' && (
          <div
            className="absolute inset-y-0 left-0 overflow-hidden bg-radial from-slate-900 to-slate-950 border-r border-white/60 shadow-xl"
            style={{ width: `${sliderPosition}%` }}
          >
            <div
              className="absolute inset-y-0 left-0 h-full"
              style={{
                width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
              }}
            >
              <img
                src={originalUrl}
                alt="Original artisan photograph"
                className="w-full h-full object-contain pointer-events-none"
              />
            </div>
            <div className="absolute top-3 left-3 bg-primary/90 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
              <ImageIcon className="w-3 h-3" />
              <span>Original Photo</span>
            </div>
          </div>
        )}

        {/* Draggable Vertical Slider Handle */}
        {viewMode === 'split' && (
          <div
            onMouseDown={handleMouseDown}
            className="absolute inset-y-0 flex items-center justify-center cursor-ew-resize"
            style={{ left: `calc(${sliderPosition}% - 16px)` }}
          >
            <div className="w-8 h-8 rounded-full bg-white text-primary shadow-lg border-2 border-secondary flex items-center justify-center transition-transform hover:scale-110 active:scale-95">
              <Sliders className="w-4 h-4 text-secondary rotate-90" />
            </div>
          </div>
        )}
      </div>

      {/* Safety & Fidelity Metrics Section */}
      {metrics && (
        <div className="p-4 bg-surface-container-low rounded-xl border border-surface-variant/80 flex flex-col gap-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-primary flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
              Fidelity & Craft Authenticity Guardrails
            </span>
            <span className="text-[11px] text-on-surface-variant">Conservative AI</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            {typeof metrics.mean_delta_e === 'number' && (
              <div className="p-2.5 bg-white rounded-lg border border-surface-variant flex flex-col gap-0.5">
                <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Colour Difference (ΔE)</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono font-bold text-sm text-primary">{metrics.mean_delta_e.toFixed(2)}</span>
                  <span className="text-[10px] text-success font-semibold">(≤ 3.0 target)</span>
                </div>
              </div>
            )}

            {typeof metrics.luminance_ssim === 'number' && (
              <div className="p-2.5 bg-white rounded-lg border border-surface-variant flex flex-col gap-0.5">
                <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Luminance SSIM</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono font-bold text-sm text-primary">{metrics.luminance_ssim.toFixed(2)}</span>
                  <span className="text-[10px] text-success font-semibold">(≥ 0.92 target)</span>
                </div>
              </div>
            )}

            {typeof metrics.edge_preservation_ratio === 'number' && (
              <div className="p-2.5 bg-white rounded-lg border border-surface-variant flex flex-col gap-0.5">
                <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Edge Preservation</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono font-bold text-sm text-primary">
                    {Math.min(100, Math.max(0, metrics.edge_preservation_ratio <= 1 ? metrics.edge_preservation_ratio * 100 : metrics.edge_preservation_ratio)).toFixed(0)}%
                  </span>
                  <span className="text-[10px] text-success font-semibold">(≥ 90% target)</span>
                </div>
              </div>
            )}
          </div>

          {warnings && warnings.length > 0 && (
            <div className="mt-1 p-2.5 bg-amber-50 text-amber-900 rounded-lg border border-amber-200 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="font-bold">Review Advisory:</span>
                <ul className="list-disc list-inside">
                  {warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};