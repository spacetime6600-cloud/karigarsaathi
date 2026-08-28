import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { enquiryRepository } from '@/repositories';
import { enquiryService } from '@/services/api/enquiryService';
import { BuyerEnquiry, EnquiryWorkflowStatus } from '@/types';
import { QuickReplyModal } from '@/components/enquiries/QuickReplyModal';
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
  Reply,
  AlertCircle,
  Building,
  MessageCircle,
  ShieldCheck,
  Check,
  Loader2,
} from 'lucide-react';
import { clsx } from 'clsx';

export const BuyerEnquiryPage: React.FC = () => {
  const { enquiryId } = useParams<{ enquiryId?: string }>();
  const navigate = useNavigate();
  const { user, userAccount } = useAuth();
  const currentArtisanId = userAccount?.uid || user?.id || 'artisan_001';
  const [enquiries, setEnquiries] = useState<BuyerEnquiry[]>(() => {
    try {
      return enquiryService.listEnquiries();
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(enquiryId || null);
  const [statusFilter, setStatusFilter] = useState<'all' | EnquiryWorkflowStatus>('all');

  const [replyText, setReplyText] = useState('');
  const [quotePrice, setQuotePrice] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccessToast, setSentSuccessToast] = useState(false);
  const [isQuickReplyModalOpen, setIsQuickReplyModalOpen] = useState(false);

  useEffect(() => {
    const fetchEnquiries = async () => {
      try {
        const list = await enquiryRepository.listArtisanEnquiries(currentArtisanId);
        if (list && list.length > 0) {
          setEnquiries(list);
        }
      } catch {
        // Keep existing
      } finally {
        setLoading(false);
      }
    };
    fetchEnquiries();
  }, [currentArtisanId]);

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
            The requested enquiry reference "{enquiryId}" could not be found or has been removed.
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

  const handleSelectEnquiry = (id: string) => {
    setActiveId(id);
    navigate(`/artisan/enquiries/${id}`);
    setReplyText('');
    setQuotePrice('');
    setSentSuccessToast(false);
  };

  const handleUpdateStatus = async (newStatus: EnquiryWorkflowStatus) => {
    if (!activeEnquiry) return;
    try {
      const updated = await enquiryRepository.updateEnquiryStatus(
        activeEnquiry.id,
        currentArtisanId,
        newStatus,
        `Status updated to ${newStatus} by artisan`
      );
      setEnquiries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status.');
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeEnquiry) return;

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
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-secondary text-white">
                  {newCount} New
                </span>
              )}
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Review verified leads, negotiate custom specifications, and manage direct buyer orders.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsQuickReplyModalOpen(true)}
            leftIcon={<Reply className="w-4 h-4" />}
            className="text-xs font-bold"
          >
            Quick Reply Dialog
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {(['all', 'new', 'acknowledged', 'contacted', 'closed', 'spam'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={clsx(
              'px-3 py-1.5 rounded-lg font-bold capitalize transition-colors whitespace-nowrap',
              statusFilter === st
                ? 'bg-primary text-white'
                : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
            )}
          >
            {st === 'all' ? `All (${enquiries.length})` : st}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
          <Loader2 className="w-8 h-8 text-secondary animate-spin" />
          <p className="text-xs font-semibold">Loading your verified enquiries...</p>
        </div>
      ) : enquiries.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center gap-3 bg-white border border-surface-variant rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center">
            <MessageCircle className="w-6 h-6" />
          </div>
          <h2 className="font-bold text-base text-primary">No Buyer Enquiries Yet</h2>
          <p className="text-xs text-on-surface-variant max-w-sm">
            When buyers view your public Craft Passports and submit structured enquiries, they will appear here securely.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Enquiries List (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                Inquiries ({filteredEnquiries.length})
              </span>
              <span className="text-[11px] text-on-surface-variant font-medium">Select to view</span>
            </div>

            <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredEnquiries.map((item) => {
                const isSelected = item.id === activeId;
                const isUnread = item.status === 'new';

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectEnquiry(item.id)}
                    className={clsx(
                      'p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 select-none touch-target',
                      isSelected
                        ? 'bg-white border-secondary shadow-md ring-2 ring-secondary/20'
                        : isUnread
                        ? 'bg-amber-50/80 border-amber-200 hover:bg-amber-100/70'
                        : 'bg-surface-container-low/60 border-surface-variant/70 hover:bg-white'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-xs sm:text-sm text-primary truncate">
                          {item.buyerName}
                        </span>
                        {item.buyerOrganisation && (
                          <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
                            <Building className="w-2.5 h-2.5 text-secondary" /> {item.buyerOrganisation}
                          </span>
                        )}
                        {item.destinationCity && (
                          <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5 text-secondary" /> {item.destinationCity}
                          </span>
                        )}
                      </div>

                      <span
                        className={clsx(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full capitalize',
                          item.status === 'new'
                            ? 'bg-secondary text-white'
                            : item.status === 'contacted'
                            ? 'bg-green-100 text-green-800'
                            : item.status === 'closed'
                            ? 'bg-gray-200 text-gray-700'
                            : 'bg-surface-container text-on-surface-variant'
                        )}
                      >
                        {item.status}
                      </span>
                    </div>

                    <p className="text-xs text-on-surface-variant line-clamp-1 italic">
                      "{item.message || item.initialMessage}"
                    </p>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-surface-variant/40">
                      <span className="text-secondary font-bold">
                        {item.quantityRequested} units • {item.preferredContactMethod || 'whatsapp'}
                      </span>
                      <span className="text-on-surface-variant font-mono text-[10px]">
                        {new Date(item.receivedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
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
              {/* Active Enquiry Card Header */}
              <Card className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-surface-variant card-shadow rounded-2xl">
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-base text-primary">{activeEnquiry.buyerName}</h2>
                    {activeEnquiry.buyerOrganisation && (
                      <span className="text-xs font-semibold text-secondary">
                        ({activeEnquiry.buyerOrganisation})
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-on-surface-variant mt-1">
                    {activeEnquiry.buyerContact && (
                      <span className="flex items-center gap-1 font-mono text-secondary font-semibold">
                        <Phone className="w-3 h-3" /> {activeEnquiry.buyerContact}
                      </span>
                    )}
                    {activeEnquiry.destinationCity && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-secondary" /> {activeEnquiry.destinationCity}
                      </span>
                    )}
                    <span className="text-success font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-success" /> Verified Lead
                    </span>
                  </div>
                </div>

                {/* Workflow Status Switcher */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-on-surface-variant">Status:</span>
                  <select
                    value={activeEnquiry.status}
                    onChange={(e) => handleUpdateStatus(e.target.value as EnquiryWorkflowStatus)}
                    className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-surface-variant bg-white text-primary focus:ring-2 focus:ring-secondary"
                  >
                    <option value="new">New</option>
                    <option value="acknowledged">Acknowledged</option>
                    <option value="contacted">Contacted</option>
                    <option value="closed">Closed</option>
                    <option value="spam">Mark as Spam</option>
                  </select>
                </div>
              </Card>

              {/* Product Inquired Reference Banner */}
              <div className="p-3.5 bg-surface-container rounded-xl border border-surface-variant flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  {activeEnquiry.productImage && (
                    <img
                      src={activeEnquiry.productImage}
                      alt={activeEnquiry.productTitle}
                      className="w-12 h-12 rounded-lg object-cover border border-surface-variant shrink-0"
                    />
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">
                      Product Inquired
                    </span>
                    <span className="font-bold text-sm text-primary truncate">
                      {activeEnquiry.productTitle}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-secondary bg-white px-3 py-1 rounded-full border border-surface-variant">
                    {activeEnquiry.quantityRequested} Units Requested
                  </span>
                  {activeEnquiry.targetPrice && (
                    <p className="text-[11px] font-bold text-primary mt-1">
                      Budget: ₹{activeEnquiry.targetPrice.toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
              </div>

              {/* Message Thread History */}
              <Card className="p-6 flex flex-col gap-4 min-h-[250px] bg-white border border-surface-variant rounded-2xl">
                {/* Initial Buyer Message */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary-fixed text-primary font-bold flex items-center justify-center shrink-0 mt-1 text-xs">
                    {activeEnquiry.buyerName[0]?.toUpperCase() || 'B'}
                  </div>
                  <div className="flex flex-col gap-1 max-w-[85%]">
                    <div className="p-4 rounded-2xl rounded-tl-none bg-surface-container-high text-on-surface text-sm leading-relaxed">
                      <p>{activeEnquiry.message || activeEnquiry.initialMessage}</p>
                    </div>
                    <span className="text-[10px] text-on-surface-variant ml-1 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {activeEnquiry.buyerName} • Preferred: {activeEnquiry.preferredContactMethod || 'whatsapp'} • {new Date(activeEnquiry.receivedAt).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Threaded Artisan Replies */}
                {activeEnquiry.replies?.map((rep) => (
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
                      <span className="text-[10px] text-on-surface-variant mr-1 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        You • {rep.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
              </Card>

              {/* Reply Form */}
              <Card className="p-4 bg-white border border-surface-variant rounded-2xl">
                <form onSubmit={handleSendReply} className="flex flex-col gap-3">
                  <TextArea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Reply to ${activeEnquiry.buyerName} directly with customisation notes or delivery timeline...`}
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
                        placeholder="e.g. 13500"
                        className="w-32 text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      {sentSuccessToast && (
                        <span className="text-xs font-bold text-success flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Reply Sent!
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
              Select an enquiry from the left to view the message thread.
            </div>
          )}
        </div>
      )}

      {/* Quick Reply Modal */}
      {isQuickReplyModalOpen && (
        <QuickReplyModal
          isOpen={isQuickReplyModalOpen}
          onClose={() => setIsQuickReplyModalOpen(false)}
          enquiryId={activeId}
          onReplySent={async () => {
            setIsQuickReplyModalOpen(false);
            if (currentArtisanId) {
              const freshList = await enquiryRepository.listArtisanEnquiries(currentArtisanId);
              setEnquiries(freshList);
            }
          }}
        />
      )}
    </div>
  );
};
