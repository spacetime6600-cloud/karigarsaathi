import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { enquiryService } from '@/services/api/enquiryService';
import { useSync } from '@/app/providers/SyncProvider';
import { MessageSquare, ArrowRight, ChevronRight, WifiOff } from 'lucide-react';
import { clsx } from 'clsx';

export interface BuyerEnquiryPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
  className?: string;
}

export const BuyerEnquiryPopover: React.FC<BuyerEnquiryPopoverProps> = ({
  isOpen,
  onClose,
  triggerRef,
  className,
}) => {
  const { isOnline } = useSync();
  const navigate = useNavigate();
  const popoverRef = useRef<HTMLDivElement>(null);

  const enquiries = enquiryService.listEnquiries();
  const unreadCount = enquiries.filter((e) => e.status === 'new').length;

  // Handle outside click without blocking trigger click
  useEffect(() => {
    if (!isOpen) return;

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      // If clicking trigger button or inside popover, do nothing
      if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) {
        return;
      }
      onClose();
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [isOpen, onClose, triggerRef]);

  // Handle keyboard events (Escape to close and return focus)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      triggerRef.current?.focus();
    }
  };

  const handleNavigate = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    navigate(path);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      id="buyer-enquiries-popover"
      role="dialog"
      aria-label="Buyer Enquiries Panel"
      aria-modal="false"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className={clsx(
        'absolute right-0 top-full mt-2 w-[calc(100vw-24px)] sm:w-[380px] max-w-[390px]',
        'glass-menu rounded-2xl p-0 shadow-xl z-50 border border-surface-variant/90 animate-in fade-in zoom-in-95 duration-150',
        'flex flex-col overflow-hidden max-h-[460px]',
        className
      )}
    >
      {/* 1. Header (14-16px padding) */}
      <div className="px-4 py-3.5 border-b border-surface-variant/70 flex items-center justify-between bg-surface-container-lowest/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary shrink-0" />
          <h3 className="font-bold text-sm text-primary leading-none">Buyer Enquiries</h3>
        </div>

        {unreadCount > 0 && (
          <span className="text-[11px] font-bold text-secondary bg-secondary-fixed/60 px-2.5 py-0.5 rounded-full border border-secondary/20 leading-none">
            {unreadCount} new
          </span>
        )}
      </div>

      {/* Offline Alert if active */}
      {!isOnline && (
        <div className="px-4 py-2 bg-error-container/60 border-b border-error/20 flex items-center gap-2 text-[11px] text-error font-medium shrink-0">
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
          <span>Offline Mode: Enquiries saved locally.</span>
        </div>
      )}

      {/* 2. Spaced & Readable Previews List */}
      <div className="flex-1 overflow-y-auto divide-y divide-surface-variant/50">
        {enquiries.length === 0 ? (
          <div className="p-6 text-center flex flex-col items-center justify-center gap-1.5 text-on-surface-variant">
            <MessageSquare className="w-6 h-6 text-outline-variant" />
            <p className="font-bold text-xs text-primary">No buyer enquiries yet</p>
            <p className="text-[11px] max-w-xs">
              Direct messages from your Craft Passport will appear here.
            </p>
          </div>
        ) : (
          enquiries.map((enq) => {
            const isUnread = enq.status === 'new';
            const targetUrl = `/enquiries/${enq.id}/reply`;

            return (
              <Link
                key={enq.id}
                to={targetUrl}
                onClick={(e) => handleNavigate(e, targetUrl)}
                className={clsx(
                  'w-full text-left px-4 py-3.5 min-h-[88px] transition-colors flex items-center gap-3 select-none touch-target focus:outline-none focus-visible:bg-surface-container block group cursor-pointer',
                  isUnread
                    ? 'bg-sky-50/80 hover:bg-sky-100/70'
                    : 'hover:bg-surface-container-low/70'
                )}
              >
                {/* Avatar (34-38px) */}
                <div className="relative shrink-0">
                  <img
                    src={enq.buyerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt={enq.buyerName}
                    className="w-9 h-9 rounded-full object-cover border border-surface-variant/80 shrink-0"
                  />
                  {isUnread && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-secondary rounded-full border-2 border-white" />
                  )}
                </div>

                {/* Content Container (Breathing Room, 1-line clamps) */}
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  {/* Top Row: Name + Time */}
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="font-bold text-xs sm:text-sm text-primary truncate group-hover:text-secondary transition-colors">
                      {enq.buyerName}
                    </span>
                    <span className="text-[10px] text-on-surface-variant shrink-0 font-mono">
                      {enq.receivedAt}
                    </span>
                  </div>

                  {/* Product & Quantity Line (1-line clamp) */}
                  <div className="text-[11px] text-on-surface-variant truncate whitespace-nowrap overflow-hidden">
                    <span className="font-medium text-slate-700">{enq.productTitle}</span>
                    <span> • </span>
                    <span className="font-bold text-secondary">{enq.quantityRequested} units</span>
                  </div>

                  {/* Message Preview (Strictly 1 line with ellipsis) */}
                  <p className="text-[11px] text-slate-600 truncate whitespace-nowrap overflow-hidden italic">
                    "{enq.initialMessage}"
                  </p>
                </div>

                {/* Right Chevron */}
                <div className="shrink-0 pl-0.5 text-on-surface-variant group-hover:text-primary transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* 3. Footer (48px) */}
      <div className="h-12 px-4 border-t border-surface-variant/70 bg-surface-container-lowest/90 backdrop-blur-sm flex items-center shrink-0">
        <Link
          to="/enquiries"
          onClick={(e) => handleNavigate(e, '/enquiries')}
          className="w-full py-2 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs flex items-center justify-center gap-1.5 transition-colors touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955] cursor-pointer"
        >
          <span>View all enquiries</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
