import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '@/stores/sessionStore';
import { useDeleteSourceData } from '@/hooks/useApi';
import { Button, Card, CardHeader, Alert } from '@/components';

export function DeletionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { sessionId, reset } = useSessionStore();
  const deleteSourceData = useDeleteSourceData();

  const [deleteRecording, setDeleteRecording] = useState(false);
  const [deleteTranscript, setDeleteTranscript] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    if (!sessionId) return;

    try {
      await deleteSourceData.mutateAsync({
        sessionId,
        data: { delete_recording: deleteRecording, delete_transcript: deleteTranscript },
      });
      reset();
      navigate('/language');
    } catch (error) {
      console.error('Failed to delete data:', error);
    }
  };

  const canDelete = (deleteRecording || deleteTranscript) && confirmDelete;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card className="mb-8">
          <CardHeader
            title={t('deletion.title')}
            subtitle={t('deletion.subtitle')}
          />
        </Card>

        <Card className="mb-8">
          <div className="space-y-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-4">{t('deletion.deleteRecording')}</h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteRecording}
                  onChange={(e) => setDeleteRecording(e.target.checked)}
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-gray-700">{t('deletion.deleteRecording')}</span>
              </label>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-4">{t('deletion.deleteTranscript')}</h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteTranscript}
                  onChange={(e) => setDeleteTranscript(e.target.checked)}
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-gray-700">{t('deletion.deleteTranscript')}</span>
              </label>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-4">{t('deletion.deleteBoth')}</h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmDelete}
                  onChange={(e) => setConfirmDelete(e.target.checked)}
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-gray-700">{t('deletion.confirm')}</span>
              </label>
            </div>

            {deleteSourceData.isError && (
              <Alert variant="error">{t('errors.generic')}</Alert>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={!canDelete || deleteSourceData.isPending}
                className="flex-1"
              >
                {deleteSourceData.isPending ? t('common.loading') : t('deletion.delete')}
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/language')}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
            </div>

            {!deleteRecording && !deleteTranscript && (
              <p className="text-center text-sm text-gray-500">
                {t('deletion.selectOption')}
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}