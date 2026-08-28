import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '@/stores/sessionStore';
import { useTranscript, useUpdateTranscript, useDraft, useRegenerateCatalogue } from '@/hooks/useApi';
import { Button, Card, CardHeader, Textarea, Alert, Badge, Progress } from '@/components';

export function TranscriptReviewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { sessionId, setTranscriptCorrectedText, transcriptCorrectedText } = useSessionStore();
  const { data: transcript, isLoading: transcriptLoading } = useTranscript(sessionId || null);
  const updateTranscript = useUpdateTranscript();
  const { data: draft } = useDraft(sessionId || null);
  const regenerateCatalogue = useRegenerateCatalogue();

  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(transcriptCorrectedText || transcript?.corrected_text || transcript?.original_text || '');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (transcript) {
      setEditedText(transcript.corrected_text || transcript.original_text || '');
      setTranscriptCorrectedText(transcript.corrected_text || transcript.original_text || '');
    }
  }, [transcript, setTranscriptCorrectedText]);

  const handleSave = async () => {
    if (!sessionId) return;
    try {
      await updateTranscript.mutateAsync({ sessionId, data: { corrected_text: editedText } });
      setIsEditing(false);
      setTranscriptCorrectedText(editedText);
    } catch (error) {
      console.error('Failed to save transcript:', error);
    }
  };

  const handleGenerateCatalogue = async () => {
    if (!sessionId) return;
    setIsGenerating(true);
    try {
      await regenerateCatalogue.mutateAsync(sessionId);
      navigate('/catalogue-review');
    } catch (error) {
      console.error('Failed to generate catalogue:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const hasLowConfidence = transcript && (transcript.confidence !== null && transcript.confidence < 0.6);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-8">
          <CardHeader
            title={t('transcriptReview.title')}
            subtitle={t('transcriptReview.subtitle')}
          />
        </Card>

        <Card className="mb-8">
          <div className="space-y-6">
            {transcriptLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mx-auto mb-4" />
                <p className="text-gray-600">{t('common.loading')}</p>
              </div>
            ) : transcript ? (
              <>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('transcriptReview.detectedLanguage')}
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                        {transcript.detected_language?.toUpperCase() || 'N/A'}
                      </span>
                      {transcript.detected_language && transcript.confidence !== null && (
                        <div className="flex items-center gap-2">
                          <Progress
                            value={transcript.confidence * 100}
                            size="sm"
                            showLabel
                            variant={transcript.confidence < 0.6 ? 'warning' : 'default'}
                            className="w-32"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  {hasLowConfidence && (
                    <Badge variant="warning" className="flex-shrink-0">
                      {t('transcriptReview.lowConfidenceWarning')}
                    </Badge>
                  )}
                </div>

                {hasLowConfidence && (
                  <Alert variant="warning" className="mt-4">
                    {t('transcriptReview.lowConfidenceWarning')}
                  </Alert>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isEditing ? t('transcriptReview.correctedText') : t('transcriptReview.originalText')}
                  </label>
                  {isEditing ? (
                    <Textarea
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      rows={8}
                      className="font-mono text-sm"
                      placeholder={t('transcriptReview.originalText')}
                    />
                  ) : (
                    <div className="prose max-w-none p-4 bg-gray-50 rounded-lg border border-gray-200 whitespace-pre-wrap font-mono text-sm">
                      {editedText || t('common.loading')}
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  {isEditing ? (
                    <>
                      <Button variant="secondary" onClick={() => setIsEditing(false)}>
                        {t('common.cancel')}
                      </Button>
                      <Button variant="primary" onClick={handleSave} disabled={updateTranscript.isPending}>
                        {updateTranscript.isPending ? t('common.loading') : t('transcriptReview.save')}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" onClick={() => setIsEditing(true)}>
                        {t('transcriptReview.edit')}
                      </Button>
                      <Button 
                        variant="primary" 
                        onClick={handleGenerateCatalogue} 
                        disabled={draft?.status === 'generating' || isGenerating}
                      >
                        {isGenerating ? t('common.loading') : t('transcriptReview.confirmAndGenerate')}
                      </Button>
                    </>
                  )}
                </div>
              </>
            ) : (
              <Alert variant="error">{t('errors.generic')}</Alert>
            )}
          </div>
        </Card>

        {updateTranscript.isError && (
          <Alert variant="error">{t('errors.generic')}</Alert>
        )}
        {regenerateCatalogue.isError && (
          <Alert variant="error">{t('errors.processingFailed')}</Alert>
        )}
      </div>
    </div>
  );
}