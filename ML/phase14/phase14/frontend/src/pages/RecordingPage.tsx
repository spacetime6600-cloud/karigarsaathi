import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '@/stores/sessionStore';
import { useUploadAudio, useProcessSession, useSessionStatus } from '@/hooks/useApi';
import { useRecording } from '@/hooks/useRecording';
import { Button, Card, CardHeader, Alert, AudioPlayer } from '@/components';
import { cn, formatTime, revokeObjectURL } from '@/utils/helpers';

const MAX_DURATION_SECONDS = 300;
const MAX_SIZE_MB = 50;
const ALLOWED_EXTENSIONS = ['.wav', '.mp3', '.m4a', '.webm', '.ogg'];

export function RecordingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { sessionId } = useSessionStore();
  const uploadAudio = useUploadAudio();
  const processSession = useProcessSession();
  const { data: sessionStatus } = useSessionStatus(sessionId || null);

  const {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    error: recordingError,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    discardRecording,
    playAudio,
  } = useRecording();

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return t('errors.audioTooLarge', { mb: MAX_SIZE_MB });
    }
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return t('errors.unsupportedFormat');
    }
    return null;
  }, [t]);

  const processAudio = useCallback(async () => {
    if (!sessionId) return;
    setIsProcessing(true);
    try {
      await processSession.mutateAsync(sessionId);
      navigate('/transcript-review');
    } catch (error) {
      setIsProcessing(false);
      const message = error instanceof Error ? error.message : t('errors.processingFailed');
      setUploadError(message);
      console.error('Processing failed:', error);
    }
  }, [sessionId, processSession, navigate, t]);

  const handleRecordAndUpload = useCallback(async (fileToUpload: File) => {
    setIsProcessing(true);
    setUploadError(null);
    try {
      await uploadAudio.mutateAsync({ sessionId: sessionId!, file: fileToUpload });
      setIsProcessing(false);
      await processAudio();
    } catch (error) {
      setIsProcessing(false);
      const message = error instanceof Error ? error.message : t('errors.processingFailed');
      setUploadError(message);
      console.error('Upload failed:', error);
    }
  }, [sessionId, uploadAudio, processAudio, t]);

  const handleUploadAndProcess = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      setUploadError(error);
      return;
    }
    setUploadError(null);
    handleRecordAndUpload(file);
  }, [validateFile, handleRecordAndUpload]);

  const handleDiscardUpload = useCallback(() => {
    setUploadedFile(null);
    if (uploadedFileUrl) {
      revokeObjectURL(uploadedFileUrl);
      setUploadedFileUrl(null);
    }
    setUploadError(null);
  }, [uploadedFileUrl]);

  const handleDiscardRecording = useCallback(() => {
    discardRecording();
    setUploadedFile(null);
    if (uploadedFileUrl) {
      revokeObjectURL(uploadedFileUrl);
      setUploadedFileUrl(null);
    }
    setUploadError(null);
  }, [discardRecording, uploadedFileUrl]);

  const handleReRecord = useCallback(() => {
    discardRecording();
    setUploadedFile(null);
    if (uploadedFileUrl) {
      revokeObjectURL(uploadedFileUrl);
      setUploadedFileUrl(null);
    }
    setUploadError(null);
    startRecording();
  }, [discardRecording, startRecording, uploadedFileUrl]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Card className="mb-8">
          <CardHeader
            title={t('recording.title')}
            subtitle={t('recording.subtitle')}
          />
        </Card>

        <Card className="mb-8">
          <div className="space-y-6">
            {recordingError && (
              <Alert variant="error">{recordingError}</Alert>
            )}
            {uploadError && (
              <Alert variant="error">{uploadError}</Alert>
            )}

            {isRecording && (
              <div className="text-center">
                <div className="inline-flex items-center gap-4 mb-6">
                  <div className={cn(
                    'w-20 h-20 rounded-full border-4 border-primary-200 flex items-center justify-center',
                    isPaused ? 'animate-pulse' : 'animate-spin'
                  )}>
                    <svg className="w-10 h-10 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5.1c0 4.6 3.5 8.1 8 8.1s8-3.5 8-8.1h-1.6z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-3xl font-mono font-bold text-gray-900">{formatTime(duration)}</p>
                    <p className="text-sm text-gray-500">{isPaused ? t('recording.pause') : t('recording.stop')}</p>
                  </div>
                </div>

                <div className="flex justify-center gap-3">
                  {isPaused ? (
                    <Button variant="primary" onClick={resumeRecording} size="lg">
                      {t('recording.resume')}
                    </Button>
                  ) : (
                    <Button variant="secondary" onClick={pauseRecording} size="lg">
                      {t('recording.pause')}
                    </Button>
                  )}
                  <Button variant="primary" onClick={stopRecording} size="lg">
                    {t('recording.stop')}
                  </Button>
                  <Button variant="ghost" onClick={discardRecording} size="lg">
                    {t('recording.discard')}
                  </Button>
                </div>
              </div>
            )}

            {!isRecording && !audioBlob && !uploadedFile && (
              <div className="space-y-6">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v-2m0 2v-2m0 0a7 7 0 017 7m0 0a7 7 0 01-7 7m-7-7H3m14 0H3" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{t('recording.start')}</h3>
                  <p className="text-gray-500 mb-4">{t('recording.maxDuration', { seconds: MAX_DURATION_SECONDS })}</p>
                  <p className="text-sm text-gray-400 mb-6">{t('recording.supportedFormats')}</p>

                  <Button variant="primary" onClick={startRecording} size="lg" className="w-full sm:w-auto">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5.1c0 4.6 3.5 8.1 8 8.1s8-3.5 8-8.1h-1.6z" />
                    </svg>
                    {t('recording.start')}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">{t('recording.uploadFallback')}</span>
                    </div>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept=".wav,.mp3,.m4a,.webm,.ogg"
                      onChange={(e) => e.target.files?.[0] && handleUploadAndProcess(e.target.files[0])}
                      className="sr-only"
                      id="file-upload"
                      disabled={uploadAudio.isPending || isProcessing}
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="mt-2 text-gray-600">
                        <span className="font-medium text-primary-600">{t('recording.uploadButton')}</span> {t('recording.uploadFallback')}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{t('recording.maxSize', { mb: MAX_SIZE_MB })}</p>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {audioBlob && !isRecording && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5.1c0 4.6 3.5 8.1 8 8.1s8-3.5 8-8.1h-1.6z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">recording.webm</p>
                      <p className="text-sm text-gray-500">{formatTime(duration)} • {(audioBlob.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => playAudio(audioBlob!)} size="sm">
                      {t('recording.playback')}
                    </Button>
                    <Button variant="outline" onClick={handleDiscardRecording} size="sm">
                      {t('recording.discard')}
                    </Button>
                    <Button variant="secondary" onClick={handleReRecord} size="sm">
                      {t('recording.reRecord')}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    onClick={() => handleRecordAndUpload(new File([audioBlob!], 'recording.webm', { type: 'audio/webm' }))}
                    className="flex-1"
                    disabled={isProcessing}
                  >
                    {isProcessing ? t('common.loading') : t('recording.processing')}
                  </Button>
                </div>
              </div>
            )}

            {uploadedFile && !audioBlob && !isRecording && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <path d="M14 2v6h6" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                      <p className="text-sm text-gray-500">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleDiscardUpload} size="sm">
                      {t('recording.discard')}
                    </Button>
                    <Button variant="secondary" onClick={() => { setUploadedFile(null); if (uploadedFileUrl) { revokeObjectURL(uploadedFileUrl); setUploadedFileUrl(null); } startRecording(); }} size="sm">
                      {t('recording.reRecord')}
                    </Button>
                  </div>
                </div>

                <AudioPlayer src={uploadedFileUrl || URL.createObjectURL(uploadedFile)} />

                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    onClick={() => handleRecordAndUpload(uploadedFile)}
                    className="flex-1"
                    disabled={isProcessing}
                  >
                    {isProcessing ? t('common.loading') : t('recording.processing')}
                  </Button>
                </div>
              </div>
            )}

            {sessionStatus && sessionStatus.status === 'uploaded' && !isProcessing && !audioBlob && !uploadedFile && (
              <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800">{t('recording.readyForReview')}</p>
                <Button variant="primary" onClick={processAudio} className="mt-3">
                  {t('common.next')}
                </Button>
              </div>
            )}
          </div>
        </Card>

        {(uploadAudio.isError || processSession.isError) && (
          <Alert variant="error">{t('errors.processingFailed')}</Alert>
        )}
      </div>
    </div>
  );
}