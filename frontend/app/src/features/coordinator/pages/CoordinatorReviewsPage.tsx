import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { coordinatorService } from '@/services/coordinator/coordinatorService';
import { validateProductForReadiness } from '@/domain/products/validation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import {
  FileCheck2,
  Search,
  AlertCircle,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Image,
  X,
  ExternalLink,
} from 'lucide-react';
import { clsx } from 'clsx';
import { ROUTES } from '@/routes';

export const CoordinatorReviewsPage: React.FC = () => {
  const { user, userAccount } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const activeTab = searchParams.get('tab') || 'all';
  const artisanFilter = searchParams.get('artisanId') || 'all';

  // Review modal state
  const [inspectingProduct, setInspectingProduct] = useState<any | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const coordinatorUid = userAccount?.uid || user?.id || 'coord_001';

  const loadReviewProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await coordinatorService.listAssignedProducts(coordinatorUid);
      setProducts(list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load review queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviewProducts();
  }, [coordinatorUid]);

  // Filter products by tab & search
  const filteredProducts = products.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (p.title && p.title.toLowerCase().includes(term)) ||
      (p.artisanName && p.artisanName.toLowerCase().includes(term)) ||
      (p.category && p.category.toLowerCase().includes(term));

    const matchesArtisan =
      artisanFilter === 'all' || p.artisanUid === artisanFilter;

    let matchesTab = true;
    const readiness = validateProductForReadiness(p);

    if (activeTab === 'needs_review') {
      matchesTab = p.status === 'draft' || !readiness.isReady;
    } else if (activeTab === 'ready') {
      matchesTab = p.status === 'ready' || readiness.isReady;
    } else if (activeTab === 'exported') {
      matchesTab = p.status === 'published' || p.status === 'shared' || p.status === 'passport_generated';
    }

    return matchesSearch && matchesArtisan && matchesTab;
  });

  const handleReviewAction = async (action: 'mark_ready' | 'request_changes') => {
    if (!inspectingProduct) return;
    setSubmittingAction(true);
    setActionSuccess(null);
    try {
      await coordinatorService.updateProductReview(
        coordinatorUid,
        inspectingProduct.artisanUid,
        inspectingProduct.id,
        action,
        reviewNotes
      );
      setActionSuccess(
        action === 'mark_ready'
          ? 'Product certified as Ready for Craft Passport & Export!'
          : 'Correction request with coordinator notes logged successfully.'
      );
      await loadReviewProducts();
      setTimeout(() => {
        setInspectingProduct(null);
        setReviewNotes('');
        setActionSuccess(null);
      }, 1200);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to record review action.');
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-surface-variant/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">
              Quality Assurance
            </span>
            <Badge variant="indigo" className="text-[10px] uppercase font-bold">
              Readiness Gate
            </Badge>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-primary tracking-tight mt-1">
            Product Catalogue Reviews
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            Audit craft authenticity, dimensions, fair pricing, and readiness before passport generation or batch export.
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
            placeholder="Search by craft title or artisan..."
            leftIcon={<Search className="w-4 h-4 text-on-surface-variant" />}
            className="text-xs"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center bg-surface-container rounded-xl p-1 text-xs font-bold overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'all' })}
            className={clsx(
              'px-3 py-1.5 rounded-lg whitespace-nowrap transition-all touch-target',
              activeTab === 'all' ? 'bg-white text-primary shadow-xs' : 'text-on-surface-variant hover:text-primary'
            )}
          >
            All Products ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'needs_review' })}
            className={clsx(
              'px-3 py-1.5 rounded-lg whitespace-nowrap transition-all touch-target',
              activeTab === 'needs_review' ? 'bg-white text-amber-900 shadow-xs' : 'text-on-surface-variant hover:text-primary'
            )}
          >
            Needs Review
          </button>
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'ready' })}
            className={clsx(
              'px-3 py-1.5 rounded-lg whitespace-nowrap transition-all touch-target',
              activeTab === 'ready' ? 'bg-white text-secondary shadow-xs' : 'text-on-surface-variant hover:text-primary'
            )}
          >
            Ready / Certified
          </button>
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'exported' })}
            className={clsx(
              'px-3 py-1.5 rounded-lg whitespace-nowrap transition-all touch-target',
              activeTab === 'exported' ? 'bg-white text-primary shadow-xs' : 'text-on-surface-variant hover:text-primary'
            )}
          >
            Published / Passport
          </button>
        </div>
      </div>

      {/* Main Review Products Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
          <Loader2 className="w-8 h-8 text-secondary animate-spin" />
          <p className="text-xs font-semibold">Loading assigned product review queue...</p>
        </div>
      ) : error ? (
        <Card className="p-8 text-center flex flex-col items-center gap-3 bg-white border border-error/30 rounded-2xl max-w-md mx-auto">
          <AlertTriangle className="w-8 h-8 text-error" />
          <h3 className="font-bold text-base text-primary">Unable to load reviews</h3>
          <p className="text-xs text-on-surface-variant leading-relaxed">{error}</p>
        </Card>
      ) : filteredProducts.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center gap-3 bg-white border border-surface-variant rounded-2xl">
          <CheckCircle2 className="w-10 h-10 text-success" />
          <h3 className="font-bold text-base text-primary">No Products in This Queue</h3>
          <p className="text-xs text-on-surface-variant max-w-md">
            There are currently no products matching your search and filter criteria.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((prod) => {
            const readiness = validateProductForReadiness(prod);
            const coverImage = prod.photos?.[0]?.url || prod.images?.[0]?.previewUrl;

            return (
              <Card
                key={prod.id}
                className="bg-white border border-surface-variant/80 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between hover:border-secondary/40 transition-all"
              >
                <div>
                  {/* Image / Thumbnail */}
                  <div className="h-44 w-full bg-surface-container-low relative overflow-hidden flex items-center justify-center">
                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt={prod.title || 'Product'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-on-surface-variant">
                        <Image className="w-8 h-8 text-on-surface-variant/50" />
                        <span className="text-[10px] font-semibold">No Cover Photo</span>
                      </div>
                    )}

                    <span
                      className={clsx(
                        'absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-xs uppercase',
                        readiness.isReady
                          ? 'bg-success text-white'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      )}
                    >
                      {readiness.isReady ? 'Ready' : 'Incomplete'}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex flex-col gap-2.5">
                    <div className="flex flex-col">
                      <h4 className="font-bold text-sm text-primary line-clamp-1">
                        {prod.title || 'Untitled Craft Item'}
                      </h4>
                      <span className="text-xs text-secondary font-semibold">
                        {prod.artisanName} • {prod.clusterName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-on-surface-variant pt-1 border-t border-surface-variant/50">
                      <span>Category: <strong>{prod.category || 'Craft'}</strong></span>
                      <span className="text-primary font-bold">
                        ₹{(prod.price || prod.selectedPrice || 0).toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Readiness Gaps Tag Summary */}
                    {!readiness.isReady && (
                      <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900 flex items-start gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">
                          {readiness.errors.map((e) => e.field).join(', ')} missing
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 pt-0">
                  <Button
                    size="sm"
                    onClick={() => {
                      setInspectingProduct(prod);
                      setReviewNotes(prod.shippingNotes || '');
                    }}
                    className="w-full text-xs font-bold"
                  >
                    Inspect & Review
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* REVIEW INSPECTION MODAL                                   */}
      {/* ========================================================= */}
      {inspectingProduct && (
        <div
          role="dialog"
          aria-labelledby="modal-review-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
        >
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 bg-white rounded-3xl shadow-2xl border border-surface-variant flex flex-col gap-5 relative">
            <button
              type="button"
              onClick={() => setInspectingProduct(null)}
              className="absolute right-4 top-4 p-1.5 text-on-surface-variant hover:text-primary rounded-lg touch-target"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-secondary uppercase tracking-wider">
                Coordinator Review
              </span>
              <h3 id="modal-review-title" className="font-display text-xl font-bold text-primary">
                {inspectingProduct.title || 'Untitled Craft Item'}
              </h3>
              <span className="text-xs text-on-surface-variant">
                Crafted by <strong>{inspectingProduct.artisanName}</strong> ({inspectingProduct.clusterName})
              </span>
            </div>

            {actionSuccess && (
              <div className="p-3.5 bg-green-50 text-green-900 border border-green-200 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-700" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {/* Product Facts Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-surface-container-low rounded-2xl border border-surface-variant text-xs">
              <div>
                <span className="text-[10px] text-on-surface-variant block uppercase">Category</span>
                <span className="font-bold text-primary">{inspectingProduct.category || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-on-surface-variant block uppercase">Price</span>
                <span className="font-bold text-primary">₹{(inspectingProduct.price || inspectingProduct.selectedPrice || 0).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] text-on-surface-variant block uppercase">Stock</span>
                <span className="font-bold text-primary">{inspectingProduct.stockQuantity || 1} units</span>
              </div>
            </div>

            {/* Readiness Audit Report */}
            {(() => {
              const readiness = validateProductForReadiness(inspectingProduct);
              return (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-secondary" /> Readiness Assessment (10 Quality Gates)
                  </span>
                  {readiness.isReady ? (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-900 flex items-center gap-2 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-green-700" />
                      <span>All 10 listing quality checks passed. Product meets verified Craft Passport standards.</span>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex flex-col gap-1.5 text-xs text-amber-900">
                      <span className="font-bold text-amber-800">
                        {readiness.errors.length} Readiness Gaps to Resolve:
                      </span>
                      <ul className="list-disc list-inside text-[11px] flex flex-col gap-0.5">
                        {readiness.errors.map((err, i) => (
                          <li key={i}>{err.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Live Passport Link if available */}
            {(inspectingProduct.passportSlug || inspectingProduct.passportId) && (
              <div className="p-3 bg-secondary/10 border border-secondary/20 rounded-xl flex items-center justify-between text-xs">
                <span className="font-bold text-primary">Digitized Craft Passport Active</span>
                <Link
                  to={ROUTES.publicPassport(inspectingProduct.passportSlug || inspectingProduct.passportId)}
                  state={{
                    from: `/coordinator/reviews${location.search}`,
                    fromLabel: 'Reviews Queue',
                    sourceRole: 'coordinator',
                  }}
                  className="font-bold text-secondary hover:underline flex items-center gap-1"
                >
                  <span>View Craft Passport</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {/* Coordinator Review Notes */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="review-notes" className="text-xs font-bold text-primary">
                Coordinator Feedback & Assistance Notes
              </label>
              <TextArea
                id="review-notes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add guidance for the artisan (e.g., 'Please take a close-up photo of the weave pattern', 'Add washing temperature in care instructions')..."
                rows={3}
                className="text-xs"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Button
                variant="secondary"
                disabled={submittingAction}
                onClick={() => handleReviewAction('request_changes')}
                className="w-full sm:flex-1 text-xs font-bold"
              >
                Request Corrections
              </Button>

              <Button
                disabled={submittingAction}
                onClick={() => handleReviewAction('mark_ready')}
                className="w-full sm:flex-1 text-xs font-bold bg-secondary text-white"
              >
                {submittingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Certify as Ready'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
