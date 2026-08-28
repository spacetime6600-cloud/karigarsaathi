import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '@/stores/sessionStore';
import { useSubmitConsent } from '@/hooks/useApi';
import { Button, Card, CardHeader, Input, Alert } from '@/components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { consentSchema, type ConsentInput } from '@/schemas';

const RETENTION_OPTIONS = [
  { value: 'immediate', labelKey: 'consent.retentionOptions.immediate' },
  { value: 'until_approval', labelKey: 'consent.retentionOptions.until_approval' },
  { value: 'configurable', labelKey: 'consent.retentionOptions.configurable' },
] as const;

export function ConsentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { sessionId, setConsentGranted, setRetentionChoice } = useSessionStore();
  const submitConsent = useSubmitConsent();

  const [configurableDays, setConfigurableDays] = useState(30);
  const [retentionSelected, setRetentionSelected] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ConsentInput>({
    resolver: zodResolver(consentSchema),
    defaultValues: {
      consent_granted: false,
      retention_choice: { choice: 'configurable', configurable_days: 30 },
      consent_policy_version: 'v1',
    },
  });

  const watchedConsentGranted = watch('consent_granted');
  const watchedRetentionChoice = watch('retention_choice.choice');
  const watchedConfigurableDays = watch('retention_choice.configurable_days');

  const handleConsentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const granted = e.target.checked;
    setValue('consent_granted', granted);
    setConsentGranted(granted);
  };

  const handleRetentionChange = (choice: 'immediate' | 'until_approval' | 'configurable') => {
    setValue('retention_choice.choice', choice);
    if (choice === 'configurable') {
      setValue('retention_choice.configurable_days', configurableDays || 30);
    } else {
      setValue('retention_choice.configurable_days', undefined);
    }
    setRetentionChoice(choice);
    setRetentionSelected(true);
  };

  const handleConfigurableDaysChange = (days: number) => {
    setConfigurableDays(days);
    setValue('retention_choice.configurable_days', days);
  };

  const onSubmit = async (data: ConsentInput) => {
    if (!sessionId) return;

    try {
      await submitConsent.mutateAsync({ sessionId, data: data as { consent_granted: boolean; retention_choice: { choice: 'immediate' | 'until_approval' | 'configurable'; configurable_days?: number }; consent_policy_version: string } });
      navigate('/recording');
    } catch (error) {
      console.error('Consent submission failed:', error);
    }
  };

  const canSubmit = watchedConsentGranted && retentionSelected;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card className="mb-8">
          <CardHeader
            title={t('consent.title')}
            subtitle={t('consent.description')}
          />
        </Card>

        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('consent_granted')}
                  onChange={(e) => handleConsentChange(e)}
                  className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  required
                />
                <span className="text-gray-700 text-sm">
                  {t('consent.grantConsent')}
                </span>
              </label>
              {errors.consent_granted && (
                <p className="mt-2 text-sm text-red-600" role="alert">
                  {t('consent.grantConsent')} {t('common.required')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('consent.retentionChoice')}
              </label>
              <div className="space-y-3">
                {RETENTION_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      watchedRetentionChoice === option.value
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="retention_choice"
                      value={option.value}
                      checked={watchedRetentionChoice === option.value}
                      onChange={() => handleRetentionChange(option.value as 'immediate' | 'until_approval' | 'configurable')}
                      className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="text-gray-700">{t(option.labelKey)}</span>
                  </label>
                ))}
              </div>

              {watchedRetentionChoice === 'configurable' && (
                <div className="pl-12 mt-2">
                  <Input
                    label={t('consent.configurableDays')}
                    type="number"
                    min={1}
                    max={365}
                    value={watchedConfigurableDays || 30}
                    onChange={(e) => handleConfigurableDaysChange(parseInt(e.target.value) || 30)}
                    error={errors.retention_choice?.configurable_days?.message}
                    className="w-40"
                  />
                </div>
              )}
            </div>

            {submitConsent.isError && (
              <Alert variant="error">{t('errors.generic')}</Alert>
            )}

            <div className="flex gap-3">
              <Button
                type="submit"
                className="flex-1"
                disabled={!canSubmit || isSubmitting}
              >
                {isSubmitting ? t('common.loading') : t('consent.continue')}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}