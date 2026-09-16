import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductDraft } from '@/app/providers/ProductDraftProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { useLanguage } from '@/app/providers/LanguageProvider';
import { passportManager, PassportReadinessError } from '@/services/passport/passportManager';
import { validateProductForReadiness, ReadinessValidationError } from '@/domain/products/validation';
import { PassportPublicField } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ShieldCheck, ArrowRight, CheckSquare, Square, AlertCircle, Sparkles } from 'lucide-react';
import { resolveProductImageUrl } from '@/services/media/imageUrlResolver';

const FALLBACK_IMAGE_URL = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800';

export const ApprovePublicInfoPage: React.FC = () => {
  const { draft, updateDraft, saveDraft } = useProductDraft();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [hasAgreed, setHasAgreed] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedReadinessErrors, setFailedReadinessErrors] = useState<ReadinessValidationError[]>([]);
  const [isFailedModalOpen, setIsFailedModalOpen] = useState(false);

  const handleApproveAndIssue = async () => {
    if (!hasAgreed) return;

    if (localStorage.getItem('simulate_passport_failed') === 'true') {
      setIsFailedModalOpen(true);
      return;
    }

    setIsCreating(true);
    setErrorMessage(null);
    setFailedReadinessErrors([]);

    // 1. Pre-validate readiness requirements
    const preCheck = validateProductForReadiness(draft);
    if (!preCheck.isReady) {
      setFailedReadinessErrors(preCheck.errors);
      setErrorMessage(`Cannot activate Craft Passport: Product failed ${preCheck.errors.length} readiness requirements.`);
      setIsFailedModalOpen(true);
      setIsCreating(false);
      return;
    }

    try {
      // Build approved fields explicitly based on artisan selection and non-empty values
      const approvedFields: PassportPublicField[] = [];
      if (draft.publicFields.title) {
        approvedFields.push('title');
        if (draft.titleHindi?.trim()) approvedFields.push('titleHindi');
      }
      if (draft.publicFields.story) {
        approvedFields.push('description', 'story');
        if (draft.descriptionHindi?.trim()) approvedFields.push('descriptionHindi');
      }
      if (draft.publicFields.category && draft.category?.trim()) approvedFields.push('category');
      if (draft.publicFields.technique && (draft.technique?.trim() || draft.craftType?.trim())) approvedFields.push('technique');
      if (draft.publicFields.materials && draft.materials && draft.materials.length > 0) approvedFields.push('materials');
      if (draft.publicFields.dimensions && draft.dimensions?.trim()) approvedFields.push('dimensions');
      if (draft.publicFields.artisanName) approvedFields.push('artisanName');
      if (draft.publicFields.workshopLocation) approvedFields.push('location');
      if (draft.publicFields.retailPrice && typeof draft.selectedPrice === 'number') approvedFields.push('price');
      if (draft.publicFields.directContact) approvedFields.push('contactOption');
      if (draft.photos && draft.photos.length > 0) approvedFields.push('photos');
      if (draft.careInstructions?.trim()) approvedFields.push('careInstructions');
      if (Array.isArray(draft.tags) && draft.tags.length > 0) approvedFields.push('tags');

      const ownerId = user?.id || draft.ownerId;
      if (!ownerId || ownerId === 'artisan_default') {
        setErrorMessage('Authentication required: Please sign in to issue Craft Passports.');
        setIsFailedModalOpen(true);
        return;
      }

      // Atomic Passport Activation in repository
      const result = await passportManager.activatePassport(
        ownerId,
        draft,
        approvedFields,
        user || undefined
      );

      // Only update local and cloud state to 'ready' & 'shared' after backend activation succeeds
      updateDraft({
        status: 'ready',
        lifecycleStatus: 'shared',
        passportStatus: 'active',
        passportId: result.passportId,
        passportSlug: result.publicSlug,
      });

      await saveDraft();
      navigate('/artisan/products/new/passport', {
        state: {
          passportId: result.passportId,
          publicSlug: result.publicSlug,
          publicUrl: result.publicUrl,
        },
      });
    } catch (err) {
      if (err instanceof PassportReadinessError) {
        setFailedReadinessErrors(err.errors);
        setErrorMessage(err.message);
      } else {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to issue Craft Passport.');
      }
      setIsFailedModalOpen(true);
    } finally {
      setIsCreating(false);
    }
  };

  const activePhoto = draft.photos[draft.coverPhotoIndex] || draft.photos[0];
  const matchingImage = draft.images?.find(
    (img) => img.id === activePhoto?.id || img.originalPath === activePhoto?.url || img.displayPath === activePhoto?.url || img.secureUrl === activePhoto?.url
  );
  const resolvedImageUrl = resolveProductImageUrl(matchingImage || activePhoto, { fallback: FALLBACK_IMAGE_URL });

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Step Header */}
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-primary tracking-tight">
          {t('productCreation.step6Title')}
        </h1>
        <p className="text-sm sm:text-base text-on-surface-variant">
          {t('productCreation.step6Subtitle')}
        </p>
      </div>

      {/* Two-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Live Public Passport Preview Card (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          <Card className="p-5 sm:p-6 bg-white rounded-2xl border-2 border-secondary card-shadow flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-surface-variant/70 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-secondary" />
                <h2 className="font-bold text-sm text-primary uppercase tracking-wider">
                  Public Craft Passport Preview
                </h2>
              </div>
              <Badge variant="terracotta" className="text-[10px]">Pending Approval</Badge>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-start">
              <img
                src={resolvedImageUrl}
                alt={draft.title || 'Craft piece'}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = FALLBACK_IMAGE_URL;
                }}
                className="w-full sm:w-40 h-40 rounded-xl object-cover border border-surface-variant shadow-xs shrink-0"
              />

              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <h3 className="font-display text-lg sm:text-xl font-bold text-primary leading-snug">
                  {draft.title || 'Untitled Craft Item'}
                </h3>

                {draft.publicFields.artisanName && (
                  <p className="text-xs text-on-surface-variant">
                    Artisan: <strong className="text-primary">{user?.name || 'Master Artisan'}</strong> • {user?.workshopName || 'Traditional Handloom Workshop'}
                  </p>
                )}

                {draft.publicFields.origin && (
                  <p className="text-xs text-on-surface-variant">
                    Origin: <strong className="text-primary">{draft.origin}</strong>
                  </p>
                )}

                {draft.publicFields.technique && (
                  <p className="text-xs text-on-surface-variant">
                    Technique: <strong className="text-primary">{draft.technique || draft.craftType}</strong>
                  </p>
                )}

                {draft.publicFields.materials && draft.materials && draft.materials.length > 0 && (
                  <p className="text-xs text-on-surface-variant">
                    Materials: <strong className="text-primary">{draft.materials.join(', ')}</strong>
                  </p>
                )}

                {draft.publicFields.retailPrice && (
                  <p className="text-sm font-bold text-primary font-mono mt-1">
                    Price: ₹{draft.selectedPrice.toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            </div>

            {/* Artisan Integrity Declaration Checkbox */}
            <div
              role="checkbox"
              aria-checked={hasAgreed}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  setHasAgreed(!hasAgreed);
                }
              }}
              onClick={() => setHasAgreed(!hasAgreed)}
              className="p-4 rounded-xl bg-surface-container-low border border-surface-variant/70 cursor-pointer flex items-start gap-3 select-none touch-target focus:ring-2 focus:ring-secondary/40"
            >
              <span className="mt-0.5 text-secondary shrink-0">
                {hasAgreed ? (
                  <CheckSquare className="w-5 h-5 fill-secondary text-white" />
                ) : (
                  <Square className="w-5 h-5 text-on-surface-variant" />
                )}
              </span>
              <p className="text-xs text-primary leading-relaxed">
                <strong>Explicit Consent Approval:</strong> I approve the selected information for public viewing and sharing via Craft Passport, scannable QR code, and buyer exports.
              </p>
            </div>
          </Card>
        </div>

        {/* Right Column: Guidance Card (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <Card className="p-5 bg-white rounded-2xl border border-surface-variant/80 card-shadow flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-secondary" />
              <h3 className="font-bold text-sm text-primary">
                Privacy Protection
              </h3>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Only the fields you checked will be publicly visible. Your account credentials, internal notes, and cost breakdowns will remain 100% private.
            </p>
          </Card>
        </div>
      </div>

      {/* Page Actions Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-surface-variant/70">
        <Button variant="ghost" onClick={() => navigate('/artisan/products/new/public-fields')} className="text-xs">
          {t('common.back')}
        </Button>

        <Button
          size="md"
          onClick={handleApproveAndIssue}
          disabled={!hasAgreed || isCreating}
          isLoading={isCreating}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          className="font-bold text-xs px-6"
        >
          {isCreating ? 'Issuing Passport...' : 'Approve & Issue Craft Passport'}
        </Button>
      </div>

      {/* Passport Creation Failure / Readiness Checklist Modal */}
      <Modal
        isOpen={isFailedModalOpen}
        onClose={() => setIsFailedModalOpen(false)}
        title={failedReadinessErrors.length > 0 ? "Product Readiness Requirements" : "Passport Activation Issue"}
        maxWidth="lg"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 p-3.5 bg-error-container rounded-xl text-on-error-container text-xs">
            <AlertCircle className="w-5 h-5 shrink-0 text-error mt-0.5" />
            <div>
              <p className="font-bold">
                {failedReadinessErrors.length > 0
                  ? `Cannot activate Craft Passport: Product failed ${failedReadinessErrors.length} readiness requirements.`
                  : errorMessage || 'We could not issue the Craft Passport right now. Your draft is safely saved.'}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-on-error-container/80">
                To guarantee authentic craft provenance, all mandatory product specifications must be completed before issuing a public Craft Passport.
              </p>
            </div>
          </div>

          {/* Detailed list of failed readiness requirements with jump buttons */}
          {failedReadinessErrors.length > 0 && (
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
              {failedReadinessErrors.map((err, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-surface-container rounded-xl border border-surface-variant flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary truncate">
                        {err.stepName} — {err.field}
                      </span>
                      <Badge variant="terracotta" className="text-[9px] uppercase px-1.5 py-0">Required</Badge>
                    </div>
                    <p className="text-[11px] text-on-surface-variant leading-snug">{err.message}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setIsFailedModalOpen(false);
                      navigate(err.stepUrl);
                    }}
                    rightIcon={<ArrowRight className="w-3 h-3" />}
                    className="shrink-0 text-[11px] py-1 px-2.5 font-bold"
                  >
                    Fix in {err.stepName}
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-variant/40">
            <Button
              size="sm"
              variant="tertiary"
              onClick={() => setIsFailedModalOpen(false)}
              className="text-xs"
            >
              Close & Keep Editing
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
