import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { coordinatorService } from '@/services/coordinator/coordinatorService';
import { validateProductForReadiness } from '@/domain/products/validation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  ArrowLeft,
  Building,
  MapPin,
  Loader2,
  AlertTriangle,
  MessageSquareQuote,
  ShieldCheck,
  Package,
  AlertCircle,
} from 'lucide-react';
import { ROUTES } from '@/routes';
import { clsx } from 'clsx';

export const CoordinatorArtisanDetailPage: React.FC = () => {
  const { artisanId } = useParams<{ artisanId: string }>();
  const { user, userAccount } = useAuth();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'enquiries' | 'cluster'>('products');

  const coordinatorUid = userAccount?.uid || user?.id || 'coord_001';

  useEffect(() => {
    let isMounted = true;
    async function loadArtisanDetail() {
      if (!artisanId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await coordinatorService.getAssignedArtisanDetail(coordinatorUid, artisanId);
        if (isMounted) {
          setDetail(data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unauthorized or artisan not found.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadArtisanDetail();
    return () => {
      isMounted = false;
    };
  }, [coordinatorUid, artisanId]);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
        <Loader2 className="w-8 h-8 text-secondary animate-spin" />
        <p className="text-xs font-semibold">Loading artisan cluster detail...</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <Card className="p-8 text-center flex flex-col items-center gap-4 bg-white border border-error/30 rounded-2xl max-w-lg mx-auto my-12">
        <AlertTriangle className="w-8 h-8 text-error" />
        <h3 className="font-bold text-base text-primary">Access Restricted</h3>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          {error || 'Artisan record could not be loaded.'}
        </p>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => navigate(ROUTES.COORDINATOR_ARTISANS)}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          className="text-xs font-bold"
        >
          Return to Artisans Directory
        </Button>
      </Card>
    );
  }

  const { projection, profile, products, enquiries, exportProblems } = detail;

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      {/* Top Breadcrumb / Back Link */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(ROUTES.COORDINATOR_ARTISANS)}
          className="flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors touch-target"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Artisans</span>
        </button>
      </div>

      {/* Artisan Profile Hero Banner */}
      <Card className="p-6 sm:p-8 bg-surface-container-lowest border border-surface-variant/80 rounded-3xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4 min-w-0">
          <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-2xl shrink-0 ring-2 ring-primary/20">
            {projection.artisanDisplayName?.charAt(0) || 'A'}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="font-display text-2xl font-bold text-primary truncate">
                {projection.artisanDisplayName}
              </h2>
              <Badge variant="indigo" className="text-[10px] font-bold uppercase">
                Active Assignment
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-on-surface-variant flex-wrap mt-1">
              {projection.clusterName && (
                <span className="flex items-center gap-1 font-medium">
                  <Building className="w-3.5 h-3.5 text-secondary" /> {projection.clusterName}
                </span>
              )}
              {projection.state && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-secondary" /> {projection.state}
                </span>
              )}
              {profile?.craftType && (
                <span className="text-secondary font-semibold">
                  • {profile.craftType}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Permissions Granted Status */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="p-2.5 bg-surface-container-low rounded-xl border border-surface-variant/50 flex items-center gap-3 text-xs">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase">
              Permitted Scope:
            </span>
            <span className="text-xs font-semibold text-primary">Catalog Status</span>
            <span className="text-xs font-semibold text-primary">Enquiries</span>
            {projection.permissions.assistExports && (
              <span className="text-xs font-semibold text-secondary font-bold">Export Help</span>
            )}
          </div>
        </div>
      </Card>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-surface-variant/80 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all touch-target',
            activeTab === 'products'
              ? 'bg-secondary text-white shadow-xs'
              : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'
          )}
        >
          <Package className="w-4 h-4" />
          <span>Product Catalog ({products.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('enquiries')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all touch-target',
            activeTab === 'enquiries'
              ? 'bg-secondary text-white shadow-xs'
              : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'
          )}
        >
          <MessageSquareQuote className="w-4 h-4" />
          <span>Buyer Enquiries ({enquiries.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cluster')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all touch-target',
            activeTab === 'cluster'
              ? 'bg-secondary text-white shadow-xs'
              : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'
          )}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Cluster & Export Diagnostics</span>
        </button>
      </div>

      {/* Tab 1: Product Catalog & Readiness Checks */}
      {activeTab === 'products' && (
        <div className="flex flex-col gap-4">
          {products.length === 0 ? (
            <Card className="p-12 text-center flex flex-col items-center gap-2 bg-white border border-surface-variant rounded-2xl">
              <Package className="w-8 h-8 text-on-surface-variant" />
              <h4 className="font-bold text-sm text-primary">No Products Created Yet</h4>
              <p className="text-xs text-on-surface-variant">
                This artisan has not yet started catalog digitization.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map((prod: any) => {
                const readiness = validateProductForReadiness(prod);
                return (
                  <Card
                    key={prod.id}
                    className="p-5 bg-white border border-surface-variant/80 rounded-2xl shadow-xs flex flex-col justify-between gap-4"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col min-w-0">
                          <h4 className="font-bold text-sm text-primary truncate">{prod.title || 'Untitled Product'}</h4>
                          <span className="text-xs text-on-surface-variant">{prod.category || 'Handicraft'} • ₹{(prod.price || prod.selectedPrice || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <span
                          className={clsx(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase',
                            readiness.isReady
                              ? 'bg-success-container text-on-success-container'
                              : 'bg-amber-100 text-amber-900'
                          )}
                        >
                          {readiness.isReady ? 'Ready' : 'Incomplete'}
                        </span>
                      </div>

                      {/* Readiness Gaps List if incomplete */}
                      {!readiness.isReady && (
                        <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl flex flex-col gap-1.5 text-xs text-amber-900">
                          <span className="font-bold text-[11px] flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                            Readiness Issues ({readiness.errors.length}):
                          </span>
                          <ul className="list-disc list-inside text-[11px] text-amber-800 flex flex-col gap-0.5">
                            {readiness.errors.map((err, i) => (
                              <li key={i}>{err.message}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-surface-variant flex items-center justify-between">
                      <span className="text-[10px] text-on-surface-variant">ID: {prod.id}</span>
                      <Button
                        size="sm"
                        onClick={() => navigate(ROUTES.COORDINATOR_REVIEWS)}
                        className="text-xs font-bold"
                      >
                        Review in Queue
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Buyer Enquiries */}
      {activeTab === 'enquiries' && (
        <div className="flex flex-col gap-4">
          {enquiries.length === 0 ? (
            <Card className="p-12 text-center flex flex-col items-center gap-2 bg-white border border-surface-variant rounded-2xl">
              <MessageSquareQuote className="w-8 h-8 text-on-surface-variant" />
              <h4 className="font-bold text-sm text-primary">No Enquiries Received</h4>
              <p className="text-xs text-on-surface-variant">
                This artisan has no open buyer enquiries.
              </p>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {enquiries.map((enq: any) => (
                <Card
                  key={enq.id}
                  className="p-5 bg-white border border-surface-variant/80 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-primary">{enq.buyerName}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary-fixed text-secondary uppercase">
                        {enq.status}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant line-clamp-1">{enq.message || enq.initialMessage}</p>
                    <span className="text-[11px] text-secondary font-semibold">
                      Product: {enq.productTitle} • Qty: {enq.quantityRequested || 1}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => navigate(ROUTES.COORDINATOR_ENQUIRIES)}
                    className="text-xs font-bold shrink-0"
                  >
                    Assist Reply
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Cluster & Export Diagnostics */}
      {activeTab === 'cluster' && (
        <div className="flex flex-col gap-4">
          <Card className="p-6 bg-white border border-surface-variant/80 rounded-2xl shadow-xs flex flex-col gap-4">
            <h3 className="font-display text-base font-bold text-primary">
              Cluster Assignment Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-surface-container-low rounded-xl border border-surface-variant/40">
                <span className="text-[10px] text-on-surface-variant font-bold block uppercase">Cluster Name</span>
                <span className="font-bold text-primary">{projection.clusterName}</span>
              </div>
              <div className="p-3 bg-surface-container-low rounded-xl border border-surface-variant/40">
                <span className="text-[10px] text-on-surface-variant font-bold block uppercase">State / Region</span>
                <span className="font-bold text-primary">{projection.state}</span>
              </div>
            </div>

            {exportProblems.length > 0 && (
              <div className="flex flex-col gap-2 pt-4 border-t border-surface-variant">
                <h4 className="font-bold text-xs text-error flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Export Problems Recorded ({exportProblems.length})
                </h4>
                {exportProblems.map((ep: any, idx: number) => (
                  <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs flex justify-between items-center">
                    <div>
                      <span className="font-bold text-primary">{ep.productTitle} ({ep.format?.toUpperCase()})</span>
                      <p className="text-error mt-0.5">{ep.errorMessage}</p>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => navigate(ROUTES.COORDINATOR_SALES)} className="text-xs font-bold">
                      Resolve
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};
