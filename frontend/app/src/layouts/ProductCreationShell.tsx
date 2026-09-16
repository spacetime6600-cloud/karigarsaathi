import React from 'react';
import { Outlet, useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Volume2, VolumeX, Save, Check, Loader2, AlertCircle } from 'lucide-react';
import { useAudioHelp } from '@/app/providers/AudioHelpProvider';
import { useProductDraft } from '@/app/providers/ProductDraftProvider';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { PageAtmosphere } from '@/components/layout/PageAtmosphere';
import { SyncStatusIndicator } from '@/components/navigation/SyncStatusIndicator';
import { SkipLink } from '@/components/ui/SkipLink';
import { AriaLiveAnnouncer } from '@/components/ui/AriaLiveAnnouncer';
import { clsx } from 'clsx';
import { logger } from '@/services/logging/logger';

const STEP_DEFINITIONS = [
  { step: 1, slug: 'photos', label: 'Photographs' },
  { step: 2, slug: 'details', label: 'Product Details' },
  { step: 3, slug: 'review', label: 'Review Facts' },
  { step: 4, slug: 'price', label: 'Fair Pricing' },
  { step: 5, slug: 'public-fields', label: 'Public Fields' },
  { step: 6, slug: 'approve', label: 'Approve' },
  { step: 7, slug: 'passport', label: 'Craft Passport' },
  { step: 8, slug: 'share', label: 'Share & Export' },
];

