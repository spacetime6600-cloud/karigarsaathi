export type SupportedLanguage = 'en' | 'hi' | 'or' | 'bn' | 'te';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string; // Native script
  englishName: string;
  script: string;
  badge?: string;
}

export type SyncState = 'saved' | 'pending' | 'syncing' | 'failed' | 'synced' | 'offline' | 'error';

export interface ArtisanProfile {
  id: string;
  name: string;
  phone: string;
  role: 'artisan' | 'coordinator';
  craftType: string;
  location: string;
  avatarUrl: string;
  workshopName: string;
  bio: string;
  joinedYear: number;
}

export type EnhancementStatus =
  | 'none'
  | 'queued'
  | 'processing'
  | 'succeeded'
  | 'succeeded_with_warnings'
  | 'failed'
  | 'rejected';

export type ArtisanApprovalStatus =
  | 'none'
  | 'pending_review'
  | 'approved'
  | 'rejected';

export type SelectedImageVariant = 'original' | 'enhanced';

export interface QualityMetrics {
  mean_delta_e?: number | null;
  luminance_ssim?: number | null;
  edge_preservation_ratio?: number | null;
  p95_delta_e?: number | null;
  foreground_coverage?: number | null;
  highlight_clipping_percent?: number | null;
  shadow_clipping_percent?: number | null;
  mask_boundary_retention?: number | null;
}

export interface ImageEnhancementRecord {
  jobId?: string;
  requestId?: string;
  status: EnhancementStatus;
  approvalStatus: ArtisanApprovalStatus;
  selectedVariant: SelectedImageVariant;
  enhancedPath?: string;
  enhancedDownloadURL?: string;
  previewPath?: string;
  previewDownloadURL?: string;
  operationsRequested?: string[];
  operationsApplied?: string[];
  warnings?: string[];
  metrics?: QualityMetrics;
  processingDurationMs?: number;
  errorCode?: string;
  errorMessage?: string;
  adapterVersion?: string;
  originalChecksum?: string;
  enhancedChecksum?: string;
  updatedAt?: string;
}

export interface PhotographItem {
  id: string;
  url: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  isCover?: boolean;
  rawOriginalUrl?: string;
  enhancedUrl?: string;
  previewUrl?: string;
  enhancementStatus?: EnhancementStatus;
  approvalStatus?: ArtisanApprovalStatus;
  selectedVariant?: SelectedImageVariant;
  warnings?: string[];
  metrics?: QualityMetrics;
  jobId?: string;
  requestId?: string;
}

export interface CostBreakdown {
  rawMaterials: number;
  laborHours: number;
  hourlyRate: number;
  packagingAndLogistics: number;
  totalCost: number;
}

export interface PriceSuggestion {
  tier: 'fair_trade' | 'market_standard' | 'premium_heritage';
  price: number;
  label: string;
  sublabel: string;
  marginPercent: number;
  isRecommended?: boolean;
}

export interface PublicFieldsSelection {
  title: boolean;
  category: boolean;
  technique: boolean;
  materials: boolean;
  dimensions: boolean;
  origin: boolean;
  story: boolean;
  artisanName: boolean;
  workshopLocation: boolean;
  directContact: boolean;
  retailPrice: boolean;
  wholesaleAvailable: boolean;
}

export interface FactField {
  key: string;
  label: string;
  value: string;
  isConfirmed: boolean;
  confidenceScore: number; // 0.0 to 1.0
  needsReviewReason?: string;
  correctedValue?: string;
}

export interface ProductImageRecord {
  id: string;
  ownerId?: string;
  originalPath: string;
  displayPath?: string;
  originalDownloadURL?: string;
  displayDownloadURL?: string;
  fileName: string;
  contentType: string;
  originalSize: number;
  displaySize?: number;
  width?: number;
  height?: number;
  cropInfo?: { x: number; y: number; width: number; height: number };
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'failed';
  enhancement?: ImageEnhancementRecord;
  createdAt: string;
}

export interface ProductDimensions {
  length?: number;
  width?: number;
  height?: number;
  unit: string;
}

export interface ProductWeight {
  value?: number;
  unit: 'g' | 'kg';
}

