/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { coordinatorService } from '@/services/coordinator/coordinatorService';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Search,
  CheckCircle2,
  Clock,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Package,
} from 'lucide-react';
import { ROUTES } from '@/routes';
import { clsx } from 'clsx';

export const CoordinatorEnquiriesPage: React.FC = () => {
  const { user, userAccount } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const activeTab = searchParams.get('tab') || 'all';

  const coordinatorUid = userAccount?.uid || user?.id || 'coord_001';

  useEffect(() => {
    let isMounted = true;
    async function loadEnquiries() {
      setLoading(true);
      setError(null);
      try {
        const list = await coordinatorService.listAssignedEnquiries(coordinatorUid);
        if (isMounted) {
          setEnquiries(list);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load buyer enquiries.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadEnquiries();
    return () => {
      isMounted = false;
    };
  }, [coordinatorUid]);

  const filteredEnquiries = enquiries.filter((e) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (e.buyerName && e.buyerName.toLowerCase().includes(term)) ||
      (e.artisanName && e.artisanName.toLowerCase().includes(term)) ||
      (e.productTitle && e.productTitle.toLowerCase().includes(term));

    let matchesTab = true;
    if (activeTab === 'new') {
      matchesTab = e.status === 'new';
    } else if (activeTab === 'replied') {
      matchesTab = e.status === 'replied';
    } else if (activeTab === 'confirmed') {
      matchesTab = e.status === 'order_confirmed';
    }

    return matchesSearch && matchesTab;
  });

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-surface-variant/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">
              Market Linkage
            </span>
            <Badge variant="indigo" className="text-[10px] uppercase font-bold">
              Buyer Enquiries
            </Badge>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-primary tracking-tight mt-1">
            Buyer Enquiries & Orders
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            Monitor, assist, and follow up on wholesale and retail buyer messages received across your assigned artisans.
          </p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="w-full sm:w-80">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by buyer, artisan, or product..."
            leftIcon={<Search className="w-4 h-4 text-on-surface-variant" />}
            className="text-xs"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center bg-surface-container rounded-xl p-1 text-xs font-bold overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'all' })}
            className={clsx(
              'px-3 py-1.5 rounded-lg whitespace-nowrap transition-all touch-target',
              activeTab === 'all' ? 'bg-white text-primary shadow-xs' : 'text-on-surface-variant hover:text-primary'
            )}
          >
            All Enquiries ({enquiries.length})
          </button>
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'new' })}
            className={clsx(
              'px-3 py-1.5 rounded-lg whitespace-nowrap transition-all touch-target',
              activeTab === 'new' ? 'bg-white text-secondary shadow-xs' : 'text-on-surface-variant hover:text-primary'
            )}
          >
            New Messages
          </button>
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'replied' })}
            className={clsx(
              'px-3 py-1.5 rounded-lg whitespace-nowrap transition-all touch-target',
              activeTab === 'replied' ? 'bg-white text-primary shadow-xs' : 'text-on-surface-variant hover:text-primary'
            )}
          >
            Replied
          </button>
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'confirmed' })}
            className={clsx(
              'px-3 py-1.5 rounded-lg whitespace-nowrap transition-all touch-target',
              activeTab === 'confirmed' ? 'bg-white text-success shadow-xs' : 'text-on-surface-variant hover:text-primary'
            )}
          >
            Confirmed Orders
          </button>
        </div>
      </div>

      {/* Enquiries List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
          <Loader2 className="w-8 h-8 text-secondary animate-spin" />
          <p className="text-xs font-semibold">Loading assigned buyer enquiries...</p>
        </div>
      ) : error ? (
        <Card className="p-8 text-center flex flex-col items-center gap-3 bg-white border border-error/30 rounded-2xl max-w-md mx-auto">
          <AlertTriangle className="w-8 h-8 text-error" />
          <h3 className="font-bold text-base text-primary">Unable to load enquiries</h3>
          <p className="text-xs text-on-surface-variant leading-relaxed">{error}</p>
        </Card>
      ) : filteredEnquiries.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center gap-3 bg-white border border-surface-variant rounded-2xl">
          <CheckCircle2 className="w-10 h-10 text-success" />
          <h3 className="font-bold text-base text-primary">No Enquiries Found</h3>
          <p className="text-xs text-on-surface-variant max-w-md">
            No incoming buyer enquiries match the selected filter.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3.5">
          {filteredEnquiries.map((enq) => (
            <Card
              key={enq.id}
              className="p-5 bg-white border border-surface-variant/80 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-secondary/40 transition-all"
            >
              <div className="flex items-start gap-4 min-w-0">
                <div className="w-11 h-11 rounded-full bg-secondary-fixed text-secondary flex items-center justify-center font-bold text-base shrink-0">
                  {enq.buyerName?.charAt(0) || 'B'}
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-sm text-primary truncate">{enq.buyerName}</h4>
                    <span
                      className={clsx(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase',
                        enq.status === 'new'
                          ? 'bg-secondary-fixed text-secondary'
                          : enq.status === 'order_confirmed'
                          ? 'bg-success-container text-on-success-container'
                          : 'bg-surface-container text-on-surface-variant'
                      )}
                    >
                      {enq.status === 'order_confirmed' ? 'Order Confirmed' : enq.status}
                    </span>
                  </div>

                  <p className="text-xs text-on-surface-variant line-clamp-2 mt-1">
                    "{enq.message || enq.initialMessage}"
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-on-surface-variant flex-wrap mt-2">
                    <span className="font-semibold text-secondary flex items-center gap-1">
                      <Package className="w-3.5 h-3.5" /> {enq.productTitle}
                    </span>
                    <span>• Artisan: <strong>{enq.artisanName}</strong></span>
                    <span>• Qty: <strong>{enq.quantityRequested || 1} units</strong></span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {enq.receivedAt || 'Recent'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end shrink-0">
                <Button
                  size="sm"
                  onClick={() => navigate(ROUTES.coordinatorEnquiryDetail(enq.id))}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  className="text-xs font-bold"
                >
                  View Thread
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
