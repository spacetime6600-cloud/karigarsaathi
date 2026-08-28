import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSessionStore, type Clarification } from '@/stores/sessionStore';
import { useDraft, useUpdateDraft, useRegenerateCatalogue, useApproveCatalogue } from '@/hooks/useApi';
import { Button, Card, CardHeader, Input, Alert, Badge, Tabs, Progress } from '@/components';
import { getFieldStatusColor, getFieldStatusLabel } from '@/utils/helpers';
import { useForm } from 'react-hook-form';

const BILINGUAL_FIELDS = [
  { key: 'title', labelKey: 'catalogueReview.fields.title', hindi: 'title_hi', english: 'title_en' },
  { key: 'description', labelKey: 'catalogueReview.fields.description', hindi: 'description_hi', english: 'description_en' },
  { key: 'tags', labelKey: 'catalogueReview.fields.tags', hindi: 'tags_hi', english: 'tags_en' },
] as const;

const STRUCTURED_FIELDS = [
  { key: 'product_name', labelKey: 'catalogueReview.fields.productName' },
  { key: 'product_type', labelKey: 'catalogueReview.fields.productType' },
  { key: 'category', labelKey: 'catalogueReview.fields.category' },
  { key: 'materials', labelKey: 'catalogueReview.fields.materials' },
  { key: 'craft_technique', labelKey: 'catalogueReview.fields.craftTechnique' },
  { key: 'colors', labelKey: 'catalogueReview.fields.colors' },
  { key: 'dimensions', labelKey: 'catalogueReview.fields.dimensions' },
  { key: 'weight', labelKey: 'catalogueReview.fields.weight' },
  { key: 'quantity_available', labelKey: 'catalogueReview.fields.quantityAvailable' },
  { key: 'production_time', labelKey: 'catalogueReview.fields.productionTime' },
  { key: 'customization_availability', labelKey: 'catalogueReview.fields.customizationAvailability' },
  { key: 'care_instructions', labelKey: 'catalogueReview.fields.careInstructions' },
  { key: 'place_of_origin', labelKey: 'catalogueReview.fields.placeOfOrigin' },
  { key: 'price', labelKey: 'catalogueReview.fields.price' },
  { key: 'artisan_story', labelKey: 'catalogueReview.fields.artisanStory' },
] as const;

