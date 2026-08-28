import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  ProductDraft,
  FactField,
  PhotographItem,
  CostBreakdown,
  PublicFieldsSelection,
  ProductImageRecord,
} from '@/types';
import { productRepository } from '@/repositories';
import { ProductRecord, productRecordToDraft, draftToProductRecord } from '@/domain/products';
import { validateProductForReadiness } from '@/domain/products/validation';
import { useAuth } from '@/app/providers/AuthProvider';
import { draftRecoveryService, ConflictCheckResult } from '@/services/storage/draftRecoveryService';
import { logger } from '@/services/logging/logger';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'offline_saved' | 'error';

interface ProductDraftContextType {
  draft: ProductDraft;
  isSaving: boolean;
  autosaveStatus: AutosaveStatus;
  saveError: string | null;
  conflictData: ConflictCheckResult | null;
  updateDraft: (updates: Partial<ProductDraft>) => void;
  saveDraft: () => Promise<ProductRecord>;
  loadDraft: (productId: string) => Promise<ProductDraft>;
  markListingReady: () => Promise<ProductRecord>;
  addPhoto: (photo: PhotographItem) => void;
  addImageRecord: (imageRecord: ProductImageRecord, photoItem: PhotographItem) => void;
  removePhoto: (id: string) => void;
  setCoverPhoto: (index: number) => void;
  updateConfirmedFact: (key: string, value: string) => void;
  confirmFact: (fact: FactField, correctedValue?: string) => void;
  updateCostBreakdown: (breakdown: Partial<CostBreakdown>) => void;
  setSelectedPrice: (price: number, strategy?: ProductDraft['pricingStrategy']) => void;
  updatePublicFields: (fields: Partial<PublicFieldsSelection>) => void;
  resetDraft: (customId?: string) => ProductDraft;
  resolveConflict: (choice: 'local' | 'cloud') => void;
  clearSaveError: () => void;
  updateImageEnhancement: (photoId: string, enhancementData: Partial<PhotographItem>) => void;
}

