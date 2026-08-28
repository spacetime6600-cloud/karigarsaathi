import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '@/stores/sessionStore';
import { useGetSession, useSessionStatus } from '@/hooks/useApi';
import { Button, Card, CardHeader, Alert, Badge } from '@/components';
import { formatDateTime, getStatusColor } from '@/utils/helpers';

const STATUS_ROUTES: Record<string, string> = {
  created: '/language',
  awaiting_audio: '/language',
  uploaded: '/recording',
  transcribing: '/recording',
  transcription_failed: '/recording',
  awaiting_transcript_review: '/transcript-review',
  generating_catalogue: '/catalogue-review',
  clarification_required: '/clarification',
  draft_ready: '/catalogue-review',
  approved: '/approval',
  failed: '/language',
  source_deleted: '/language',
};

export function SessionResumePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { sessionId, setSessionId, setSelectedLanguage, setConsentGranted, setRetentionChoice } = useSessionStore();
  const [showResumePrompt, setShowResumePrompt] = useState(false);

  const { data: sessionData, isLoading } = useGetSession(sessionId || '');
  const { data: statusData } = useSessionStatus(sessionId || null);

  const currentStatus = statusData?.status || sessionData?.status || 'created';
  const targetRoute = STATUS_ROUTES[currentStatus] || '/language';

  useEffect(() => {
    if (sessionId && !sessionData) {
      setShowResumePrompt(true);
    }
  }, [sessionId, sessionData]);

  const handleResume = () => {
    if (sessionData) {
      setSelectedLanguage(sessionData.selected_language as 'hi' | 'en' | 'or' | 'bn' | 'te');
      setConsentGranted(sessionData.consent_granted);
      if (sessionData.retention_choice) {
        setRetentionChoice(sessionData.retention_choice);
      }
    }
    navigate(targetRoute);
  };

  const handleNewSession = () => {
    setSessionId(null);
    setShowResumePrompt(false);
    navigate('/language');
  };

  if (showResumePrompt && sessionData) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader
              title={t('session.resume')}
              subtitle={t('session.newSession')}
            />
            <div className="p-4 space-y-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">{t('session.sessionId')}</p>
                    <p className="font-mono text-gray-900">{sessionData.session_id}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">{t('session.status')}</p>
                    <Badge className={getStatusColor(currentStatus)}>
                      {currentStatus.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-gray-500">{t('session.createdAt')}</p>
                    <p className="text-gray-900">{formatDateTime(sessionData.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">{t('common.updatedAt')}</p>
                    <p className="text-gray-900">{formatDateTime(sessionData.updated_at)}</p>
                  </div>
                </div>
              </div>

              <Alert variant="info">
                <p>{t('session.resumePrompt')}</p>
              </Alert>

              <div className="flex gap-3">
                <Button variant="primary" onClick={handleResume} className="flex-1">
                  {t('session.resume')}
                </Button>
                <Button variant="secondary" onClick={handleNewSession} className="flex-1">
                  {t('session.newSession')}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto text-center">
        <Card>
          <CardHeader
            title={t('session.noSession')}
            subtitle={t('session.startNew')}
          />
          <div className="p-4">
            <Button variant="primary" onClick={handleNewSession} size="lg">
              {t('session.newSession')}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}