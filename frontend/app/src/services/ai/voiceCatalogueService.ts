/**
 * KarigarSaathi — Voice and Multilingual Auto-Catalogue Service Layer
 * Typed client integration for the Python FastAPI Voice & Multilingual Auto-Catalogue microservice.
 * Powered by Sarvam AI (Saaras STT & Mayura Translation).
 * Supports speech recording, transcript review/correction, zero-hallucination fact extraction,
 * bilingual catalogue generation, and privacy deletion.
 */

import { auth } from '@/config/firebase';
import {
  VoiceSupportedLanguage,
  VoiceTranscriptionResult,
  CatalogueGenerationResult,
} from '@/types';

export interface VoiceHealthResponse {
  status: string;
  service: string;
  model_ready: boolean;
  speech_engine?: string;
  speech_model?: string;
  supported_languages?: string[];
}

export interface VoiceSessionResponse {
  session_id: string;
  status: string;
  selected_language: string;
  user_id?: string;
}

export interface AudioUploadResponse {
  recording_id: string;
  stored_filename: string;
  file_size_bytes: number;
  status: string;
}

export interface VoiceClientError {
  errorCode: string;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}

export class VoiceCatalogueError extends Error {
  public errorCode: string;
  public retryable: boolean;
  public details?: Record<string, unknown>;

  constructor(clientError: VoiceClientError) {
    super(clientError.message);
    this.name = 'VoiceCatalogueError';
    this.errorCode = clientError.errorCode;
    this.retryable = clientError.retryable;
    this.details = clientError.details;
  }
}

class VoiceCatalogueService {
  /**
   * Returns true if Voice Auto-Catalogue is enabled via environment config.
   */
  public isVoiceEnabled(): boolean {
    const globalFlag = import.meta.env.VITE_AI_ENABLED;
    if (globalFlag === 'false' || globalFlag === false) return false;

    const voiceFlag = import.meta.env.VITE_VOICE_CATALOGUE_ENABLED;
    if (voiceFlag === 'false' || voiceFlag === false) return false;

    return true;
  }

  /**
   * Resolves the host base URL for the Voice Auto-Catalogue backend.
   * In production (Vercel or any non-localhost host), strictly uses the public HTTPS backend.
   * In local development, defaults to port 8001 on localhost.
   */
  public getHostBaseUrl(): string {
    const configured = import.meta.env.VITE_VOICE_CATALOGUE_SERVICE_URL;
    if (configured) {
      if (typeof window !== 'undefined' && configured.includes('localhost') && window.location.hostname !== 'localhost') {
        return configured.replace('localhost', window.location.hostname).replace(/\/api\/v1\/?$/, '');
      }
      return configured.replace(/\/api\/v1\/?$/, '');
    }

    // Never fall back to localhost on deployed production instances (Vercel, HTTPS, etc.)
    const isProduction =
      import.meta.env.PROD ||
      (typeof window !== 'undefined' &&
        (window.location.hostname.includes('vercel.app') || window.location.protocol === 'https:'));

    if (isProduction) {
      return 'https://karigarsaathi-ai-voice.onrender.com';
    }

    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      return `http://${window.location.hostname}:8001`;
    }