const createInitialDraft = (artisanId = ''): ProductDraft => ({
  id: `draft_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
  artisanId,
  ownerId: artisanId,
  title: 'Indigo & Terracotta Silk Jamdani Saree',
  titleHindi: 'इंडिगो और टेराकोटा रेशम जामदानी साड़ी',
  description: 'Woven completely on a traditional pit loom over 18 days. The terracotta and deep indigo geometric patterns celebrate regional river heritage.',
  descriptionHindi: 'पारंपरिक गड्ढा करघे पर 18 दिनों में बुनी गई प्रामाणिक साड़ी।',
  category: 'Handloom Textiles',
  subcategory: 'Sarees & Stoles',
  technique: 'Traditional Handloom Jamdani Weaving',
  craftType: 'Jamdani Silk Weave',
  material: 'Pure Mulberry Silk',
  materials: ['Pure Mulberry Silk', 'Natural Vegetable Dyes', 'Zari Threads'],
  colour: 'Indigo & Terracotta',
  dimensions: '5.5 meters (Length) x 1.2 meters (Width)',
  dimensionsObj: { length: 5.5, width: 1.2, height: 0.01, unit: 'm' },
  weightObj: { value: 650, unit: 'g' },
  stockQuantity: 3,
  sku: 'JAM-SILK-001',
  origin: 'Assam & Pochampally, India',
  story: 'Woven completely on a traditional pit loom over 18 days. The terracotta and deep indigo geometric patterns celebrate regional river heritage.',
  tags: ['Silk Saree', 'Jamdani Weave', 'Handloom Textile', 'Natural Dye', 'Assam Craft'],
  makingTime: '18 Days',
  careInstructions: 'Dry clean only. Store wrapped in pure muslin cloth away from direct moisture.',
  customisationAvailable: true,
  shippingNotes: 'Ships in sustainable handcrafted kraft packaging within 3 business days.',
  photos: [
    {
      id: 'p1',
      url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
      name: 'jamdani_saree_full.jpg',
      size: 2450000,
      type: 'image/jpeg',
      uploadedAt: new Date().toISOString(),
      isCover: true,
    },
    {
      id: 'p2',
      url: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=800&auto=format&fit=crop&q=80',
      name: 'jamdani_border_detail.jpg',
      size: 1980000,
      type: 'image/jpeg',
      uploadedAt: new Date().toISOString(),
    },
    {
      id: 'p3',
      url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&auto=format&fit=crop&q=80',
      name: 'artisan_loom_action.jpg',
      size: 3120000,
      type: 'image/jpeg',
      uploadedAt: new Date().toISOString(),
    },
  ],
  images: [],
  primaryImageId: 'p1',
  coverPhotoIndex: 0,
  voiceNoteUrl: 'blob:simulated_audio_note_01',
  voiceTranscript: 'यह साड़ी शुद्ध शहतूत रेशम और प्राकृतिक टेराकोटा रंगों से 18 दिनों में हथकरघे पर बुनी गई है। लंबाई साढ़े पांच मीटर है।',
  voiceConfidence: 0.94,
  confirmedFacts: [
    { key: 'category', label: 'Category', value: 'Handwoven Textiles', isConfirmed: true, confidenceScore: 0.98 },
    { key: 'origin', label: 'Origin', value: 'Assam, India', isConfirmed: true, confidenceScore: 0.95 },
    { key: 'technique', label: 'Primary Technique', value: 'Handloom Jamdani Weave', isConfirmed: true, confidenceScore: 0.94 },
  ],
  needsReviewFacts: [
    {
      key: 'materials',
      label: 'Material Confirmation',
      value: 'Natural Mulberry Silk & Vegetable Dye',
      isConfirmed: false,
      confidenceScore: 0.72,
      needsReviewReason: 'Please confirm the specific silk grade and dye composition.',
    },
    {
      key: 'dimensions',
      label: 'Dimensions',
      value: '5.5 x 1.2 meters',
      isConfirmed: false,
      confidenceScore: 0.78,
      needsReviewReason: 'Verify if blouse piece is included in total length.',
    },
  ],
  costBreakdown: {
    rawMaterials: 3800,
    laborHours: 42,
    hourlyRate: 150,
    packagingAndLogistics: 450,
    totalCost: 10550,
  },
  selectedPrice: 14500,
  currency: 'INR',
  pricingStrategy: 'fair_trade',
  publicFields: {
    title: true,
    category: true,
    technique: true,
    materials: true,
    dimensions: true,
    origin: true,
    story: true,
    artisanName: true,
    workshopLocation: true,
    directContact: true,
    retailPrice: true,
    wholesaleAvailable: false,
  },
  status: 'draft',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  schemaVersion: 1,
});

const ProductDraftContext = createContext<ProductDraftContextType | undefined>(undefined);

export const ProductDraftProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [draft, setDraft] = useState<ProductDraft>(() => createInitialDraft(user?.id || ''));
  const [isSaving, setIsSaving] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [conflictData, setConflictData] = useState<ConflictCheckResult | null>(null);

  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDirtyRef = useRef(false);
  const previousUserIdRef = useRef<string | null>(user?.id || null);

  // Sync draft owner and handle account switching safely without cross-tenant pollution
  useEffect(() => {
    const currentUid = user?.id || null;
    const prevUid = previousUserIdRef.current;

    if (currentUid !== prevUid) {
      previousUserIdRef.current = currentUid;

      if (!prevUid && currentUid) {
        // Auth resolved from unauthenticated to logged-in
        setDraft((prev) => {
          if (!prev.ownerId || prev.ownerId === 'artisan_default') {
            return { ...prev, artisanId: currentUid, ownerId: currentUid };
          }
          if (prev.ownerId === currentUid) {
            return prev;
          }
          const userRecovery = draftRecoveryService.getLocalRecovery(currentUid, prev.id);
          return userRecovery ? userRecovery.draft : createInitialDraft(currentUid);
        });
      } else if (prevUid && currentUid && prevUid !== currentUid) {
        // Account switched from userA to userB: Reset state for userB without touching userA's data
        const fresh = createInitialDraft(currentUid);
        setDraft(fresh);
        setSaveError(null);
        setConflictData(null);
        isDirtyRef.current = false;
        setAutosaveStatus('idle');
      } else if (!currentUid) {
        // User logged out: clear user-scoped active state cleanly
        const clean = createInitialDraft('');
        setDraft(clean);
        setSaveError(null);
        setConflictData(null);
        isDirtyRef.current = false;
        setAutosaveStatus('idle');
      }
    } else if (currentUid && (draft.artisanId !== currentUid || draft.ownerId !== currentUid)) {
      if (!draft.ownerId || draft.ownerId === 'artisan_default') {
        setDraft((prev) => ({
          ...prev,
          artisanId: currentUid,
          ownerId: currentUid,
        }));
      }
    }
  }, [user?.id, draft.artisanId, draft.ownerId, draft.id]);

  // Main Save Draft method (Manual or Triggered)
  const saveDraft = useCallback(async (): Promise<ProductRecord> => {
    if (!user?.id) {
      const errorMsg = 'Authentication required: User must be signed in to save product drafts.';
      setSaveError(errorMsg);
      setAutosaveStatus('error');
      throw new Error(errorMsg);
    }

    setIsSaving(true);
    setAutosaveStatus('saving');
    setSaveError(null);

    try {
      const currentDraft = draft;
      const ownerId = user.id;

      // Check if product already exists in Firestore for this owner
      let existingRecord: ProductRecord | null = null;
      try {
        existingRecord = await productRepository.getOwnedProductById(ownerId, currentDraft.id);
      } catch {
        existingRecord = null;
      }

      let savedRecord: ProductRecord;
      const recordPayload = draftToProductRecord(currentDraft, ownerId);

      if (existingRecord) {
        // Update existing document with clean sanitized payload
        savedRecord = await productRepository.updateProduct(ownerId, currentDraft.id, recordPayload);
      } else {
        // Create new document with clean sanitized payload
        savedRecord = await productRepository.createProduct(ownerId, recordPayload);
      }

      // Update local state with the confirmed record values
      setDraft((prev) => ({
        ...prev,
        id: savedRecord.id,
        artisanId: ownerId,
        ownerId,
        updatedAt: savedRecord.updatedAt,
        lastAutosavedAt: savedRecord.lastAutosavedAt || new Date().toISOString(),
      }));

      // Update local recovery mirror
      draftRecoveryService.saveLocalRecovery(ownerId, {
        ...currentDraft,
        updatedAt: savedRecord.updatedAt,
      });

      isDirtyRef.current = false;
      setAutosaveStatus('saved');
      setSaveError(null);

      logger.info('FIRESTORE', 'Product draft saved successfully through repository', {
        productId: savedRecord.id,
        ownerId,
        title: savedRecord.title,
        updatedAt: savedRecord.updatedAt,
      });

      return savedRecord;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to persist product draft to Firebase.';
      setSaveError(message);
      // Stop the autosave retry loop on error; do not immediately retry the same failing payload
      isDirtyRef.current = false;

      // Check if offline
      if (!navigator.onLine) {
        setAutosaveStatus('offline_saved');
      } else {
        setAutosaveStatus('error');
      }

      // Always preserve device recovery even if cloud fails
      if (user?.id) {
        draftRecoveryService.saveLocalRecovery(user.id, draft);
      }

      logger.error('FIRESTORE', 'Failed to save product draft', err, { ownerId: user?.id });
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, draft]);

  // Debounced Autosave (1500ms after meaningful changes)
  useEffect(() => {
    if (!isDirtyRef.current || !user?.id || !draft.id) return;

    // Immediately update device local storage
    draftRecoveryService.saveLocalRecovery(user.id, draft);

    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    autosaveTimeoutRef.current = setTimeout(() => {
      if (isDirtyRef.current && user?.id) {
        saveDraft().catch((err) => {
          logger.warn('AUTOSAVE', 'Debounced autosave caught error', {
            error: err instanceof Error ? err.message : String(err),
          });
        });
      }
    }, 1500);

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [draft, user?.id, saveDraft]);

  const updateDraft = useCallback((updates: Partial<ProductDraft>) => {
    isDirtyRef.current = true;
    setDraft((prev) => ({
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const loadDraft = useCallback(async (productId: string): Promise<ProductDraft> => {
    if (!user?.id) {
      throw new Error('Authentication required: User must be signed in to load drafts.');
    }

    const record = await productRepository.getOwnedProductById(user.id, productId);
    if (!record) {
      throw new Error(`Product draft with ID ${productId} not found for this user.`);
    }

    const loadedDraft = productRecordToDraft(record);

    // Check for local recovery conflict
    const localRecovery = draftRecoveryService.getLocalRecovery(user.id, productId);
    const conflict = draftRecoveryService.detectConflict(loadedDraft, localRecovery);

    if (conflict.hasConflict) {
      setConflictData(conflict);
    } else {
      setConflictData(null);
    }

    setDraft(loadedDraft);
    isDirtyRef.current = false;
    setAutosaveStatus('saved');
    logger.info('FIRESTORE', 'Loaded product draft into workflow context', { productId, ownerId: user.id });
    return loadedDraft;
  }, [user?.id]);

  const resolveConflict = useCallback((choice: 'local' | 'cloud') => {
    if (!user?.id || !draft.id) return;

    if (choice === 'local') {
      const localRecovery = draftRecoveryService.getLocalRecovery(user.id, draft.id);
      if (localRecovery) {
        setDraft(localRecovery.draft);
        isDirtyRef.current = true;
      }
    }
    setConflictData(null);
  }, [user?.id, draft.id]);

  const markListingReady = useCallback(async (): Promise<ProductRecord> => {
    if (!user?.id) {
      throw new Error('Authentication required: You must be signed in to mark a listing as ready.');
    }

    const validation = validateProductForReadiness(draft);
    if (!validation.isReady) {
      const errorMessages = validation.errors.map((e) => e.message).join(' | ');
      throw new Error(`Cannot mark listing as ready: ${errorMessages}`);
    }

    const updatedDraft: ProductDraft = {
      ...draft,
      status: 'ready' as const,
      completionState: {
        isReady: true,
        completedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };

    const recordPayload = draftToProductRecord(updatedDraft, user.id);
    let savedRecord: ProductRecord;

    try {
      const existing = await productRepository.getOwnedProductById(user.id, updatedDraft.id);
      if (existing) {
        savedRecord = await productRepository.updateProduct(user.id, updatedDraft.id, recordPayload);
      } else {
        savedRecord = await productRepository.createProduct(user.id, recordPayload);
      }
    } catch (err) {
      logger.error('FIRESTORE', 'Failed to persist ready listing to Firestore', err, { ownerId: user.id });
      throw err;
    }

    // Only update in-memory state after successful Firestore persistence
    setDraft((prev) => ({
      ...prev,
      ...updatedDraft,
      id: savedRecord.id,
      updatedAt: savedRecord.updatedAt,
      lastAutosavedAt: savedRecord.lastAutosavedAt || new Date().toISOString(),
    }));

    draftRecoveryService.saveLocalRecovery(user.id, {
      ...updatedDraft,
      updatedAt: savedRecord.updatedAt,
    });

    isDirtyRef.current = false;
    setAutosaveStatus('saved');
    setSaveError(null);

    return savedRecord;
  }, [user?.id, draft]);

  const resetDraft = useCallback((customId?: string): ProductDraft => {
    const newId = customId || `draft_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const fresh = createInitialDraft(user?.id || '');
    fresh.id = newId;
    fresh.title = '';
    fresh.photos = [];
    fresh.images = [];
    fresh.confirmedFacts = [];
    fresh.needsReviewFacts = [];
    fresh.createdAt = new Date().toISOString();
    fresh.updatedAt = new Date().toISOString();
    setDraft(fresh);
    setSaveError(null);
    setConflictData(null);
    isDirtyRef.current = false;
    setAutosaveStatus('idle');
    return fresh;
  }, [user?.id]);

  const addPhoto = useCallback((photo: PhotographItem) => {
    isDirtyRef.current = true;
    setDraft((prev) => ({
      ...prev,
      photos: [...prev.photos, photo],
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const addImageRecord = useCallback((imageRecord: ProductImageRecord, photoItem: PhotographItem) => {
    isDirtyRef.current = true;
    setDraft((prev) => {
      const images = [...(prev.images || []), imageRecord];
      const photos = [...prev.photos, photoItem];
      return {
        ...prev,
        images,
        photos,
        primaryImageId: prev.primaryImageId || imageRecord.id,
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  const removePhoto = useCallback((id: string) => {
    isDirtyRef.current = true;
    setDraft((prev) => {
      const photos = prev.photos.filter((p) => p.id !== id);
      const images = (prev.images || []).filter((img) => img.id !== id);
      const coverPhotoIndex = Math.min(prev.coverPhotoIndex, Math.max(0, photos.length - 1));
      return {
        ...prev,
        photos,
        images,
        coverPhotoIndex,
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  const setCoverPhoto = useCallback((index: number) => {
    isDirtyRef.current = true;
    setDraft((prev) => ({
      ...prev,
      coverPhotoIndex: index,
      primaryImageId: prev.images && prev.images[index] ? prev.images[index].id : prev.primaryImageId,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const updateConfirmedFact = useCallback((key: string, value: string) => {
    isDirtyRef.current = true;
    setDraft((prev) => ({
      ...prev,
      confirmedFacts: prev.confirmedFacts.map((f) => (f.key === key ? { ...f, value } : f)),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const confirmFact = useCallback((fact: FactField, correctedValue?: string) => {
    isDirtyRef.current = true;
    setDraft((prev) => {
      const value = correctedValue !== undefined ? correctedValue : fact.value;
      const updatedConfirmed = [
        ...prev.confirmedFacts.filter((f) => f.key !== fact.key),
        { ...fact, value, isConfirmed: true },
      ];
      const updatedNeedsReview = prev.needsReviewFacts.filter((f) => f.key !== fact.key);

      return {
        ...prev,
        confirmedFacts: updatedConfirmed,
        needsReviewFacts: updatedNeedsReview,
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  const updateCostBreakdown = useCallback((breakdown: Partial<CostBreakdown>) => {
    isDirtyRef.current = true;
    setDraft((prev) => {
      const newBreakdown = { ...prev.costBreakdown, ...breakdown };
      const raw = Number(newBreakdown.rawMaterials) || 0;
      const hours = Number(newBreakdown.laborHours) || 0;
      const rate = Number(newBreakdown.hourlyRate) || 0;
      const logistics = Number(newBreakdown.packagingAndLogistics) || 0;
      newBreakdown.totalCost = raw + hours * rate + logistics;

      return {
        ...prev,
        costBreakdown: newBreakdown,
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  const setSelectedPrice = useCallback((price: number, strategy: ProductDraft['pricingStrategy'] = 'custom') => {
    isDirtyRef.current = true;
    setDraft((prev) => ({
      ...prev,
      selectedPrice: price,
      pricingStrategy: strategy,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const updatePublicFields = useCallback((fields: Partial<PublicFieldsSelection>) => {
    isDirtyRef.current = true;
    setDraft((prev) => ({
      ...prev,
      publicFields: { ...prev.publicFields, ...fields },
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const updateImageEnhancement = useCallback(
    (photoId: string, enhancementData: Partial<PhotographItem>) => {
      isDirtyRef.current = true;
      setDraft((prev) => {
        const updatedPhotos = prev.photos.map((photo) => {
          if (photo.id !== photoId) return photo;

          const rawOriginalUrl = photo.rawOriginalUrl || photo.url;
          const updatedPhoto: PhotographItem = {
            ...photo,
            ...enhancementData,
            rawOriginalUrl,
          };

          if (
            enhancementData.approvalStatus === 'approved' &&
            enhancementData.selectedVariant === 'enhanced' &&
            enhancementData.enhancedUrl
          ) {
            updatedPhoto.url = enhancementData.enhancedUrl;
          } else if (
            enhancementData.approvalStatus === 'rejected' ||
            enhancementData.selectedVariant === 'original'
          ) {
            updatedPhoto.url = rawOriginalUrl;
          }

          return updatedPhoto;
        });

        const updatedImages = (prev.images || []).map((img) => {
          if (img.id !== photoId) return img;

          const currentEnhancement = img.enhancement || {
            status: 'none' as const,
            approvalStatus: 'none' as const,
            selectedVariant: 'original' as const,
          };

          return {
            ...img,
            enhancement: {
              ...currentEnhancement,
              jobId: enhancementData.jobId || currentEnhancement.jobId,
              requestId: enhancementData.requestId || currentEnhancement.requestId,
              status: enhancementData.enhancementStatus || currentEnhancement.status,
              approvalStatus: enhancementData.approvalStatus || currentEnhancement.approvalStatus,
              selectedVariant: enhancementData.selectedVariant || currentEnhancement.selectedVariant,
              enhancedPath: enhancementData.enhancedUrl || currentEnhancement.enhancedPath,
              enhancedDownloadURL: enhancementData.enhancedUrl || currentEnhancement.enhancedDownloadURL,
              previewPath: enhancementData.previewUrl || currentEnhancement.previewPath,
              previewDownloadURL: enhancementData.previewUrl || currentEnhancement.previewDownloadURL,
              warnings: enhancementData.warnings || currentEnhancement.warnings,
              metrics: enhancementData.metrics || currentEnhancement.metrics,
              updatedAt: new Date().toISOString(),
            },
          };
        });

        return {
          ...prev,
          photos: updatedPhotos,
          images: updatedImages,
          updatedAt: new Date().toISOString(),
        };
      });
    },
    []
  );

  const clearSaveError = useCallback(() => {
    setSaveError(null);
  }, []);

  return (
    <ProductDraftContext.Provider
      value={{
        draft,
        isSaving,
        autosaveStatus,
        saveError,
        conflictData,
        updateDraft,
        saveDraft,
        loadDraft,
        markListingReady,
        addPhoto,
        addImageRecord,
        removePhoto,
        setCoverPhoto,
        updateConfirmedFact,
        confirmFact,
        updateCostBreakdown,
        setSelectedPrice,
        updatePublicFields,
        resetDraft,
        resolveConflict,
        clearSaveError,
        updateImageEnhancement,
      }}
    >
      {children}
    </ProductDraftContext.Provider>
  );
};

export const useProductDraft = (): ProductDraftContextType => {
  const ctx = useContext(ProductDraftContext);
  if (!ctx) throw new Error('useProductDraft must be used within ProductDraftProvider');
  return ctx;
};
