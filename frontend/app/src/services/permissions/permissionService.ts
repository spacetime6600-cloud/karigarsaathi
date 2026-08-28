import { storage } from '../storage/localStorage';
import { logger } from '@/services/logging/logger';

export type PermissionStateStatus =
  | 'granted'
  | 'denied'
  | 'prompt'
  | 'dismissed'
  | 'unavailable'
  | 'blocked'
  | 'insecure_context'
  | 'unknown';

export interface PermissionsState {
  camera: PermissionStateStatus;
  microphone: PermissionStateStatus;
}

export interface PermissionRequestResult {
  status: PermissionStateStatus;
  stream?: MediaStream;
  error?: string;
  recoveryInstructions?: string;
  diagnostics?: MicrophoneDiagnostics;
}

export interface MicrophoneDiagnostics {
  origin: string;
  isSecureContext: boolean;
  hasMediaDevices: boolean;
  hasGetUserMedia: boolean;
  hasMediaRecorder: boolean;
  isIframe: boolean;
  permissionQueryStatus: 'granted' | 'denied' | 'prompt' | 'unknown';
  availableAudioInputsCount?: number;
  exceptionName?: string;
  exceptionMessage?: string;
}

const DEFAULT_PERMISSIONS: PermissionsState = {
  camera: 'prompt',
  microphone: 'prompt',
};