    return 'http://127.0.0.1:8001';
  }

  /**
   * Resolves the API base URL with /api/v1 prefix for the Voice Auto-Catalogue microservice.
   */
  public getServiceBaseUrl(): string {
    return `${this.getHostBaseUrl()}/api/v1`;
  }

  /**
   * Sanitizes error messages from backend responses, mapping them to friendly, actionable guidance.
   * Never exposes raw internal errors (e.g. urlopen error [Errno 111]).
   */
  public extractErrorMessage(errJson: unknown, defaultMsg: string = 'An error occurred'): string {
    const obj = errJson && typeof errJson === 'object' ? (errJson as Record<string, unknown>) : null;
    const errObj = obj?.error && typeof obj.error === 'object' ? (obj.error as Record<string, unknown>) : null;
    const raw =
      obj?.detail ||
      errObj?.message ||
      obj?.message ||
      (typeof errJson === 'string' ? errJson : '');

    if (!raw) return defaultMsg;

    const str = String(raw);

    if (str.includes('urlopen error') || str.includes('Connection refused') || str.includes('Ollama unreachable')) {
      return 'Voice backend could not reach the translation service. Please verify server connectivity or try again.';
    }
    if (str.includes('SARVAM_KEY_MISSING')) {
      return 'Sarvam API key is not configured on the voice server. Please configure SARVAM_API_KEY on the Render service.';
    }
    if (str.includes('SARVAM_KEY_INVALID')) {
      return 'Invalid or expired Sarvam API key. Please check SARVAM_API_KEY in server environment.';
    }
    if (str.includes('SARVAM_INSUFFICIENT_CREDITS')) {
      return 'Insufficient Sarvam API credits. Please replenish credits in your Sarvam account.';
    }
    if (str.includes('SARVAM_RATE_LIMITED')) {
      return 'Sarvam API rate limit exceeded. Please wait a moment and retry.';
    }
    if (str.includes('SARVAM_NETWORK_TIMEOUT')) {
      return 'Sarvam AI request timed out. Please try again.';
    }
    if (str.includes('SARVAM_NETWORK_ERROR')) {
      return 'Unable to reach Sarvam AI services. Please verify internet connectivity or retry.';
    }

    return str;
  }

  /**
   * Safe fetch wrapper that handles network disconnects and Render wake-up cleanly.
   */
  private async safeFetch(url: string, init?: RequestInit): Promise<Response> {
    try {
      return await fetch(url, init);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw err;
      }
      const isRender = url.includes('onrender.com');
      const message = isRender
        ? 'Voice service is starting up on Render (free tier cold start can take 30–50s). Please wait a moment and retry.'
        : 'Voice service unavailable. Please check that the voice service is reachable and retry.';

      throw new VoiceCatalogueError({
        errorCode: 'SERVICE_UNAVAILABLE',
        message,
        retryable: true,
        details: { url, error: err instanceof Error ? err.message : String(err) },
      });
    }
  }

  /**
   * Obtains an authorization token for the microservice.
   */
  private async getAuthToken(): Promise<string> {
    try {
      if (auth?.currentUser) {
        const idToken = await auth.currentUser.getIdToken();
        if (idToken) return idToken;
      }
    } catch {
      // Fall through to dev token
    }

    return import.meta.env.VITE_AI_DEV_BEARER_TOKEN || 'mock_firebase_artisan_token';
  }

  /**
   * Checks microservice health and model readiness without spending any Sarvam credits.
   * Handles waking Render services with a reasonable timeout.
   */
  public async checkHealth(timeoutMs = 12000): Promise<VoiceHealthResponse> {
    if (!this.isVoiceEnabled()) {
      return {
        status: 'disabled',
        service: 'KarigarSaathi Voice Studio',
        model_ready: false,
      };
    }

    const healthUrl = `${this.getHostBaseUrl()}/health`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(healthUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      clearTimeout(timer);
      const isTimeout = err instanceof Error && err.name === 'AbortError';
      return {
        status: isTimeout ? 'starting' : 'unreachable',
        service: 'KarigarSaathi Voice Studio',
        model_ready: false,
      };
    }
  }

  /**
   * Creates a new catalogue session.
   */
  public async createSession(params: {
    selectedLanguage?: VoiceSupportedLanguage;
    consentGranted?: boolean;
    retentionChoice?: string;
  }): Promise<VoiceSessionResponse> {
    const baseUrl = this.getServiceBaseUrl();
    const token = await this.getAuthToken();

    const response = await this.safeFetch(`${baseUrl}/catalogue-sessions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        selected_language: params.selectedLanguage || 'hi',
        consent_granted: params.consentGranted ?? true,
        retention_choice: params.retentionChoice || '30_days',
      }),
    });

    if (!response.ok) {
      let errDetail = '';
      try {
        const errJson = await response.json();
        errDetail = this.extractErrorMessage(errJson, `Failed to create voice catalogue session (${response.status})`);
      } catch {
        errDetail = `Failed to create voice catalogue session (${response.status})`;
      }

      throw new VoiceCatalogueError({
        errorCode: `HTTP_${response.status}`,
        message: errDetail,
        retryable: true,
      });
    }

    return await response.json();
  }

  /**
   * Uploads an audio recording for a session.
   */
  public async uploadAudio(params: {
    sessionId: string;
    audioBlob: Blob;
    filename?: string;
    signal?: AbortSignal;
  }): Promise<AudioUploadResponse> {
    const { sessionId, audioBlob, filename = 'recording.wav', signal } = params;
    const baseUrl = this.getServiceBaseUrl();
    const token = await this.getAuthToken();

    const formData = new FormData();
    formData.append('audio_file', audioBlob, filename);

    const response = await this.safeFetch(`${baseUrl}/catalogue-sessions/${sessionId}/audio`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      body: formData,
      signal,
    });

    if (!response.ok) {
      let errDetail = '';
      try {
        const errJson = await response.json();
        errDetail = this.extractErrorMessage(errJson, `Failed to upload audio recording (${response.status})`);
      } catch {
        errDetail = `Failed to upload audio recording (${response.status})`;
      }

      throw new VoiceCatalogueError({
        errorCode: `HTTP_${response.status}`,
        message: errDetail,
        retryable: response.status >= 500,
      });
    }

    return await response.json();
  }

  /**
   * Triggers Sarvam Saaras AI speech transcription for an uploaded session.
   */
  public async processAudio(params: {
    sessionId: string;
    signal?: AbortSignal;
  }): Promise<VoiceTranscriptionResult> {
    const { sessionId, signal } = params;
    const baseUrl = this.getServiceBaseUrl();
    const token = await this.getAuthToken();

    const response = await this.safeFetch(`${baseUrl}/catalogue-sessions/${sessionId}/process`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      signal,
    });

    if (!response.ok) {
      let errDetail = '';
      try {
        const errJson = await response.json();
        errDetail = this.extractErrorMessage(errJson, `Speech transcription failed (${response.status})`);
      } catch {
        errDetail = `Speech transcription failed (${response.status})`;
      }

      throw new VoiceCatalogueError({
        errorCode: `HTTP_${response.status}`,
        message: errDetail,
        retryable: response.status >= 500,
      });
    }

    return await response.json();
  }

  /**
   * Updates / corrects the transcript text for a session.
   */
  public async updateTranscript(params: {
    sessionId: string;
    correctedText: string;
  }): Promise<{ session_id: string; corrected_text: string }> {
    const { sessionId, correctedText } = params;
    const baseUrl = this.getServiceBaseUrl();
    const token = await this.getAuthToken();

    const response = await this.safeFetch(`${baseUrl}/catalogue-sessions/${sessionId}/transcript`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ corrected_text: correctedText }),
    });

    if (!response.ok) {
      let errDetail = '';
      try {
        const errJson = await response.json();
        errDetail = this.extractErrorMessage(errJson, `Failed to update transcript (${response.status})`);
      } catch {
        errDetail = `Failed to update transcript (${response.status})`;
      }

      throw new VoiceCatalogueError({
        errorCode: `HTTP_${response.status}`,
        message: errDetail,
        retryable: true,
      });
    }

    return await response.json();
  }

  /**
   * Generates bilingual catalogue suggestions from confirmed transcript and draft facts.
   */
  public async generateCatalogue(params: {
    sessionId: string;
    text?: string;
    existingFields?: Record<string, unknown>;
    signal?: AbortSignal;
  }): Promise<CatalogueGenerationResult> {
    const { sessionId, text, existingFields, signal } = params;
    const baseUrl = this.getServiceBaseUrl();
    const token = await this.getAuthToken();

    const response = await this.safeFetch(`${baseUrl}/catalogue-sessions/${sessionId}/generate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        text,
        existing_fields: existingFields,
      }),
      signal,
    });

    if (!response.ok) {
      let errDetail = '';
      try {
        const errJson = await response.json();
        errDetail = this.extractErrorMessage(errJson, `Catalogue generation failed (${response.status})`);
      } catch {
        errDetail = `Catalogue generation failed (${response.status})`;
      }

      throw new VoiceCatalogueError({
        errorCode: `HTTP_${response.status}`,
        message: errDetail,
        retryable: response.status >= 500,
      });
    }

    return await response.json();
  }

  /**
   * Explicitly approves the catalogue, creating an immutable snapshot.
   */
  public async approveCatalogue(params: {
    sessionId: string;
  }): Promise<{ session_id: string; approved: boolean; snapshot_id: string }> {
    const { sessionId } = params;
    const baseUrl = this.getServiceBaseUrl();
    const token = await this.getAuthToken();

    const response = await this.safeFetch(`${baseUrl}/catalogue-sessions/${sessionId}/approve`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new VoiceCatalogueError({
        errorCode: `HTTP_${response.status}`,
        message: `Failed to approve catalogue (${response.status})`,
        retryable: true,
      });
    }

    return await response.json();
  }

  /**
   * Deletes audio recording and raw transcript data from the server.
   */
  public async deleteSourceData(params: {
    sessionId: string;
  }): Promise<{ session_id: string; status: string }> {
    const { sessionId } = params;
    const baseUrl = this.getServiceBaseUrl();
    const token = await this.getAuthToken();

    const response = await this.safeFetch(`${baseUrl}/catalogue-sessions/${sessionId}/source-data`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new VoiceCatalogueError({
        errorCode: `HTTP_${response.status}`,
        message: `Failed to delete source data (${response.status})`,
        retryable: true,
      });
    }

    return await response.json();
  }

  /**
   * Direct stateless transcription endpoint via Sarvam Saaras AI.
   */
  public async transcribeDirect(params: {
    audioBlob: Blob;
    languageHint?: VoiceSupportedLanguage;
    signal?: AbortSignal;
  }): Promise<VoiceTranscriptionResult> {
    const { audioBlob, languageHint, signal } = params;
    const baseUrl = this.getServiceBaseUrl();

    const formData = new FormData();
    formData.append('audio_file', audioBlob, 'direct_audio.wav');
    if (languageHint) {
      formData.append('language_hint', languageHint);
    }

    const response = await this.safeFetch(`${baseUrl}/transcribe`, {
      method: 'POST',
      body: formData,
      signal,
    });

    if (!response.ok) {
      let errDetail = '';
      try {
        const errJson = await response.json();
        errDetail = this.extractErrorMessage(errJson, `Direct transcription failed (${response.status})`);
      } catch {
        errDetail = `Direct transcription failed (${response.status})`;
      }

      throw new VoiceCatalogueError({
        errorCode: `HTTP_${response.status}`,
        message: errDetail,
        retryable: response.status >= 500,
      });
    }

    return await response.json();
  }

  /**
   * Direct stateless catalogue generation from text.
   */
  public async generateDirect(params: {
    text: string;
    sourceLanguage?: VoiceSupportedLanguage;
    targetLanguage?: VoiceSupportedLanguage;
    existingFields?: Record<string, unknown>;
    signal?: AbortSignal;
  }): Promise<CatalogueGenerationResult> {
    const { text, sourceLanguage = 'en', targetLanguage = 'hi', existingFields, signal } = params;
    const baseUrl = this.getServiceBaseUrl();

    const response = await this.safeFetch(`${baseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        text,
        source_language: sourceLanguage,
        target_language: targetLanguage,
        existing_fields: existingFields,
      }),
      signal,
    });

    if (!response.ok) {
      let errDetail = '';
      try {
        const errJson = await response.json();
        errDetail = this.extractErrorMessage(errJson, `Direct catalogue generation failed (${response.status})`);
      } catch {
        errDetail = `Direct catalogue generation failed (${response.status})`;
      }

      throw new VoiceCatalogueError({
        errorCode: `HTTP_${response.status}`,
        message: errDetail,
        retryable: response.status >= 500,
      });
    }

    return await response.json();
  }

  /**
   * Translates confirmed/edited source transcript via Sarvam AI translation API.
   * Uses /pipeline/translate-only which applies faithful craft language routing:
   *   hi -> preserve Hindi + produce English
   *   en -> preserve English + produce Hindi
   *   or/bn/te -> regional -> English -> Hindi
   *
   * Returns both hindi_output and english_output so the UI can display and edit both.
   */
  public async translateWithSarvam(params: {
    correctedTranscript: string;
    sourceLanguage: VoiceSupportedLanguage;
    signal?: AbortSignal;
  }): Promise<{
    hindi_output: string | null;
    english_output: string | null;
    routing_path: string[];
    review_required: boolean;
    review_reason: string | null;
  }> {
    const { correctedTranscript, sourceLanguage, signal } = params;
    const baseUrl = this.getServiceBaseUrl();

    const response = await this.safeFetch(`${baseUrl}/pipeline/translate-only`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        corrected_transcript: correctedTranscript,
        source_language: sourceLanguage,
      }),
      signal,
    });

    if (!response.ok) {
      let errDetail = '';
      try {
        const errJson = await response.json();
        errDetail = this.extractErrorMessage(errJson, `Translation request failed (${response.status})`);
      } catch {
        errDetail = `Translation request failed (${response.status})`;
      }

      throw new VoiceCatalogueError({
        errorCode: `HTTP_${response.status}`,
        message: errDetail,
        retryable: response.status >= 500,
      });
    }

    return await response.json();
  }

  /**
   * Translates confirmed source transcript into English (or another target language).
   * @deprecated Use translateWithSarvam() for the full bilingual pipeline.
   */
  public async translateText(params: {
    text: string;
    sourceLanguage?: VoiceSupportedLanguage;
    targetLanguage?: VoiceSupportedLanguage;
    signal?: AbortSignal;
  }): Promise<{ source_text: string; translated_text: string; source_language: string; target_language: string }> {
    const { text, sourceLanguage = 'hi', targetLanguage = 'en', signal } = params;
    const baseUrl = this.getServiceBaseUrl();

    const response = await this.safeFetch(`${baseUrl}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        text,
        source_language: sourceLanguage,
        target_language: targetLanguage,
      }),
      signal,
    });

    if (!response.ok) {
      let errDetail = '';
      try {
        const errJson = await response.json();
        errDetail = this.extractErrorMessage(errJson, `Translation request failed (${response.status})`);
      } catch {
        errDetail = `Translation request failed (${response.status})`;
      }

      throw new VoiceCatalogueError({
        errorCode: `HTTP_${response.status}`,
        message: errDetail,
        retryable: response.status >= 500,
      });
    }

    return await response.json();
  }
}

export const voiceCatalogueService = new VoiceCatalogueService();
