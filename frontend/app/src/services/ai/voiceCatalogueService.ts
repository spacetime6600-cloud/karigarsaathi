/**
 * KarigarSaathi â€” Voice and Multilingual Auto-Catalogue Service Layer
 * Typed client integration for the Python FastAPI Voice & Multilingual Auto-Catalogue microservice (:8001).
 * Supports speech recording, Faster Whisper transcription, transcript correction,
 * zero-hallucination fact extraction, bilingual catalogue generation, and privacy deletion.
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
  whisper_model?: string;
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
   * Resolves the host base URL for the Voice Auto-Catalogue microservice (port 8001).
   * Automatically adapts localhost -> current hostname when accessing over LAN.
   */
  public getHostBaseUrl(): string {
    const configured = import.meta.env.VITE_VOICE_CATALOGUE_SERVICE_URL;
    if (configured) {
      if (typeof window !== 'undefined' && configured.includes('localhost') && window.location.hostname !== 'localhost') {
        return configured.replace('localhost', window.location.hostname).replace(/\/api\/v1\/?$/, '');
      }
      return configured.replace(/\/api\/v1\/?$/, '');
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
   * Safe fetch wrapper that handles network disconnects and connection refused cleanly.
   */
  private async safeFetch(url: string, init?: RequestInit): Promise<Response> {
    try {
      return await fetch(url, init);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw err;
      }
      throw new VoiceCatalogueError({
        errorCode: 'SERVICE_UNAVAILABLE',
        message: 'Voice service unavailable. Please check that the local AI Voice microservice is running on port 8001.',
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
   * Checks microservice health and model readiness.
   */
  public async checkHealth(timeoutMs = 4000): Promise<VoiceHealthResponse> {
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
      return {
        status: 'unreachable',
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
      throw new VoiceCatalogueError({
        errorCode: `HTTP_${response.status}`,
        message: `Failed to create voice catalogue session (${response.status})`,
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
        errDetail = errJson.detail || '';
      } catch {
        // ignore
      }

      throw new VoiceCatalogueError({
        errorCode: `HTTP_${response.status}`,
        message: errDetail || `Failed to upload audio recording (${response.status})`,
        retryable: response.status >= 500,
      });
    }

    return await response.json();
  }

  /**
   * Triggers Faster Whisper speech transcription for an uploaded session.
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
        errDetail = errJson.detail || '';
      } catch {
        // ignore
      }

      throw new VoiceCatalogueError({
        errorCode: `HTTP_${response.status}`,
        message: errDetail || `Speech transcription failed (${response.status})`,
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
      throw new VoiceCatalogueError({
        errorCode: `HTTP_${response.status}`,
        message: `Failed to update transcript (${response.status})`,
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
        errDetail = errJson.detail || '';
      } catch {
        // ignore
      }

      throw new VoiceCatalogueError({
        errorCode: `HTTP_${response.status}`,
        message: errDetail || `Catalogue generation failed (${response.status})`,
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
   * Direct stateless transcription endpoint.
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
      throw new VoiceCatalogueError({
        errorCode: `HTTP_${response.status}`,
        message: `Direct transcription failed (${response.status})`,
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
      throw new VoiceCatalogueError({
        errorCode: `HTTP_${response.status}`,
        message: `Direct catalogue generation failed (${response.status})`,
        retryable: response.status >= 500,
      });
    }

    return await response.json();
  }

  /**
   * Translates confirmed source transcript via phase14-sarvam (Ollama /api/generate).
   * Uses /pipeline/translate-only which applies correct language routing:
   *   hi -> preserve Hindi + produce English
   *   en -> preserve English + produce Hindi
   *   or/bn/te -> regional -> English -> Hindi
   *
   * Returns both hindi_output and english_output so the UI can display both.
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
      throw new VoiceCatalogueError({
        errorCode: `HTTP_${response.status}`,
        message: `Translation request failed (${response.status})`,
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
      throw new VoiceCatalogueError({
        errorCode: `HTTP_${response.status}`,
        message: `Translation request failed (${response.status})`,
        retryable: response.status >= 500,
      });
    }

    return await response.json();
  }
}

export const voiceCatalogueService = new VoiceCatalogueService();
