import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductDraft } from '@/app/providers/ProductDraftProvider';
import { useLanguage } from '@/app/providers/LanguageProvider';
import { validateProductForReadiness, ReadinessValidationError } from '@/domain/products/validation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Check,
  Edit3,
  Camera,
  Layers,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

export const ReviewFactsPage: React.FC = () => {
  const { draft, updateConfirmedFact, markListingReady } = useProductDraft();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [isMarkingReady, setIsMarkingReady] = useState(false);
  const [readySuccess, setReadySuccess] = useState(false);
  const [submissionErrors, setSubmissionErrors] = useState<ReadinessValidationError[] | null>(null);

  // Live 10-point readiness check
  const liveValidation = validateProductForReadiness(draft);

  const handleEditChange = (key: string, val: string) => {
    setEditedValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleSaveConfirmedEdit = (key: string) => {
    const val = editedValues[key];
    if (val) {
      updateConfirmedFact(key, val);
    }
    setEditingKey(null);
  };

  const [persistenceError, setPersistenceError] = useState<string | null>(null);

  const handleMarkAsReady = async () => {
    if (!liveValidation.isReady) {
      setSubmissionErrors(liveValidation.errors);
      return;
    }

    setIsMarkingReady(true);
    setPersistenceError(null);
    setSubmissionErrors(null);
    try {
      await markListingReady();
      setReadySuccess(true);
      setTimeout(() => {
        navigate('/artisan/products/new/price');
      }, 1200);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to persist ready listing to Firestore.';
      setPersistenceError(msg);
    } finally {
      setIsMarkingReady(false);
    }
  };

  const handleContinue = () => {
    navigate('/artisan/products/new/price');
  };

  const activeErrors = submissionErrors || (liveValidation.isReady ? [] : liveValidation.errors);

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Step Header */}
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-primary tracking-tight">
          {t('productCreation.step3Title')}
        </h1>
        <p className="text-sm sm:text-base text-on-surface-variant">
          Review all extracted facts, physical specifications, and readiness checklist before pricing.
        </p>
      </div>

      {/* Success Toast */}
      {readySuccess && (
        <div
          role="status"
          className="p-4 bg-success-container text-on-success-container rounded-2xl border border-success/30 font-bold text-sm flex items-center gap-2 animate-in fade-in"
        >
          <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
          <span>Listing specifications verified & marked as Ready! Proceeding to Fair Pricing...</span>
        </div>
      )}

      {/* Dedicated Persistence Error Alert */}
      {persistenceError && (
        <div
          role="alert"
          aria-labelledby="persistence-error-heading"
          className="p-4 sm:p-5 bg-error-container text-on-error-container rounded-2xl border border-error/30 flex flex-col gap-2 animate-in fade-in shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-error shrink-0" />
              <h2 id="persistence-error-heading" className="font-bold text-sm sm:text-base">
                Draft Persistence Error
              </h2>
            </div>
            <button
              type="button"
              onClick={() => handleMarkAsReady()}
              className="text-xs font-bold px-3 py-1 bg-error text-white rounded-lg hover:bg-error/90"
            >
              Retry
            </button>
          </div>
          <p className="text-xs text-on-error-container/90 leading-relaxed">
            {persistenceError}
          </p>
        </div>
      )}

      {/* Accessible Readiness Validation Summary (only shown when content is unready) */}
      {!liveValidation.isReady && activeErrors.length > 0 && (
        <div
          role="alert"
          aria-labelledby="readiness-summary-heading"
          className="p-4 sm:p-5 bg-error-container text-on-error-container rounded-2xl border border-error/30 flex flex-col gap-3 animate-in fade-in shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-error shrink-0" />
              <h2 id="readiness-summary-heading" className="font-bold text-sm sm:text-base">
                Listing Not Ready for Publication ({activeErrors.length} {activeErrors.length === 1 ? 'item requires' : 'items require'} attention)
              </h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-error/15 text-error">
              Incomplete
            </span>
          </div>

          <p className="text-xs text-on-error-container/90 leading-relaxed">
            Please complete the following required specifications before transitioning this craft to "Ready":
          </p>

          <ul className="flex flex-col gap-2 pt-1 border-t border-error/20">
            {activeErrors.map((err, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between gap-3 text-xs bg-white/70 p-2.5 rounded-xl border border-error/15"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-error shrink-0" />
                  <span className="font-medium text-primary">{err.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(err.stepUrl)}
                  className="font-bold text-xs text-secondary hover:text-primary flex items-center gap-1 shrink-0 px-2 py-1 rounded-lg bg-surface hover:bg-surface-variant transition-colors"
                >
                  <span>Fix in {err.stepName}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Full Listing Overview & Extracted Facts (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {/* Master Listing Overview Card with Edit Jump Links */}
          <Card className="p-5 sm:p-6 bg-white rounded-2xl border border-surface-variant/80 card-shadow flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-surface-variant/70 pb-2.5">
              <h2 className="font-bold text-base text-primary flex items-center gap-2">
                <Layers className="w-4 h-4 text-secondary" />
                <span>Complete Catalogue Review</span>
              </h2>
              <Badge variant={draft.status === 'ready' ? 'indigo' : 'warning'}>
                {draft.status === 'ready' ? 'Ready' : 'Draft'}
              </Badge>
            </div>

            {/* General Info Summary */}
            <div className="p-4 bg-surface-container-low/60 rounded-xl border border-surface-variant flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant">Product Title</span>
                  <span className="font-bold text-base text-primary">{draft.title || 'Untitled Product'}</span>
                  {draft.titleHindi && (
                    <span className="text-xs text-on-surface-variant font-medium mt-0.5">हिंदी: {draft.titleHindi}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/artisan/products/new/details')}
                  className="text-xs text-secondary hover:underline flex items-center gap-1 font-bold shrink-0"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
              </div>

              <div className="border-t border-surface-variant/70 pt-2 flex flex-col">
                <span className="text-[10px] uppercase font-bold text-on-surface-variant">Heritage Narrative</span>
                <p className="text-xs text-primary leading-relaxed mt-0.5">{draft.story || draft.description || 'No description provided.'}</p>
                {draft.descriptionHindi && (
                  <p className="text-xs text-on-surface-variant italic mt-1">हिंदी: {draft.descriptionHindi}</p>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border-t border-surface-variant/70 pt-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant block">Category</span>
                  <span className="font-semibold text-primary">{draft.category || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant block">Craft Technique</span>
                  <span className="font-semibold text-primary">{draft.technique || draft.craftType || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant block">Materials</span>
                  <span className="font-semibold text-primary">
                    {Array.isArray(draft.materials) && draft.materials.length > 0 ? draft.materials.join(', ') : draft.material || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant block">Dimensions</span>
                  <span className="font-semibold text-primary">{draft.dimensions || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant block">Origin</span>
                  <span className="font-semibold text-primary">{draft.origin || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant block">Stock Quantity</span>
                  <span className="font-semibold text-primary">{draft.stockQuantity !== undefined ? draft.stockQuantity : 1} units</span>
                </div>
              </div>

              {/* Tags */}
              {draft.tags && draft.tags.length > 0 && (
                <div className="border-t border-surface-variant/70 pt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase mr-1">Tags:</span>
                  {draft.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-md bg-surface-container text-[11px] font-semibold text-primary">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Photographs Strip with Edit Link */}
            <div className="p-4 bg-surface-container-low/60 rounded-xl border border-surface-variant flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-secondary" />
                  <span>Attached Photographs ({draft.photos.length})</span>
                </span>
                <button
                  type="button"
                  onClick={() => navigate('/artisan/products/new/photos')}
                  className="text-xs text-secondary hover:underline flex items-center gap-1 font-bold"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Manage Photos
                </button>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {draft.photos.map((p, idx) => (
                  <div key={p.id} className="relative w-16 h-16 rounded-lg overflow-hidden border border-surface-variant shrink-0">
                    <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                    {idx === draft.coverPhotoIndex && (
                      <span className="absolute bottom-0 inset-x-0 bg-secondary text-white text-[8px] font-bold text-center py-0.5">
                        Cover
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Confirmed / Extracted Voice Facts Card */}
          {draft.confirmedFacts.length > 0 && (
            <Card className="p-5 sm:p-6 bg-white rounded-2xl border border-surface-variant/80 card-shadow flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-surface-variant/70 pb-2.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <h2 className="font-bold text-base text-primary">
                    Extracted Voice Facts
                  </h2>
                </div>
                <span className="text-xs text-on-surface-variant font-medium">
                  {draft.confirmedFacts.length} Verified
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {draft.confirmedFacts.map((fact) => {
                  const isEditing = editingKey === fact.key;

                  return (
                    <div
                      key={fact.key}
                      className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-surface-container-low/60 border border-surface-variant/70"
                    >
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        <span>{fact.label}</span>
                        <Badge variant="success" className="text-[10px] py-0 px-2">
                          {Math.round(fact.confidenceScore * 100)}% Confirmed
                        </Badge>
                      </div>

                      {isEditing ? (
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            value={editedValues[fact.key] !== undefined ? editedValues[fact.key] : fact.value}
                            onChange={(e) => handleEditChange(fact.key, e.target.value)}
                            className="h-10 text-xs py-1"
                          />
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleSaveConfirmedEdit(fact.key)}
                            className="text-xs shrink-0"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <span className="font-bold text-sm text-primary">{fact.value}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingKey(fact.key);
                              handleEditChange(fact.key, fact.value);
                            }}
                            className="text-xs text-secondary hover:underline flex items-center gap-1 font-semibold touch-target"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: 10-Point Readiness Checklist & Mark as Ready (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <Card className="p-5 bg-white rounded-2xl border border-surface-variant/80 card-shadow flex flex-col gap-3.5">
            <div className="flex items-center justify-between border-b border-surface-variant/70 pb-2.5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-secondary" />
                <span>Readiness Checklist</span>
              </h3>
              <Badge variant={liveValidation.isReady ? 'success' : 'warning'}>
                {liveValidation.isReady ? '10/10 Passed' : `${10 - liveValidation.errors.length}/10 Complete`}
              </Badge>
            </div>

            <ul className="flex flex-col gap-2 text-xs">
              {/* 1. Photos */}
              <li className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-primary">
                  {draft.photos.length > 0 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-error shrink-0" />
                  )}
                  <span>1+ Photographs</span>
                </span>
                <button
                  type="button"
                  onClick={() => navigate('/artisan/products/new/photos')}
                  className="text-[11px] text-secondary hover:underline font-bold"
                >
                  {draft.photos.length} uploaded
                </button>
              </li>

              {/* 2. Primary Cover Image */}
              <li className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-primary">
                  {draft.coverPhotoIndex !== undefined && draft.coverPhotoIndex >= 0 && draft.photos.length > 0 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-error shrink-0" />
                  )}
                  <span>Primary Cover Photo</span>
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  {draft.photos.length > 0 ? `Photo #${draft.coverPhotoIndex + 1}` : 'None'}
                </span>
              </li>

              {/* 3. Title */}
              <li className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-primary">
                  {draft.title && draft.title.trim() ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-error shrink-0" />
                  )}
                  <span>Product Title</span>
                </span>
                <button
                  type="button"
                  onClick={() => navigate('/artisan/products/new/details')}
                  className="text-[11px] text-secondary hover:underline font-bold"
                >
                  {draft.title ? 'Set' : 'Missing'}
                </button>
              </li>

              {/* 4. Description */}
              <li className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-primary">
                  {(draft.story && draft.story.trim()) || (draft.description && draft.description.trim()) ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-error shrink-0" />
                  )}
                  <span>Heritage Narrative</span>
                </span>
                <button
                  type="button"
                  onClick={() => navigate('/artisan/products/new/details')}
                  className="text-[11px] text-secondary hover:underline font-bold"
                >
                  {draft.story || draft.description ? 'Set' : 'Missing'}
                </button>
              </li>

              {/* 5. Category */}
              <li className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-primary">
                  {draft.category && draft.category.trim() ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-error shrink-0" />
                  )}
                  <span>Craft Category</span>
                </span>
                <button
                  type="button"
                  onClick={() => navigate('/artisan/products/new/details')}
                  className="text-[11px] text-secondary hover:underline font-bold"
                >
                  {draft.category || 'Missing'}
                </button>
              </li>

              {/* 6. Technique / Craft Type */}
              <li className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-primary">
                  {(draft.technique && draft.technique.trim()) || (draft.craftType && draft.craftType.trim()) ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-error shrink-0" />
                  )}
                  <span>Craft Technique</span>
                </span>
                <button
                  type="button"
                  onClick={() => navigate('/artisan/products/new/details')}
                  className="text-[11px] text-secondary hover:underline font-bold"
                >
                  {draft.technique || draft.craftType || 'Missing'}
                </button>
              </li>

              {/* 7. Materials */}
              <li className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-primary">
                  {(Array.isArray(draft.materials) && draft.materials.length > 0) || draft.material ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-error shrink-0" />
                  )}
                  <span>Raw Materials</span>
                </span>
                <button
                  type="button"
                  onClick={() => navigate('/artisan/products/new/details')}
                  className="text-[11px] text-secondary hover:underline font-bold"
                >
                  {Array.isArray(draft.materials) && draft.materials.length > 0 ? `${draft.materials.length} items` : draft.material || 'Missing'}
                </button>
              </li>

              {/* 8. Retail Price */}
              <li className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-primary">
                  {typeof draft.selectedPrice === 'number' && draft.selectedPrice >= 0 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-error shrink-0" />
                  )}
                  <span>Retail Price</span>
                </span>
                <button
                  type="button"
                  onClick={() => navigate('/artisan/products/new/price')}
                  className="text-[11px] text-secondary hover:underline font-bold"
                >
                  {draft.selectedPrice !== undefined ? `₹${draft.selectedPrice.toLocaleString('en-IN')}` : 'Missing'}
                </button>
              </li>

              {/* 9. Stock Quantity */}
              <li className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-primary">
                  {draft.stockQuantity !== undefined && Number.isInteger(draft.stockQuantity) && draft.stockQuantity >= 0 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-error shrink-0" />
                  )}
                  <span>Stock Quantity</span>
                </span>
                <button
                  type="button"
                  onClick={() => navigate('/artisan/products/new/details')}
                  className="text-[11px] text-secondary hover:underline font-bold"
                >
                  {draft.stockQuantity !== undefined ? `${draft.stockQuantity} units` : '1 unit'}
                </button>
              </li>

              {/* 10. Image Upload Status */}
              <li className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-primary">
                  {draft.images && draft.images.length > 0 && draft.images.every((img) => img.uploadStatus === 'completed') ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                  )}
                  <span>Upload Integrity</span>
                </span>
                <span className="text-[11px] text-success font-semibold">Verified</span>
              </li>
            </ul>

            <div className="pt-3 border-t border-surface-variant/70 flex flex-col gap-2">
              <Button
                variant="primary"
                size="md"
                onClick={handleMarkAsReady}
                isLoading={isMarkingReady}
                leftIcon={<ShieldCheck className="w-4 h-4" />}
                className="w-full text-xs font-bold"
              >
                Mark as Ready
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Page Actions Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-surface-variant/70">
        <Button variant="ghost" onClick={() => navigate('/artisan/products/new/details')} className="text-xs">
          {t('common.back')}
        </Button>

        <Button
          size="md"
          onClick={handleContinue}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          className="font-bold text-xs px-6"
        >
          {t('common.continue')}
        </Button>
      </div>
    </div>
  );
};
