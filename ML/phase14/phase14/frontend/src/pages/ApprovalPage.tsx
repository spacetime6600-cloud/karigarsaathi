import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '@/stores/sessionStore';
import { useApprovedSnapshot } from '@/hooks/useApi';
import { Button, Card, CardHeader, Alert } from '@/components';
import { formatDateTime, downloadJson } from '@/utils/helpers';

export function ApprovalPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { sessionId } = useSessionStore();
  const { data: snapshot, isLoading } = useApprovedSnapshot(sessionId || null);

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

  if (!snapshot) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <Alert variant="error">
            <h3 className="font-medium">{t('approval.title')}</h3>
            <p className="mt-2">{t('errors.notFound')}</p>
          </Alert>
          <Button variant="primary" onClick={() => navigate('/language')} className="mt-4">
            {t('common.back')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card className="mb-8">
          <CardHeader
            title={t('approval.approved')}
            subtitle={t('approval.subtitle')}
          />
        </Card>

        <Card className="mb-8">
          <div className="text-center py-8">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('approval.approved')}</h2>
            <p className="text-gray-600 mb-6">{t('approval.confirm')}</p>

            <div className="space-y-3 text-left max-w-md mx-auto">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">{t('approval.snapshotId')}</p>
                <p className="font-mono text-gray-900 break-all">{snapshot.id || 'N/A'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">{t('common.createdAt')}</p>
                <p className="font-medium text-gray-900">{formatDateTime(snapshot.approved_at)}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">{t('approval.revision')}</p>
                <p className="font-medium text-gray-900">{snapshot.revision}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-800">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{t('approval.is_immutable')}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="mb-8">
          <div className="flex gap-3">
            <Button variant="primary" onClick={() => downloadJson(snapshot.catalogue_json, `catalogue-${sessionId}.json`)} className="flex-1">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {t('approval.downloadJson')}
            </Button>
            <Button variant="secondary" onClick={() => navigate('/language')} className="flex-1">
              {t('session.newSession')}
            </Button>
          </div>
        </Card>

        <details className="mt-8">
          <summary className="cursor-pointer font-medium text-gray-700 select-none">
            {t('approval.viewJson')}
          </summary>
          <pre className="mt-4 p-4 bg-gray-900 text-green-300 rounded-lg overflow-x-auto text-sm max-h-96">
            {JSON.stringify(snapshot.catalogue_json, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}