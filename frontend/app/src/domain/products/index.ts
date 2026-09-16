import {
  ProductDraft,
  PublicFieldsSelection,
  ProductImageRecord,
  ProductDimensions,
  ProductWeight,
  ProductLifecycleStatus,
  ProductStatusHistoryEntry,
} from '@/types';

export type ProductStatus = ProductLifecycleStatus;

export interface ProductRecord {
  id: string;
  ownerId: string;
  artisanId?: string;
  title: string;
  titleHindi?: string;
  description: string;
  descriptionHindi?: string;
  category: string;
  subcategory?: string;
  craftType: string;
  state: string;
  material?: string;
  materials?: string[];
  colour?: string;
  dimensions?: string;
  dimensionsObj?: ProductDimensions;
  weightObj?: ProductWeight;
  price: number;
  currency: string;
  stockQuantity: number;
  sku?: string;
  status: ProductStatus;
  tags?: string[];
  makingTime?: string;
  careInstructions?: string;
  customisationAvailable?: boolean;
  shippingNotes?: string;
  photoPaths: string[];
  images?: ProductImageRecord[];
  primaryImageId?: string;
  thumbnailPath?: string;
  technique?: string;
  origin?: string;
  story?: string;
  coverPhotoIndex?: number;
  voiceNoteUrl?: string;
  voiceTranscript?: string;
  voiceConfidence?: number;
  confirmedFacts?: Array<{
    key: string;
    label: string;
    value: string;
    isConfirmed: boolean;
    confidenceScore: number;
  }>;
  needsReviewFacts?: Array<{
    key: string;
    label: string;
    value: string;
    isConfirmed: boolean;
    confidenceScore: number;
    needsReviewReason?: string;
    correctedValue?: string;
  }>;
  costBreakdown?: {
    rawMaterials: number;
    laborHours: number;
    hourlyRate: number;
    packagingAndLogistics: number;
    totalCost: number;
  };
  pricingStrategy?: 'fair_trade' | 'market_standard' | 'premium_heritage' | 'custom';
  publicFields?: PublicFieldsSelection | Record<string, boolean>;
  suggestionMetadata?: {
    mockGenerated: boolean;
    generatedAt?: string;
    appliedSuggestions?: string[];
  };
  completionState?: {
    isReady: boolean;
    completedAt?: string;
  };
  passportId?: string;
  passportStatus?: 'inactive' | 'active' | 'revoked';
  passportSlug?: string;
  lifecycleStatus?: ProductLifecycleStatus;
  statusHistory?: ProductStatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
  lastAutosavedAt?: string;
  archivedAt?: string;
  duplicatedFrom?: string;
  schemaVersion?: number;
}

export interface CreateProductInput extends Omit<ProductRecord, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'> {
  id?: string;
}

import { removeUndefinedDeep } from '@/utils/firestore';

export interface UpdateProductInput extends Partial<Omit<ProductRecord, 'id' | 'ownerId' | 'createdAt'>> {
  updatedAt?: string;
}