export const ProductCreationShell: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isPlaying, toggleHelp } = useAudioHelp();
  const { draft, loadDraft, saveDraft, isSaving, saveError, clearSaveError } = useProductDraft();
  const [savedToast, setSavedToast] = React.useState(false);
  const [localErrorMessage, setLocalErrorMessage] = React.useState<string | null>(null);

  const draftIdParam = searchParams.get('draftId');

  React.useEffect(() => {
    if (draftIdParam && draft.id !== draftIdParam) {
      loadDraft(draftIdParam).catch((err) => {
        logger.warn('RECOVERY', 'Could not restore draft from URL parameter', { draftId: draftIdParam, err });
      });
    }
  }, [draftIdParam, draft.id, loadDraft]);

  // Map route to 8-step index
  const getStepNumber = (pathname: string): number => {
    const matched = STEP_DEFINITIONS.find((s) => pathname.includes(`/${s.slug}`));
    return matched ? matched.step : 1;
  };

  const currentStep = getStepNumber(location.pathname);
  const currentStepDef = STEP_DEFINITIONS.find((s) => s.step === currentStep) || STEP_DEFINITIONS[0];

  const prevStepRef = React.useRef(currentStep);
  const direction = currentStep >= prevStepRef.current ? 'forward' : 'backward';

  React.useEffect(() => {
    prevStepRef.current = currentStep;
  }, [currentStep]);

  const handleSaveDraft = async () => {
    setLocalErrorMessage(null);
    clearSaveError();

    try {
      await saveDraft();
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to save draft to server.';
      setLocalErrorMessage(msg);
      setTimeout(() => setLocalErrorMessage(null), 5000);
    }
  };

  const handleBack = () => {
    if (currentStep === 1) {
      navigate('/artisan/dashboard');
    } else {
      navigate(-1);
    }
  };

  const displayError = localErrorMessage || saveError;

  return (
    <PageAtmosphere variant="light" position="top" className="min-h-screen flex flex-col antialiased">
      <SkipLink targetId="main-content" />
      <AriaLiveAnnouncer />
      <OfflineBanner />

      {/* Transactional Top Header */}
      <header className="sticky top-0 z-50 bg-[#FBF8F3]/90 backdrop-blur-md border-b border-surface-variant/70 shadow-xs px-4 sm:px-8 lg:px-12 h-15 sm:h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            aria-label="Go back"
            className="flex items-center justify-center min-w-[44px] min-h-[44px] text-primary hover:bg-surface-container rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary touch-target"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col justify-center">
            <Link
              to="/artisan/dashboard"
              className="font-display text-lg sm:text-xl font-bold text-primary hover:text-secondary transition-colors min-h-0 leading-none"
            >
              KarigarSaathi
            </Link>
            <span className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider mt-1 leading-none whitespace-nowrap">
              Add New Product Listing
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Truthful Sync Status Indicator */}
          <SyncStatusIndicator />

          {/* Save Draft Action */}
          <button
            onClick={handleSaveDraft}
            disabled={isSaving}
            aria-label="Save draft progress"
            className="flex items-center gap-1.5 text-primary hover:text-secondary border border-surface-variant hover:border-secondary/40 bg-white/80 rounded-full px-3 sm:px-4 py-1.5 text-xs font-bold transition-all touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 text-secondary animate-spin" />
                <span>Saving...</span>
              </>
            ) : savedToast ? (
              <>
                <Check className="w-4 h-4 text-success" />
                <span className="text-success">Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-secondary" />
                <span>Save Draft</span>
              </>
            )}
          </button>

          {/* Voice Assistance Audio Trigger */}
          <button
            onClick={() => toggleHelp()}
            aria-label={isPlaying ? 'Stop audio assistance' : 'Listen to instructions'}
            className="flex items-center gap-1.5 text-primary hover:bg-surface-container rounded-full px-3 py-1.5 text-xs font-bold transition-colors touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {isPlaying ? (
              <VolumeX className="w-4 h-4 text-secondary animate-pulse" />
            ) : (
              <Volume2 className="w-4 h-4 text-primary" />
            )}
            <span className="hidden sm:inline">
              {isPlaying ? 'Playing...' : 'Listen'}
            </span>
          </button>
        </div>
      </header>

      {/* Error Alert Notification if Save Fails */}
      {displayError && (
        <div
          role="alert"
          className="w-full bg-error-container text-on-error-container border-b border-error/20 px-4 py-2 text-xs flex items-center justify-between"
        >
          <div className="flex items-center gap-2 max-w-[1140px] mx-auto w-full">
            <AlertCircle className="w-4 h-4 text-error shrink-0" />
            <span>{displayError}</span>
          </div>
        </div>
      )}

      {/* Progress Stepper Bar Container */}
      <section
        aria-label="Product Creation Progress"
        className="w-full bg-white/80 backdrop-blur-xs border-b border-surface-variant/70 py-3 sm:py-3.5 px-4 sm:px-8 lg:px-12"
      >
        <div className="max-w-[1140px] mx-auto w-full">
          {/* Desktop 8-Step Stepper (>= 1024px) */}
          <nav aria-label="Steps" className="hidden lg:flex items-center justify-between">
            {STEP_DEFINITIONS.map((s, idx) => {
              const isPassed = currentStep > s.step;
              const isCurrent = currentStep === s.step;
              const isFuture = currentStep < s.step;

              return (
                <div key={s.step} className="flex items-center flex-1 last:flex-none">
                  <div
                    className={clsx(
                      'flex items-center gap-2 pr-3 py-1',
                      isCurrent && 'text-primary font-bold',
                      isPassed && 'text-success font-semibold',
                      isFuture && 'text-on-surface-variant/60 font-medium'
                    )}
                  >
                    <span
                      className={clsx(
                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono transition-colors shrink-0',
                        isCurrent && 'bg-secondary text-white font-bold shadow-xs',
                        isPassed && 'bg-success/20 text-success border border-success/40',
                        isFuture && 'bg-surface-container text-on-surface-variant/60 border border-surface-variant'
                      )}
                    >
                      {isPassed ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : s.step}
                    </span>
                    <span className="text-xs whitespace-nowrap">{s.label}</span>
                  </div>

                  {idx < STEP_DEFINITIONS.length - 1 && (
                    <div
                      className={clsx(
                        'flex-1 h-[2px] mx-2 transition-colors',
                        isPassed ? 'bg-success/50' : 'bg-surface-variant/80'
                      )}
                    />
                  )}
                </div>
              );
            })}
          </nav>

          {/* Mobile & Tablet Stepper (< 1024px) */}
          <div className="lg:hidden flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-primary">
                Step {currentStep} of 8 • <span className="text-secondary">{currentStepDef.label}</span>
              </span>
              <span className="text-on-surface-variant font-mono text-[11px]">
                {Math.round((currentStep / 8) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-surface-variant/80 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-secondary h-full transition-all duration-300 rounded-full"
                style={{ width: `${(currentStep / 8) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area (Max width 1140px) */}
      <main id="main-content" tabIndex={-1} className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1140px] w-full mx-auto pb-16 focus:outline-none overflow-x-clip">
        <div
          key={currentStep}
          className={clsx(
            direction === 'forward' ? 'step-forward-enter' : 'step-backward-enter',
            'w-full'
          )}
        >
          <Outlet />
        </div>
      </main>
    </PageAtmosphere>
  );
};
