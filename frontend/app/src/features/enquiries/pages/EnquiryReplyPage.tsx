import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { enquiryRepository } from '@/repositories';
import { enquiryService } from '@/services/api/enquiryService';
import { BuyerEnquiry } from '@/types';
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
  Loader2,
  ExternalLink,
} from 'lucide-react';

export const EnquiryReplyPage: React.FC = () => {
  const { enquiryId } = useParams<{ enquiryId: string }>();
  const navigate = useNavigate();
  const { user, userAccount } = useAuth();
  const currentArtisanId = userAccount?.uid || user?.id || 'demo_artisan_ravi';

  const [enquiry, setEnquiry] = useState<BuyerEnquiry | null>(() =>
    enquiryId ? enquiryService.getEnquiryById(enquiryId) : null
  );
  const [loading, setLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [quotePrice, setQuotePrice] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  useEffect(() => {
    if (!enquiryId || !currentArtisanId) {
      setLoading(false);
      return;
    }

    enquiryRepository
      .getEnquiryById(enquiryId, currentArtisanId)
      .then((data) => {
        setEnquiry(data);
        if (data && data.status === 'new') {
          enquiryRepository
            .updateEnquiryStatus(data.id, currentArtisanId, 'acknowledged', 'Opened by artisan')
            .then((upd) => setEnquiry(upd))
            .catch(() => {});
        }
      })
      .catch(() => {
        setEnquiry(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [enquiryId, currentArtisanId]);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
        <Loader2 className="w-8 h-8 text-secondary animate-spin" />
        <p className="text-xs font-semibold">Loading enquiry conversation...</p>
      </div>
    );
  }

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
          <Button variant="secondary" onClick={() => navigate('/artisan/enquiries')}>
            Back to Enquiries
          </Button>
          <Button variant="ghost" onClick={() => navigate('/artisan/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || isSending || !currentArtisanId) return;

    setIsSending(true);
    try {
      const price = quotePrice ? Number(quotePrice) : undefined;
      const updated = await enquiryRepository.addEnquiryReply(
        enquiry.id,
        currentArtisanId,
        {
          id: `rep_${Date.now()}`,
          sender: 'artisan',
          text: replyText.trim(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          priceQuote: price,
        }
      );

      setEnquiry(updated);
      setReplyText('');
      setQuotePrice('');
      setSentSuccess(true);
      setTimeout(() => setSentSuccess(false), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send reply.');
    } finally {
      setIsSending(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!currentArtisanId) return;
    try {
      const updated = await enquiryRepository.updateEnquiryStatus(
        enquiry.id,
        currentArtisanId,
        'order_confirmed',
        'Order confirmed by artisan'
      );
      setEnquiry(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to confirm order.');
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Top Header & Breadcrumb Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-variant pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/artisan/enquiries"
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
                <span className="text-[11px] font-medium text-on-surface-variant bg-surface-container px-2.5 py-0.5 rounded-full capitalize">
                  {enquiry.status === 'acknowledged' ? 'Read' : enquiry.status}
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
            to="/artisan/enquiries"
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
          {/* Buyer Profile Card */}
          <Card className="p-5 bg-white border border-surface-variant card-shadow flex flex-col gap-4 rounded-2xl">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-full bg-secondary-fixed text-primary font-bold flex items-center justify-center shrink-0 text-base">
                {enquiry.buyerName[0]?.toUpperCase() || 'B'}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <h2 className="font-bold text-base text-primary break-words leading-snug">
                  {enquiry.buyerName}
                </h2>
                {(enquiry.buyerLocation || enquiry.destinationCity) && (
                  <span className="text-xs text-on-surface-variant flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-secondary shrink-0" /> {enquiry.buyerLocation || enquiry.destinationCity}
                  </span>
                )}
                {enquiry.consentToBeContacted && (enquiry.buyerPhone || enquiry.buyerContact) && (
                  <span className="text-xs text-secondary font-mono flex items-center gap-1 mt-1 font-medium">
                    <Phone className="w-3.5 h-3.5 shrink-0" /> {enquiry.buyerPhone || enquiry.buyerContact}
                  </span>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-surface-variant flex items-center justify-between text-xs text-on-surface-variant">
              <span>Received:</span>
              <span className="font-mono flex items-center gap-1 font-medium text-primary">
                <Clock className="w-3 h-3" />
                {enquiry.receivedAt && isNaN(Date.parse(enquiry.receivedAt))
                  ? enquiry.receivedAt
                  : new Date(enquiry.receivedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </Card>

          {/* Order Request Summary Card */}
          <Card className="p-5 bg-white border border-surface-variant card-shadow flex flex-col gap-3.5 rounded-2xl">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Order Request Summary
            </span>

            <div className="flex items-center gap-3 p-3 bg-surface-container rounded-xl border border-surface-variant/70">
              {enquiry.productImage ? (
                <img
                  src={enquiry.productImage}
                  alt={enquiry.productTitle}
                  className="w-14 h-14 rounded-lg object-cover border border-surface-variant shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant shrink-0">
                  <Package className="w-6 h-6" />
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm text-primary leading-tight line-clamp-2">
                  {enquiry.productTitle}
                </span>
                <span className="text-xs font-bold text-secondary flex items-center gap-1 mt-1.5">
                  <Package className="w-3.5 h-3.5" />
                  Quantity: {enquiry.quantityRequested} units
                </span>
                {enquiry.publicSlug && (
                  <Link
                    to={`/passport/${enquiry.publicSlug}`}
                    state={{ from: `/artisan/enquiries/${enquiry.id}`, fromLabel: 'Enquiry Reply', sourceRole: 'artisan' }}
                    className="text-[11px] font-bold text-secondary hover:underline flex items-center gap-1 mt-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>View Craft Passport</span>
                  </Link>
                )}
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
          {/* Conversation History Card */}
          <Card className="p-6 bg-white border border-surface-variant card-shadow flex flex-col gap-6 min-h-[340px] rounded-2xl">
            <div className="flex items-center justify-between border-b border-surface-variant pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm text-primary">Conversation History</h3>
              </div>
              <span className="text-xs text-on-surface-variant">
                {(enquiry.replies?.length || 0) + 1} {enquiry.replies?.length === 0 ? 'Message' : 'Messages'}
              </span>
            </div>

            <div className="flex flex-col gap-5">
              {/* Buyer Initial Message */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary-fixed text-primary font-bold flex items-center justify-center shrink-0 mt-1 text-xs">
                  {enquiry.buyerName[0]?.toUpperCase() || 'B'}
                </div>
                <div className="flex flex-col gap-1 max-w-[85%]">
                  <div className="p-4 rounded-2xl rounded-tl-none bg-surface-container-high text-on-surface text-sm leading-relaxed">
                    <p>{enquiry.message || enquiry.initialMessage}</p>
                  </div>
                  <span className="text-[10px] text-on-surface-variant ml-1 flex items-center gap-1 font-mono">
                    <Clock className="w-2.5 h-2.5" /> {enquiry.buyerName} • {new Date(enquiry.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Threaded Artisan Replies */}
              {enquiry.replies?.map((rep) => (
                <div key={rep.id} className="flex items-start gap-3 justify-end">
                  <div className="flex flex-col gap-1 max-w-[85%] items-end">
                    <div className="p-4 rounded-2xl rounded-tr-none bg-primary text-white text-sm leading-relaxed shadow-sm">
                      <p>{rep.text}</p>
                      {rep.priceQuote && (
                        <div className="mt-2 pt-2 border-t border-white/20 text-xs font-bold text-amber-200">
                          Formal Quote: ₹{rep.priceQuote.toLocaleString('en-IN')}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-on-surface-variant mr-1 flex items-center gap-1 font-mono">
                      <Clock className="w-2.5 h-2.5" /> You • {rep.timestamp}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Reply Composer Form */}
          <Card className="p-5 bg-white border border-surface-variant card-shadow flex flex-col gap-4 rounded-2xl">
            <h4 className="font-bold text-sm text-primary">Send Response</h4>
            <form onSubmit={handleSendReply} className="flex flex-col gap-4">
              <TextArea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Type your reply to ${enquiry.buyerName}... Provide craft timeline or pricing notes.`}
                rows={4}
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-on-surface-variant">Price Quote (₹):</span>
                  <Input
                    type="number"
                    min="0"
                    value={quotePrice}
                    onChange={(e) => setQuotePrice(e.target.value)}
                    placeholder="e.g. 14500"
                    className="w-32 text-xs"
                  />
                </div>

                <div className="flex items-center gap-3">
                  {sentSuccess && (
                    <span className="text-xs font-bold text-success flex items-center gap-1">
                      <Check className="w-4 h-4" /> Reply sent successfully!
                    </span>
                  )}
                  <Button
                    type="submit"
                    disabled={isSending || !replyText.trim()}
                    leftIcon={isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    className="text-xs font-bold"
                  >
                    {isSending ? 'Sending...' : 'Send Message'}
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