export const permissionService = {
  getPermissions(): PermissionsState {
    return storage.get<PermissionsState>('appPermissions', DEFAULT_PERMISSIONS);
  },

  getPermission(type: 'camera' | 'microphone'): PermissionStateStatus {
    return this.getPermissions()[type] || 'prompt';
  },

  setPermission(type: 'camera' | 'microphone', status: PermissionStateStatus): void {
    const current = this.getPermissions();
    current[type] = status;
    storage.set('appPermissions', current);
    logger.info('PERMISSION', `Permission updated: ${type} -> ${status}`);
  },

  resetPermissions(): void {
    storage.set('appPermissions', DEFAULT_PERMISSIONS);
  },

  /**
   * Diagnostic snapshot of the browser environment for microphone access.
   */
  async getMicrophoneDiagnostics(): Promise<MicrophoneDiagnostics> {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'unknown';
    const isSecureContext = typeof window !== 'undefined' ? Boolean(window.isSecureContext) : false;
    const hasMediaDevices = typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices);
    const hasGetUserMedia =
      typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);
    const hasMediaRecorder = typeof window !== 'undefined' && typeof MediaRecorder !== 'undefined';
    const isIframe = typeof window !== 'undefined' ? window.self !== window.top : false;

    let permissionQueryStatus: 'granted' | 'denied' | 'prompt' | 'unknown' = 'unknown';

    if (
      typeof navigator !== 'undefined' &&
      navigator.permissions &&
      typeof navigator.permissions.query === 'function'
    ) {
      try {
        // Querying 'microphone' is supported in Chromium, but may throw in Firefox / Safari
        const permissionStatus = await navigator.permissions.query({
          name: 'microphone' as PermissionName,
        });
        if (permissionStatus.state === 'granted' || permissionStatus.state === 'denied' || permissionStatus.state === 'prompt') {
          permissionQueryStatus = permissionStatus.state;
        }
      } catch {
        // Treat unsupported Permissions API query as unknown
        permissionQueryStatus = 'unknown';
      }
    }

    let availableAudioInputsCount: number | undefined = undefined;
    if (hasMediaDevices && typeof navigator.mediaDevices.enumerateDevices === 'function') {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        availableAudioInputsCount = devices.filter((d) => d.kind === 'audioinput').length;
      } catch {
        // ignore enumeration errors
      }
    }

    return {
      origin,
      isSecureContext,
      hasMediaDevices,
      hasGetUserMedia,
      hasMediaRecorder,
      isIframe,
      permissionQueryStatus,
      availableAudioInputsCount,
    };
  },

  /**
   * Safe camera request with hardware detection and permission caching.
   */
  async requestCamera(): Promise<PermissionRequestResult> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      this.setPermission('camera', 'unavailable');
      return {
        status: 'unavailable',
        error: 'Camera hardware or API is not available on this device.',
        recoveryInstructions: 'Please use the gallery/file picker button to select craft photographs.',
      };
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      this.setPermission('camera', 'granted');
      return {
        status: 'granted',
        stream,
      };
    } catch (err: unknown) {
      const error = err as { name?: string; message?: string };
      logger.warn('PERMISSION', 'Camera access denied or failed', error);

      if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
        this.setPermission('camera', 'denied');
        return {
          status: 'denied',
          error: 'Camera permission was denied.',
          recoveryInstructions:
            'To enable camera access, tap the lock/settings icon in your browser address bar and allow Camera permission, or upload from your device gallery.',
        };
      }

      if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') {
        this.setPermission('camera', 'unavailable');
        return {
          status: 'unavailable',
          error: 'No camera device found.',
          recoveryInstructions: 'Please use the device file picker to select photos.',
        };
      }

      this.setPermission('camera', 'blocked');
      return {
        status: 'blocked',
        error: error?.message || 'Unable to access camera.',
        recoveryInstructions: 'Please check your browser settings or select photos from your device storage.',
      };
    }
  },

  /**
   * Safe microphone request with precise diagnostic detection and recovery guidance.
   */
  async requestMicrophone(signal?: AbortSignal): Promise<PermissionRequestResult> {
    const isAiEnabled =
      import.meta.env.VITE_AI_ENABLED !== 'false' &&
      import.meta.env.VITE_AI_ENABLED !== false &&
      import.meta.env.VITE_VOICE_CATALOGUE_ENABLED !== 'false' &&
      import.meta.env.VITE_VOICE_CATALOGUE_ENABLED !== false;

    const diagnostics = await this.getMicrophoneDiagnostics();

    if (!isAiEnabled) {
      logger.info('PERMISSION', 'Microphone requested with AI disabled');
      return {
        status: 'unavailable',
        error: 'Voice description is disabled in configuration. You can type craft details directly.',
        recoveryInstructions: 'Type your craft story and specifications directly in the provided text fields.',
        diagnostics,
      };
    }

    // 1. Check for Insecure Context (e.g. accessed over HTTP on LAN IP http://10.5.0.2:3001)
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      this.setPermission('microphone', 'insecure_context');
      logger.warn('PERMISSION', 'Microphone blocked due to insecure context (non-localhost HTTP origin)', {
        origin: diagnostics.origin,
      });

      return {
        status: 'insecure_context',
        error: `Microphone recording requires a Secure Context (HTTPS or localhost). Accessing over unencrypted network address (${diagnostics.origin}) disables browser audio capture.`,
        recoveryInstructions:
          'To record audio directly: 1. Open the app via http://localhost:3001 on the host computer, or 2. Use the "Upload Audio File" button to upload a voice recording, or 3. Type your craft description.',
        diagnostics,
      };
    }

    // 2. Check for missing MediaDevices API
    if (!diagnostics.hasMediaDevices || !diagnostics.hasGetUserMedia) {
      this.setPermission('microphone', 'unavailable');
      return {
        status: 'unavailable',
        error: 'Microphone hardware or audio recording API is not supported in this browser.',
        recoveryInstructions:
          'You can upload a pre-recorded audio file (WAV/MP3/M4A) or type your craft description.',
        diagnostics,
      };
    }

    // Check if aborted before initiating prompt
    if (signal?.aborted) {
      return {
        status: 'dismissed',
        error: 'Microphone request was cancelled.',
        diagnostics,
      };
    }

    try {
      // Clean audio constraints avoiding device-specific locks
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Check if aborted while prompt was open
      if (signal?.aborted) {
        this.stopMediaStream(stream);
        return {
          status: 'dismissed',
          error: 'Microphone request was cancelled.',
          diagnostics,
        };
      }

      this.setPermission('microphone', 'granted');
      return {
        status: 'granted',
        stream,
        diagnostics,
      };
    } catch (err: unknown) {
      const error = err as { name?: string; message?: string };
      diagnostics.exceptionName = error?.name;
      diagnostics.exceptionMessage = error?.message;

      logger.warn('PERMISSION', 'Microphone access denied or failed', {
        name: error?.name,
        message: error?.message,
        origin: diagnostics.origin,
      });

      // NotAllowedError / PermissionDeniedError
      if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
        this.setPermission('microphone', 'denied');
        return {
          status: 'denied',
          error: 'Microphone permission was denied by browser or operating system.',
          recoveryInstructions:
            'To enable recording: 1. Tap the site settings/padlock icon in your browser address bar and allow Microphone. 2. On Windows, verify Settings -> Privacy & security -> Microphone is enabled. Alternatively, use "Upload Audio File" or type your description.',
          diagnostics,
        };
      }

      // NotFoundError / DevicesNotFoundError
      if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') {
        this.setPermission('microphone', 'unavailable');
        return {
          status: 'unavailable',
          error: 'No microphone hardware device was found on this system.',
          recoveryInstructions:
            'Please connect a microphone or headset, upload a recorded audio file, or type your craft description.',
          diagnostics,
        };
      }

      // NotReadableError / TrackStartError
      if (error?.name === 'NotReadableError' || error?.name === 'TrackStartError') {
        this.setPermission('microphone', 'blocked');
        return {
          status: 'blocked',
          error: 'Microphone is currently in use by another application or audio driver.',
          recoveryInstructions:
            'Close other applications using the microphone and click "Retry Microphone", or upload an audio file.',
          diagnostics,
        };
      }

      // OverconstrainedError
      if (error?.name === 'OverconstrainedError') {
        // Fallback with bare minimum constraints
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          if (signal?.aborted) {
            this.stopMediaStream(fallbackStream);
            return { status: 'dismissed', diagnostics };
          }
          this.setPermission('microphone', 'granted');
          return { status: 'granted', stream: fallbackStream, diagnostics };
        } catch {
          // Fall through
        }
      }

      // SecurityError (e.g. iframe policy)
      if (error?.name === 'SecurityError') {
        this.setPermission('microphone', 'blocked');
        return {
          status: 'blocked',
          error: 'Microphone access is blocked by security or iframe policy restrictions.',
          recoveryInstructions: 'Please open the application in a standalone browser tab.',
          diagnostics,
        };
      }

      this.setPermission('microphone', 'unavailable');
      return {
        status: 'unavailable',
        error: error?.message || 'Unable to access microphone.',
        recoveryInstructions:
          'You can upload a pre-recorded audio file (WAV/MP3/M4A) or type your craft description.',
        diagnostics,
      };
    }
  },

  /**
   * Release all MediaStream tracks immediately to avoid leaving camera/microphone active.
   */
  stopMediaStream(stream?: MediaStream | null): void {
    if (!stream) return;
    try {
      const tracks = stream.getTracks();
      for (const track of tracks) {
        track.stop();
      }
      logger.debug('PERMISSION', `Stopped ${tracks.length} MediaStream tracks`);
    } catch (err) {
      logger.warn('PERMISSION', 'Error stopping MediaStream tracks', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },
};