export function draftToProductRecord(draft: ProductDraft, ownerId: string): ProductRecord {
  const photoPaths = draft.photos && draft.photos.length > 0
    ? draft.photos
        .map((p) => {
          if (p.selectedVariant === 'enhanced' && p.enhancedUrl && !p.enhancedUrl.startsWith('data:')) {
            return p.enhancedUrl;
          }
          return p.url;
        })
        .filter((u): u is string => typeof u === 'string' && u.trim().length > 0 && !u.startsWith('data:'))
    : (draft.photoPaths || []).filter((u) => typeof u === 'string' && !u.startsWith('data:'));

  const firstMaterial = draft.materials && draft.materials.length > 0
    ? draft.materials.join(', ')
    : (draft.material || '');

  const record: ProductRecord = {
    id: draft.id,
    ownerId,
    artisanId: draft.artisanId || ownerId,
    title: draft.title || 'Untitled Product',
    description: draft.story || draft.description || draft.title || 'Handcrafted artisan product',
    category: draft.category || 'General Craft',
    craftType: draft.craftType || draft.technique || 'Handmade',
    state: draft.origin || 'India',
    material: firstMaterial,
    materials: draft.materials || (draft.material ? [draft.material] : []),
    price: typeof draft.selectedPrice === 'number' && !isNaN(draft.selectedPrice) ? draft.selectedPrice : 0,
    currency: draft.currency || 'INR',
    stockQuantity: typeof draft.stockQuantity === 'number' && !isNaN(draft.stockQuantity) ? draft.stockQuantity : 1,
    status: (draft.status === 'published' || draft.status === 'ready' || draft.status === 'archived'
      ? draft.status
      : 'draft') as ProductStatus,
    tags: Array.isArray(draft.tags) ? draft.tags : [],
    photoPaths,
    thumbnailPath: photoPaths[draft.coverPhotoIndex || 0] || photoPaths[0] || '',
    technique: draft.technique || draft.craftType || 'Handmade',
    origin: draft.origin || 'India',
    story: draft.story || draft.description || '',
    coverPhotoIndex: draft.coverPhotoIndex || 0,
    createdAt: draft.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: draft.schemaVersion || 1,
  };

  // Conditionally assign optional fields only when they exist and are non-empty
  if (draft.titleHindi?.trim()) record.titleHindi = draft.titleHindi.trim();
  if (draft.descriptionHindi?.trim()) record.descriptionHindi = draft.descriptionHindi.trim();
  if (draft.subcategory?.trim()) record.subcategory = draft.subcategory.trim();
  if (draft.colour?.trim()) record.colour = draft.colour.trim();
  if (draft.dimensions?.trim()) record.dimensions = draft.dimensions.trim();
  if (draft.dimensionsObj) {
    const dim = removeUndefinedDeep(draft.dimensionsObj);
    if (Object.keys(dim).length > 0) record.dimensionsObj = dim;
  }
  if (draft.weightObj) {
    const wt = removeUndefinedDeep(draft.weightObj);
    if (Object.keys(wt).length > 0) record.weightObj = wt;
  }
  if (draft.sku?.trim()) record.sku = draft.sku.trim();
  if (draft.makingTime?.trim()) record.makingTime = draft.makingTime.trim();
  if (draft.careInstructions?.trim()) record.careInstructions = draft.careInstructions.trim();
  if (typeof draft.customisationAvailable === 'boolean') record.customisationAvailable = draft.customisationAvailable;
  if (draft.shippingNotes?.trim()) record.shippingNotes = draft.shippingNotes.trim();

  if (Array.isArray(draft.images) && draft.images.length > 0) {
    const sanitizedImages = draft.images.map((img) => removeUndefinedDeep(img));
    if (sanitizedImages.length > 0) record.images = sanitizedImages;
  }
  if (draft.primaryImageId?.trim()) record.primaryImageId = draft.primaryImageId.trim();

  if (draft.voiceNoteUrl?.trim()) record.voiceNoteUrl = draft.voiceNoteUrl.trim();
  if (draft.voiceTranscript?.trim()) record.voiceTranscript = draft.voiceTranscript.trim();
  if (typeof draft.voiceConfidence === 'number') record.voiceConfidence = draft.voiceConfidence;

  if (Array.isArray(draft.confirmedFacts) && draft.confirmedFacts.length > 0) {
    record.confirmedFacts = draft.confirmedFacts.map((f) => removeUndefinedDeep(f));
  }
  if (Array.isArray(draft.needsReviewFacts) && draft.needsReviewFacts.length > 0) {
    record.needsReviewFacts = draft.needsReviewFacts.map((f) => removeUndefinedDeep(f));
  }
  if (draft.costBreakdown) {
    record.costBreakdown = removeUndefinedDeep(draft.costBreakdown);
  }
  if (draft.pricingStrategy) record.pricingStrategy = draft.pricingStrategy;
  if (draft.publicFields) {
    record.publicFields = removeUndefinedDeep(draft.publicFields);
  }
  if (draft.suggestionMetadata) {
    record.suggestionMetadata = removeUndefinedDeep(draft.suggestionMetadata);
  }
  if (draft.completionState) {
    record.completionState = removeUndefinedDeep(draft.completionState);
  }
  if (draft.passportId?.trim()) record.passportId = draft.passportId.trim();
  if (draft.passportStatus) record.passportStatus = draft.passportStatus;
  if (draft.passportSlug?.trim()) record.passportSlug = draft.passportSlug.trim();
  if (draft.lifecycleStatus) record.lifecycleStatus = draft.lifecycleStatus;
  if (Array.isArray(draft.statusHistory) && draft.statusHistory.length > 0) {
    record.statusHistory = draft.statusHistory.map((sh) => removeUndefinedDeep(sh));
  }
  if (draft.lastAutosavedAt) record.lastAutosavedAt = draft.lastAutosavedAt;
  if (draft.archivedAt) record.archivedAt = draft.archivedAt;
  if (draft.duplicatedFrom?.trim()) record.duplicatedFrom = draft.duplicatedFrom.trim();

  return removeUndefinedDeep(record);
}

