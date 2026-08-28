import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductDraft } from '@/app/providers/ProductDraftProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { useLanguage } from '@/app/providers/LanguageProvider';
import {
  uploadPhotograph,
  validateImageFile,
  MAX_IMAGES_PER_PRODUCT,
  ALLOWED_MIME_TYPES,
} from '@/services/media/imageProcessor';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import {
  Camera,
  Trash2,
  ArrowRight,
  Upload,
  Sparkles,
  Sun,
  Crop,
  Star,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Check,
} from 'lucide-react';
import { clsx } from 'clsx';
import { logger } from '@/services/logging/logger';
import { AIEnhancementModal } from './components/AIEnhancementModal';
import { JobResult } from '@/services/ai/aiEnhancementService';

export const AddPhotographsPage: React.FC = () => {
  const { draft, addImageRecord, removePhoto, setCoverPhoto, updateDraft, updateImageEnhancement } = useProductDraft();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [isCameraDeniedModalOpen, setIsCameraDeniedModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // AI Enhancement state
  const [aiEnhancingPhotoIndex, setAiEnhancingPhotoIndex] = useState<number | null>(null);

  // Crop & Adjust interface state
  const [croppingPhotoIndex, setCroppingPhotoIndex] = useState<number | null>(null);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<'1:1' | '4:3' | '3:4' | 'original'>('1:1');
  const [cropZoom, setCropZoom] = useState<number>(1);
  const [isApplyingCrop, setIsApplyingCrop] = useState<boolean>(false);

  const handleProcessFile = async (file: File) => {
    setUploadError(null);

    const validation = validateImageFile(file, draft.photos.length);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file.');
      return;
    }

    if (!user?.id) {
      setUploadError('Please sign in to upload photos.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      const { imageRecord, photoItem } = await uploadPhotograph({
        ownerId: user.id,
        productId: draft.id,
        file,
        onProgress: (percent) => setUploadProgress(percent),
      });

      addImageRecord(imageRecord, photoItem);
      logger.info('STORAGE', 'Photo processed and attached to draft', {
        imageId: imageRecord.id,
        productId: draft.id,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Photo upload failed. Please try again.';
      setUploadError(msg);
      logger.error('STORAGE', 'Failed processing photo upload', err, { productId: draft.id });
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      if (draft.photos.length + i >= MAX_IMAGES_PER_PRODUCT) {
        setUploadError(`Maximum of ${MAX_IMAGES_PER_PRODUCT} photos allowed per product.`);
        break;
      }
      await handleProcessFile(files[i]);
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleOpenCropModal = (index: number) => {
    setCroppingPhotoIndex(index);
    setSelectedAspectRatio('1:1');
    setCropZoom(1);
  };

  const handleApplyCrop = async () => {
    if (croppingPhotoIndex === null || !draft.photos[croppingPhotoIndex]) return;

    setIsApplyingCrop(true);
    try {
      const targetPhoto = draft.photos[croppingPhotoIndex];
      // Create cropped canvas preview
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = targetPhoto.url;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image for cropping.'));
      });

      let targetWidth = img.naturalWidth;
      let targetHeight = img.naturalHeight;

      if (selectedAspectRatio === '1:1') {
        const minDim = Math.min(targetWidth, targetHeight);
        targetWidth = minDim;
        targetHeight = minDim;
      } else if (selectedAspectRatio === '4:3') {
        targetHeight = Math.round(targetWidth * (3 / 4));
      } else if (selectedAspectRatio === '3:4') {
        targetWidth = Math.round(targetHeight * (3 / 4));
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.min(1600, targetWidth);
      canvas.height = Math.round(canvas.width * (targetHeight / targetWidth));

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight, 0, 0, canvas.width, canvas.height);
        const croppedDataUrl = canvas.toDataURL('image/webp', 0.85);

        // Update photo URL in state
        const updatedPhotos = [...draft.photos];
        updatedPhotos[croppingPhotoIndex] = {
          ...targetPhoto,
          url: croppedDataUrl,
        };

        updateDraft({ photos: updatedPhotos });
        logger.info('STORAGE', 'Applied crop to photo', { index: croppingPhotoIndex, ratio: selectedAspectRatio });
      }

      setCroppingPhotoIndex(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to crop photo.';
      setUploadError(msg);
    } finally {
      setIsApplyingCrop(false);
    }
  };

  const handleContinue = () => {
    if (draft.photos.length === 0) {
      setUploadError('Please upload at least one authentic photograph of your handmade craft.');
      return;
    }
    navigate('/artisan/products/new/details');
  };

  const activeCoverPhoto = draft.photos[draft.coverPhotoIndex] || draft.photos[0];

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Step Header */}
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-primary tracking-tight">
          {t('productCreation.step1Title')}
        </h1>
        <p className="text-sm sm:text-base text-on-surface-variant">
          Upload up to 6 high-resolution photographs of your craft. Images will be securely optimized and stored.
        </p>
      </div>

      {/* Error Alert */}
      {uploadError && (
        <div
          role="alert"
          className="p-3.5 bg-error-container text-on-error-container rounded-xl text-xs font-semibold flex items-center justify-between border border-error/20 animate-in fade-in"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-error shrink-0" />
            <span>{uploadError}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-xs font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Two-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Upload Controls & Large Photo Showcase (65% / 8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          <Card className="p-5 sm:p-6 bg-white rounded-2xl border border-surface-variant/80 card-shadow flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-surface-variant/70 pb-2.5">
              <h2 className="font-bold text-base text-primary">
                Product Photographs ({draft.photos.length}/{MAX_IMAGES_PER_PRODUCT})
              </h2>
              <span className="text-xs text-on-surface-variant">
                Supported: JPEG, PNG, WebP (Max 10 MB)
              </span>
            </div>

            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="p-4 bg-secondary/5 rounded-xl border border-secondary/20 flex flex-col gap-2 animate-in fade-in">
                <div className="flex items-center justify-between text-xs font-bold text-secondary">
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Optimizing & uploading display copy...
                  </span>
                  <span>{uploadProgress || 0}%</span>
                </div>
                <div className="w-full bg-secondary/20 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-secondary h-full transition-all duration-200 rounded-full"
                    style={{ width: `${uploadProgress || 10}%` }}
                  />
                </div>
              </div>
            )}

            {/* Primary Large Image Preview */}
            {draft.photos.length > 0 ? (
              <div className="flex flex-col gap-3">
                <div className="relative w-full h-64 sm:h-80 rounded-xl overflow-hidden bg-surface-container border border-surface-variant">
                  <img
                    src={activeCoverPhoto.url}
                    alt={activeCoverPhoto.name || 'Product photo preview'}
                    className="w-full h-full object-cover"
                  />
                  {/* Cover Photo Badges & Actions */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                    <div className="bg-white/95 backdrop-blur-sm text-primary text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-surface-variant/70 shadow-xs flex items-center gap-1">
                      <Star className="w-3 h-3 text-secondary fill-secondary" />
                      <span>Cover Photo (Passport Primary)</span>
                    </div>

                    {activeCoverPhoto?.approvalStatus === 'approved' && activeCoverPhoto?.selectedVariant === 'enhanced' && (
                      <div className="bg-amber-500/95 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                        <Sparkles className="w-3 h-3 fill-white" />
                        <span>AI Enhanced (Approved)</span>
                      </div>
                    )}
                  </div>

                  {/* Actions: AI Enhance and Crop & Adjust */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAiEnhancingPhotoIndex(draft.coverPhotoIndex || 0)}
                      className="bg-secondary/95 backdrop-blur-sm hover:bg-secondary text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-secondary shadow-xs flex items-center gap-1.5 cursor-pointer transition-all hover:shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Enhance with AI</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenCropModal(draft.coverPhotoIndex || 0)}
                      className="bg-white/95 backdrop-blur-sm hover:bg-white text-primary text-xs font-bold px-3 py-1.5 rounded-lg border border-surface-variant shadow-xs flex items-center gap-1.5 cursor-pointer transition-all hover:shadow-sm"
                    >
                      <Crop className="w-3.5 h-3.5 text-secondary" />
                      <span>Crop & Adjust</span>
                    </button>
                  </div>
                </div>

                {/* Compact Thumbnail Gallery Row */}
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                  {draft.photos.map((photo, index) => {
                    const isCover = index === draft.coverPhotoIndex;
                    const isEnhanced = photo.approvalStatus === 'approved' && photo.selectedVariant === 'enhanced';

                    return (
                      <div
                        key={photo.id}
                        onClick={() => setCoverPhoto(index)}
                        className={clsx(
                          'relative w-20 h-20 rounded-lg overflow-hidden border-2 cursor-pointer transition-all shrink-0 group',
                          isCover ? 'border-secondary ring-2 ring-secondary/30' : 'border-surface-variant hover:border-primary'
                        )}
                      >
                        <img
                          src={photo.url}
                          alt={photo.name}
                          className="w-full h-full object-cover"
                        />
                        {isCover && (
                          <div className="absolute top-1 left-1 bg-secondary text-white rounded-full p-0.5 shadow-xs">
                            <Star className="w-2.5 h-2.5 fill-white" />
                          </div>
                        )}
                        {isEnhanced && (
                          <div className="absolute top-1 right-1 bg-amber-500 text-white rounded-full p-0.5 shadow-xs" title="AI Enhanced">
                            <Sparkles className="w-2.5 h-2.5 fill-white" />
                          </div>
                        )}
                        <div className="absolute bottom-1 inset-x-1 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-xs p-0.5 rounded-md">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAiEnhancingPhotoIndex(index);
                            }}
                            aria-label={`Enhance photo ${index + 1} with AI`}
                            title="Enhance with AI"
                            className="bg-white/90 text-secondary hover:bg-secondary hover:text-white rounded-md p-1 transition-colors"
                          >
                            <Sparkles className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenCropModal(index);
                            }}
                            aria-label={`Crop photo ${index + 1}`}
                            className="bg-white/90 text-primary hover:bg-primary hover:text-white rounded-md p-1 transition-colors"
                          >
                            <Crop className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removePhoto(photo.id);
                            }}
                            aria-label={`Remove photo ${index + 1}`}
                            className="bg-white/90 text-error hover:bg-error hover:text-white rounded-md p-1 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add More Thumbnail Button */}
                  {draft.photos.length < MAX_IMAGES_PER_PRODUCT && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-20 h-20 rounded-lg border-2 border-dashed border-outline-variant hover:border-secondary transition-colors cursor-pointer flex flex-col items-center justify-center gap-1 bg-surface-container-low/60 shrink-0 text-on-surface-variant hover:text-secondary"
                    >
                      <Upload className="w-4 h-4" />
                      <span className="text-[10px] font-bold">Add More</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Empty Dropzone Box */
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-8 sm:p-12 flex flex-col items-center justify-center text-center gap-3 border-2 border-dashed border-outline-variant hover:border-secondary rounded-xl transition-colors bg-surface-container-low/40 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-sm text-primary">Upload authentic craft photographs</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Select JPEG, PNG, or WebP files from your device (Max 10 MB each)
                  </p>
                </div>
              </div>
            )}

            {/* Hidden Standard File Input */}
            <input
              ref={fileInputRef}
              type="file"
              id="photo-file-input"
              multiple
              accept={ALLOWED_MIME_TYPES.join(',')}
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Hidden Mobile Camera Input */}
            <input
              ref={cameraInputRef}
              type="file"
              id="camera-file-input"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || draft.photos.length >= MAX_IMAGES_PER_PRODUCT}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-surface-variant bg-surface-container-low hover:bg-surface-container text-primary font-bold text-xs cursor-pointer transition-colors touch-target select-none disabled:opacity-50"
              >
                <Upload className="w-4 h-4 text-secondary" />
                <span>Upload From Device</span>
              </button>

              <Button
                type="button"
                variant="secondary"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isUploading || draft.photos.length >= MAX_IMAGES_PER_PRODUCT}
                isLoading={isUploading}
                leftIcon={<Camera className="w-4 h-4" />}
                className="w-full text-xs font-bold py-2.5"
              >
                Capture with Camera
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column: Photography Best Practices (35% / 4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <Card className="p-5 bg-white rounded-2xl border border-surface-variant/80 card-shadow flex flex-col gap-3.5">
            <h3 className="font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-1.5 border-b border-surface-variant/70 pb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-secondary" />
              <span>Photography Guidelines</span>
            </h3>

            <ul className="flex flex-col gap-3 text-xs text-on-surface-variant">
              <li className="flex items-start gap-2.5">
                <Sun className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                <span><strong>Natural Daylight:</strong> Shoot near a window with soft, even light without harsh glare or digital filters.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Crop className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                <span><strong>Multiple Angles:</strong> Capture overall product framing, intricate weave details, and artisan stamps.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Star className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                <span><strong>Cover Image:</strong> Tap any uploaded thumbnail to designate it as the primary QR Craft Passport cover image.</span>
              </li>
            </ul>
          </Card>

          {/* Privacy and Storage Note */}
          <div className="p-3.5 rounded-xl bg-surface-container-low/70 border border-surface-variant text-[11px] text-on-surface-variant leading-relaxed">
            <CheckCircle2 className="w-3.5 h-3.5 text-success inline mr-1" />
            <strong>Authentic Storage Guarantee:</strong> Photographs are securely isolated under your artisan identity with zero generative AI manipulation.
          </div>
        </div>
      </div>

      {/* Page Actions Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-surface-variant/70">
        <Button variant="ghost" onClick={() => navigate('/artisan/dashboard')} className="text-xs">
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

      {/* Interactive Crop & Adjust Modal */}
      {croppingPhotoIndex !== null && draft.photos[croppingPhotoIndex] && (
        <Modal
          isOpen={true}
          onClose={() => setCroppingPhotoIndex(null)}
          title="Crop & Align Craft Photograph"
        >
          <div className="flex flex-col gap-4">
            <p className="text-xs text-on-surface-variant">
              Select an aspect ratio framing for optimal display in the Craft Catalogue & Passport.
            </p>

            {/* Crop Preview Viewport */}
            <div className="relative w-full h-64 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-surface-variant">
              <img
                src={draft.photos[croppingPhotoIndex].url}
                alt="Crop preview"
                className="max-h-full max-w-full object-contain transition-transform duration-150"
                style={{ transform: `scale(${cropZoom})` }}
              />
              <div
                className={clsx(
                  'absolute border-2 border-white/80 pointer-events-none transition-all',
                  selectedAspectRatio === '1:1' && 'w-48 h-48 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]',
                  selectedAspectRatio === '4:3' && 'w-56 h-42 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]',
                  selectedAspectRatio === '3:4' && 'w-42 h-56 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]',
                  selectedAspectRatio === 'original' && 'w-full h-full border-dashed border-white/40'
                )}
              />
            </div>

            {/* Aspect Ratio Options */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Framing Aspect Ratio</span>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: '1:1', label: '1:1 Square' },
                  { id: '4:3', label: '4:3 Landscape' },
                  { id: '3:4', label: '3:4 Portrait' },
                  { id: 'original', label: 'Original' },
                ].map((ratio) => (
                  <button
                    key={ratio.id}
                    type="button"
                    onClick={() => setSelectedAspectRatio(ratio.id as '1:1' | '4:3' | '3:4' | 'original')}
                    className={clsx(
                      'py-2 px-2.5 rounded-lg text-xs font-bold border text-center transition-all cursor-pointer',
                      selectedAspectRatio === ratio.id
                        ? 'bg-secondary text-white border-secondary shadow-xs'
                        : 'bg-surface hover:bg-surface-variant border-surface-variant text-primary'
                    )}
                  >
                    {ratio.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Zoom Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-primary">
                <span>Scale Adjustment</span>
                <span>{Math.round(cropZoom * 100)}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="2"
                step="0.05"
                value={cropZoom}
                onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                className="w-full accent-secondary"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-variant/70">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCroppingPhotoIndex(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleApplyCrop}
                isLoading={isApplyingCrop}
                leftIcon={<Check className="w-3.5 h-3.5" />}
                className="text-xs font-bold"
              >
                Apply Crop & Update
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Camera Permission Fallback Modal */}
      <Modal
        isOpen={isCameraDeniedModalOpen}
        onClose={() => setIsCameraDeniedModalOpen(false)}
        title={t('photographs.cameraDeniedTitle')}
      >
        <div className="flex flex-col gap-4">
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {t('photographs.cameraDeniedDesc')}
          </p>
          <Button
            size="md"
            onClick={() => {
              setIsCameraDeniedModalOpen(false);
              fileInputRef.current?.click();
            }}
            className="w-full text-xs font-bold"
          >
            Upload from File Gallery
          </Button>
        </div>
      </Modal>

      {/* AI Enhancement Studio Modal */}
      {aiEnhancingPhotoIndex !== null && draft.photos[aiEnhancingPhotoIndex] && (
        <AIEnhancementModal
          isOpen={true}
          onClose={() => setAiEnhancingPhotoIndex(null)}
          photoItem={draft.photos[aiEnhancingPhotoIndex]}
          productId={draft.id}
          artisanId={user?.id || ''}
          onApprove={(photoId, result: JobResult) => {
            updateImageEnhancement(photoId, {
              approvalStatus: 'approved',
              selectedVariant: 'enhanced',
              enhancementStatus: result.status,
              enhancedUrl: result.enhancedDataUrl,
              previewUrl: result.previewDataUrl,
              metrics: result.metrics,
              warnings: result.warnings,
              jobId: result.job_id,
              requestId: result.request_id,
            });
            setAiEnhancingPhotoIndex(null);
          }}
          onReject={(photoId) => {
            updateImageEnhancement(photoId, {
              approvalStatus: 'rejected',
              selectedVariant: 'original',
              enhancementStatus: 'rejected',
            });
            setAiEnhancingPhotoIndex(null);
          }}
        />
      )}
    </div>
  );
};