export interface ProductDraft {
  id: string;
  artisanId: string;
  ownerId?: string;
  title: string;
  titleHindi?: string;
  description?: string;
  descriptionHindi?: string;
  category: string;
  subcategory?: string;
  technique: string;
  craftType?: string;
  material?: string;
  materials: string[];
  colour?: string;
  dimensions: string;
  dimensionsObj?: ProductDimensions;
  weightObj?: ProductWeight;
  stockQuantity?: number;
  sku?: string;
  origin: string;
  story: string;
  tags?: string[];
  makingTime?: string;
  careInstructions?: string;
  customisationAvailable?: boolean;
  shippingNotes?: string;
  photos: PhotographItem[];
  photoPaths?: string[];
  images?: ProductImageRecord[];
  primaryImageId?: string;
  coverPhotoIndex: number;
  voiceNoteUrl?: string;
  voiceTranscript?: string;
  voiceConfidence?: number;
  confirmedFacts: FactField[];
  needsReviewFacts: FactField[];
  costBreakdown: CostBreakdown;
  selectedPrice: number;
  currency?: string;
  pricingStrategy: 'fair_trade' | 'market_standard' | 'premium_heritage' | 'custom';
  publicFields: PublicFieldsSelection;
  status: 'draft' | 'ready' | 'in_review' | 'passport_generated' | 'exported' | 'shared' | 'submitted' | 'published' | 'archived';
  lifecycleStatus?: ProductLifecycleStatus;
  passportStatus?: CraftPassportStatus;
  passportSlug?: string;
  suggestionMetadata?: {
    mockGenerated: boolean;
    generatedAt?: string;
    appliedSuggestions?: string[];
  };
  completionState?: {
    isReady: boolean;
    completedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
  lastAutosavedAt?: string;
  archivedAt?: string;
  duplicatedFrom?: string;
  passportId?: string;
  statusHistory?: ProductStatusHistoryEntry[];
  schemaVersion?: number;
}

export type CraftPassportStatus =
  | 'inactive'
  | 'active'
  | 'revoked';

export type PassportPublicField =
  | 'title'
  | 'titleHindi'
  | 'description'
  | 'descriptionHindi'
  | 'photos'
  | 'category'
  | 'subcategory'
  | 'technique'
  | 'materials'
  | 'dimensions'
  | 'careInstructions'
  | 'tags'
  | 'price'
  | 'artisanName'
  | 'story'
  | 'location'
  | 'contactOption';

export interface CraftPassport {
  id: string;
  ownerId?: string;
  productId: string;
  publicToken?: string;
  publicSlug?: string;
  status?: CraftPassportStatus;
  approvedFields?: PassportPublicField[];
  consentRecordId?: string;
  publishedSnapshotVersion?: number;
  createdAt?: string;
  updatedAt?: string;
  activatedAt?: string;
  revokedAt?: string;
  // Legacy / convenience fields
  artisanId?: string;
  artisanName?: string;
  productTitle?: string;
  publicUrl?: string;
  workshopLocation?: string;
  craftHeritage?: string;
  technique?: string;
  materials?: string[];
  dimensions?: string;
  origin?: string;
  story?: string;
  photos?: string[];
  publicPrice?: number;
  verificationHash?: string;
  verifiedAt?: string;
  artisanPhone?: string;
  category?: string;
  qrPayload?: string;
}

export interface SanitizedPassportData {
  title: string;
  titleHindi?: string;
  description?: string;
  descriptionHindi?: string;
  photos: string[];
  category?: string;
  subcategory?: string;
  technique?: string;
  materials?: string[];
  dimensions?: string;
  careInstructions?: string;
  tags?: string[];
  price?: number;
  currency?: string;
  artisanName?: string;
  artisanStory?: string;
  state?: string;
  district?: string;
  workshopName?: string;
  contactOption?: boolean;
  verificationHash?: string;
}

export interface PublicCraftPassport {
  passportId: string;
  productId: string;
  ownerId: string;
  slug: string;
  status: 'active' | 'revoked';
  snapshotVersion: number;
  publicData: SanitizedPassportData;
  activatedAt: string;
  updatedAt: string;
  revokedAt?: string;
}

export interface ActivatedPassportResult {
  passportId: string;
  publicSlug: string;
  publicUrl: string;
  status: 'active';
  publicData: SanitizedPassportData;
  snapshotVersion: number;
  passport: CraftPassport;
  slug: string;
}

export type ExportFormat = 'pdf' | 'csv' | 'json' | 'qr' | 'whatsapp';

export type MarketplaceChannel = 'ondc' | 'indiahandmade' | 'gem_odop' | 'generic';

export type ExportAction =
  | 'export'
  | 'generated'
  | 'downloaded'
  | 'copied'
  | 'shared'
  | 'redirected'
  | 'submitted'
  | 'published'
  | 'failed';

export interface ExportAuditRecord {
  id: string;
  ownerId: string;
  productId: string;
  passportId?: string;
  format: ExportFormat;
  channel?: MarketplaceChannel;
  action: ExportAction;
  status: 'pending' | 'completed' | 'failed';
  adapterId?: string;
  schemaVersion?: string;
  checksum?: string;
  errorCode?: string;
  errorMessage?: string;
  createdAt: string;
}

export interface ConsentRecord {
  id: string;
  ownerId: string;
  productId: string;
  passportId?: string;
  purpose: 'public_passport' | 'export' | 'channel_preparation';
  approvedFields: PassportPublicField[];
  consentGranted: boolean;
  snapshotVersion: number;
  actorUid: string;
  createdAt: string;
  revokedAt?: string;
}

export type AdapterCapability =
  | 'preview'
  | 'validate'
  | 'export'
  | 'redirect'
  | 'submit'
  | 'publish';

export interface AdapterValidationResult {
  valid: boolean;
  channel: MarketplaceChannel;
  errors: string[];
  warnings: string[];
  readyForExport: boolean;
}

export interface PreparedChannelPayload {
  channel: MarketplaceChannel;
  schemaVersion: string;
  payload: Record<string, unknown>;
  generatedAt: string;
}

export interface ExportArtifact {
  format: ExportFormat;
  fileName: string;
  mimeType: string;
  data: string | Blob;
}

export interface SubmissionResult {
  success: boolean;
  channel: MarketplaceChannel;
  status: 'not_configured' | 'unsupported_capability' | 'submitted' | 'failed';
  message: string;
  submissionId?: string;
}

export type ProductLifecycleStatus =
  | 'draft'
  | 'ready'
  | 'shared'
  | 'enquiry_received'
  | 'exported'
  | 'published'
  | 'archived';

export interface ProductStatusHistoryEntry {
  previousStatus: ProductLifecycleStatus;
  newStatus: ProductLifecycleStatus;
  timestamp: string;
  actorType: 'artisan' | 'buyer' | 'system' | 'coordinator';
  actorUid?: string;
  reason?: string;
  triggeringEnquiryId?: string;
}

export type EnquiryWorkflowStatus =
  | 'new'
  | 'acknowledged'
  | 'contacted'
  | 'closed'
  | 'spam'
  | 'viewed'
  | 'replied'
  | 'order_confirmed'
  | 'pending_sync';

export type PreferredContactMethod = 'whatsapp' | 'phone' | 'email';

export interface EnquiryReply {
  id: string;
  sender: 'artisan' | 'buyer';
  text: string;
  timestamp: string;
  priceQuote?: number;
}

export interface BuyerEnquiry {
  id: string;
  passportId?: string;
  publicSlug?: string;
  productId: string;
  productTitle: string;
  productImage?: string;
  artisanId: string;
  buyerName: string;
  buyerAvatar?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  buyerLocation?: string;
  buyerContact: string;
  buyerOrganisation?: string;
  destinationCity?: string;
  quantityRequested: number;
  targetPrice?: number;
  message: string;
  initialMessage?: string;
  preferredContactMethod: PreferredContactMethod;
  consentToBeContacted: boolean;
  status: EnquiryWorkflowStatus;
  statusHistory?: Array<{
    status: EnquiryWorkflowStatus;
    changedAt: string;
    changedBy: string;
    note?: string;
  }>;
  receivedAt: string;
  createdAt: string;
  updatedAt?: string;
  replies: EnquiryReply[];
  source?: 'craft_passport' | 'product_page' | 'direct';
  schemaVersion: number;
  abuseMetadata?: {
    sourceHash: string;
    formDurationMs: number;
    userAgent?: string;
  };
}

export interface EnquirySubmissionPayload {
  publicSlug: string;
  buyerName: string;
  buyerContact: string;
  buyerPhone?: string;
  buyerEmail?: string;
  buyerOrganisation?: string;
  quantityRequested?: number;
  targetPrice?: number;
  destinationCity?: string;
  message: string;
  preferredContactMethod?: PreferredContactMethod;
  consentToBeContacted: boolean;
  honeypot?: string;
  formStartedAt?: number;
  idempotencyKey?: string;
}

export interface EnquirySubmissionResult {
  success: boolean;
  enquiryId?: string;
  receivedAt?: string;
  acceptedAt?: string;
  status?: 'new';
  message?: string;
  errorCode?:
    | 'REVOKED_PASSPORT'
    | 'NOT_FOUND'
    | 'RATE_LIMITED'
    | 'DUPLICATE'
    | 'INVALID_INPUT'
    | 'BOT_DETECTED'
    | 'UNAVAILABLE'
    | 'INVALID_PASSPORT_STATE'
    | 'INCONSISTENT_RECORD'
    | 'PRODUCT_ARCHIVED'
    | 'FORBIDDEN_FIELD'
    | 'CONSENT_REQUIRED'
    | 'INVALID_SLUG'
    | 'SERVER_ERROR';
}

export interface CoordinatorPermissions {
  viewStatus: boolean;
  viewEnquirySummary: boolean;
  assistExports: boolean;
}

export interface CoordinatorAssignment {
  id: string;
  coordinatorUid: string;
  artisanUid: string;
  artisanName?: string;
  clusterName?: string;
  active: boolean;
  approvedAt: string;
  approvedBy: string;
  expiresAt?: string;
  permissions: CoordinatorPermissions;
  createdAt: string;
  updatedAt: string;
}

export interface CoordinatorExportProblem {
  productId: string;
  productTitle: string;
  format: ExportFormat;
  channel?: MarketplaceChannel;
  errorMessage: string;
  errorCode?: string;
  createdAt: string;
}

export interface CoordinatorArtisanProjection {
  artisanUid: string;
  artisanDisplayName: string;
  clusterName?: string;
  state?: string;
  productCounts: {
    draft: number;
    ready: number;
    shared: number;
    enquiry_received: number;
    archived: number;
    total: number;
  };
  newEnquiryCount: number;
  exportProblemsCount: number;
  exportProblems?: CoordinatorExportProblem[];
  lastActivityAt: string;
  active: boolean;
  permissions: CoordinatorPermissions;
}

export interface CoordinatorTask {
  id: string;
  artisanName: string;
  artisanPhone: string;
  craftCluster: string;
  taskType: 'registration' | 'passport_approval' | 'photo_assistance' | 'export_help';
  status: 'pending' | 'in_progress' | 'completed';
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
}

// ---- Phase 14: Voice & Multilingual Auto-Catalogue Types ----

export type VoiceSupportedLanguage = 'en' | 'hi' | 'or' | 'bn';

export interface VoiceTranscriptSegment {
  id: number | string;
  text: string;
  start: number;
  end: number;
  confidence?: number;
  is_low_confidence?: boolean;
}

export interface VoiceTranscriptionResult {
  session_id?: string;
  status: string;
  detected_language: string;
  confidence: number;
  original_text: string;
  corrected_text: string;
  segments: VoiceTranscriptSegment[];
}

export interface StructuredFactDetail {
  value: string | number | null;
  confidence?: number | null;
  confidence_method?: string | null;
  status?: 'generated' | 'unknown' | 'low_confidence';
  source?: 'transcript' | 'clarification' | 'manual' | 'generated_copy';
  evidence?: string | null;
  unit?: string | null;
  last_updated_at?: string;
}

export interface StructuredProductFacts {
  product_name?: StructuredFactDetail;
  product_type?: StructuredFactDetail;
  category?: StructuredFactDetail;
  materials?: StructuredFactDetail;
  craft_technique?: StructuredFactDetail;
  colors?: StructuredFactDetail;
  dimensions?: StructuredFactDetail;
  weight?: StructuredFactDetail;
  quantity_available?: StructuredFactDetail;
  production_time?: StructuredFactDetail;
  customization_availability?: StructuredFactDetail;
  care_instructions?: StructuredFactDetail;
  place_of_origin?: StructuredFactDetail;
  price?: StructuredFactDetail;
  artisan_story?: StructuredFactDetail;
}

export interface ClarificationQuestion {
  field: string;
  question: string;
  question_hi?: string;
  reason?: string;
}

export interface CatalogueGenerationResult {
  session_id?: string;
  status: string;
  draft: {
    title_en?: string;
    title_hi?: string;
    title_bn?: string;
    title_or?: string;
    target_language_title?: string;
    description_en?: string;
    description_hi?: string;
    description_bn?: string;
    description_or?: string;
    target_language_description?: string;
    tags_en?: string;
    tags_hi?: string;
    tags_bn?: string;
    tags_or?: string;
    target_language_tags?: string;
  };
  structured_fields: StructuredProductFacts;
  clarification_questions?: ClarificationQuestion[];
  unknown_fields?: string[];
}

