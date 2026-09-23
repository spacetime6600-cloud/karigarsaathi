import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { useProductDraft } from '@/app/providers/ProductDraftProvider';
import { productRepository } from '@/repositories';
import { productRepository as legacyProductRepo } from '@/services/api/productRepository';
import { isEmulatorMode } from '@/config/firebase';
import { ProductRecord, draftToProductRecord } from '@/domain/products';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import {
  Plus,
  Search,
  Package,
  Copy,
  Archive,
  RotateCcw,
  Trash2,
  Edit,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle,
  QrCode,
  ShieldAlert,
  ExternalLink,
} from 'lucide-react';
import { clsx } from 'clsx';
import { logger } from '@/services/logging/logger';
import { passportManager } from '@/services/passport/passportManager';
import { storage } from '@/services/storage/localStorage';
import { ROUTES } from '@/routes';
import { resolveProductCoverUrl, handleImageFallback } from '@/services/media/imageUrlResolver';

type InventoryTab = 'all' | 'draft' | 'ready' | 'published' | 'archived';

export const InventoryManagementPage: React.FC = () => {
  const { user } = useAuth();
  const { loadDraft, resetDraft } = useProductDraft();
  const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts] = useState<ProductRecord[]>(() => {
    return legacyProductRepo.listProducts().map((d) => draftToProductRecord(d, user?.id || 'artisan_default'));
  });
  const [activeTab, setActiveTab] = useState<InventoryTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [targetProduct, setTargetProduct] = useState<ProductRecord | null>(null);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [isActionProcessing, setIsActionProcessing] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchInventory = React.useCallback(async () => {
    const ownerId = user?.id || (isEmulatorMode ? 'demo_artisan_ravi' : undefined);
    if (!ownerId) {
      const fallback = legacyProductRepo.listProducts().map((d) => draftToProductRecord(d, 'demo_artisan_ravi'));
      setProducts(fallback);
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const allRecords = await productRepository.listAllArtisanProducts(ownerId);
      if (allRecords && allRecords.length > 0) {
        setProducts(allRecords);
      } else {
        const mockList = storage.get<ProductRecord[]>(`mock_products_${ownerId}`, []);
        if (mockList && mockList.length > 0) {
          setProducts(mockList);
        } else {
          const fallback = legacyProductRepo.listProducts().map((d) => draftToProductRecord(d, ownerId));
          setProducts(fallback);
        }
      }
      logger.info('INVENTORY', 'Loaded artisan inventory', { ownerId, count: allRecords?.length || 0 });
    } catch (err) {
      const mockList = storage.get<ProductRecord[]>(`mock_products_${ownerId}`, []);
      if (mockList && mockList.length > 0) {
        setProducts(mockList);
      } else {
        const fallback = legacyProductRepo.listProducts().map((d) => draftToProductRecord(d, ownerId));
        setProducts(fallback);
      }
      logger.warn('INVENTORY', 'Using local fallback products for inventory', {
        ownerId,
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Tab filter
      if (activeTab === 'all' && p.status === 'archived') return false;
      if (activeTab === 'draft' && p.status !== 'draft') return false;
      if (activeTab === 'ready' && p.status !== 'ready') return false;
      if (activeTab === 'published' && p.status !== 'published') return false;
      if (activeTab === 'archived' && p.status !== 'archived') return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (p.title || '').toLowerCase().includes(q);
        const craftMatch = (p.craftType || p.technique || '').toLowerCase().includes(q);
        const catMatch = (p.category || '').toLowerCase().includes(q);
        const skuMatch = (p.sku || '').toLowerCase().includes(q);
        return titleMatch || craftMatch || catMatch || skuMatch;
      }

      return true;
    });
  }, [products, activeTab, searchQuery]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      all: products.filter((p) => p.status !== 'archived').length,
      draft: products.filter((p) => p.status === 'draft').length,
      ready: products.filter((p) => p.status === 'ready').length,
      published: products.filter((p) => p.status === 'published').length,
      archived: products.filter((p) => p.status === 'archived').length,
    };
  }, [products]);

  // Actions
  const handleStartNewProduct = () => {
    resetDraft();
    navigate('/artisan/products/new/photos');
  };

  const handleEditProduct = async (product: ProductRecord) => {
    try {
      await loadDraft(product.id);
      navigate('/artisan/products/new/photos');
    } catch {
      showToast('Unable to open draft. Please try again.', 'error');
    }
  };

  const handleDuplicate = async (product: ProductRecord) => {
    if (!user?.id) return;
    setIsActionProcessing(true);
    try {
      const duplicated = await productRepository.duplicateProduct(user.id, product.id);
      showToast(`Duplicated as "${duplicated.title}"!`);
      await fetchInventory();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Duplication failed.', 'error');
    } finally {
      setIsActionProcessing(false);
    }
  };

  const handleConfirmArchive = async () => {
    if (!targetProduct) return;
    setIsActionProcessing(true);
    const targetTitle = targetProduct.title || 'Product';
    const targetId = targetProduct.id;

    try {
      // 1. Update local storage immediately for zero latency & offline resilience
      legacyProductRepo.archiveProduct(targetId);
      setProducts((prev) =>
        prev.map((p) => (p.id === targetId ? { ...p, status: 'archived', updatedAt: new Date().toISOString() } : p))
      );

      // 2. Sync to Firestore in background
      if (user?.id) {
        productRepository.archiveProduct(user.id, targetId).catch((err) => {
          logger.warn('INVENTORY', 'Background Firestore archive synced locally only', {
            targetId,
            error: err instanceof Error ? err.message : String(err),
          });
        });
      }

      showToast(`Archived "${targetTitle}" successfully.`);
      setIsArchiveModalOpen(false);
      setTargetProduct(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Archive failed.', 'error');
    } finally {
      setIsActionProcessing(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!targetProduct) return;
    setIsActionProcessing(true);
    const targetTitle = targetProduct.title || 'Product';
    const targetId = targetProduct.id;

    try {
      // 1. Delete from local storage immediately
      legacyProductRepo.deleteProduct(targetId);
      setProducts((prev) => prev.filter((p) => p.id !== targetId));

      // 2. Delete from Firestore in background
      if (user?.id) {
        productRepository.deleteProduct(user.id, targetId).catch((err) => {
          logger.warn('INVENTORY', 'Background Firestore deletion synced locally only', {
            targetId,
            error: err instanceof Error ? err.message : String(err),
          });
        });
      }

      showToast(`Deleted "${targetTitle}" permanently.`);
      setIsDeleteModalOpen(false);
      setTargetProduct(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed.', 'error');
    } finally {
      setIsActionProcessing(false);
    }
  };

  const handleConfirmRestore = async () => {
    if (!targetProduct) return;
    setIsActionProcessing(true);
    const targetTitle = targetProduct.title || 'Product';
    const targetId = targetProduct.id;

    try {
      // 1. Restore in local storage immediately
      legacyProductRepo.restoreProduct(targetId);
      setProducts((prev) =>
        prev.map((p) => (p.id === targetId ? { ...p, status: 'draft', updatedAt: new Date().toISOString() } : p))
      );

      // 2. Restore in Firestore in background
      if (user?.id) {
        productRepository.restoreProduct(user.id, targetId).catch((err) => {
          logger.warn('INVENTORY', 'Background Firestore restore synced locally only', {
            targetId,
            error: err instanceof Error ? err.message : String(err),
          });
        });
      }

      showToast(`Restored "${targetTitle}" to active drafts.`);
      setIsRestoreModalOpen(false);
      setTargetProduct(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Restore failed.', 'error');
    } finally {
      setIsActionProcessing(false);
    }
  };

  const handleConfirmRevoke = async () => {
    if (!user?.id || !targetProduct?.passportId) return;
    setIsActionProcessing(true);
    try {
      await passportManager.revokePassport(user.id, targetProduct.passportId);
      showToast(`Revoked Craft Passport for "${targetProduct.title || 'Product'}".`);
      setIsRevokeModalOpen(false);
      setTargetProduct(null);
      await fetchInventory();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Revocation failed.', 'error');
    } finally {
      setIsActionProcessing(false);
    }
  };

  const handleOpenPassportExports = async (product: ProductRecord) => {
    await loadDraft(product.id);
    if (product.passportId || product.passportStatus === 'active') {
      navigate('/artisan/products/new/share');
    } else {
      navigate('/artisan/products/new/public-fields');
    }
  };

  const getStatusBadge = (status: ProductRecord['status']) => {
    switch (status) {
      case 'published':
        return <Badge variant="success">Published</Badge>;
      case 'ready':
        return <Badge variant="indigo">Ready</Badge>;
      case 'archived':
        return <Badge variant="neutral">Archived</Badge>;
      case 'draft':
      default:
        return <Badge variant="warning">Draft</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      {/* Toast Notification */}
      {feedbackToast && (
        <div
          role="status"
          aria-live="polite"
          className={clsx(
            'fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-3',
            feedbackToast.type === 'success'
              ? 'bg-success-container text-on-success-container border-success/30'
              : 'bg-error-container text-on-error-container border-error/30'
          )}
        >
          <CheckCircle className="w-4 h-4" />
          <span>{feedbackToast.message}</span>
        </div>
      )}

      {/* Header & Primary CTA */}
      <section aria-label="Inventory Header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-primary tracking-tight">
            Craft Catalogue & Inventory
          </h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Manage your digitized artisan products, active drafts, and archived heritage listings.
          </p>
        </div>

        <button
          onClick={handleStartNewProduct}
          className="bg-secondary hover:bg-secondary-hover text-on-secondary rounded-xl min-h-[46px] px-5 py-2.5 flex items-center justify-center gap-2 font-bold text-xs sm:text-sm transition-all action-shadow touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955] shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add New Product</span>
        </button>
      </section>

      {/* Controls Bar: Search & Status Filter Tabs */}
      <section aria-label="Inventory Filters" className="flex flex-col gap-3">
        {/* Search Input */}
        <div className="w-full relative">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product title, craft technique, category or SKU..."
            className="pl-9 h-11 text-xs sm:text-sm bg-white"
          />
          <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-3.5" />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-surface-variant/70">
          {(
            [
              { key: 'all', label: 'All Active', count: tabCounts.all },
              { key: 'draft', label: 'Drafts', count: tabCounts.draft },
              { key: 'ready', label: 'Ready', count: tabCounts.ready },
              { key: 'published', label: 'Published', count: tabCounts.published },
              { key: 'archived', label: 'Archived', count: tabCounts.archived },
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={clsx(
                  'px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all touch-target select-none shrink-0',
                  isActive
                    ? 'bg-primary text-white font-bold shadow-xs'
                    : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={clsx(
                    'text-[10px] px-1.5 py-0.5 rounded-full font-mono',
                    isActive ? 'bg-white/20 text-white' : 'bg-surface-container-high text-on-surface-variant'
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Inventory Content */}
      <section aria-label="Products List">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
            <Loader2 className="w-8 h-8 text-secondary animate-spin" />
            <p className="text-xs font-semibold">Loading catalogue inventory from Firestore...</p>
          </div>
        ) : error ? (
          <Card className="p-8 bg-error-container/20 border border-error/30 rounded-2xl flex flex-col items-center justify-center text-center gap-3">
            <AlertCircle className="w-8 h-8 text-error" />
            <div>
              <p className="font-bold text-sm text-primary">Unable to load inventory</p>
              <p className="text-xs text-on-surface-variant mt-1">{error}</p>
            </div>
            <Button size="sm" variant="secondary" onClick={fetchInventory} className="text-xs">
              Retry Connection
            </Button>
          </Card>
        ) : filteredProducts.length === 0 ? (
          /* Empty State */
          <Card className="p-12 bg-white border border-surface-variant/80 rounded-2xl flex flex-col items-center justify-center text-center gap-3.5 card-shadow">
            <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-base text-primary">
                {searchQuery ? 'No matching products found' : `No ${activeTab} products recorded`}
              </p>
              <p className="text-xs text-on-surface-variant mt-1 max-w-sm">
                {searchQuery
                  ? 'Try searching with different keywords or clear the filter.'
                  : 'Start by creating your first handmade craft listing to track inventory and generate passports.'}
              </p>
            </div>
            {activeTab !== 'archived' && (
              <Button size="md" onClick={handleStartNewProduct} leftIcon={<Plus className="w-4 h-4" />} className="text-xs font-bold mt-2">
                Create New Craft Listing
              </Button>
            )}
          </Card>
        ) : (
          /* Products Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => {
              const coverPhoto = resolveProductCoverUrl(product);
              const formattedPrice = Number(product.price).toLocaleString('en-IN');
              const isArchived = product.status === 'archived';

              return (
                <Card
                  key={product.id}
                  className="p-4 bg-white border border-surface-variant/80 hover:border-secondary/50 rounded-2xl card-shadow flex flex-col justify-between gap-3.5 transition-all group"
                >
                  <div className="flex flex-col gap-3">
                    {/* Top Row: Thumbnail + Info */}
                    <div className="flex items-start gap-3">
                      <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-surface-variant bg-surface-container relative">
                        {coverPhoto ? (
                          <img
                            src={coverPhoto}
                            alt={product.title || 'Product'}
                            onError={handleImageFallback}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                            <Package className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          {getStatusBadge(product.status)}
                          <span className="text-[10px] text-on-surface-variant font-mono truncate">
                            {product.sku || product.id.slice(0, 10)}
                          </span>
                        </div>

                        <h3 className="font-bold text-sm text-primary truncate" title={product.title}>
                          {product.title || 'Untitled Craft Product'}
                        </h3>
                        <p className="text-xs text-on-surface-variant truncate mt-0.5">
                          {product.craftType || product.technique || product.category || 'Handmade Craft'}
                        </p>
                      </div>
                    </div>

                    {/* Operational Details Row: Price, Stock, Updated */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surface-variant/60 text-xs">
                      <div>
                        <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block">Price</span>
                        <span className="font-bold text-sm text-primary">₹{formattedPrice}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block">Inventory</span>
                        <span className={clsx('font-bold text-xs', Number(product.stockQuantity) <= 2 ? 'text-amber-700' : 'text-primary')}>
                          {product.stockQuantity || 1} units
                        </span>
                      </div>
                    </div>

                    {/* Meta info: Duplicated tag & Updated time */}
                    <div className="flex items-center justify-between text-[10.5px] text-on-surface-variant pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-secondary" />
                        {new Date(product.updatedAt || product.createdAt).toLocaleDateString()}
                      </span>
                      {product.duplicatedFrom && (
                        <span className="flex items-center gap-1 text-secondary font-medium">
                          <Copy className="w-3 h-3" /> Cloned
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-surface-variant/60">
                    {!isArchived ? (
                      <>
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleEditProduct(product)}
                            leftIcon={<Edit className="w-3.5 h-3.5" />}
                            className="flex-1 text-xs font-bold py-1.5"
                          >
                            Edit
                          </Button>

                          <button
                            type="button"
                            onClick={() => handleDuplicate(product)}
                            disabled={isActionProcessing}
                            title="Duplicate listing"
                            aria-label={`Duplicate ${product.title}`}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-primary hover:bg-surface-container border border-surface-variant touch-target transition-colors shrink-0"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setTargetProduct(product);
                              setIsArchiveModalOpen(true);
                            }}
                            disabled={isActionProcessing}
                            title="Archive listing"
                            aria-label={`Archive ${product.title}`}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-amber-800 hover:bg-amber-100 border border-surface-variant touch-target transition-colors shrink-0"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setTargetProduct(product);
                              setIsDeleteModalOpen(true);
                            }}
                            disabled={isActionProcessing}
                            title="Delete product permanently"
                            aria-label={`Delete ${product.title} permanently`}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-600 hover:text-rose-800 hover:bg-rose-100 border border-rose-200 touch-target transition-colors shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Craft Passport & Exports Button for Ready Products */}
                        {(product.status === 'ready' || product.status === 'published' || product.passportId) && (
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              onClick={() => handleOpenPassportExports(product)}
                              leftIcon={<QrCode className="w-3.5 h-3.5" />}
                              className="flex-1 text-xs font-bold py-1.5 bg-secondary hover:bg-secondary-hover"
                            >
                              Passport & Exports
                            </Button>

                            {product.passportStatus === 'active' && (
                              <>
                                <Link
                                  to={ROUTES.publicPassport(product.passportSlug || product.passportId || product.id)}
                                  state={{
                                    from: `/artisan/inventory${location.search}`,
                                    fromLabel: 'Inventory',
                                    sourceRole: 'artisan',
                                  }}
                                  title="View public Craft Passport"
                                  aria-label={`View Passport for ${product.title}`}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-secondary hover:bg-secondary/10 border border-secondary/30 touch-target transition-colors shrink-0"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Link>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setTargetProduct(product);
                                    setIsRevokeModalOpen(true);
                                  }}
                                  disabled={isActionProcessing}
                                  title="Revoke public Craft Passport"
                                  aria-label={`Revoke Passport for ${product.title}`}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-amber-700 hover:bg-amber-100 border border-amber-300 touch-target transition-colors shrink-0"
                                >
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setTargetProduct(product);
                            setIsRestoreModalOpen(true);
                          }}
                          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                          className="flex-1 text-xs font-bold py-1.5"
                        >
                          Restore to Active Drafts
                        </Button>

                        <button
                          type="button"
                          onClick={() => {
                            setTargetProduct(product);
                            setIsDeleteModalOpen(true);
                          }}
                          disabled={isActionProcessing}
                          title="Delete product permanently"
                          aria-label={`Delete ${product.title} permanently`}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-600 hover:text-rose-800 hover:bg-rose-100 border border-rose-200 touch-target transition-colors shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Permanent Delete Confirmation Dialog */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!isActionProcessing) {
            setIsDeleteModalOpen(false);
            setTargetProduct(null);
          }
        }}
        title="Delete Product Permanently"
      >
        <div className="flex flex-col gap-4">
          <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-950 leading-relaxed flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Are you sure you want to permanently delete "{targetProduct?.title || 'this product'}"?</p>
              <p className="mt-1">
                This action cannot be undone. All photographs, pricing details, and draft records will be permanently removed from your device and catalogue.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-variant">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isActionProcessing}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmDelete}
              isLoading={isActionProcessing}
              className="text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white"
            >
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>

      {/* Accessible Archive Confirmation Dialog */}
      <Modal
        isOpen={isArchiveModalOpen}
        onClose={() => {
          if (!isActionProcessing) {
            setIsArchiveModalOpen(false);
            setTargetProduct(null);
          }
        }}
        title="Archive Craft Listing"
      >
        <div className="flex flex-col gap-4">
          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
            Archiving <strong>"{targetProduct?.title || 'this listing'}"</strong> will safely hide it from your active catalogue.
            All photographs, pricing, and craft passport history remain preserved. You can restore it at any time from the <strong>Archived</strong> tab.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsArchiveModalOpen(false)}
              disabled={isActionProcessing}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmArchive}
              isLoading={isActionProcessing}
              className="text-xs font-bold bg-amber-800 hover:bg-amber-900 text-white"
            >
              Confirm Archive
            </Button>
          </div>
        </div>
      </Modal>

      {/* Revoke Passport Confirmation Dialog */}
      <Modal
        isOpen={isRevokeModalOpen}
        onClose={() => {
          if (!isActionProcessing) {
            setIsRevokeModalOpen(false);
            setTargetProduct(null);
          }
        }}
        title="Revoke Craft Passport"
      >
        <div className="flex flex-col gap-4">
          <div className="p-3.5 bg-error-container/40 rounded-xl border border-error/30 text-xs text-on-error-container leading-relaxed flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Are you sure you want to revoke this Craft Passport?</p>
              <p className="mt-1">
                The public link and scannable QR code will immediately stop displaying product information.
                You can regenerate and re-approve a new snapshot at any time.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-variant">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsRevokeModalOpen(false)}
              disabled={isActionProcessing}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmRevoke}
              isLoading={isActionProcessing}
              className="text-xs font-bold bg-error hover:bg-error/90 text-white"
            >
              Confirm Revocation
            </Button>
          </div>
        </div>
      </Modal>

      {/* Accessible Restore Confirmation Dialog */}
      <Modal
        isOpen={isRestoreModalOpen}
        onClose={() => {
          if (!isActionProcessing) {
            setIsRestoreModalOpen(false);
            setTargetProduct(null);
          }
        }}
        title="Restore Product to Drafts"
      >
        <div className="flex flex-col gap-4">
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Are you sure you want to restore <strong>"{targetProduct?.title || 'this listing'}"</strong>? It will reappear in your active catalogue drafts.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsRestoreModalOpen(false)}
              disabled={isActionProcessing}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleConfirmRestore}
              isLoading={isActionProcessing}
              className="text-xs font-bold"
            >
              Confirm Restore
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
