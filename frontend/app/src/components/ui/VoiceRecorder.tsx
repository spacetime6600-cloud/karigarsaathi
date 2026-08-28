import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Sparkles, AlertCircle, RefreshCw, UploadCloud } from 'lucide-react';
import { permissionService, MicrophoneDiagnostics } from '@/services/permissions/permissionService';
import { Button } from './Button';

export interface VoiceRecorderProps {
  onTranscriptReady: (transcript: string, confidence: number) => void;
  onPermissionDenied?: (diagnostics?: MicrophoneDiagnostics) => void;
  onOpenStudio?: () => void;
  simulatedSampleTranscript?: string;
  isSimulatingDenied?: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscriptReady,
  onPermissionDenied,
  onOpenStudio,
  simulatedSampleTranscript = 'यह पारंपरिक शहतूत रेशम की हाथ से बुनी गई जामदानी साड़ी है। इसमें प्राकृतिक टेराकोटा रंगों का प्रयोग हुआ है। लंबाई 5.5 मीटर है।',
  isSimulatingDenied = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [micError, setMicError] = useState<{
    status: string;
    error: string;
    recoveryInstructions?: string;
  } | null>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaStreamRef.current) {
        permissionService.stopMediaStream(mediaStreamRef.current);
      }
    };
  }, []);

  const handleStart = async () => {
    setMicError(null);

    if (isSimulatingDenied) {
      if (onPermissionDenied) onPermissionDenied();
      return;
    }

    const result = await permissionService.requestMicrophone();

    if (result.status !== 'granted' || !result.stream) {
      setMicError({
        status: result.status,
        error: result.error || 'Microphone unavailable.',
        recoveryInstructions: result.recoveryInstructions,
      });
      if (onPermissionDenied) onPermissionDenied(result.diagnostics);
      return;
    }

    mediaStreamRef.current = result.stream;
    setIsRecording(true);
    setSeconds(0);

    timerRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
  };

  const handleStop = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaStreamRef.current) {
      permissionService.stopMediaStream(mediaStreamRef.current);
      mediaStreamRef.current = null;
    }

    setIsRecording(false);
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      onTranscriptReady(simulatedSampleTranscript, 0.94);
    }, 1000);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full flex flex-col items-center justify-center p-5 bg-surface-container-low rounded-2xl border border-surface-variant gap-3 text-center">
      {micError ? (
        <div className="flex flex-col items-center gap-2.5 w-full text-left p-3 bg-warning-container/30 rounded-xl border border-warning/30 text-xs">
          <div className="flex items-start gap-2 text-warning">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block text-on-surface">
                {micError.status === 'insecure_context'
                  ? 'Microphone Insecure Context'
                  : 'Microphone Unavailable'}
              </span>
              <p className="text-[11px] text-on-surface-variant mt-0.5">{micError.error}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-1.5 w-full pt-1 border-t border-warning/20">
            <Button
              size="sm"
              variant="tertiary"
              onClick={handleStart}
              leftIcon={<RefreshCw className="w-3 h-3" />}
              className="text-[11px] py-1"
            >
              Retry
            </Button>
            {onOpenStudio && (
              <Button
                size="sm"
                variant="secondary"
                onClick={onOpenStudio}
                leftIcon={<UploadCloud className="w-3 h-3" />}
                className="text-[11px] py-1"
              >
                Open Studio / Upload
              </Button>
            )}
          </div>
        </div>
      ) : isProcessing ? (
        <div className="flex flex-col items-center gap-3 py-4 animate-in fade-in">
          <div className="w-14 h-14 rounded-full bg-primary-fixed flex items-center justify-center text-primary animate-spin">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="font-bold text-sm text-primary">Transcribing & Extracting Craft Facts...</p>
            <p className="text-[11px] text-on-surface-variant">Processing multi-dialect vernacular voice input</p>
          </div>
        </div>
      ) : isRecording ? (
        <div className="flex flex-col items-center gap-3 py-2 w-full animate-in fade-in">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-20 h-20 bg-error-container rounded-full animate-ping opacity-50" />
            <button
              type="button"
              onClick={handleStop}
              aria-label="Stop recording audio"
              className="relative z-10 w-16 h-16 rounded-full bg-error text-white flex items-center justify-center shadow-lg hover:bg-red-700 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-fixed-dim"
            >
              <Square className="w-6 h-6 fill-current" />
            </button>
          </div>

          <div className="flex flex-col items-center gap-0.5">
            <span className="font-mono font-bold text-lg text-error tracking-wider">
              {formatTime(seconds)}
            </span>
            <p className="text-xs font-bold text-on-surface">Listening... Speak about your craft</p>
            <p className="text-[11px] text-on-surface-variant">Tap red square when finished speaking</p>
          </div>

          {/* Soundwave Simulation */}
          <div className="flex items-center gap-1.5 h-6">
            {[40, 75, 55, 90, 60, 100, 45, 80, 65, 95, 50, 85, 70, 40].map((h, i) => (
              <div
                key={i}
                className="w-1 bg-secondary rounded-full animate-pulse"
                style={{
                  height: `${h}%`,
                  animationDuration: `${0.6 + (i % 5) * 0.2}s`,
                }}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2.5 py-1 w-full">
          <button
            type="button"
            onClick={handleStart}
            aria-label="Start recording voice description"
            className="w-16 h-16 rounded-full bg-secondary text-white flex items-center justify-center shadow-md hover:bg-secondary-hover transition-all touch-target active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-fixed-dim"
          >
            <Mic className="w-8 h-8" />
          </button>
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-sm text-primary">Tap to Speak</span>
            <p className="text-[11px] text-on-surface-variant max-w-xs">
              Describe materials, weaving process, sizing, and artisan story in your regional language.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
