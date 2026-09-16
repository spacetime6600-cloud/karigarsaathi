import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Square,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Languages,
  Check,
  Trash2,
  FileText,
  ShieldCheck,
  HelpCircle,
  Layers,
  UploadCloud,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Modal } from '@/components/ui/Modal';
import { logger } from '@/services/logging/logger';
import {
  permissionService,
  MicrophoneDiagnostics,
} from '@/services/permissions/permissionService';
import {
  voiceCatalogueService,
  VoiceCatalogueError,
  VoiceHealthResponse,
} from '@/services/ai/voiceCatalogueService';
import {
  VoiceSupportedLanguage,
  VoiceTranscriptionResult,
  CatalogueGenerationResult,
} from '@/types';

export interface VoiceCatalogueStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySuggestions: (payload: {
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
  }) => void;
  initialDraftTitle?: string;
  initialDraftDescription?: string;
}

type InputMode = 'voice' | 'upload' | 'typed';
type StudioStep =
  | 'input_choice'
  | 'recording'
  | 'transcribing'
  | 'transcript_review'
  | 'generating'
  | 'catalogue_review';

export const VoiceCatalogueStudioModal: React.FC<VoiceCatalogueStudioModalProps> = ({
  isOpen,
  onClose,
  onApplySuggestions,
  initialDraftTitle = '',
  initialDraftDescription = '',
}) => {
  // Mode and Language State
  const [selectedLanguage, setSelectedLanguage] = useState<VoiceSupportedLanguage>('hi');
  const [inputMode, setInputMode] = useState<InputMode>('voice');
  const [step, setStep] = useState<StudioStep>('input_choice');

  // Diagnostics and Health
  const [diagnostics, setDiagnostics] = useState<MicrophoneDiagnostics | null>(null);
  const [serviceHealth, setServiceHealth] = useState<VoiceHealthResponse | null>(null);
  const [micErrorDetail, setMicErrorDetail] = useState<{
    status: string;
    error: string;
    recoveryInstructions?: string;
  } | null>(null);

  // Privacy & Consent
  const [consentGranted, setConsentGranted] = useState(true);
  const [retentionChoice] = useState<'30_days' | 'immediate_delete'>('30_days');
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioFileName, setAudioFileName] = useState<string>('recording.wav');

  // Active Streams & Controls
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingAbortControllerRef = useRef<AbortController | null>(null);
  const translationAbortControllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Transcript & Translation State
  const [transcriptResult, setTranscriptResult] = useState<VoiceTranscriptionResult | null>(null);
  const [editableTranscript, setEditableTranscript] = useState('');
  const [englishTranslation, setEnglishTranslation] = useState('');
  const [lastTranslatedSourceText, setLastTranslatedSourceText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [typedInputText, setTypedInputText] = useState('');

  // Generation & Review State
  const [generationResult, setGenerationResult] = useState<CatalogueGenerationResult | null>(null);
  const [editableTitleEn, setEditableTitleEn] = useState('');
  const [editableTitleIndic, setEditableTitleIndic] = useState('');
  const [editableDescEn, setEditableDescEn] = useState('');
  const [editableDescIndic, setEditableDescIndic] = useState('');
  const [editableTagsEn, setEditableTagsEn] = useState('');
  const [editableTagsIndic, setEditableTagsIndic] = useState('');

  // UI / Error State
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDeletingData, setIsDeletingData] = useState(false);
  const [dataDeletedNotice, setDataDeletedNotice] = useState(false);
  const [overwriteWarningModal, setOverwriteWarningModal] = useState(false);

  // Load diagnostics and service health on open
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setDataDeletedNotice(false);

      permissionService.getMicrophoneDiagnostics().then((diag) => {
        setDiagnostics(diag);
        if (!diag.isSecureContext) {
          setMicErrorDetail({
            status: 'insecure_context',
            error: `Microphone recording requires a Secure Context (HTTPS or localhost). You are currently accessing over an unencrypted network address (${diag.origin}).`,
            recoveryInstructions:
              '1. Open the application via http://localhost:3001 on the host computer.\n2. Or use "Upload Audio File" to upload voice notes.\n3. Or use "Type Description" to type craft facts.',
          });
        }
      });

      voiceCatalogueService.checkHealth().then((health) => {
        setServiceHealth(health);
      });
    } else {
      cleanupResources();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const cleanupResources = () => {
    // Abort any pending permission prompt
    if (pendingAbortControllerRef.current) {
      pendingAbortControllerRef.current.abort();
      pendingAbortControllerRef.current = null;
    }

    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }

    // Stop all media tracks
    if (mediaStreamRef.current) {
      permissionService.stopMediaStream(mediaStreamRef.current);
      mediaStreamRef.current = null;
    }

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Abort any in-flight translation request
    if (translationAbortControllerRef.current) {
      translationAbortControllerRef.current.abort();
      translationAbortControllerRef.current = null;
    }

    // Revoke object URL
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    setIsRecording(false);
    setIsPlayingAudio(false);
  };

  // Audio Recording Handlers
  const handleStartRecording = async () => {
    setErrorMessage(null);
    setMicErrorDetail(null);
    cleanupResources();

    const controller = new AbortController();
    pendingAbortControllerRef.current = controller;

    const result = await permissionService.requestMicrophone(controller.signal);

    if (result.status !== 'granted' || !result.stream) {
      setMicErrorDetail({
        status: result.status,
        error: result.error || 'Unable to access microphone.',
        recoveryInstructions: result.recoveryInstructions,
      });
      return;
    }

    // If canceled while prompt was open
    if (controller.signal.aborted) {
      permissionService.stopMediaStream(result.stream);
      return;
    }

    mediaStreamRef.current = result.stream;
    audioChunksRef.current = [];

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : MediaRecorder.isTypeSupported('audio/ogg')
      ? 'audio/ogg'
      : 'audio/wav';

    try {
      const recorder = new MediaRecorder(result.stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        if (blob.size > 100) {
          setAudioBlob(blob);
          const ext = mimeType.includes('webm') ? 'webm' : mimeType.includes('ogg') ? 'ogg' : 'wav';
          setAudioFileName(`recording_${Date.now()}.${ext}`);
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
        }
        if (mediaStreamRef.current) {
          permissionService.stopMediaStream(mediaStreamRef.current);
          mediaStreamRef.current = null;
        }
      };

      recorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);

      setStep('recording');
    } catch (err) {
      logger.warn('PERMISSION', 'MediaRecorder initialization failed', { err });
      permissionService.stopMediaStream(result.stream);
      setMicErrorDetail({
        status: 'unsupported',
        error: 'MediaRecorder initialization failed in this browser.',
        recoveryInstructions: 'Please upload an audio file or type your craft description.',
      });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.requestData();
      } catch {
        // ignore
      }
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  };

  const handleDiscardAudio = () => {
    cleanupResources();
    setAudioBlob(null);
    setRecordingSeconds(0);
    setStep('input_choice');
  };

  const handleTogglePlayback = () => {
    if (!audioPlayerRef.current || !audioUrl) return;

    if (isPlayingAudio) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  // Audio File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage('Audio file exceeds maximum size limit (50 MB).');
      return;
    }

    cleanupResources();
    setAudioBlob(file);
    setAudioFileName(file.name);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setRecordingSeconds(0);
    setErrorMessage(null);
  };

  // Submit Audio for Faster Whisper Transcription
  const handleSubmitAudioForTranscription = async () => {
    if (!audioBlob || audioBlob.size < 50) {
      setErrorMessage('No valid audio data recorded. Please record or upload a non-empty audio clip.');
      return;
    }

    setErrorMessage(null);
    setStep('transcribing');

    try {
      // 1. Create Session
      const session = await voiceCatalogueService.createSession({
        selectedLanguage,
        consentGranted,
        retentionChoice,
      });
      setSessionId(session.session_id);

      // 2. Upload Audio
      await voiceCatalogueService.uploadAudio({
        sessionId: session.session_id,
        audioBlob,
        filename: audioFileName,
      });

      // 3. Process Transcription with Faster Whisper
      const transResult = await voiceCatalogueService.processAudio({
        sessionId: session.session_id,
      });

      const recognizedText = transResult.corrected_text || transResult.original_text;
      setTranscriptResult(transResult);
      setEditableTranscript(recognizedText);
      setStep('transcript_review');

      // 4. Auto-generate English translation for Both mode
      if (recognizedText.trim()) {
        handleTranslateToEnglish(recognizedText);
      }
    } catch (err) {
      const msg =
        err instanceof VoiceCatalogueError
          ? err.message
          : 'Speech transcription failed. Please check microservice connectivity on port 8001 or type description.';
      setErrorMessage(msg);
      setStep('recording');
    }
  };

  // Translate confirmed source transcript via phase14-sarvam (Ollama /api/generate)
  const handleTranslateToEnglish = async (sourceTextOverride?: string) => {
    const textToTranslate = (typeof sourceTextOverride === 'string' ? sourceTextOverride : editableTranscript).trim();
    if (!textToTranslate) return;

    if (translationAbortControllerRef.current) {
      translationAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    translationAbortControllerRef.current = controller;

    setIsTranslating(true);
    setErrorMessage(null);
    try {
      const res = await voiceCatalogueService.translateWithSarvam({
        correctedTranscript: textToTranslate,
        sourceLanguage: selectedLanguage,
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      // English output: direct for English input, translated for others
      const engText = res.english_output || '';
      setEnglishTranslation(engText);
      setLastTranslatedSourceText(textToTranslate);

      if (res.review_required && res.review_reason) {
        setErrorMessage(`Translation needs review: ${res.review_reason}`);
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      const msg =
        err instanceof VoiceCatalogueError
          ? err.message
          : 'Translation request failed. Please check that the Phase 14 microservice is running on port 8001.';
      setErrorMessage(msg);
    } finally {
      if (!controller.signal.aborted) {
        setIsTranslating(false);
      }
    }
  };

  // Submit Typed Description
  const handleSubmitTypedInput = async () => {
    if (!typedInputText.trim()) return;
    setErrorMessage(null);
    setStep('generating');

    try {
      const session = await voiceCatalogueService.createSession({
        selectedLanguage,
        consentGranted,
        retentionChoice,
      });
      setSessionId(session.session_id);

      const genResult = await voiceCatalogueService.generateCatalogue({
        sessionId: session.session_id,
        text: typedInputText,
      });

      populateGeneratedState(genResult);
      setEditableTranscript(typedInputText);
      setStep('catalogue_review');
    } catch (err) {
      const msg =
        err instanceof VoiceCatalogueError
          ? err.message
          : 'Catalogue generation failed. Please verify the AI service on port 8001.';
      setErrorMessage(msg);
      setStep('input_choice');
    }
  };

  // Generate Catalogue from Confirmed Transcript
  const handleGenerateFromConfirmedTranscript = async () => {
    if (!sessionId || !editableTranscript.trim()) return;
    setErrorMessage(null);
    setStep('generating');

    try {
      // Save transcript correction
      await voiceCatalogueService.updateTranscript({
        sessionId,
        correctedText: editableTranscript,
      });

      // Generate catalogue suggestions
      const genResult = await voiceCatalogueService.generateCatalogue({
        sessionId,
        text: editableTranscript,
      });

      populateGeneratedState(genResult);
      setStep('catalogue_review');
    } catch (err) {
      const msg =
        err instanceof VoiceCatalogueError
          ? err.message
          : 'Catalogue suggestion generation failed. Please try again.';
      setErrorMessage(msg);
      setStep('transcript_review');
    }
  };

  const populateGeneratedState = (genResult: CatalogueGenerationResult) => {
    setGenerationResult(genResult);
    setEditableTitleEn(genResult.draft.title_en || '');
    setEditableTitleIndic(genResult.draft.target_language_title || genResult.draft.title_hi || '');
    setEditableDescEn(genResult.draft.description_en || '');
    setEditableDescIndic(genResult.draft.target_language_description || genResult.draft.description_hi || '');
    setEditableTagsEn(genResult.draft.tags_en || '');
    setEditableTagsIndic(genResult.draft.target_language_tags || genResult.draft.tags_hi || '');
  };

  // Explicit Apply to Product Draft
  const handleApplyToDraftConfirmed = async () => {
    if (sessionId) {
      try {
        await voiceCatalogueService.approveCatalogue({ sessionId });
      } catch {
        // Non-blocking
      }
    }

    const structured = generationResult?.structured_fields || {};
    const materialsStr = structured.materials?.value ? String(structured.materials.value) : '';
    const materialsArr = materialsStr.split(',').map((s) => s.trim()).filter(Boolean);

    onApplySuggestions({
      title: editableTitleEn || editableTitleIndic || 'Handcrafted Craft Item',
      description: editableDescEn || editableDescIndic || '',
      tags: editableTagsEn ? editableTagsEn.split(',').map((t) => t.trim()).filter(Boolean) : [],
      materials: materialsArr.length > 0 ? materialsArr : ['Silk'],
      technique: structured.craft_technique?.value ? String(structured.craft_technique.value) : undefined,
      category: structured.category?.value ? String(structured.category.value) : undefined,
      dimensions: structured.dimensions?.value ? String(structured.dimensions.value) : undefined,
      titleHindi: editableTitleIndic,
      descriptionHindi: editableDescIndic,
      transcript: editableTranscript,
      confidence: transcriptResult?.confidence || 0.95,
    });

    onClose();
  };

  const handleApplyClick = () => {
    if (
      (initialDraftTitle.trim() && initialDraftTitle !== editableTitleEn) ||
      (initialDraftDescription.trim() && initialDraftDescription !== editableDescEn)
    ) {
      setOverwriteWarningModal(true);
    } else {
      handleApplyToDraftConfirmed();
    }
  };

  // Privacy: Delete Source Data
  const handleDeleteSourceData = async () => {
    if (!sessionId) return;
    setIsDeletingData(true);
    try {
      await voiceCatalogueService.deleteSourceData({ sessionId });
      setDataDeletedNotice(true);
    } catch {
      // ignore
    } finally {
      setIsDeletingData(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Voice & Multilingual Catalogue Studio"
      maxWidth="5xl"
    >
      <div className="flex flex-col gap-5">
        {/* Top AI Engine Status Banner */}
        <div className="p-3.5 bg-surface-container-low rounded-2xl border border-surface-variant/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-on-surface-variant">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary text-[#FFB955] flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-primary text-xs sm:text-sm block">Multilingual AI Catalogue Engine</span>
              <span className="text-[11px] text-on-surface-variant">Local Speech-to-Text & Regional Vernacular Translation</span>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {diagnostics && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-surface-variant text-[10px] font-semibold text-primary shadow-2xs">
                <ShieldCheck className="w-3 h-3 text-success" />
                {diagnostics.isSecureContext ? 'Secure Context' : 'Insecure Origin'}
              </span>
            )}
            {serviceHealth?.status === 'ok' || serviceHealth?.status === 'ready' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 border border-success/20 text-success text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                Engine Online
              </span>
            ) : serviceHealth?.status === 'starting' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                Engine Starting
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-800 text-[11px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Voice Service Unavailable
              </span>
            )}
          </div>
        </div>

        {/* Global Error Banner with Actionable Recovery */}
        {errorMessage && (
          <div
            role="alert"
            className="p-4 bg-error-container text-on-error-container rounded-2xl border border-error/30 flex items-start justify-between gap-3 text-sm animate-in fade-in"
          >
            <div className="flex items-start gap-3 flex-1">
              <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
              <div className="flex-1 flex flex-col gap-1.5">
                <p className="font-bold text-xs">Error Notice</p>
                <p className="text-xs leading-relaxed">{errorMessage}</p>
                {audioBlob && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSubmitAudioForTranscription}
                      leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                      className="text-xs"
                    >
                      Retry Transcription
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setInputMode('typed')}
                      leftIcon={<FileText className="w-3.5 h-3.5" />}
                      className="text-xs"
                    >
                      Type Description Instead
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              aria-label="Dismiss error"
              className="text-on-error-container/60 hover:text-on-error-container"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Data Deleted Notice */}
        {dataDeletedNotice && (
          <div className="p-3 bg-success-container text-on-success-container rounded-xl border border-success/30 flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
            <span>Audio recording and server transcript were permanently deleted per your privacy request.</span>
          </div>
        )}

        {/* Studio Stepper Bar */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-surface-container-low rounded-2xl border border-surface-variant/60 text-xs font-semibold">
          <div
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all ${
              step === 'input_choice' || step === 'recording'
                ? 'bg-primary text-white font-bold shadow-xs'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === 'input_choice' || step === 'recording'
                  ? 'bg-white/20 text-white'
                  : 'bg-surface-variant text-on-surface-variant'
              }`}
            >
              1
            </span>
            <span className="hidden sm:inline">Input Craft Details</span>
            <span className="sm:hidden">Input</span>
          </div>

          <div
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all ${
              step === 'transcript_review'
                ? 'bg-primary text-white font-bold shadow-xs'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === 'transcript_review'
                  ? 'bg-white/20 text-white'
                  : 'bg-surface-variant text-on-surface-variant'
              }`}
            >
              2
            </span>
            <span className="hidden sm:inline">Review Transcript</span>
            <span className="sm:hidden">Transcript</span>
          </div>

          <div
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all ${
              step === 'catalogue_review'
                ? 'bg-primary text-white font-bold shadow-xs'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === 'catalogue_review'
                  ? 'bg-white/20 text-white'
                  : 'bg-surface-variant text-on-surface-variant'
              }`}
            >
              3
            </span>
            <span className="hidden sm:inline">Bilingual Catalogue</span>
            <span className="sm:hidden">Catalogue</span>
          </div>
        </div>

        {/* STEP 1: Input Choice / Voice Recording / Audio Upload / Typed Input */}
        {(step === 'input_choice' || step === 'recording') && (
          <div className="flex flex-col gap-4 animate-in fade-in">
            {/* Language & Input Mode Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-primary" />
                  Spoken / Input Language
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { code: 'hi', label: 'हिन्दी', sub: 'Hindi' },
                    { code: 'en', label: 'English', sub: 'English' },
                    { code: 'or', label: 'ଓଡ଼ିଆ', sub: 'Odia' },
                    { code: 'bn', label: 'বাংলা', sub: 'Bengali' },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setSelectedLanguage(lang.code as VoiceSupportedLanguage)}
                      className={`p-2 rounded-xl border text-center transition-all select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955] ${
                        selectedLanguage === lang.code
                          ? 'bg-primary text-white border-primary shadow-xs font-bold'
                          : 'bg-white text-primary border-surface-variant hover:bg-surface-container-low'
                      }`}
                    >
                      <div className="text-xs">{lang.label}</div>
                      <div
                        className={`text-[10px] ${
                          selectedLanguage === lang.code ? 'text-white/80' : 'text-on-surface-variant'
                        }`}
                      >
                        {lang.sub}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Input Mode
                </label>
                <div className="grid grid-cols-3 gap-2 h-full">
                  <button
                    type="button"
                    onClick={() => setInputMode('voice')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955] ${
                      inputMode === 'voice'
                        ? 'bg-primary text-white border-primary font-bold shadow-xs'
                        : 'bg-white text-primary border-surface-variant hover:bg-surface-container-low'
                    }`}
                  >
                    <Mic className={`w-4 h-4 shrink-0 ${inputMode === 'voice' ? 'text-white' : 'text-primary'}`} />
                    <span className="text-xs font-semibold">Record Voice</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('upload')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955] ${
                      inputMode === 'upload'
                        ? 'bg-primary text-white border-primary font-bold shadow-xs'
                        : 'bg-white text-primary border-surface-variant hover:bg-surface-container-low'
                    }`}
                  >
                    <UploadCloud
                      className={`w-4 h-4 shrink-0 ${inputMode === 'upload' ? 'text-white' : 'text-primary'}`}
                    />
                    <span className="text-xs font-semibold">Upload Audio</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('typed')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955] ${
                      inputMode === 'typed'
                        ? 'bg-primary text-white border-primary font-bold shadow-xs'
                        : 'bg-white text-primary border-surface-variant hover:bg-surface-container-low'
                    }`}
                  >
                    <FileText
                      className={`w-4 h-4 shrink-0 ${inputMode === 'typed' ? 'text-white' : 'text-primary'}`}
                    />
                    <span className="text-xs font-semibold">Type Text</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Privacy & Recording Consent Drawer */}
            <div className="p-3 bg-surface-container-low rounded-2xl border border-surface-variant/60 flex flex-col gap-1.5 text-xs text-on-surface-variant">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-on-surface">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>Artisan Voice Privacy & Storage Guarantee</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentGranted}
                    onChange={(e) => setConsentGranted(e.target.checked)}
                    className="rounded text-primary focus:ring-primary h-4 w-4"
                  />
                  <span className="font-semibold text-primary">Recording Consent</span>
                </label>
              </div>
              <p className="text-[11px] leading-relaxed">
                Speech audio is transcribed via local Faster Whisper on your microservice. Raw audio is stored in
                isolated session storage and can be deleted at any time.
              </p>
            </div>

            {/* Odia Speech Recognition Guidance */}
            {selectedLanguage === 'or' && inputMode === 'voice' && (
              <div className="p-3.5 bg-secondary/10 rounded-2xl border border-secondary/20 flex items-start gap-2.5 text-xs text-on-surface animate-in fade-in">
                <Info className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                <div className="flex-1 flex flex-col gap-0.5">
                  <span className="font-bold text-secondary">Odia (ଓଡ଼ିଆ) Voice Input Guidance</span>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    Standard Whisper models do not include native Odia speech recognition. For the highest fidelity with Odia crafts, please use the <strong>"Type Text"</strong> tab to describe your product in Odia script, or record speech in Hindi, Bengali, or English.
                  </p>
                </div>
              </div>
            )}

            {/* Microphone Permission / Insecure Context Diagnostic Alert */}
            {inputMode === 'voice' && micErrorDetail && (
              <div className="p-4 bg-warning-container/40 rounded-2xl border border-warning/40 flex flex-col gap-2.5 text-xs text-on-warning-container animate-in fade-in">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                  <div className="flex-1 flex flex-col gap-1">
                    <p className="font-bold text-sm text-on-surface">
                      {micErrorDetail.status === 'insecure_context'
                        ? 'Microphone Disabled: Insecure Network Address'
                        : micErrorDetail.status === 'denied'
                        ? 'Microphone Permission Blocked'
                        : 'Microphone Hardware Unavailable'}
                    </p>
                    <p className="leading-relaxed">{micErrorDetail.error}</p>
                    {micErrorDetail.recoveryInstructions && (
                      <div className="mt-1 p-2.5 bg-white/70 rounded-xl border border-warning/30 font-medium whitespace-pre-line text-[11px] text-on-surface">
                        {micErrorDetail.recoveryInstructions}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-warning/20">
                  <Button
                    variant="tertiary"
                    size="sm"
                    onClick={handleStartRecording}
                    leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                  >
                    Retry Microphone
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setInputMode('upload')}
                    leftIcon={<UploadCloud className="w-3.5 h-3.5" />}
                  >
                    Upload Audio File Instead
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setInputMode('typed')}
                    leftIcon={<FileText className="w-3.5 h-3.5" />}
                  >
                    Type Description Instead
                  </Button>
                </div>
              </div>
            )}

            {/* Input Mode 1: Live Voice Recording */}
            {inputMode === 'voice' && !micErrorDetail && (
              <div className="p-6 bg-white rounded-2xl border border-surface-variant flex flex-col items-center justify-center gap-4 text-center">
                {audioBlob && !isRecording ? (
                  /* Audio Review / Playback View */
                  <div className="flex flex-col items-center gap-4 w-full animate-in fade-in">
                    <div className="p-4 bg-success-container/30 rounded-2xl border border-success/20 w-full flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleTogglePlayback}
                          aria-label={isPlayingAudio ? 'Pause audio' : 'Play audio'}
                          className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary/90 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955]"
                        >
                          {isPlayingAudio ? (
                            <Pause className="w-5 h-5 text-white" />
                          ) : (
                            <Play className="w-5 h-5 ml-0.5 text-white fill-current" />
                          )}
                        </button>
                        <div className="text-left">
                          <p className="font-bold text-xs text-on-surface">Voice Recording Captured</p>
                          <p className="text-[10px] text-on-surface-variant">
                            Duration: {formatSeconds(recordingSeconds)} • Size:{' '}
                            {(audioBlob.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="tertiary"
                          size="sm"
                          onClick={handleDiscardAudio}
                          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                        >
                          Re-record
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleSubmitAudioForTranscription}
                          leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                        >
                          Transcribe & Extract Facts
                        </Button>
                      </div>
                    </div>

                    {audioUrl && (
                      <audio
                        ref={audioPlayerRef}
                        src={audioUrl}
                        onEnded={() => setIsPlayingAudio(false)}
                        className="hidden"
                      />
                    )}
                  </div>
                ) : isRecording ? (
                  /* Live Recording View */
                  <div className="flex flex-col items-center gap-4 py-3 w-full animate-in fade-in">
                    <div className="relative flex items-center justify-center">
                      <div className="absolute w-24 h-24 bg-error-container rounded-full animate-ping opacity-40" />
                      <button
                        type="button"
                        onClick={handleStopRecording}
                        aria-label="Stop recording audio"
                        className="relative z-10 w-20 h-20 rounded-full bg-error text-white flex items-center justify-center shadow-xl hover:bg-red-700 transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-error/40"
                      >
                        <Square className="w-8 h-8 fill-current text-white" />
                      </button>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                      <span className="font-mono font-bold text-2xl text-error tracking-wider">
                        {formatSeconds(recordingSeconds)}
                      </span>
                      <p className="text-sm font-bold text-on-surface">
                        Listening... Speak clearly about your craft
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        Mention craft name, material, technique, dimensions, and colours.
                      </p>
                    </div>

                    {/* Animated Soundwave */}
                    <div className="flex items-center gap-1.5 h-8">
                      {[40, 75, 55, 90, 60, 100, 45, 80, 65, 95, 50, 85, 70, 40].map((h, i) => (
                        <div
                          key={i}
                          className="w-1.5 bg-primary rounded-full animate-pulse"
                          style={{
                            height: `${h}%`,
                            animationDuration: `${0.5 + (i % 5) * 0.2}s`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Initial Record Button */
                  <div className="flex flex-col items-center gap-4 py-6 w-full">
                    <button
                      type="button"
                      onClick={handleStartRecording}
                      aria-label="Start recording craft description"
                      className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-primary/90 transition-all transform hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB955]"
                    >
                      <Mic className="w-9 h-9 text-white shrink-0" />
                    </button>
                    <div className="flex flex-col gap-1">
                      <p className="font-bold text-base text-primary">Tap to Speak About Your Craft</p>
                      <p className="text-xs text-on-surface-variant max-w-sm">
                        Speak naturally in{' '}
                        {selectedLanguage === 'hi'
                          ? 'Hindi'
                          : selectedLanguage === 'bn'
                          ? 'Bengali'
                          : selectedLanguage === 'or'
                          ? 'Odia'
                          : 'English'}
                        . Our Faster Whisper AI will transcribe your speech and extract verified facts.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Input Mode 2: Audio File Upload */}
            {inputMode === 'upload' && (
              <div className="p-6 bg-white rounded-2xl border border-surface-variant flex flex-col items-center justify-center gap-4 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/wav,audio/mp3,audio/mpeg,audio/webm,audio/ogg,audio/m4a,audio/x-m4a"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {audioBlob ? (
                  <div className="w-full flex flex-col gap-3">
                    <div className="p-4 bg-surface-container-low rounded-xl border border-surface-variant flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleTogglePlayback}
                          aria-label={isPlayingAudio ? 'Pause uploaded audio' : 'Play uploaded audio'}
                          className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-sm hover:bg-primary/90 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955]"
                        >
                          {isPlayingAudio ? (
                            <Pause className="w-4 h-4 text-white" />
                          ) : (
                            <Play className="w-4 h-4 ml-0.5 text-white fill-current" />
                          )}
                        </button>
                        <div className="text-left">
                          <p className="font-bold text-xs text-on-surface truncate max-w-xs">{audioFileName}</p>
                          <p className="text-[10px] text-on-surface-variant">
                            Size: {(audioBlob.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="tertiary"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Choose Other
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleSubmitAudioForTranscription}
                          leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                        >
                          Transcribe File
                        </Button>
                      </div>
                    </div>

                    {audioUrl && (
                      <audio
                        ref={audioPlayerRef}
                        src={audioUrl}
                        onEnded={() => setIsPlayingAudio(false)}
                        className="hidden"
                      />
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-6 w-full">
                    <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center text-primary">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="font-bold text-sm text-primary">Upload Pre-recorded Audio Note</p>
                      <p className="text-xs text-on-surface-variant max-w-sm">
                        Select a voice recording file (.wav, .mp3, .m4a, .webm, .ogg) from your computer or phone.
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      leftIcon={<UploadCloud className="w-4 h-4" />}
                    >
                      Select Audio File
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Input Mode 3: Typed Description Input */}
            {inputMode === 'typed' && (
              <div className="p-4 bg-white rounded-2xl border border-surface-variant flex flex-col gap-3">
                <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  Type your handcrafted item description
                </label>
                <TextArea
                  rows={4}
                  value={typedInputText}
                  onChange={(e) => setTypedInputText(e.target.value)}
                  placeholder="e.g. यह पारंपरिक हथकरघा जामदानी साड़ी है, शुद्ध शहतूत रेशम और प्राकृतिक रंगों से बनी है। लंबाई 5.5 मीटर है।"
                  className="font-sans text-sm"
                />
                <div className="flex justify-end">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSubmitTypedInput}
                    disabled={!typedInputText.trim()}
                    leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                  >
                    Generate Catalogue Suggestions
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP: Transcribing / Generating Spinners */}
        {(step === 'transcribing' || step === 'generating') && (
          <div className="p-12 bg-surface-container-low rounded-2xl border border-surface-variant flex flex-col items-center justify-center gap-4 text-center animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center text-primary animate-spin">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-bold text-base text-primary">
                {step === 'transcribing'
                  ? 'Transcribing Speech with Faster Whisper on Port 8001...'
                  : 'Extracting Verified Facts & Generating Bilingual Copy...'}
              </p>
              <p className="text-xs text-on-surface-variant">
                Grounding physical specifications and building authentic titles in English and selected regional language.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: Transcript Review & Translation (Both Operations) */}
        {step === 'transcript_review' && (
          <div className="flex flex-col gap-4 animate-in fade-in">
            <div className="p-4 bg-white rounded-2xl border border-surface-variant flex flex-col gap-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface">
                    Speech Transcript & Translation Review
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-on-surface-variant font-medium">
                    Source: {selectedLanguage === 'hi' ? 'Hindi (हिन्दी)' : selectedLanguage === 'bn' ? 'Bengali (বাংলা)' : selectedLanguage === 'or' ? 'Odia (ଓଡ଼ିଆ)' : 'English'}
                  </span>
                  <Badge variant="indigo">AI Review Aid</Badge>
                </div>
              </div>

              {/* Audio Playback Bar beside/above transcript */}
              {audioUrl && (
                <div className="p-3 bg-surface-container-low rounded-xl border border-surface-variant/70 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleTogglePlayback}
                      aria-label={isPlayingAudio ? 'Pause recording audio' : 'Play recording audio'}
                      className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shadow-sm hover:bg-primary/90 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955]"
                    >
                      {isPlayingAudio ? (
                        <Pause className="w-4 h-4 text-white" />
                      ) : (
                        <Play className="w-4 h-4 ml-0.5 text-white fill-current" />
                      )}
                    </button>
                    <div className="text-left">
                      <span className="text-xs font-bold text-on-surface block">Listen to Recording</span>
                      <span className="text-[10px] text-on-surface-variant">
                        Listen to verify that recognized words match your speech.
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="tertiary"
                    size="sm"
                    onClick={() => setStep('input_choice')}
                    leftIcon={<RotateCcw className="w-3 h-3" />}
                    className="text-[11px] py-1"
                  >
                    Re-record / Upload
                  </Button>
                </div>
              )}

              {/* Outdated Translation Banner */}
              {englishTranslation && editableTranscript.trim() !== lastTranslatedSourceText.trim() && (
                <div className="p-3 bg-warning-container/30 rounded-xl border border-warning/30 flex items-center justify-between text-xs text-on-warning-container animate-in fade-in">
                  <span>✏️ Source transcript was edited. English translation may be outdated.</span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleTranslateToEnglish()}
                    disabled={isTranslating}
                    leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                  >
                    {isTranslating ? 'Translating...' : 'Re-translate to English'}
                  </Button>
                </div>
              )}

              {/* Side-by-Side (Desktop) / Stacked (Mobile) Editable Text Areas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Column 1: Source Language Transcript */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      Original Transcript ({selectedLanguage === 'hi' ? 'Hindi — हिन्दी' : selectedLanguage === 'bn' ? 'Bengali — বাংলা' : selectedLanguage === 'or' ? 'Odia — ଓଡ଼ିଆ' : 'English'})
                    </label>
                  </div>
                  <TextArea
                    rows={4}
                    value={editableTranscript}
                    onChange={(e) => setEditableTranscript(e.target.value)}
                    placeholder="Source language transcript..."
                    className="font-sans text-sm font-medium leading-relaxed bg-surface-container-low"
                  />
                  <span className="text-[10px] text-on-surface-variant">
                    Edit any recognized words, numbers, or dimensions above.
                  </span>
                </div>

                {/* Column 2: English Translation */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                      <Languages className="w-3.5 h-3.5 text-secondary" />
                      English Translation
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTranslateToEnglish()}
                      disabled={isTranslating || !editableTranscript.trim()}
                      className="text-[11px] py-0.5 px-2 h-auto text-secondary hover:bg-secondary/10"
                    >
                      {isTranslating ? 'Translating...' : englishTranslation ? 'Retranslate' : 'Translate to English'}
                    </Button>
                  </div>
                  <TextArea
                    rows={4}
                    value={englishTranslation}
                    onChange={(e) => setEnglishTranslation(e.target.value)}
                    placeholder={isTranslating ? 'Generating English translation...' : 'English translation will appear here...'}
                    className="font-sans text-sm font-medium leading-relaxed bg-surface-container-low"
                  />
                  <span className="text-[10px] text-on-surface-variant">
                    Faithful English translation preserving stated facts.
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-surface-variant/40">
                <Button
                  variant="tertiary"
                  size="sm"
                  onClick={() => setStep('input_choice')}
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                >
                  Back to Input
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleGenerateFromConfirmedTranscript}
                  disabled={!editableTranscript.trim()}
                  leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                >
                  Confirm & Generate Catalogue
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Bilingual Catalogue Review & Physical Facts */}
        {step === 'catalogue_review' && generationResult && (
          <div className="flex flex-col gap-5 animate-in fade-in">
            {/* Extracted Physical Facts Box */}
            <div className="p-5 bg-white rounded-3xl border border-surface-variant/80 shadow-xs flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                  <Layers className="w-4 h-4 text-secondary" />
                  Extracted Physical Facts
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Ground Truth from Artisan Speech
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Craft Technique', fact: generationResult.structured_fields.craft_technique },
                  { label: 'Materials', fact: generationResult.structured_fields.materials },
                  { label: 'Product Type', fact: generationResult.structured_fields.product_type },
                  { label: 'Dimensions', fact: generationResult.structured_fields.dimensions },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-surface-container-low/70 rounded-2xl border border-surface-variant/50 flex flex-col gap-1.5 transition-colors hover:bg-surface-container-low"
                  >
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">{item.label}</span>
                    <span className="text-xs font-bold text-primary truncate">
                      {item.fact?.value ? (
                        String(item.fact.value)
                      ) : (
                        <span className="text-on-surface-variant/60 font-normal italic">Not specified</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Clarification Questions for Missing Fields */}
            {generationResult.clarification_questions && generationResult.clarification_questions.length > 0 && (
              <div className="p-4 bg-amber-50/90 rounded-2xl border border-amber-200/80 flex flex-col gap-2.5 text-xs text-amber-950 shadow-2xs">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Optional Details to Enrich Catalogue</span>
                </div>
                <ul className="space-y-1.5 pl-1 text-[11px] leading-relaxed">
                  {generationResult.clarification_questions.map((q, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-amber-900">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>
                        {q.field && q.field.trim() ? (
                          <strong className="font-semibold text-amber-950">{q.field}: </strong>
                        ) : null}
                        {q.question}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Side-by-Side Bilingual Title & Description Editors */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* English Version */}
              <div className="p-5 bg-white rounded-3xl border border-surface-variant/80 shadow-xs flex flex-col gap-4">
                <div className="flex items-center justify-between pb-2 border-b border-surface-variant/40">
                  <div className="flex items-center gap-2">
                    <Badge variant="indigo">English Catalogue</Badge>
                    <span className="text-[11px] font-semibold text-on-surface-variant">Buyer Facing</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-primary">Product Title</label>
                  <Input
                    value={editableTitleEn}
                    onChange={(e) => setEditableTitleEn(e.target.value)}
                    className="text-sm font-semibold rounded-xl"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-primary">Description / Artisan Story</label>
                  <TextArea
                    rows={5}
                    value={editableDescEn}
                    onChange={(e) => setEditableDescEn(e.target.value)}
                    className="text-xs sm:text-sm font-normal leading-relaxed rounded-xl min-h-[110px]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-primary">Marketplace Tags</label>
                  <Input
                    value={editableTagsEn}
                    onChange={(e) => setEditableTagsEn(e.target.value)}
                    className="text-xs rounded-xl"
                    placeholder="e.g. saree, handloom, silk, traditional"
                  />
                </div>
              </div>

              {/* Indic Vernacular Version */}
              <div className="p-5 bg-white rounded-3xl border border-surface-variant/80 shadow-xs flex flex-col gap-4">
                <div className="flex items-center justify-between pb-2 border-b border-surface-variant/40">
                  <div className="flex items-center gap-2">
                    <Badge variant="terracotta">
                      {selectedLanguage === 'hi'
                        ? 'हिन्दी (Hindi)'
                        : selectedLanguage === 'bn'
                        ? 'বাংলা (Bengali)'
                        : selectedLanguage === 'or'
                        ? 'ଓଡ଼ିଆ (Odia)'
                        : 'Regional'}{' '}
                      Catalogue
                    </Badge>
                    <span className="text-[11px] font-semibold text-on-surface-variant">Native Script</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-primary">शीर्षक (Title)</label>
                  <Input
                    value={editableTitleIndic}
                    onChange={(e) => setEditableTitleIndic(e.target.value)}
                    className="text-sm font-semibold rounded-xl"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-primary">विवरण (Description)</label>
                  <TextArea
                    rows={5}
                    value={editableDescIndic}
                    onChange={(e) => setEditableDescIndic(e.target.value)}
                    className="text-xs sm:text-sm font-normal leading-relaxed rounded-xl min-h-[110px]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-primary">टैग्स (Tags)</label>
                  <Input
                    value={editableTagsIndic}
                    onChange={(e) => setEditableTagsIndic(e.target.value)}
                    className="text-xs rounded-xl"
                    placeholder="उदा. हथकरघा, रेशम, पारंपरिक"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="sticky -bottom-4 sm:-bottom-5 -mx-5 sm:-mx-6 px-5 sm:px-6 py-3.5 bg-surface-container-lowest/95 backdrop-blur-xs border-t border-surface-variant/60 mt-2 z-10 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <Button
                variant="tertiary"
                size="sm"
                onClick={handleDeleteSourceData}
                disabled={isDeletingData || dataDeletedNotice}
                leftIcon={<Trash2 className="w-3.5 h-3.5 text-error" />}
                className="text-xs"
              >
                {dataDeletedNotice ? 'Audio Deleted' : 'Delete Audio From Server'}
              </Button>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <Button
                  variant="tertiary"
                  size="md"
                  onClick={() => setStep('transcript_review')}
                  className="text-xs font-semibold"
                >
                  Edit Transcript
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleApplyClick}
                  leftIcon={<Check className="w-4 h-4" />}
                  className="font-bold text-xs bg-secondary hover:bg-secondary/90 text-white shadow-sm"
                >
                  Apply to Product Details
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overwrite Confirmation Modal */}
      {overwriteWarningModal && (
        <Modal
          isOpen={overwriteWarningModal}
          onClose={() => setOverwriteWarningModal(false)}
          title="Overwrite Existing Details?"
          maxWidth="sm"
        >
          <div className="flex flex-col gap-4 text-xs">
            <p className="text-on-surface">
              You already have custom text in your product draft. Applying these AI suggestions will update the title and description.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="tertiary" size="sm" onClick={() => setOverwriteWarningModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setOverwriteWarningModal(false);
                  handleApplyToDraftConfirmed();
                }}
              >
                Confirm & Overwrite
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
};
