import React, { useState, useEffect, useRef } from 'react';
import { PhotographItem } from '@/types';
import { aiEnhancementService, JobResult, AIEnhancementError } from '@/services/ai/aiEnhancementService';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ImageComparisonViewer } from './ImageComparisonViewer';
import { announce } from '@/components/ui/AriaLiveAnnouncer';
import {
  Sparkles,
  Check,
  X,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Loader2,
  WifiOff,
  Image as ImageIcon,
} from 'lucide-react';
import { logger } from '@/services/logging/logger';

interface AIEnhancementModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoItem: PhotographItem | null;
  productId: string;
  artisanId: string;
  onApprove: (photoId: string, result: JobResult) => void;
  onReject: (photoId: string) => void;
}

type ModalStep = 'CONSENT' | 'PROCESSING' | 'REVIEW' | 'ERROR';

export const AIEnhancementModal: React.FC<AIEnhancementModalProps> = ({
  isOpen,
  onClose,
  photoItem,
  productId,
  artisanId,
  onApprove,
  onReject,
}) => {
  const [step, setStep] = useState<ModalStep>('CONSENT');
  const [consentGranted, setConsentGranted] = useState<boolean>(false);
  const [jobResult, setJobResult] = useState<JobResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRetryable, setIsRetryable] = useState<boolean>(true);
  const currentRequestIdRef = useRef<string>('');

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const isAiEnabled = aiEnhancementService.isAiEnabled();

  // Reset or initialize step based on existing enhancement status
  useEffect(() => {
    if (isOpen && photoItem) {
      if (photoItem.enhancedUrl && photoItem.approvalStatus === 'approved') {
        setJobResult({
          job_id: photoItem.jobId || 'job_prev',
          request_id: photoItem.requestId || 'req_prev',
          artisan_id: artisanId,
          product_id: productId,
          status: 'succeeded',
          enhanced_image_reference: photoItem.enhancedUrl,
          preview_image_reference: photoItem.previewUrl,
          enhancedDataUrl: photoItem.enhancedUrl,
          previewDataUrl: photoItem.previewUrl,
          operations_requested: ['background_removal', 'lighting_correction', 'centring', 'standard_resize'],
          operations_applied: ['background_removal', 'lighting_correction', 'centring', 'standard_resize'],
          warnings: photoItem.warnings || [],
          metrics: photoItem.metrics || {},
          processing_duration_ms: 1200,
          retryable: false,
          adapter_version: 'isnet-general-use',
          created_at: photoItem.uploadedAt,
        });
        setStep('REVIEW');
      } else {
        setStep('CONSENT');
        setConsentGranted(false);
        setJobResult(null);
        setErrorMessage(null);
      }
    }
  }, [isOpen, photoItem, artisanId, productId]);

  const handleStartEnhancement = async () => {
    if (!photoItem) return;

    if (!artisanId) {
      setErrorMessage('Authentication required: Please sign in before requesting AI enhancement.');
      setIsRetryable(false);
      setStep('ERROR');
      return;
    }

    if (!isOnline) {
      setErrorMessage('Internet connection required for AI enhancement. Your original photo is safely preserved offline.');
      setStep('ERROR');
      return;
    }

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    currentRequestIdRef.current = requestId;

    setStep('PROCESSING');
    setErrorMessage(null);
    announce('Processing product photograph enhancement with AI Image Studio...', 'polite');

    try {
      // 1. Fetch image Blob from existing photo URL (object URL or remote URL)
      const blob = await aiEnhancementService.urlToBlob(photoItem.rawOriginalUrl || photoItem.url);

      // 2. Submit to AI microservice
      const result = await aiEnhancementService.enhanceImage({
        imageBlob: blob,
        consentGranted: true,
        requestId,
        productId,
        artisanId,
        outputSize: 512,
        background: 'white',
      });

      setJobResult(result);
      setStep('REVIEW');
      announce('AI enhancement completed. Inspect the comparison and choose whether to approve.', 'polite');
    } catch (err) {
      const msg = err instanceof AIEnhancementError ? err.message : (err instanceof Error ? err.message : 'AI enhancement request failed.');
      const retryable = err instanceof AIEnhancementError ? err.retryable : true;

      setErrorMessage(msg);
      setIsRetryable(retryable);
      setStep('ERROR');
      announce(`AI enhancement failed: ${msg}`, 'assertive');
      logger.error('SYSTEM', 'Enhancement processing error in modal', err, { photoId: photoItem.id });
    }
  };

  const handleCancelProcessing = () => {
    if (currentRequestIdRef.current) {
      aiEnhancementService.cancelEnhancement(currentRequestIdRef.current);
    }
    setStep('CONSENT');
    announce('AI enhancement cancelled.', 'polite');
  };

  const handleApprove = () => {
    if (!photoItem || !jobResult) return;
    onApprove(photoItem.id, jobResult);
    announce('Enhanced photo approved as product display image.', 'polite');
    onClose();
  };

  const handleReject = () => {
    if (!photoItem) return;
    onReject(photoItem.id);
    announce('Enhanced version declined. Authentic original photo preserved.', 'polite');
    onClose();
  };

  if (!isOpen || !photoItem) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={step === 'PROCESSING' ? handleCancelProcessing : onClose}
      title="AI Image Studio — Photograph Enhancement"
    >
      <div className="flex flex-col gap-5 text-primary max-w-2xl">
        {/* Step 1: Consent & Rationale */}
        {step === 'CONSENT' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 p-3 bg-secondary/10 text-secondary rounded-xl text-xs font-semibold border border-secondary/20">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>
                Enhance presentation for catalogues & Craft Passports without altering craft authenticity.
              </span>
            </div>

            {/* Preview of Original Photo */}
            <div className="relative w-full h-56 rounded-xl overflow-hidden bg-slate-900 border border-surface-variant flex items-center justify-center">
              <img
                src={photoItem.rawOriginalUrl || photoItem.url}
                alt="Selected craft photo"
                className="max-h-full max-w-full object-contain"
              />
              <div className="absolute top-3 left-3 bg-primary/90 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                <span>Original Photograph</span>
              </div>
            </div>

            {/* Enhancement Guardrails Checklist */}
            <div className="p-3.5 bg-surface-container-low rounded-xl border border-surface-variant flex flex-col gap-2 text-xs">
              <span className="font-bold text-primary flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-secondary shrink-0" />
                What AI Image Studio Does:
              </span>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-on-surface-variant text-[11px]">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-success shrink-0" />
                  <span>Removes cluttered background cleanly</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-success shrink-0" />
                  <span>Conservative lighting balance</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-success shrink-0" />
                  <span>Centers product on catalogue canvas</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-success shrink-0" />
                  <span>Preserves original photo immutably</span>
                </li>
              </ul>
            </div>

            {/* Offline or Disabled Alert */}
            {!isAiEnabled ? (
              <div className="p-3 bg-surface-container rounded-xl border border-surface-variant text-xs text-on-surface-variant flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-warning shrink-0" />
                <span>AI Enhancement is currently disabled in your environment configuration.</span>
              </div>
            ) : !isOnline ? (
              <div className="p-3 bg-surface-container rounded-xl border border-surface-variant text-xs text-on-surface-variant flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-secondary shrink-0" />
                <span>Device is offline. AI processing requires an internet connection.</span>
              </div>
            ) : (
              /* Explicit Consent Checkbox */
              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-secondary/30 bg-secondary/5 cursor-pointer hover:bg-secondary/10 transition-colors">
                <input
                  type="checkbox"
                  checked={consentGranted}
                  onChange={(e) => setConsentGranted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-secondary rounded accent-secondary cursor-pointer"
                />
                <span className="text-xs text-primary font-medium leading-relaxed select-none">
                  I give consent to enhance this photograph. I understand this adjusts background and lighting presentation only and will not modify my craft's authentic colours or weave.
                </span>
              </label>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-variant">
              <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
                Continue with Original
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleStartEnhancement}
                disabled={!isAiEnabled || !isOnline || !consentGranted}
                leftIcon={<Sparkles className="w-4 h-4" />}
                className="text-xs font-bold"
              >
                Enhance with AI
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Processing In-Flight */}
        {step === 'PROCESSING' && (
          <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
            <div className="relative w-16 h-16 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin" />
              <Sparkles className="w-4 h-4 absolute top-1 right-1 text-amber-500 animate-pulse" />
            </div>

            <div className="flex flex-col gap-1 max-w-sm">
              <h3 className="font-bold text-base text-primary">Enhancing Photograph...</h3>
              <p className="text-xs text-on-surface-variant">
                Removing background and applying conservative lighting balance. This usually takes 1–3 seconds.
              </p>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleCancelProcessing}
              className="mt-4 text-xs font-semibold"
            >
              Cancel Processing
            </Button>
          </div>
        )}

        {/* Step 3: Comparison & Review */}
        {step === 'REVIEW' && jobResult && (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-on-surface-variant">
              Compare the original photo with the enhanced catalogue version below. You can approve the enhanced version or continue using your original photo.
            </p>

            <ImageComparisonViewer
              originalUrl={photoItem.rawOriginalUrl || photoItem.url}
              enhancedUrl={jobResult.enhancedDataUrl || photoItem.enhancedUrl || photoItem.url}
              metrics={jobResult.metrics}
              warnings={jobResult.warnings}
            />

            {/* Decision Actions */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-surface-variant flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReject}
                leftIcon={<X className="w-3.5 h-3.5" />}
                className="text-xs text-on-surface-variant hover:text-error"
              >
                Decline & Use Original
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleStartEnhancement}
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  Retry
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleApprove}
                  leftIcon={<Check className="w-3.5 h-3.5" />}
                  className="text-xs font-bold"
                >
                  Approve Enhanced Image
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Error State */}
        {step === 'ERROR' && (
          <div className="py-6 flex flex-col gap-4">
            <div className="p-4 bg-error-container text-on-error-container rounded-xl text-xs flex items-start gap-3 border border-error/20">
              <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="font-bold text-sm">Enhancement Unavailable</span>
                <p className="leading-relaxed">{errorMessage}</p>
              </div>
            </div>

            <div className="p-3 bg-surface-container-low rounded-xl border border-surface-variant text-xs text-on-surface-variant flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-success shrink-0" />
              <span>Your authentic original photo remains 100% intact and ready for use.</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-variant">
              <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
                Continue with Original Photo
              </Button>

              {isRetryable && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleStartEnhancement}
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                  className="text-xs font-bold"
                >
                  Retry Enhancement
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};