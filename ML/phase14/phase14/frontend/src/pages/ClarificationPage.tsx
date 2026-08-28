import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '@/stores/sessionStore';
import { useAnswerClarification } from '@/hooks/useApi';
import { Button, Card, CardHeader, Textarea, Alert, Badge } from '@/components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clarificationAnswerSchema, type ClarificationAnswerInput } from '@/schemas';

interface Clarification {
  clarification_id: string;
  target_field: string;
  reason: string;
  source_language_question: string;
  hindi_question: string;
  english_question: string;
  status: string;
  answer: string | null;
  mark_unknown: boolean;
  required: boolean;
}

export function ClarificationPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { sessionId, clarifications, updateClarification } = useSessionStore();
  const answerClarification = useAnswerClarification();

  const [currentClarificationIndex, setCurrentClarificationIndex] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClarificationAnswerInput>({
    resolver: zodResolver(clarificationAnswerSchema),
    defaultValues: {
      clarification_id: '',
      answer_text: '',
      mark_unknown: false,
      answer_source: 'artisan',
    },
  });

  const currentClarification = clarifications[currentClarificationIndex] as Clarification | undefined;
  const watchedMarkUnknown = watch('mark_unknown');

  const isRequired = currentClarification?.required ?? true;

  const handleAnswerSubmit = async (data: ClarificationAnswerInput) => {
    if (!sessionId || !currentClarification) return;

    try {
      const clarificationId = currentClarification.clarification_id;
      await answerClarification.mutateAsync({
        sessionId,
        data: {
          clarification_id: clarificationId,
          answer_text: data.answer_text ?? null,
          mark_unknown: data.mark_unknown,
          answer_source: data.answer_source,
        },
      });

      updateClarification(clarificationId, {
        answer: data.answer_text ?? null,
        mark_unknown: data.mark_unknown,
        status: 'answered',
      });

      if (currentClarificationIndex < clarifications.length - 1) {
        setCurrentClarificationIndex(currentClarificationIndex + 1);
        reset({
          clarification_id: clarifications[currentClarificationIndex + 1].clarification_id,
          answer_text: '',
          mark_unknown: false,
          answer_source: 'artisan',
        });
      } else {
        navigate('/catalogue-review');
      }
    } catch (error) {
      console.error('Failed to answer clarification:', error);
    }
  };

  const handleSkip = () => {
    if (isRequired) return;
    if (currentClarificationIndex < clarifications.length - 1) {
      setCurrentClarificationIndex(currentClarificationIndex + 1);
      reset({
        clarification_id: clarifications[currentClarificationIndex + 1].clarification_id,
        answer_text: '',
        mark_unknown: false,
        answer_source: 'artisan',
      });
    } else {
      navigate('/catalogue-review');
    }
  };

  const hasUnresolvedRequired = clarifications.some(
    (c) => c.required && c.status !== 'answered'
  );

  if (!currentClarification) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <Card>
            <CardHeader
              title={t('clarification.noQuestions')}
              subtitle={t('clarification.noQuestions')}
            />
            <div className="p-4">
              <Button variant="primary" onClick={() => navigate('/catalogue-review')}>
                {t('common.next')}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card className="mb-8">
          <CardHeader
            title={`${t('clarification.title')} (${currentClarificationIndex + 1}/${clarifications.length})`}
            subtitle={t('clarification.subtitle')}
          />
        </Card>

        <Card className="mb-8">
          <form onSubmit={handleSubmit(handleAnswerSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-gray-900">{t('clarification.question')}</h4>
                  <Badge variant={isRequired ? 'error' : 'info'}>
                    {isRequired ? t('clarification.required') : t('clarification.optional')}
                  </Badge>
                </div>
                <div className="space-y-3 text-sm">
                  <p className="text-gray-700">
                    <span className="font-medium">{t('clarification.reason')}: </span>
                    {currentClarification.reason}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">{t('common.required')}: </span>
                    {currentClarification.target_field}
                  </p>
                  <div className="pt-2 border-t border-gray-200">
                    <p className="font-medium text-gray-900">{t('clarification.question')}</p>
                    <p className="text-gray-700 mt-1">{currentClarification.source_language_question || currentClarification.english_question}</p>
                    <p className="text-gray-500 text-sm mt-1">{currentClarification.hindi_question}</p>
                    <p className="text-gray-500 text-sm">{currentClarification.english_question}</p>
                  </div>
                </div>
              </div>

              <Textarea
                label={t('clarification.answer')}
                {...register('answer_text')}
                rows={4}
                placeholder={t('clarification.answer')}
                disabled={watchedMarkUnknown}
                className="font-mono text-sm"
              />
              {errors.answer_text && (
                <p className="text-sm text-red-600" role="alert">{errors.answer_text.message}</p>
              )}

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="mark-unknown"
                  {...register('mark_unknown')}
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="mark-unknown" className="text-gray-700 cursor-pointer">
                  {t('clarification.markUnknown')}
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? t('common.loading') : t('clarification.submit')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleSkip}
                disabled={isSubmitting || isRequired}
              >
                {t('clarification.skipOptional')}
              </Button>
            </div>
          </form>
        </Card>

        {hasUnresolvedRequired && (
          <Alert variant="warning">
            <p className="font-medium">{t('clarification.blockApproval')}</p>
            <p className="text-sm mt-1">{t('clarification.resolveRequired')}</p>
          </Alert>
        )}

        {answerClarification.isError && (
          <Alert variant="error">{t('errors.generic')}</Alert>
        )}
      </div>
    </div>
  );
}