/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { enquiryService } from '@/services/api/enquiryService';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import { Input } from '@/components/ui/Input';
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Package,
  Send,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { ROUTES } from '@/routes';

export const CoordinatorEnquiryDetailPage: React.FC = () => {
  const { enquiryId } = useParams<{ enquiryId: string }>();
  const navigate = useNavigate();

  const [enquiry, setEnquiry] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [priceQuote, setPriceQuote] = useState<string>('');
  const [isReplying, setIsReplying] = useState(false);

  useEffect(() => {
    if (!enquiryId) return;
    const found = enquiryService.getEnquiryById(enquiryId);
    setEnquiry(found);
    setLoading(false);
  }, [enquiryId]);

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiryId || !replyText.trim()) return;

    setIsReplying(true);
    const parsedPrice = priceQuote ? parseFloat(priceQuote) : undefined;
    const updated = enquiryService.addReply(enquiryId, replyText.trim(), parsedPrice);
    if (updated) {
      setEnquiry({ ...updated });
      setReplyText('');
      setPriceQuote('');
    }
    setIsReplying(false);
  };

  const handleConfirmOrder = () => {
    if (!enquiryId) return;
    const updated = enquiryService.confirmOrder(enquiryId);
    if (updated) {
      setEnquiry({ ...updated });
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
        <Loader2 className="w-8 h-8 text-secondary animate-spin" />
        <p className="text-xs font-semibold">Loading enquiry conversation...</p>
      </div>
    );
  }

  if (!enquiry) {
    return (
      <Card className="p-8 text-center flex flex-col items-center gap-4 bg-white border border-error/30 rounded-2xl max-w-md mx-auto my-12">
        <AlertTriangle className="w-8 h-8 text-error" />
        <h3 className="font-bold text-base text-primary">Enquiry Not Found</h3>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => navigate(ROUTES.COORDINATOR_ENQUIRIES)}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          className="text-xs font-bold"
        >
          Return to Enquiries
        </Button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Top Back Link */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate(ROUTES.COORDINATOR_ENQUIRIES)}
          className="flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors touch-target"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Enquiries</span>
        </button>

        {enquiry.status !== 'order_confirmed' && (
          <Button
            size="sm"
            variant="secondary"
            onClick={handleConfirmOrder}
            leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-success" />}
            className="text-xs font-bold"
          >
            Mark Order as Confirmed
          </Button>
        )}
      </div>

      {/* Enquiry Overview Card */}
      <Card className="p-6 bg-surface-container-lowest border border-surface-variant/80 rounded-3xl shadow-xs flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-secondary-fixed text-secondary flex items-center justify-center font-bold text-lg shrink-0">
              {enquiry.buyerName?.charAt(0) || 'B'}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-bold text-primary truncate">
                  {enquiry.buyerName}
                </h2>
                <Badge variant="indigo" className="text-[10px] font-bold uppercase">
                  {enquiry.status === 'order_confirmed' ? 'Confirmed Order' : enquiry.status}
                </Badge>
              </div>
              <span className="text-xs text-on-surface-variant">
                {enquiry.buyerLocation || 'Domestic Buyer'} • Preferred: {enquiry.preferredContactMethod || 'WhatsApp'}
              </span>
            </div>
          </div>

          <div className="text-right text-xs">
            <span className="font-bold text-primary block">
              Requested: {enquiry.quantityRequested || 1} units
            </span>
            <span className="text-[11px] text-on-surface-variant">{enquiry.receivedAt || 'Recent'}</span>
          </div>
        </div>

        {/* Linked Product Banner */}
        <div className="p-3 bg-surface-container-low rounded-2xl border border-surface-variant/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Package className="w-4 h-4 text-secondary shrink-0" />
            <span className="font-bold text-primary truncate">{enquiry.productTitle}</span>
          </div>
          <span className="text-on-surface-variant font-medium shrink-0">
            ID: {enquiry.productId?.slice(0, 10)}
          </span>
        </div>
      </Card>

      {/* Message Thread */}
      <div className="flex flex-col gap-3">
        <h3 className="font-display text-base font-bold text-primary">Conversation History</h3>

        {/* Initial Buyer Message */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-surface-variant/80 shadow-xs flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-primary">{enquiry.buyerName}</span>
            <span className="text-[11px] text-on-surface-variant">{enquiry.receivedAt || 'Recent'}</span>
          </div>
          <p className="text-xs sm:text-sm text-primary leading-relaxed">
            {enquiry.message || enquiry.initialMessage}
          </p>
        </div>

        {/* Replies */}
        {enquiry.replies?.map((rep: any, idx: number) => (
          <div
            key={idx}
            className="p-4 sm:p-5 rounded-2xl bg-secondary/5 border border-secondary/20 shadow-xs flex flex-col gap-2 ml-4 sm:ml-8"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-secondary">
                {rep.sender === 'coordinator' ? 'Cluster Coordinator (Assistant)' : 'Artisan Reply'}
              </span>
              <span className="text-[11px] text-on-surface-variant">{rep.timestamp || 'Just now'}</span>
            </div>
            <p className="text-xs sm:text-sm text-primary leading-relaxed">{rep.text}</p>
            {rep.priceQuote && (
              <span className="text-xs font-bold text-secondary">
                Quoted Price: ₹{rep.priceQuote.toLocaleString('en-IN')} per unit
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Reply Form */}
      <Card className="p-6 bg-white border border-surface-variant/80 rounded-3xl shadow-xs flex flex-col gap-4">
        <h4 className="font-display text-sm font-bold text-primary flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-secondary" />
          Send Follow-up / Quotation Assistance
        </h4>

        <form onSubmit={handleSendReply} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="reply-text" className="text-xs font-bold text-primary">
              Response Message
            </label>
            <TextArea
              id="reply-text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type quotation or dispatch guidance for the buyer..."
              rows={3}
              required
              className="text-xs"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-full sm:w-48 flex flex-col gap-1">
              <label htmlFor="quote-price" className="text-xs font-bold text-primary">
                Price Quote (₹ Optional)
              </label>
              <Input
                id="quote-price"
                type="number"
                value={priceQuote}
                onChange={(e) => setPriceQuote(e.target.value)}
                placeholder="e.g. 2400"
                min="0"
                className="text-xs"
              />
            </div>

            <Button
              type="submit"
              disabled={isReplying}
              rightIcon={<Send className="w-4 h-4" />}
              className="w-full sm:w-auto sm:mt-5 ml-auto text-xs font-bold bg-secondary text-white"
            >
              {isReplying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Assistant Reply'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
