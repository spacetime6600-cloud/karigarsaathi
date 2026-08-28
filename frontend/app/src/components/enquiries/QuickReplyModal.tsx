import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BuyerEnquiry } from '@/types';
import { enquiryService } from '@/services/api/enquiryService';
import { syncService } from '@/services/storage/syncService';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Send, CheckCircle2, MapPin, Phone, ExternalLink, Sparkles, Clock, Check } from 'lucide-react';

export interface QuickReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  enquiryId: string | null;
  onReplySent?: () => void;
}

export const QuickReplyModal: React.FC<QuickReplyModalProps> = ({
  isOpen,
  onClose,
  enquiryId,
  onReplySent,
}) => {
  const navigate = useNavigate();

  const [enquiry, setEnquiry] = useState<BuyerEnquiry | null>(null);
  const [replyText, setReplyText] = useState('');
  const [quotePrice, setQuotePrice] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  useEffect(() => {
    if (enquiryId) {
      const data = enquiryService.getEnquiryById(enquiryId);
      setEnquiry(data);
      setReplyText('');
      setQuotePrice('');
      setSentSuccess(false);
    }
  }, [enquiryId, isOpen]);

  if (!isOpen || !enquiry) return null;

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setIsSending(true);

    if (localStorage.getItem('simulate_enquiry_waiting') === 'true' || syncService.getForceOffline()) {
      syncService.addToQueue('enquiry_reply', { enquiryId: enquiry.id, replyText, quotePrice });
      setIsSending(false);
      setSentSuccess(true);
      setTimeout(() => {
        onReplySent?.();
        onClose();
      }, 1200);
      return;
    }

    const price = quotePrice ? Number(quotePrice) : undefined;
    const updated = enquiryService.addReply(enquiry.id, replyText, price);

    setTimeout(() => {
      setIsSending(false);
      setSentSuccess(true);
      if (updated) {
        setEnquiry({ ...updated });
      }
      setTimeout(() => {
        onReplySent?.();
        onClose();
      }, 1000);
    }, 400);
  };

  const handleConfirmOrder = () => {
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
      title="Reply to Buyer Enquiry"
      maxWidth="lg"
    >
      <div className="flex flex-col gap-4 max-h-[75vh] overflow-y-auto pr-1">
        {/* Buyer & Product Summary Header */}
        <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-variant flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={enquiry.buyerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
              alt={enquiry.buyerName}
              className="w-11 h-11 rounded-full object-cover border-2 border-primary shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm text-primary truncate">{enquiry.buyerName}</span>
              <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-secondary" /> {enquiry.buyerLocation}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono text-secondary">
                  <Phone className="w-3 h-3" /> {enquiry.buyerPhone}
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
        <div className="flex items-center gap-3 p-3 bg-surface-container rounded-lg border border-surface-variant/70 text-xs">
          <img
            src={enquiry.productImage}
            alt={enquiry.productTitle}
            className="w-12 h-12 rounded-md object-cover shrink-0 border border-surface-variant"
          />
          <div className="flex flex-col flex-1 min-w-0">
            <span className="font-bold text-primary truncate">{enquiry.productTitle}</span>
            <span className="text-secondary font-bold">
              Quantity Inquired: {enquiry.quantityRequested} units
            </span>
          </div>
        </div>

        {/* Message Thread History */}
        <div className="flex flex-col gap-3 p-3.5 bg-surface rounded-xl border border-surface-variant/80 max-h-52 overflow-y-auto">
          {/* Initial Buyer Message */}
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
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

        {/* Quick Reply Form */}
        <form onSubmit={handleSendReply} className="flex flex-col gap-3 pt-1">
          {sentSuccess ? (
            <div className="p-3 bg-success-container text-on-success-container rounded-lg flex items-center justify-center gap-2 text-xs font-bold border border-green-300 animate-in fade-in">
              <Check className="w-4 h-4 text-success" />
              <span>Reply sent successfully to {enquiry.buyerName}!</span>
            </div>
          ) : (
            <>
              <TextArea
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your response to the buyer (e.g. availability, delivery timeline, custom weaving options)..."
                required
                className="text-xs"
              />

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="w-full sm:w-60">
                  <Input
                    type="number"
                    value={quotePrice}
                    onChange={(e) => setQuotePrice(e.target.value)}
                    placeholder="Quoted Price (₹ per unit optional)"
                    className="py-1 text-xs"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                    className="text-xs min-h-0 h-10 px-3 flex-1 sm:flex-initial"
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    size="md"
                    isLoading={isSending}
                    rightIcon={<Send className="w-3.5 h-3.5" />}
                    className="text-xs font-bold px-5 min-h-0 h-10 flex-1 sm:flex-initial"
                  >
                    Send Reply
                  </Button>
                </div>
              </div>
            </>
          )}
        </form>

        {/* Footer Link to Full Thread Page */}
        <div className="pt-2 border-t border-surface-variant flex items-center justify-between text-xs text-on-surface-variant">
          <span className="flex items-center gap-1 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-secondary" /> Direct artisan messaging
          </span>
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate(`/artisan/enquiries/${enquiry.id}`);
            }}
            className="font-bold text-secondary hover:underline inline-flex items-center gap-1"
          >
            <span>Open Full Screen Thread</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </Modal>
  );
};
