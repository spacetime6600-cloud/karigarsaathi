import React, { useState, useEffect, useRef } from 'react';
import { BuyerEnquiry } from '@/types';
import { enquiryService } from '@/services/api/enquiryService';
import { syncService } from '@/services/storage/syncService';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Send, CheckCircle2, MapPin, Phone, Clock, Check, AlertCircle, Package } from 'lucide-react';

export interface BuyerEnquiryConversationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  enquiryId: string | null;
  onReplySent?: () => void;
}

export const BuyerEnquiryConversationDialog: React.FC<BuyerEnquiryConversationDialogProps> = ({
  isOpen,
  onClose,
  enquiryId,
  onReplySent,
}) => {
  const [enquiry, setEnquiry] = useState<BuyerEnquiry | null>(null);
  const [replyText, setReplyText] = useState('');
  const [quotePrice, setQuotePrice] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && enquiryId) {
      const data = enquiryService.getEnquiryById(enquiryId);
      setEnquiry(data);
      setReplyText('');
      setQuotePrice('');
      setSentSuccess(false);
    }
  }, [enquiryId, isOpen]);

  if (!isOpen) return null;

  if (!enquiry) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Enquiry Not Found">
        <div className="flex flex-col items-center gap-3 p-4 text-center">
          <AlertCircle className="w-8 h-8 text-error" />
          <p className="text-sm font-medium text-primary">The selected enquiry could not be loaded.</p>
          <Button onClick={onClose} variant="secondary" className="mt-2 text-xs">
            Close
          </Button>
        </div>
      </Modal>
    );
  }

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !enquiry) return;

    setIsSending(true);

    if (localStorage.getItem('simulate_enquiry_waiting') === 'true' || syncService.getForceOffline()) {
      syncService.addToQueue('enquiry_reply', { enquiryId: enquiry.id, replyText, quotePrice });
      setIsSending(false);
      setSentSuccess(true);
      onReplySent?.();
      return;
    }

    const price = quotePrice ? Number(quotePrice) : undefined;
    const updated = enquiryService.addReply(enquiry.id, replyText, price);

    setIsSending(false);
    if (updated) {
      setEnquiry({ ...updated });
    }
    setReplyText('');
    setQuotePrice('');
    setSentSuccess(true);
    onReplySent?.();
  };

  const handleConfirmOrder = () => {
    if (!enquiry) return;
    const updated = enquiryService.confirmOrder(enquiry.id);
    if (updated) {
      setEnquiry({ ...updated });
      onReplySent?.();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Buyer Enquiry Conversation"
      maxWidth="lg"
    >
      <div className="flex flex-col gap-4 max-h-[72vh] overflow-y-auto pr-1">
        {/* Buyer Summary & Status Bar */}
        <div className="p-3 rounded-xl bg-surface-container-low border border-surface-variant flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={enquiry.buyerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
              alt={enquiry.buyerName}
              className="w-10 h-10 rounded-full object-cover border-2 border-primary shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm text-primary truncate">{enquiry.buyerName}</span>
              <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-secondary shrink-0" /> {enquiry.buyerLocation}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono text-secondary">
                  <Phone className="w-3 h-3 shrink-0" /> {enquiry.buyerPhone}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {enquiry.status === 'order_confirmed' ? (
              <Badge variant="success" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                Order Confirmed
              </Badge>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                onClick={handleConfirmOrder}
                className="text-xs py-1 px-2.5 h-8 min-h-0"
              >
                Mark Order Confirmed
              </Button>
            )}
          </div>
        </div>

        {/* Product Inquired Info */}
        <div className="flex items-center gap-3 p-2.5 bg-surface-container rounded-lg border border-surface-variant/70 text-xs">
          <img
            src={enquiry.productImage}
            alt={enquiry.productTitle}
            className="w-10 h-10 rounded-md object-cover shrink-0 border border-surface-variant"
          />
          <div className="flex flex-col flex-1 min-w-0">
            <span className="font-bold text-primary truncate">{enquiry.productTitle}</span>
            <span className="text-secondary font-bold flex items-center gap-1 mt-0.5">
              <Package className="w-3 h-3" />
              Requested: {enquiry.quantityRequested} units
            </span>
          </div>
        </div>

        {/* Message Thread History */}
        <div className="flex flex-col gap-3 p-3.5 bg-surface rounded-xl border border-surface-variant/80 max-h-56 overflow-y-auto">
          {/* Initial Buyer Message */}
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              {enquiry.buyerName.charAt(0)}
            </div>
            <div className="flex flex-col gap-1 max-w-[85%]">
              <div className="p-3 rounded-xl rounded-tl-none bg-surface-container-high text-on-surface text-xs leading-relaxed">
                <p>{enquiry.initialMessage}</p>
              </div>
              <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" /> {enquiry.receivedAt}
              </span>
            </div>
          </div>

          {/* Artisan Replies */}
          {enquiry.replies.map((rep) => (
            <div
              key={rep.id}
              className={`flex items-start gap-2.5 ${
                rep.sender === 'artisan' ? 'flex-row-reverse self-end' : ''
              }`}
            >
              <div className="flex flex-col gap-1 max-w-[85%] items-end">
                <div
                  className={`p-3 rounded-xl text-xs leading-relaxed ${
                    rep.sender === 'artisan'
                      ? 'rounded-tr-none bg-secondary-container text-on-secondary-container font-medium'
                      : 'rounded-tl-none bg-surface-container-high text-on-surface'
                  }`}
                >
                  <p>{rep.text}</p>
                  {rep.priceQuote && (
                    <div className="mt-1.5 pt-1.5 border-t border-on-secondary-container/20 font-bold text-xs">
                      Quoted Price: ₹{rep.priceQuote.toLocaleString('en-IN')} / unit
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-on-surface-variant">
                  {rep.sender === 'artisan' ? 'You' : enquiry.buyerName} • {rep.timestamp}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Reply Submission Form */}
        <form onSubmit={handleSendReply} className="flex flex-col gap-2.5 pt-1">
          {sentSuccess && (
            <div className="p-2.5 bg-success-container text-on-success-container rounded-lg flex items-center justify-center gap-2 text-xs font-bold border border-green-300 animate-in fade-in">
              <Check className="w-4 h-4 text-success" />
              <span>Reply sent successfully!</span>
            </div>
          )}

          <TextArea
            ref={replyInputRef}
            rows={2}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Reply to ${enquiry.buyerName}...`}
            required
            className="text-xs"
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="w-full sm:w-56">
              <Input
                type="number"
                value={quotePrice}
                onChange={(e) => setQuotePrice(e.target.value)}
                placeholder="Quote Price (₹ optional)"
                className="py-1 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="text-xs min-h-0 h-9 px-3 flex-1 sm:flex-initial"
              >
                Close
              </Button>

              <Button
                type="submit"
                size="md"
                isLoading={isSending}
                rightIcon={<Send className="w-3.5 h-3.5" />}
                className="text-xs font-bold px-4 min-h-0 h-9 flex-1 sm:flex-initial"
              >
                Send Reply
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};
