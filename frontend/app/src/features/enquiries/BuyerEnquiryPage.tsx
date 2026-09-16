import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { useSync } from '@/app/providers/SyncProvider';
import { enquiryRepository } from '@/repositories';
import { enquiryService } from '@/services/api/enquiryService';
import { BuyerEnquiry, EnquiryWorkflowStatus } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import {
  Send,
  ArrowLeft,
  Phone,
  MapPin,
  Clock,
  AlertCircle,
  MessageCircle,
  ShieldCheck,
  Check,
  Loader2,
  Package,
  ExternalLink,
  WifiOff,
} from 'lucide-react';
import { clsx } from 'clsx';

const formatDateSafe = (dateStr?: string): string => {
  if (!dateStr) return '';
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) {
    return dateStr;
  }
  return parsed.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const formatDateShortSafe = (dateStr?: string): string => {
  if (!dateStr) return '';
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) {
    return dateStr;
  }
  return parsed.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
  });
};

export const BuyerEnquiryPage: React.FC = () => {
  const { enquiryId } = useParams<{ enquiryId?: string }>();
  const navigate = useNavigate();
  const { user, userAccount } = useAuth();
  const { isOnline } = useSync();
  const currentArtisanId = userAccount?.uid || user?.id || 'demo_artisan_ravi';

  const [enquiries, setEnquiries] = useState<BuyerEnquiry[]>(() => {
    try {
      return enquiryService.listEnquiries();
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(enquiryId || null);
  const [statusFilter, setStatusFilter] = useState<'all' | EnquiryWorkflowStatus>('all');

  const [replyText, setReplyText] = useState('');
  const [quotePrice, setQuotePrice] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccessToast, setSentSuccessToast] = useState(false);

  // 1. Live subscription to authenticated artisan's incoming enquiries
  useEffect(() => {
    if (!currentArtisanId) {
      setEnquiries([]);
      setLoading(false);
      return;
    }

    if (enquiries.length === 0) {
      setLoading(true);
    }
    setError(null);
    let isSubscribed = true;

    const unsubscribe = enquiryRepository.subscribeArtisanEnquiries
      ? enquiryRepository.subscribeArtisanEnquiries(currentArtisanId, (list) => {
          if (isSubscribed) {
            setEnquiries(list || []);
            setLoading(false);
          }
        })
      : () => {};

    // Direct fetch fallback if realtime is unavailable
    if (!enquiryRepository.subscribeArtisanEnquiries) {
      enquiryRepository
        .listArtisanEnquiries(currentArtisanId)
        .then((list) => {
          if (isSubscribed) {
            setEnquiries(list || []);
            setLoading(false);
          }
        })
        .catch((err) => {
          if (isSubscribed) {
            setError(err instanceof Error ? err.message : 'Failed to load enquiries.');
            setLoading(false);
          }
        });
    }

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentArtisanId]);

  // Sync activeId with URL param if present
  useEffect(() => {
    if (enquiryId) {
      setActiveId(enquiryId);
    }
  }, [enquiryId]);

  const filteredEnquiries = enquiries.filter((e) => {
    if (statusFilter === 'all') return true;
    return e.status === statusFilter;
  });

  const activeEnquiry = activeId
    ? enquiries.find((e) => e.id === activeId) || null
    : filteredEnquiries[0] || null;

  // 2. Auto-mark enquiry as read / acknowledged when opened
  useEffect(() => {
    if (activeEnquiry && activeEnquiry.status === 'new' && currentArtisanId) {
      enquiryRepository
        .updateEnquiryStatus(activeEnquiry.id, currentArtisanId, 'acknowledged', 'Marked as read by artisan')
        .then((updated) => {
          setEnquiries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
        })
        .catch(() => {
          // Ignore background read error
        });
    }
  }, [activeEnquiry, currentArtisanId]);

  const handleSelectEnquiry = (id: string) => {
    setActiveId(id);
    navigate(`/artisan/enquiries/${id}`);
    setReplyText('');
    setQuotePrice('');
    setSentSuccessToast(false);
  };

  const handleUpdateStatus = async (newStatus: EnquiryWorkflowStatus) => {
    if (!activeEnquiry || !currentArtisanId) return;
    try {
      const updated = await enquiryRepository.updateEnquiryStatus(
        activeEnquiry.id,
        currentArtisanId,
        newStatus,
        `Status updated to ${newStatus} by artisan`
      );
      setEnquiries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update enquiry status.');
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeEnquiry || !currentArtisanId) return;

    setIsSending(true);
    try {
      const price = quotePrice ? Number(quotePrice) : undefined;
      const updated = await enquiryRepository.addEnquiryReply(
        activeEnquiry.id,
        currentArtisanId,
        {
          id: `rep_${Date.now()}`,
          sender: 'artisan',
          text: replyText.trim(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          priceQuote: price,
        }
      );

      setEnquiries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      setReplyText('');
      setQuotePrice('');
      setSentSuccessToast(true);
      setTimeout(() => setSentSuccessToast(false), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send reply.');
    } finally {
      setIsSending(false);
    }
  };

  const newCount = enquiries.filter((e) => e.status === 'new').length;

  // Safe Not-Found Error View when an invalid enquiry ID is in the URL
  if (enquiryId && !loading && !enquiries.some((e) => e.id === enquiryId)) {
    return (
      <div className="p-8 text-center flex flex-col items-center gap-4 bg-white rounded-2xl border border-surface-variant max-w-lg mx-auto mt-8 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-error-container/50 text-error flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-bold text-lg text-primary">Enquiry Not Found</h2>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            The requested enquiry reference "{enquiryId}" could not be found or belongs to a different artisan.
          </p>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <Button variant="secondary" onClick={() => navigate('/artisan/enquiries')}>
            View All Enquiries
          </Button>
          <Button variant="ghost" onClick={() => navigate('/artisan/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 max-w-6xl mx-auto animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-variant pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/artisan/dashboard')}
            aria-label="Back to dashboard"
            className="p-2 text-on-surface-variant hover:text-primary rounded-full hover:bg-surface-container transition-colors touch-target"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-primary">
                Buyer Enquiries & Orders
              </h1>
              {newCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-secondary text-white shadow-xs">
                  {newCount} New
                </span>
              )}
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Verified customer requests, custom specification orders, and buyer leads received from your Craft Passports.
            </p>
          </div>
        </div>

        {!isOnline && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-100/90 text-amber-900 border border-amber-300 rounded-full text-xs font-medium self-start sm:self-auto">
            <WifiOff className="w-3.5 h-3.5" />
            <span>Cached Offline View</span>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs select-none">
        {(['all', 'new', 'acknowledged', 'contacted', 'closed'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={clsx(
              'px-3.5 py-1.5 rounded-xl font-bold capitalize transition-all whitespace-nowrap touch-target',
              statusFilter === st
                ? 'bg-primary text-white shadow-xs'
                : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
            )}
          >
            {st === 'all'
              ? `All (${enquiries.length})`
              : st === 'new'
              ? `New (${newCount})`
              : st === 'acknowledged'
              ? 'Read'
              : st}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 text-error text-xs rounded-xl border border-red-200 font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Content Body */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
          <Loader2 className="w-8 h-8 text-secondary animate-spin" />
          <p className="text-xs font-semibold">Loading your verified enquiries...</p>
        </div>
      ) : enquiries.length === 0 ? (
        <Card className="p-12 sm:p-16 text-center flex flex-col items-center gap-4 bg-white border border-surface-variant rounded-3xl shadow-xs">
          <div className="w-16 h-16 rounded-full bg-secondary-fixed/50 text-secondary flex items-center justify-center">
            <MessageCircle className="w-8 h-8" />
          </div>
          <div className="max-w-md flex flex-col gap-1">
            <h2 className="font-bold text-lg text-primary">No Buyer Enquiries Yet</h2>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              When buyers view your verified Craft Passports and submit structured inquiries, they will appear directly in this secure inbox with consented contact details.
            </p>
          </div>
          <Link
            to="/artisan/inventory"
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Package className="w-4 h-4" />
            <span>Manage Craft Products</span>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Enquiries List (4 cols) */}
          <div
            className={clsx(
              'lg:col-span-4 flex flex-col gap-3',
              activeId && 'hidden lg:flex'
            )}
          >
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                Inquiries ({filteredEnquiries.length})
              </span>
              <span className="text-[11px] text-on-surface-variant font-medium">Select to view</span>
            </div>

            <div className="flex flex-col gap-2 max-h-[640px] overflow-y-auto pr-1">
              {filteredEnquiries.map((item) => {
                const isSelected = item.id === activeEnquiry?.id;
                const isUnread = item.status === 'new';

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectEnquiry(item.id)}
                    className={clsx(
                      'p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 select-none touch-target',
                      isSelected
                        ? 'bg-white border-secondary shadow-md ring-2 ring-secondary/20'
                        : isUnread
                        ? 'bg-amber-50/90 border-amber-200 hover:bg-amber-100/70 shadow-xs'
                        : 'bg-white/80 border-surface-variant/80 hover:bg-white'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.productImage && (
                          <img
                            src={item.productImage}
                            alt={item.productTitle}
                            className="w-9 h-9 rounded-lg object-cover border border-surface-variant shrink-0"
                          />
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-xs sm:text-sm text-primary truncate">
                            {item.buyerName}
                          </span>
                          <span className="text-[11px] text-slate-700 truncate font-medium">
                            {item.productTitle}
                          </span>
                        </div>
                      </div>

                      <span
                        className={clsx(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0',
                          item.status === 'new'
                            ? 'bg-secondary text-white'
                            : item.status === 'contacted'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : item.status === 'closed'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-surface-container text-on-surface-variant'
                        )}
                      >
                        {item.status === 'new' ? 'New' : item.status === 'acknowledged' ? 'Read' : item.status}
                      </span>
                    </div>

                    <p className="text-xs text-on-surface-variant line-clamp-2 italic bg-surface-container-low/50 p-2 rounded-lg">
                      "{item.message || item.initialMessage}"
                    </p>

                    <div className="flex items-center justify-between text-[11px] pt-1 text-on-surface-variant font-medium">
                      <span className="text-secondary font-bold">
                        {item.quantityRequested} {item.quantityRequested === 1 ? 'unit' : 'units'}
                      </span>
                      <span className="font-mono text-[10px]">
                        {formatDateShortSafe(item.receivedAt || item.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Thread & Actions (8 cols) */}
          {activeEnquiry ? (
            <div className="lg:col-span-8 flex flex-col gap-4">
              {/* Mobile Back button to list */}
              <div className="lg:hidden">
                <button
                  onClick={() => setActiveId(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-secondary hover:underline py-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Inquiries List</span>
                </button>
              </div>

              {/* Active Enquiry Lead Header Card */}
              <Card className="p-5 flex flex-col gap-4 bg-white border border-surface-variant rounded-2xl shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-bold text-base sm:text-lg text-primary">{activeEnquiry.buyerName}</h2>
                      {activeEnquiry.buyerOrganisation && (
                        <span className="text-xs font-semibold text-secondary bg-secondary-fixed/40 px-2 py-0.5 rounded-md">
                          {activeEnquiry.buyerOrganisation}
                        </span>
                      )}
                      <span className="text-success font-bold text-xs flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-success" /> Consented Lead
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-on-surface-variant mt-1.5">
                      {activeEnquiry.destinationCity && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-secondary" /> {activeEnquiry.destinationCity}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[11px] font-mono">
                        <Clock className="w-3 h-3 text-on-surface-variant" />
                        {formatDateSafe(activeEnquiry.receivedAt || activeEnquiry.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Workflow Status Controls */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-on-surface-variant">Status:</span>
                    <select
                      value={activeEnquiry.status}
                      onChange={(e) => handleUpdateStatus(e.target.value as EnquiryWorkflowStatus)}
                      aria-label="Enquiry workflow status"
                      className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-surface-variant bg-white text-primary focus:ring-2 focus:ring-secondary"
                    >
                      <option value="new">New</option>
                      <option value="acknowledged">Read / Acknowledged</option>
                      <option value="contacted">Contacted / Replied</option>
                      <option value="closed">Closed / Archived</option>
                      <option value="spam">Mark as Spam</option>
                    </select>
                  </div>
                </div>

                {/* Direct Contact Actions (Gated strictly by buyer consent & provided details) */}
                {activeEnquiry.consentToBeContacted && (activeEnquiry.buyerPhone || activeEnquiry.buyerContact) && (
                  <div className="flex items-center gap-2.5 flex-wrap pt-3 border-t border-surface-variant/60">
                    <span className="text-xs font-bold text-on-surface-variant">Direct Buyer Contact:</span>
                    
                    {/* WhatsApp Action */}
                    <a
                      href={`https://wa.me/${(activeEnquiry.buyerPhone || activeEnquiry.buyerContact || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                        `Namaste ${activeEnquiry.buyerName}, thank you for your enquiry regarding "${activeEnquiry.productTitle}" on KarigarSaathi.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366]/10 text-[#128C7E] hover:bg-[#25D366]/20 border border-[#25D366]/30 rounded-xl text-xs font-bold transition-colors touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]"
                      onClick={() => handleUpdateStatus('contacted')}
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                      <span>Chat on WhatsApp ({activeEnquiry.buyerPhone || activeEnquiry.buyerContact})</span>
                    </a>

                    {/* Phone Action */}
                    <a
                      href={`tel:${(activeEnquiry.buyerPhone || activeEnquiry.buyerContact || '').replace(/[^\d+]/g, '')}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 text-primary hover:bg-primary/10 border border-primary/15 rounded-xl text-xs font-bold transition-colors touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      onClick={() => handleUpdateStatus('contacted')}
                    >
                      <Phone className="w-3.5 h-3.5 text-primary" />
                      <span>Call</span>
                    </a>
                  </div>
                )}
              </Card>

              {/* Product Reference Banner */}
              <div className="p-4 bg-surface-container-low rounded-2xl border border-surface-variant flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  {activeEnquiry.productImage ? (
                    <img
                      src={activeEnquiry.productImage}
                      alt={activeEnquiry.productTitle}
                      className="w-14 h-14 rounded-xl object-cover border border-surface-variant shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant shrink-0">
                      <Package className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">
                      Craft Product Inquired
                    </span>
                    <span className="font-bold text-sm text-primary truncate">
                      {activeEnquiry.productTitle}
                    </span>
                    <div className="flex items-center gap-3 mt-1">
                      <Link
                        to={`/artisan/inventory?search=${encodeURIComponent(activeEnquiry.productTitle)}`}
                        className="text-xs font-bold text-primary hover:text-secondary hover:underline flex items-center gap-1"
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>Inventory</span>
                      </Link>
                      {activeEnquiry.publicSlug && (
                        <Link
                          to={`/passport/${activeEnquiry.publicSlug}`}
                          state={{ from: '/artisan/enquiries', fromLabel: 'Enquiries Inbox', sourceRole: 'artisan' }}
                          className="text-xs font-bold text-secondary hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View Live Passport</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-surface-variant/60">
                  <span className="text-xs font-bold text-secondary bg-white px-3 py-1 rounded-full border border-surface-variant">
                    {activeEnquiry.quantityRequested} {activeEnquiry.quantityRequested === 1 ? 'Unit' : 'Units'} Requested
                  </span>
                  {activeEnquiry.targetPrice && (
                    <p className="text-xs font-bold text-primary mt-1.5">
                      Target Budget: ₹{activeEnquiry.targetPrice.toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
              </div>

              {/* Message Thread History */}
              <Card className="p-6 flex flex-col gap-4 min-h-[240px] bg-white border border-surface-variant rounded-2xl shadow-xs">
                {/* Initial Buyer Message */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary-fixed text-primary font-bold flex items-center justify-center shrink-0 mt-1 text-xs">
                    {activeEnquiry.buyerName[0]?.toUpperCase() || 'B'}
                  </div>
                  <div className="flex flex-col gap-1 max-w-[90%] sm:max-w-[80%]">
                    <div className="p-4 rounded-2xl rounded-tl-none bg-surface-container-high text-on-surface text-sm leading-relaxed">
                      <p>{activeEnquiry.message || activeEnquiry.initialMessage}</p>
                    </div>
                    <span className="text-[10px] text-on-surface-variant ml-1 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {activeEnquiry.buyerName} • Preferred: {activeEnquiry.preferredContactMethod || 'whatsapp'} • {formatDateSafe(activeEnquiry.receivedAt || activeEnquiry.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Threaded Artisan Replies */}
                {activeEnquiry.replies?.map((rep) => (
                  <div key={rep.id} className="flex items-start gap-3 justify-end">
                    <div className="flex flex-col gap-1 max-w-[90%] sm:max-w-[80%] items-end">
                      <div className="p-4 rounded-2xl rounded-tr-none bg-primary text-white text-sm leading-relaxed shadow-sm">
                        <p>{rep.text}</p>
                        {rep.priceQuote && (
                          <div className="mt-2 pt-2 border-t border-white/20 text-xs font-bold text-amber-200">
                            Formal Quote: ₹{rep.priceQuote.toLocaleString('en-IN')}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-on-surface-variant mr-1 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        You • {rep.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
              </Card>

              {/* Reply Form */}
              <Card className="p-4 bg-white border border-surface-variant rounded-2xl shadow-xs">
                <form onSubmit={handleSendReply} className="flex flex-col gap-3">
                  <TextArea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Reply to ${activeEnquiry.buyerName} directly with customisation notes, delivery estimate, or craft timeline...`}
                    rows={3}
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
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

                    <div className="flex items-center gap-2">
                      {sentSuccessToast && (
                        <span className="text-xs font-bold text-success flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Reply Recorded!
                        </span>
                      )}
                      <Button
                        type="submit"
                        disabled={isSending || !replyText.trim()}
                        leftIcon={isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        className="text-xs font-bold"
                      >
                        {isSending ? 'Sending...' : 'Send Message & Price Quote'}
                      </Button>
                    </div>
                  </div>
                </form>
              </Card>
            </div>
          ) : (
            <div className="lg:col-span-8 p-12 text-center text-on-surface-variant bg-surface-container-lowest rounded-2xl border border-surface-variant">
              Select an enquiry from the list to view details and message thread.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