export function productRecordToDraft(record: ProductRecord): ProductDraft {
  const defaultPublicFields: PublicFieldsSelection = {
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
  };

  const photos = record.images && record.images.length > 0
    ? record.images.map((img, idx) => ({
        id: img.id,
        url: (img.enhancement?.approvalStatus === 'approved' && img.enhancement?.selectedVariant === 'enhanced' && (img.enhancement.enhancedDownloadURL || img.enhancement.enhancedPath))
          ? (img.enhancement.enhancedDownloadURL || img.enhancement.enhancedPath || img.secureUrl || img.displayDownloadURL || img.originalDownloadURL || img.originalPath)
          : (img.secureUrl || img.displayDownloadURL || img.originalDownloadURL || img.originalPath),
        name: img.fileName || `Photo ${idx + 1}`,
        size: img.displaySize || img.originalSize || 1000000,
        type: img.contentType || 'image/jpeg',
        uploadedAt: img.createdAt || record.createdAt,
        isCover: idx === (record.coverPhotoIndex || 0) || img.id === record.primaryImageId,
        rawOriginalUrl: img.secureUrl || img.originalDownloadURL || img.originalPath,
        enhancedUrl: img.enhancement?.enhancedDownloadURL || img.enhancement?.enhancedPath,
        previewUrl: img.enhancement?.previewDownloadURL || img.enhancement?.previewPath,
        enhancementStatus: img.enhancement?.status,
        approvalStatus: img.enhancement?.approvalStatus,
        selectedVariant: img.enhancement?.selectedVariant,
        warnings: img.enhancement?.warnings,
        metrics: img.enhancement?.metrics,
        jobId: img.enhancement?.jobId,
        requestId: img.enhancement?.requestId,
      }))
    : (record.photoPaths || []).map((p, idx) => ({
        id: `photo_${idx}`,
        url: p,
        name: `Photo ${idx + 1}`,
        size: 1000000,
        type: 'image/jpeg',
        uploadedAt: record.createdAt,
        isCover: idx === (record.coverPhotoIndex || 0),
      }));

  const materialsArray = record.materials && record.materials.length > 0
    ? record.materials
    : (record.material ? record.material.split(',').map((s) => s.trim()).filter(Boolean) : []);

  return {
    id: record.id,
    artisanId: record.artisanId || record.ownerId,
    ownerId: record.ownerId,
    title: record.title || '',
    titleHindi: record.titleHindi,
    description: record.description || '',
    descriptionHindi: record.descriptionHindi,
    category: record.category || '',
    subcategory: record.subcategory,
    technique: record.technique || record.craftType || '',
    craftType: record.craftType || record.technique,
    material: record.material || materialsArray[0] || '',
    materials: materialsArray,
    colour: record.colour,
    dimensions: record.dimensions || '',
    dimensionsObj: record.dimensionsObj,
    weightObj: record.weightObj,
    stockQuantity: typeof record.stockQuantity === 'number' ? record.stockQuantity : 1,
    sku: record.sku,
    origin: record.origin || record.state || '',
    story: record.story || record.description || '',
    tags: record.tags || [],
    makingTime: record.makingTime,
    careInstructions: record.careInstructions,
    customisationAvailable: record.customisationAvailable,
    shippingNotes: record.shippingNotes,
    photos,
    images: record.images,
    primaryImageId: record.primaryImageId,
    coverPhotoIndex: record.coverPhotoIndex || 0,
    voiceNoteUrl: record.voiceNoteUrl,
    voiceTranscript: record.voiceTranscript,
    voiceConfidence: record.voiceConfidence,
    confirmedFacts: (record.confirmedFacts || []).map((f) => ({ ...f })),
    needsReviewFacts: (record.needsReviewFacts || []).map((f) => ({ ...f })),
    costBreakdown: record.costBreakdown || {
      rawMaterials: 0,
      laborHours: 0,
      hourlyRate: 0,
      packagingAndLogistics: 0,
      totalCost: 0,
    },
    selectedPrice: record.price || 0,
    currency: record.currency || 'INR',
    pricingStrategy: record.pricingStrategy || 'fair_trade',
    publicFields: (record.publicFields as PublicFieldsSelection) || defaultPublicFields,
    status: (record.status === 'ready' || record.status === 'published' || record.status === 'archived'
      ? record.status
      : 'draft') as ProductDraft['status'],
    suggestionMetadata: record.suggestionMetadata,
    completionState: record.completionState,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    lastAutosavedAt: record.lastAutosavedAt,
    archivedAt: record.archivedAt,
    duplicatedFrom: record.duplicatedFrom,
    passportId: record.passportId,
    passportStatus: record.passportStatus,
    passportSlug: record.passportSlug,
    lifecycleStatus: record.lifecycleStatus,
    statusHistory: record.statusHistory ? [...record.statusHistory] : undefined,
    schemaVersion: record.schemaVersion || 1,
  };
}

export * from './validation';