export function CatalogueReviewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { sessionId, clarifications } = useSessionStore();
  const { data: draft, isLoading: draftLoading } = useDraft(sessionId || null);
  const updateDraft = useUpdateDraft();
  const regenerateCatalogue = useRegenerateCatalogue();
  const approveCatalogue = useApproveCatalogue();

  const [activeTab, setActiveTab] = useState<'hindi' | 'english'>('hindi');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalConfirmed, setApprovalConfirmed] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<Record<string, string>>({
    defaultValues: {
      title_hi: '',
      title_en: '',
      description_hi: '',
      description_en: '',
      tags_hi: '',
      tags_en: '',
    },
  });

  useEffect(() => {
    if (draft) {
      register('title_hi');
      register('title_en');
      register('description_hi');
      register('description_en');
      register('tags_hi');
      register('tags_en');

      setValue('title_hi', draft.title_hi || '', { shouldValidate: true });
      setValue('title_en', draft.title_en || '', { shouldValidate: true });
      setValue('description_hi', draft.description_hi || '', { shouldValidate: true });
      setValue('description_en', draft.description_en || '', { shouldValidate: true });
      setValue('tags_hi', draft.tags_hi || '', { shouldValidate: true });
      setValue('tags_en', draft.tags_en || '', { shouldValidate: true });
    }
  }, [draft, register, setValue]);

  const handleSave = async (data: Record<string, string>) => {
    if (!sessionId) return;
    try {
      await updateDraft.mutateAsync({ sessionId, data });
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  };

  const handleRegenerate = async () => {
    if (!sessionId) return;
    try {
      await regenerateCatalogue.mutateAsync(sessionId);
    } catch (error) {
      console.error('Failed to regenerate:', error);
    }
  };

  const handleApprove = async () => {
    if (!sessionId) return;
    try {
      await approveCatalogue.mutateAsync({ sessionId, data: { approving_user_id: 'dev-user' } });
      navigate('/approval');
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  const checkWarnings = useCallback(() => {
    const newWarnings: string[] = [];
    if (isDirty) newWarnings.push('unsaved_changes');
    if (draft?.status === 'generating') newWarnings.push('generating');
    if (draft?.structured_fields) {
      Object.entries(draft.structured_fields).forEach(([key, value]) => {
        const fieldValue = value as { status?: string; confidence?: number | null };
        if (fieldValue?.status === 'unknown') {
          newWarnings.push(`field_unknown_${key}`);
        }
        if (fieldValue?.status === 'low_confidence') {
          newWarnings.push(`field_low_confidence_${key}`);
        }
      });
    }
    // Check for unresolved required clarifications
    const unresolvedRequired = clarifications?.some(
      (c: Clarification) => c.required && c.status !== 'answered'
    );
    if (unresolvedRequired) {
      newWarnings.push('unresolved_required_clarifications');
    }
    setWarnings(newWarnings);
  }, [draft, isDirty, clarifications]);

  useEffect(() => {
    checkWarnings();
  }, [checkWarnings]);

  const tabsConfig = [
    { id: 'hindi', label: t('catalogueReview.hindi'), icon: <span className="text-xs">हि</span> },
    { id: 'english', label: t('catalogueReview.english'), icon: <span className="text-xs">EN</span> },
  ];

  const canApprove = !isDirty &&
    draft?.status !== 'generating' &&
    !regenerateCatalogue.isPending &&
    !approveCatalogue.isPending &&
    !clarifications?.some((c: Clarification) => c.required && c.status !== 'answered');

  if (draftLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-8">
          <CardHeader
            title={t('catalogueReview.title')}
            subtitle={t('catalogueReview.subtitle')}
          />
        </Card>

        <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
          <Tabs
            tabs={tabsConfig}
            activeTab={activeTab}
            onChange={(tabId: string) => setActiveTab(tabId as 'hindi' | 'english')}
            variant="pills"
          />

          {BILINGUAL_FIELDS.map((field) => {
            const hindiValue = watch(field.hindi);
            const englishValue = watch(field.english);
            const hindiError = errors[field.hindi];
            const englishError = errors[field.english];

            return (
              <Card key={field.key} className="border-l-4 border-primary-500">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">{t(field.labelKey)}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeTab === 'hindi' && (
                    <Input
                      label={t('catalogueReview.hindi')}
                      {...register(field.hindi)}
                      value={hindiValue}
                      onChange={(e) => setValue(field.hindi, e.target.value)}
                      error={hindiError?.message}
                    />
                  )}
                  {activeTab === 'english' && (
                    <Input
                      label={t('catalogueReview.english')}
                      {...register(field.english)}
                      value={englishValue}
                      onChange={(e) => setValue(field.english, e.target.value)}
                      error={englishError?.message}
                    />
                  )}
                </div>
              </Card>
            );
          })}

          <Card>
            <h3 className="font-medium text-gray-900 mb-4">{t('catalogueReview.fields.structuredFields')}</h3>
            <div className="space-y-4">
              {STRUCTURED_FIELDS.map((field) => {
                const fieldData = draft?.structured_fields?.[field.key];
                const status = fieldData?.status || 'unknown';
                const confidence = fieldData?.confidence ?? 0;
                const value = fieldData?.value;
                const source = fieldData?.source;
                const evidence = fieldData?.evidence;

                return (
                  <div key={field.key} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <label className="font-medium text-gray-900">{t(field.labelKey)}</label>
                          <Badge variant={(getFieldStatusColor(status).includes('green') ? 'success' : getFieldStatusColor(status).includes('yellow') ? 'warning' : getFieldStatusColor(status).includes('red') ? 'error' : getFieldStatusColor(status).includes('blue') ? 'info' : 'gray')}>
                            {getFieldStatusLabel(status, t)}
                          </Badge>
                          {confidence !== null && (
                            <Progress
                              value={confidence * 100}
                              size="sm"
                              variant={confidence < 0.6 ? 'warning' : 'default'}
                              className="w-24"
                            />
                          )}
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="font-mono text-gray-700">{value || t('catalogueReview.status.unknown')}</p>
                          <p className="text-gray-500">
                            {t('catalogueReview.source')}: {source} • {t('catalogueReview.confidence')}: {confidence !== null ? Math.round(confidence * 100) + '%' : 'N/A'}
                          </p>
                          {evidence && (
                            <p className="text-gray-400">{t('catalogueReview.evidence')}: {evidence}</p>
                          )}
                        </div>
                      </div>
                      <Input
                        label={activeTab === 'hindi' ? t('catalogueReview.hindi') : t('catalogueReview.english')}
                        {...register(field.key)}
                        placeholder={t('common.optional')}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {warnings.length > 0 && (
            <Alert variant="warning">
              <h4 className="font-medium mb-2">{t('approval.warnings')}</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {warnings.map((warning) => (
                  <li key={warning}>
                    {warning === 'unsaved_changes' && t('catalogueReview.warnings.unsaved')}
                    {warning === 'generating' && t('catalogueReview.warnings.generating')}
                    {warning.startsWith('field_unknown_') && t('catalogueReview.warnings.fieldUnknown', { field: warning.replace('field_unknown_', '') })}
                    {warning.startsWith('field_low_confidence_') && t('catalogueReview.warnings.fieldLowConfidence', { field: warning.replace('field_low_confidence_', '') })}
                    {warning === 'unresolved_required_clarifications' && t('catalogueReview.warnings.unresolvedClarifications')}
                  </li>
                ))}
              </ul>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleRegenerate}
              disabled={regenerateCatalogue.isPending}
            >
              {regenerateCatalogue.isPending ? t('common.loading') : t('catalogueReview.regenerate')}
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => { setApprovalConfirmed(false); setShowApprovalModal(true); }}
              disabled={!canApprove || approveCatalogue.isPending}
            >
              {t('catalogueReview.approve')}
            </Button>
          </div>

          {updateDraft.isError && (
            <Alert variant="error">{t('errors.generic')}</Alert>
          )}
          {regenerateCatalogue.isError && (
            <Alert variant="error">{t('errors.processingFailed')}</Alert>
          )}
        </form>

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="approval-modal-title"
          className={showApprovalModal ? 'fixed inset-0 z-50 overflow-y-auto' : 'hidden'}
        >
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowApprovalModal(false)} />
            <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl">
              <div className="flex items-start justify-between p-4 border-b border-gray-100">
                <h2 id="approval-modal-title" className="text-lg font-semibold text-gray-900">
                  {t('approval.title')}
                </h2>
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close modal"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4 space-y-4">
                <p>{t('approval.subtitle')}</p>
                {warnings.length > 0 && (
                  <Alert variant="warning">
                    <h4 className="font-medium mb-2">{t('approval.warnings')}</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </Alert>
                )}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    required
                    checked={approvalConfirmed}
                    onChange={(e) => setApprovalConfirmed(e.target.checked)}
                  />
                  <span className="text-gray-700 text-sm">{t('approval.confirm')}</span>
                </label>
                <div className="flex gap-3 justify-end pt-4">
                  <Button variant="ghost" onClick={() => setShowApprovalModal(false)}>
                    {t('approval.cancel')}
                  </Button>
                  <Button 
                    variant="danger" 
                    onClick={handleApprove} 
                    disabled={approveCatalogue.isPending || !approvalConfirmed}
                  >
                    {approveCatalogue.isPending ? t('common.loading') : t('approval.approve')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}