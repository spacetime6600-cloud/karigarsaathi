import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { enquiryService } from '@/services/api/enquiryService';
import { syncService } from '@/services/storage/syncService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import { Input } from '@/components/ui/Input';
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  MapPin,
  Phone,
  Clock,
  Package,
  Check,
  AlertCircle,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';

export const EnquiryReplyPage: React.FC = () => {
  const { enquiryId } = useParams<{ enquiryId: string }>();
  const navigate = useNavigate();

  const [enquiry, setEnquiry] = useState(() => (enquiryId ? enquiryService.getEnquiryById(enquiryId) : null));
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
  }, [enquiryId]);

  // Safe Not-Found Error State
  if (!enquiry) {
    return (
      <div className="w-full max-w-2xl mx-auto py-12 px-4 text-center flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-error-container/60 text-error flex items-center justify-center">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">Enquiry Not Found</h1>
          <p className="text-sm text-on-surface-variant mt-1 max-w-md">
            The enquiry reference <span className="font-mono font-bold text-primary">"{enquiryId}"</span> could not be found or has been removed.
          </p>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <Button variant="secondary" onClick={() => navigate('/enquiries')}>
            Back to Enquiries
          </Button>
          <Button variant="ghost" onClick={() => navigate('/artisan/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || isSending) return;

    setIsSending(true);

    if (localStorage.getItem('simulate_enquiry_waiting') === 'true' || syncService.getForceOffline()) {
      syncService.addToQueue('enquiry_reply', { enquiryId: enquiry.id, replyText, quotePrice });
      setIsSending(false);
      setSentSuccess(true);
      setReplyText('');
      setQuotePrice('');
      setTimeout(() => setSentSuccess(false), 3000);
      return;
    }

    const price = quotePrice ? Number(quotePrice) : undefined;
    const updated = enquiryService.addReply(enquiry.id, replyText.trim(), price);

    setIsSending(false);
    if (updated) {
      setEnquiry({ ...updated });
    }
    setReplyText('');
    setQuotePrice('');
    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 3000);
  };

  const handleConfirmOrder = () => {
    const updated = enquiryService.confirmOrder(enquiry.id);
    if (updated) {
      setEnquiry({ ...updated });
    }
  };

  const isReplyEmpty = !replyText.trim();
  const characterCount = replyText.length;

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Top Header & Breadcrumb Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-variant pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/enquiries"
            aria-label="Back to Enquiries"
            className="p-2 text-on-surface-variant hover:text-primary rounded-full hover:bg-surface-container transition-colors touch-target"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-primary">Buyer Enquiry</h1>
              {enquiry.status === 'new' ? (
                <span className="text-[11px] font-bold text-secondary bg-secondary-fixed/70 px-2.5 py-0.5 rounded-full border border-secondary/30">
                  New Unread
                </span>
              ) : enquiry.status === 'order_confirmed' ? (
                <span className="text-[11px] font-bold text-success bg-success-container px-2.5 py-0.5 rounded-full border border-success/30">
                  Order Confirmed
                </span>
              ) : (
                <span className="text-[11px] font-medium text-on-surface-variant bg-surface-container px-2.5 py-0.5 rounded-full">
                  Replied
                </span>
              )}
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Reference: <span className="font-mono font-medium">{enquiry.id}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/enquiries"
            className="text-xs font-bold text-secondary hover:underline flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-surface-container transition-colors"
          >
            <span>Back to Enquiries</span>
          </Link>
        </div>
      </div>

      {/* Two-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Buyer Profile & Order Request Summary (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Buyer Profile Card (no unnecessary truncation) */}
          <Card className="p-5 bg-white border border-surface-variant card-shadow flex flex-col gap-4">
            <div className="flex items-start gap-3.5">
              <img
                src={enquiry.buyerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
                alt={enquiry.buyerName}
                className="w-12 h-12 rounded-full object-cover border-2 border-primary shrink-0"
              />
              <div className="flex flex-col min-w-0 flex-1">
                <h2 className="font-bold text-base text-primary break-words leading-snug">
                  {enquiry.buyerName}
                </h2>
                <span className="text-xs text-on-surface-variant flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-secondary shrink-0" /> {enquiry.buyerLocation}
                </span>
                <span className="text-xs text-secondary font-mono flex items-center gap-1 mt-1 font-medium">
                  <Phone className="w-3.5 h-3.5 shrink-0" /> {enquiry.buyerPhone}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-surface-variant flex items-center justify-between text-xs text-on-surface-variant">
              <span>Received:</span>
              <span className="font-mono flex items-center gap-1 font-medium text-primary">
                <Clock className="w-3 h-3" /> {enquiry.receivedAt}
              </span>
            </div>
          </Card>

          {/* Order Request Summary Card */}
          <Card className="p-5 bg-white border border-surface-variant card-shadow flex flex-col gap-3.5">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Order Request Summary
            </span>

            <div className="flex items-center gap-3 p-3 bg-surface-container rounded-xl border border-surface-variant/70">
              <img
                src={enquiry.productImage}
                alt={enquiry.productTitle}
                className="w-14 h-14 rounded-lg object-cover border border-surface-variant shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm text-primary leading-tight line-clamp-2">
                  {enquiry.productTitle}
                </span>
                <span className="text-xs font-bold text-secondary flex items-center gap-1 mt-1.5">
                  <Package className="w-3.5 h-3.5" />
                  Quantity: {enquiry.quantityRequested} units
                </span>
              </div>
            </div>

            {/* Order Confirmation Action */}
            <div className="pt-2">
              {enquiry.status === 'order_confirmed' ? (
                <div className="w-full p-2.5 bg-success-container text-on-success-container rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold border border-green-300">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>Order Confirmed</span>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleConfirmOrder}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  className="w-full text-xs font-bold py-2.5"
                >
                  Mark Order Confirmed
                </Button>
              )}
            </div>
          </Card>

          {/* Craft Trust Note */}
          <div className="p-3.5 bg-surface-container-low rounded-xl border border-surface-variant/70 flex items-start gap-2.5 text-xs text-on-surface-variant">
            <ShieldCheck className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
            <p>
              Direct artisan-to-buyer communication. All orders are backed by verified Craft Passport heritage tags.
            </p>
          </div>
        </div>

        {/* Right Column: Full Conversation Thread & Reply Composer (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Conversation History Card with 20-24px message spacing and 70-75% bubble widths */}
          <Card className="p-6 bg-white border border-surface-variant card-shadow flex flex-col gap-6 min-h-[340px]">
            <div className="flex items-center justify-between border-b border-surface-variant pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm text-primary">Conversation History</h3>
              </div>
              <span className="text-xs text-on-surface-variant">
                {enquiry.replies.length + 1} {enquiry.replies.length === 0 ? 'Message' : 'Messages'}
              </span>
            </div>

            {/* Conversation Flow with 20-24px vertical separation */}
            <div className="flex flex-col gap-6">
              {/* Original Buyer Message (Left-Aligned, 70-75% max width, comfortable internal padding) */}
              <div className="flex items-start gap-3">
                <img
                  src={enquiry.buyerAvatar}
                  alt={enquiry.buyerName}
                  className="w-9 h-9 rounded-full object-cover shrink-0 mt-1"
                />
                <div className="flex flex-col gap-1.5 max-w-[75%]">
                  <div className="p-4 sm:p-5 rounded-2xl rounded-tl-none bg-surface-container-high text-on-surface text-sm leading-relaxed shadow-sm">
                    <p className="whitespace-pre-line">{enquiry.initialMessage}</p>
                  </div>
                  <span className="text-[11px] text-on-surface-variant ml-1 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    {enquiry.buyerName} • {enquiry.receivedAt}
                  </span>
                </div>
              </div>

              {/* Artisan Replies Thread (Right-Aligned, 70-75% max width) */}
              {enquiry.replies.map((rep) => (
                <div
                  key={rep.id}
                  className={`flex items-start gap-3 ${
                    rep.sender === 'artisan' ? 'flex-row-reverse self-end' : ''
                  }`}
                >
                  <div className="flex flex-col gap-1.5 max-w-[75%] items-end">
                    <div
                      className={`p-4 sm:p-5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        rep.sender === 'artisan'
                          ? 'rounded-tr-none bg-secondary-container text-on-secondary-container font-medium'
                          : 'rounded-tl-none bg-surface-container-high text-on-surface'
                      }`}
                    >
                      <p className="whitespace-pre-line">{rep.text}</p>
                      {rep.priceQuote && (
                        <div className="mt-2.5 pt-2.5 border-t border-on-secondary-container/20 font-bold text-xs">
                          Quoted Price: ₹{rep.priceQuote.toLocaleString('en-IN')} / unit
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] text-on-surface-variant mr-1 font-mono">
                      {rep.sender === 'artisan' ? 'You' : enquiry.buyerName} • {rep.timestamp}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Reply Composer Card (Visually Separated Below) */}
          <Card className="p-5 bg-white border border-surface-variant card-shadow flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <label htmlFor="reply-textarea" className="font-bold text-sm text-primary">
                Write your reply
              </label>
              <span className="text-xs text-on-surface-variant font-mono">{characterCount} characters</span>
            </div>

            {/* Sent Confirmation Toast */}
            {sentSuccess && (
              <div className="p-3 bg-success-container text-on-success-container rounded-xl flex items-center gap-2 text-xs font-bold border border-green-300 animate-in fade-in">
                <Check className="w-4 h-4 text-success" />
                <span>Reply sent successfully to {enquiry.buyerName}!</span>
              </div>
            )}

            <form onSubmit={handleSendReply} className="flex flex-col gap-3.5">
              <TextArea
                id="reply-textarea"
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Type your response to ${enquiry.buyerName} (e.g. custom dimensions, dispatch timelines, bulk terms)...`}
                required
              />

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <div className="w-full sm:w-64">
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
                    onClick={() => {
                      setReplyText('');
                      setQuotePrice('');
                    }}
                    className="text-xs min-h-0 h-10 px-4 flex-1 sm:flex-initial"
                  >
                    Clear
                  </Button>

                  <Button
                    type="submit"
                    size="md"
                    isLoading={isSending}
                    disabled={isReplyEmpty || isSending}
                    rightIcon={<Send className="w-4 h-4" />}
                    className="text-xs font-bold px-6 min-h-0 h-10 flex-1 sm:flex-initial"
                  >
                    Send Reply
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};
