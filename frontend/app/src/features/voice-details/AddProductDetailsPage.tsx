import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductDraft } from '@/app/providers/ProductDraftProvider';
import { useLanguage } from '@/app/providers/LanguageProvider';
import {
  catalogueSuggestionService,
  normalizeTags,
} from '@/services/suggestions/mockSuggestionService';
import { productRepository } from '@/services/api/productRepository';
import { VoiceRecorder } from '@/components/ui/VoiceRecorder';
import { VoiceCatalogueStudioModal } from '@/features/voice-details/components/VoiceCatalogueStudioModal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowRight,
  Sparkles,
  MicOff,
  X,
  Mic,
} from 'lucide-react';

export const AddProductDetailsPage: React.FC = () => {
  const { draft, updateDraft } = useProductDraft();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [isMicDeniedModalOpen, setIsMicDeniedModalOpen] = useState(false);
  const [isVoiceStudioOpen, setIsVoiceStudioOpen] = useState(false);
  const [extractedNotice, setExtractedNotice] = useState(false);

  // Tag input state
  const [tagInput, setTagInput] = useState('');

  // Suggestion states
  const [suggestedTitle, setSuggestedTitle] = useState<string | null>(null);
  const [suggestedDescription, setSuggestedDescription] = useState<string | null>(null);
  const [suggestedTags, setSuggestedTags] = useState<string[] | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [overwriteModal, setOverwriteModal] = useState<{
    isOpen: boolean;
    field: 'title' | 'description';
    newValue: string;
  }>({ isOpen: false, field: 'title', newValue: '' });

  const handleTranscriptReady = (transcript: string, confidence: number) => {
    const { confirmed, needsReview } = productRepository.extractFactsFromInput(transcript);
    updateDraft({
      voiceTranscript: transcript,
      voiceConfidence: confidence,
      confirmedFacts: confirmed,
      needsReviewFacts: needsReview,
      title: draft.title || 'Handloom Jamdani Silk Item',
    });
    setExtractedNotice(true);
  };

  const handleApplyVoiceStudioSuggestions = (payload: {
    title: string;
    description: string;
    tags: string[];
    materials: string[];
    technique?: string;
    category?: string;
    dimensions?: string;
    titleHindi?: string;
    descriptionHindi?: string;
    transcript?: string;
    confidence?: number;
  }) => {
    const { confirmed, needsReview } = productRepository.extractFactsFromInput(
      payload.transcript || `${payload.title} ${payload.description}`
    );

    updateDraft({
      title: payload.title,
      description: payload.description,
      story: payload.description,
      tags: normalizeTags([...(draft.tags || []), ...payload.tags]),
      materials: payload.materials.length > 0 ? payload.materials : draft.materials,
      technique: payload.technique || draft.technique,
      category: payload.category || draft.category,
      dimensions: payload.dimensions || draft.dimensions,
      titleHindi: payload.titleHindi || draft.titleHindi,
      descriptionHindi: payload.descriptionHindi || draft.descriptionHindi,
      voiceTranscript: payload.transcript || draft.voiceTranscript,
      voiceConfidence: payload.confidence || draft.voiceConfidence || 0.95,
      confirmedFacts: confirmed,
      needsReviewFacts: needsReview,
    });

    setExtractedNotice(true);
  };

  // Mock Suggestions
  const handleGenerateTitleSuggestion = async () => {
    setIsSuggesting(true);
    const res = await catalogueSuggestionService.suggestTitle({
      category: draft.category,
      subcategory: draft.subcategory,
      craftType: draft.technique || draft.craftType,
      material: draft.materials.join(', '),
      colour: draft.colour,
      origin: draft.origin,
    });
    setSuggestedTitle(res.data);
    setIsSuggesting(false);
  };

  const handleApplyTitleSuggestion = () => {
    if (!suggestedTitle) return;
    if (draft.title && draft.title.trim() && draft.title !== suggestedTitle) {
      setOverwriteModal({ isOpen: true, field: 'title', newValue: suggestedTitle });
    } else {
      updateDraft({ title: suggestedTitle });
      setSuggestedTitle(null);
    }
  };

  const handleGenerateDescriptionSuggestion = async () => {
    setIsSuggesting(true);
    const res = await catalogueSuggestionService.suggestDescription({
      category: draft.category,
      subcategory: draft.subcategory,
      craftType: draft.technique || draft.craftType,
      material: draft.materials.join(', '),
      origin: draft.origin,
      dimensions: draft.dimensions,
      makingTime: draft.makingTime,
    });
    setSuggestedDescription(res.data);
    setIsSuggesting(false);
  };

  const handleApplyDescriptionSuggestion = () => {
    if (!suggestedDescription) return;
    if (draft.story && draft.story.trim() && draft.story !== suggestedDescription) {
      setOverwriteModal({ isOpen: true, field: 'description', newValue: suggestedDescription });
    } else {
      updateDraft({ story: suggestedDescription, description: suggestedDescription });
      setSuggestedDescription(null);
    }
  };

  const handleGenerateTagsSuggestion = async () => {
    setIsSuggesting(true);
    const res = await catalogueSuggestionService.suggestTags({
      category: draft.category,
      subcategory: draft.subcategory,
      craftType: draft.technique || draft.craftType,
      material: draft.materials.join(', '),
      colour: draft.colour,
      origin: draft.origin,
    });
    setSuggestedTags(res.data);
    setIsSuggesting(false);
  };

  const handleApplySuggestedTags = () => {
    if (!suggestedTags) return;
    const combined = normalizeTags([...(draft.tags || []), ...suggestedTags]);
    updateDraft({ tags: combined });
    setSuggestedTags(null);
  };

  const handleAddTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    if (!tagInput.trim()) return;

    const normalized = normalizeTags([...(draft.tags || []), tagInput]);
    updateDraft({ tags: normalized });
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updated = (draft.tags || []).filter((t) => t !== tagToRemove);
    updateDraft({ tags: updated });
  };

  const handleContinue = () => {
    navigate('/artisan/products/new/review');
  };

  const activePhoto = draft.photos[draft.coverPhotoIndex] || draft.photos[0];

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Step Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-primary tracking-tight">
            {t('productCreation.step2Title')}
          </h1>
          <p className="text-sm sm:text-base text-on-surface-variant">
            Complete the product facts, heritage narrative, dimensions, and specifications.
          </p>
        </div>

        {/* Prominent Voice Studio Trigger Button */}
        <Button
          variant="secondary"
          size="md"
          onClick={() => setIsVoiceStudioOpen(true)}
          leftIcon={<Mic className="w-4 h-4 text-primary" />}
          className="shrink-0 shadow-sm"
        >
          AI Voice & Multi-Catalogue Studio
        </Button>
      </div>

      {/* Two-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Fields & Suggestions (65% / 8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {/* Main Info Card */}
          <Card className="p-5 sm:p-6 bg-white rounded-2xl border border-surface-variant/80 card-shadow flex flex-col gap-4">
            <h2 className="font-bold text-base text-primary border-b border-surface-variant/70 pb-2.5">
              1. Title & Heritage Narrative
            </h2>

            <div className="flex flex-col gap-3.5">
              {/* Product Title (English) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-primary">
                    Product Title (English) <span className="text-error">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateTitleSuggestion}
                    disabled={isSuggesting}
                    className="text-[11px] text-secondary font-bold hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Suggest Title
                  </button>
                </div>
                <Input
                  value={draft.title}
                  onChange={(e) => updateDraft({ title: e.target.value })}
                  placeholder="e.g. Indigo & Terracotta Silk Jamdani Saree"
                  required
                  className="h-11 text-sm bg-surface-container-lowest"
                />
              </div>

              {/* Title Suggestion Box */}
              {suggestedTitle && (
                <div className="p-3 bg-secondary/5 rounded-xl border border-secondary/20 flex flex-col gap-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-[11px] font-bold text-secondary">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Mock suggestion (Offline Rule-Based)
                    </span>
                    <Badge variant="indigo">Optional</Badge>
                  </div>
                  <p className="text-xs font-semibold text-primary">"{suggestedTitle}"</p>
                  <div className="flex items-center gap-2 pt-1">
                    <Button size="sm" variant="secondary" onClick={handleApplyTitleSuggestion} className="text-xs py-1">
                      Apply Suggestion
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setSuggestedTitle(null)} className="text-xs py-1">
                      Dismiss
                    </Button>
                  </div>
                </div>
              )}

              {/* Product Title (Hindi) */}
              <div>
                <label className="text-xs font-bold text-primary block mb-1">
                  Product Title (हिंदी - Hindi)
                </label>
                <Input
                  value={draft.titleHindi || ''}
                  onChange={(e) => updateDraft({ titleHindi: e.target.value })}
                  placeholder="उदा. इंडिगो और टेराकोटा रेशम जामदानी साड़ी"
                  className="h-11 text-sm bg-surface-container-lowest"
                />
              </div>

              {/* Heritage Story & Craft Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-primary">
                    Heritage Story & Craft Description <span className="text-error">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateDescriptionSuggestion}
                    disabled={isSuggesting}
                    className="text-[11px] text-secondary font-bold hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Suggest Description
                  </button>
                </div>
                <TextArea
                  value={draft.story || draft.description || ''}
                  onChange={(e) => updateDraft({ story: e.target.value, description: e.target.value })}
                  rows={3}
                  placeholder="Describe the cultural heritage, days spent on the loom, or regional significance..."
                  className="min-h-[100px] text-sm bg-surface-container-lowest"
                />
              </div>

              {/* Description Suggestion Box */}
              {suggestedDescription && (
                <div className="p-3 bg-secondary/5 rounded-xl border border-secondary/20 flex flex-col gap-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-[11px] font-bold text-secondary">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Mock suggestion (Offline Rule-Based)
                    </span>
                    <Badge variant="indigo">Optional</Badge>
                  </div>
                  <p className="text-xs text-primary leading-relaxed">"{suggestedDescription}"</p>
                  <div className="flex items-center gap-2 pt-1">
                    <Button size="sm" variant="secondary" onClick={handleApplyDescriptionSuggestion} className="text-xs py-1">
                      Apply Suggestion
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setSuggestedDescription(null)} className="text-xs py-1">
                      Dismiss
                    </Button>
                  </div>
                </div>
              )}

              {/* Description (Hindi) */}
              <div>
                <label className="text-xs font-bold text-primary block mb-1">
                  Craft Story (हिंदी - Hindi)
                </label>
                <TextArea
                  value={draft.descriptionHindi || ''}
                  onChange={(e) => updateDraft({ descriptionHindi: e.target.value })}
                  rows={2}
                  placeholder="शिल्प की प्रामाणिकता और क्षेत्रीय महत्व का विवरण..."
                  className="min-h-[75px] text-sm bg-surface-container-lowest"
                />
              </div>
            </div>
          </Card>

          {/* Classification & Specifications Card */}
          <Card className="p-5 sm:p-6 bg-white rounded-2xl border border-surface-variant/80 card-shadow flex flex-col gap-4">
            <h2 className="font-bold text-base text-primary border-b border-surface-variant/70 pb-2.5">
              2. Classification & Physical Specifications
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Category *"
                value={draft.category}
                onChange={(e) => updateDraft({ category: e.target.value })}
                placeholder="e.g. Sarees & Textiles"
                required
                className="h-11 text-sm bg-surface-container-lowest"
              />
              <Input
                label="Sub-Category"
                value={draft.subcategory}
                onChange={(e) => updateDraft({ subcategory: e.target.value })}
                placeholder="e.g. Jamdani Saree"
                className="h-11 text-sm bg-surface-container-lowest"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Craft Technique *"
                value={draft.technique || draft.craftType || ''}
                onChange={(e) => updateDraft({ technique: e.target.value, craftType: e.target.value })}
                placeholder="e.g. Handloom Jamdani Weave"
                required
                className="h-11 text-sm bg-surface-container-lowest"
              />
              <Input
                label="Materials Used *"
                value={draft.materials.join(', ')}
                onChange={(e) =>
                  updateDraft({
                    materials: e.target.value
                      .split(',')
                      .map((m) => m.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="e.g. Pure Mulberry Silk, Natural Zari"
                required
                className="h-11 text-sm bg-surface-container-lowest"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <Input
                label="Base Colour *"
                value={draft.colour}
                onChange={(e) => updateDraft({ colour: e.target.value })}
                placeholder="e.g. Terracotta Red"
                required
                className="h-11 text-sm bg-surface-container-lowest"
              />
              <Input
                label="Dimensions / Size *"
                value={draft.dimensions}
                onChange={(e) => updateDraft({ dimensions: e.target.value })}
                placeholder="e.g. 5.5 x 1.2 meters"
                className="h-11 text-sm bg-surface-container-lowest"
              />
              <Input
                label="Origin / Region *"
                value={draft.origin}
                onChange={(e) => updateDraft({ origin: e.target.value })}
                placeholder="e.g. Assam & Pochampally, India"
                className="h-11 text-sm bg-surface-container-lowest"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <Input
                label="Making Time"
                value={draft.makingTime || ''}
                onChange={(e) => updateDraft({ makingTime: e.target.value })}
                placeholder="e.g. 18 Days"
                className="h-11 text-sm bg-surface-container-lowest"
              />
              <Input
                label="Stock Quantity *"
                type="number"
                min="0"
                value={draft.stockQuantity !== undefined ? String(draft.stockQuantity) : '1'}
                onChange={(e) => updateDraft({ stockQuantity: parseInt(e.target.value, 10) || 0 })}
                className="h-11 text-sm bg-surface-container-lowest"
              />
              <Input
                label="SKU Code"
                value={draft.sku || ''}
                onChange={(e) => updateDraft({ sku: e.target.value })}
                placeholder="e.g. JAM-001"
                className="h-11 text-sm bg-surface-container-lowest"
              />
            </div>
          </Card>

          {/* Tags & Additional Details Card */}
          <Card className="p-5 sm:p-6 bg-white rounded-2xl border border-surface-variant/80 card-shadow flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-surface-variant/70 pb-2.5">
              <h2 className="font-bold text-base text-primary">
                3. Search Tags & Care Information
              </h2>
              <button
                type="button"
                onClick={handleGenerateTagsSuggestion}
                disabled={isSuggesting}
                className="text-[11px] text-secondary font-bold hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" /> Suggest Tags
              </button>
            </div>

            {/* Tag suggestions */}
            {suggestedTags && (
              <div className="p-3 bg-secondary/5 rounded-xl border border-secondary/20 flex flex-col gap-2 animate-in fade-in">
                <div className="flex items-center justify-between text-[11px] font-bold text-secondary">
                  <span>Suggested Search Tags:</span>
                  <Badge variant="indigo">Optional</Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedTags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-xs font-semibold">
                      +{tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Button size="sm" variant="secondary" onClick={handleApplySuggestedTags} className="text-xs py-1">
                    Apply All Tags
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSuggestedTags(null)} className="text-xs py-1">
                    Dismiss
                  </Button>
                </div>
              </div>
            )}

            {/* Tag Chips & Input */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-primary">Keywords & Craft Tags</label>
              <div className="flex flex-wrap gap-1.5 p-2 bg-surface-container-lowest border border-surface-variant rounded-xl min-h-[44px]">
                {(draft.tags || []).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container text-primary text-xs font-semibold"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-on-surface-variant hover:text-error transition-colors"
                      aria-label={`Remove tag ${tag}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Type tag and press Enter..."
                  className="flex-1 min-w-[120px] bg-transparent text-xs text-primary focus:outline-none p-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Care Instructions"
                value={draft.careInstructions || ''}
                onChange={(e) => updateDraft({ careInstructions: e.target.value })}
                placeholder="e.g. Dry clean only. Wrap in muslin."
                className="h-11 text-sm bg-surface-container-lowest"
              />
              <Input
                label="Shipping Notes"
                value={draft.shippingNotes || ''}
                onChange={(e) => updateDraft({ shippingNotes: e.target.value })}
                placeholder="e.g. Dispatched in 3 days."
                className="h-11 text-sm bg-surface-container-lowest"
              />
            </div>

            {/* Customisation Toggle */}
            <label className="flex items-center gap-3 p-3 bg-surface-container-low/70 rounded-xl cursor-pointer select-none">
              <input
                type="checkbox"
                checked={Boolean(draft.customisationAvailable)}
                onChange={(e) => updateDraft({ customisationAvailable: e.target.checked })}
                className="w-4 h-4 text-secondary rounded accent-secondary focus:ring-secondary"
              />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-primary">Made to Order / Customisation Available</span>
                <span className="text-[11px] text-on-surface-variant">Buyers can request custom size, colour or motifs.</span>
              </div>
            </label>
          </Card>
        </div>

        {/* Right Column: Voice Assistant & Photo Summary (35% / 4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Photo Summary Thumbnail */}
          {activePhoto && (
            <Card className="p-4 bg-white rounded-2xl border border-surface-variant/80 card-shadow flex items-center gap-3">
              <img
                src={activePhoto.url}
                alt="Product preview"
                className="w-14 h-14 rounded-lg object-cover border border-surface-variant shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Attached Photographs
                </span>
                <span className="text-xs font-bold text-primary truncate">
                  {draft.title || 'Untitled Product'}
                </span>
                <span className="text-[11px] text-secondary font-medium mt-0.5">
                  {draft.photos.length} {draft.photos.length === 1 ? 'photo' : 'photos'} uploaded
                </span>
              </div>
            </Card>
          )}

          {/* Voice Input Assistant Card */}
          <Card className="p-5 bg-white rounded-2xl border border-surface-variant/80 card-shadow flex flex-col gap-3.5">
            <div className="flex items-center justify-between border-b border-surface-variant/70 pb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-secondary" />
                <h3 className="font-bold text-sm text-primary">
                  Voice Assistant (AI Auto-Catalogue)
                </h3>
              </div>
              <Badge variant="indigo">Phase 14</Badge>
            </div>
            <p className="text-xs text-on-surface-variant">
              Describe your craft by speaking in Hindi, Bengali, Odia, or English. Faster Whisper AI will transcribe your voice and extract fact-grounded catalogue specifications.
            </p>

            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsVoiceStudioOpen(true)}
              leftIcon={<Mic className="w-4 h-4 text-primary" />}
              className="w-full font-bold shadow-sm"
            >
              Open AI Voice Studio
            </Button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-surface-variant/60"></div>
              <span className="flex-shrink mx-2 text-[10px] uppercase font-bold text-on-surface-variant/60">or quick microphone</span>
              <div className="flex-grow border-t border-surface-variant/60"></div>
            </div>

            <VoiceRecorder
              onTranscriptReady={handleTranscriptReady}
              onPermissionDenied={() => setIsMicDeniedModalOpen(true)}
              onOpenStudio={() => setIsVoiceStudioOpen(true)}
              isSimulatingDenied={localStorage.getItem('simulate_mic_denied') === 'true'}
            />

            {draft.voiceTranscript && (
              <div className="p-3 bg-surface-container-low rounded-xl flex flex-col gap-1 text-xs border border-surface-variant/70 animate-in fade-in">
                <div className="flex items-center justify-between text-secondary font-bold">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Transcript
                  </span>
                  <span className="font-mono text-[10px]">
                    {Math.round((draft.voiceConfidence || 0.94) * 100)}% Match
                  </span>
                </div>
                <p className="text-on-surface italic">"{draft.voiceTranscript}"</p>
              </div>
            )}

            {extractedNotice && (
              <div className="p-3 bg-success-container rounded-xl text-on-success-container text-xs flex items-center gap-2 border border-green-300">
                <Sparkles className="w-4 h-4 text-success shrink-0" />
                <span>Craft details extracted! Fields have been auto-populated.</span>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Page Actions Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-surface-variant/70">
        <Button variant="ghost" onClick={() => navigate('/artisan/products/new/photos')} className="text-xs">
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

      {/* Phase 14 AI Voice & Multilingual Auto-Catalogue Studio Modal */}
      <VoiceCatalogueStudioModal
        isOpen={isVoiceStudioOpen}
        onClose={() => setIsVoiceStudioOpen(false)}
        onApplySuggestions={handleApplyVoiceStudioSuggestions}
        initialDraftTitle={draft.title}
        initialDraftDescription={draft.story || draft.description}
      />

      {/* Overwrite Confirmation Modal */}
      <Modal
        isOpen={overwriteModal.isOpen}
        onClose={() => setOverwriteModal({ isOpen: false, field: 'title', newValue: '' })}
        title="Replace Existing Text?"
      >
        <div className="flex flex-col gap-4">
          <p className="text-xs text-on-surface-variant leading-relaxed">
            You already have entered a {overwriteModal.field}. Applying this mock suggestion will replace your current text with:
          </p>
          <div className="p-3 bg-surface-container-low rounded-xl border border-surface-variant text-xs font-semibold text-primary">
            "{overwriteModal.newValue}"
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOverwriteModal({ isOpen: false, field: 'title', newValue: '' })}
              className="text-xs"
            >
              Keep Current Text
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (overwriteModal.field === 'title') {
                  updateDraft({ title: overwriteModal.newValue });
                  setSuggestedTitle(null);
                } else {
                  updateDraft({ story: overwriteModal.newValue, description: overwriteModal.newValue });
                  setSuggestedDescription(null);
                }
                setOverwriteModal({ isOpen: false, field: 'title', newValue: '' });
              }}
              className="text-xs font-bold"
            >
              Replace with Suggestion
            </Button>
          </div>
        </div>
      </Modal>

      {/* Microphone Fallback Modal */}
      <Modal
        isOpen={isMicDeniedModalOpen}
        onClose={() => setIsMicDeniedModalOpen(false)}
        title={t('voiceDetails.micDeniedTitle')}
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 p-3 bg-warning-container rounded-xl text-on-warning-container text-xs border border-amber-300">
            <MicOff className="w-5 h-5 shrink-0 text-secondary mt-0.5" />
            <p>{t('voiceDetails.micDeniedDesc')}</p>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              size="md"
              variant="secondary"
              onClick={() => {
                setIsMicDeniedModalOpen(false);
                setIsVoiceStudioOpen(true);
              }}
              leftIcon={<Mic className="w-4 h-4 text-primary" />}
              className="w-full text-xs font-bold"
            >
              Open Studio / Upload Audio File
            </Button>
            <Button
              size="md"
              variant="tertiary"
              onClick={() => setIsMicDeniedModalOpen(false)}
              className="w-full text-xs"
            >
              Continue with Manual Typing
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
