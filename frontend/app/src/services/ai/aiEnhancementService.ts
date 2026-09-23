/**
 * KarigarSaathi — AI Image Studio Service Layer
 * Typed client integration for the Python FastAPI Image Studio microservice.
 * Enforces consent, authentication headers, error classification, AbortController cancellation,
 * and zero generative modifications.
 */

import { auth } from '@/config/firebase';
import { logger } from '@/services/logging/logger';
import {
  EnhancementStatus,
  QualityMetrics,
} from '@/types';

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  model_ready: boolean;
}

export interface EnhanceImageRequestParams {
  imageBlob: Blob;
  consentGranted: boolean;
  requestId: string;
  productId: string;
  artisanId: string;
  operations?: ('background_removal' | 'lighting_correction' | 'centring' | 'standard_resize')[];
  outputSize?: 512 | 768 | 1024;
  background?: 'white' | 'transparent';
  signal?: AbortSignal;
}

export interface JobResult {
  job_id: string;
  request_id: string;
  artisan_id: string;
  product_id: string;
  status: EnhancementStatus;
  original_image_reference?: string;
  enhanced_image_reference?: string;
  preview_image_reference?: string;
  operations_requested: string[];
  operations_applied: string[];
  warnings: string[];
  metrics: QualityMetrics;
  processing_duration_ms: number;
  retryable: boolean;
  failure_code?: string;
  adapter_version: string;
  created_at: string;
  completed_at?: string;
  enhancedDataUrl?: string; // Client-cached data URL or object URL for display
  previewDataUrl?: string;
}

export interface AIClientError {
  errorCode: string;
  message: string;
  retryable: boolean;
  requestId?: string;
  details?: Record<string, unknown>;
}

export class AIEnhancementError extends Error {
  public errorCode: string;
  public retryable: boolean;
  public requestId?: string;
  public details?: Record<string, unknown>;

  constructor(clientError: AIClientError) {
    super(clientError.message);
    this.name = 'AIEnhancementError';
    this.errorCode = clientError.errorCode;
    this.retryable = clientError.retryable;
    this.requestId = clientError.requestId;
    this.details = clientError.details;
  }
}

class AIEnhancementService {
  private activeAbortControllers = new Map<string, AbortController>();

  /**
   * Returns true if AI capability is enabled via environment config.
   */
  public isAiEnabled(): boolean {
    const flag = import.meta.env.VITE_AI_ENABLED;
    if (flag === 'false' || flag === false) return false;
    return true;
  }

  /**
   * Retrieves the base URL for the AI Image Studio microservice.
   */
  public getServiceBaseUrl(): string {
    const configuredUrl = import.meta.env.VITE_AI_SERVICE_URL;
    if (configuredUrl) return configuredUrl;

    // Dynamically resolve hostname for remote clients (e.g. 10.5.0.2:3001 -> 10.5.0.2:8000)
    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname;
      if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return `${window.location.protocol}//${hostname}:8000`;
      }
    }

    return 'http://localhost:8000';
  }

  /**
   * Obtains an authorization token for the microservice.
   * Uses Firebase ID token when signed in, or configured dev token in dev mode.
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

    return import.meta.env.VITE_AI_DEV_BEARER_TOKEN || 'your-dev-token-here';
  }

  /**
   * Health check endpoint to verify AI microservice availability and model readiness.
   */
  public async checkHealth(timeoutMs = 4000): Promise<HealthResponse> {
    if (!this.isAiEnabled()) {
      return {
        status: 'disabled',
        service: 'KarigarSaathi AI Image Studio',
        version: '0.1.0',
        model_ready: false,
      };
    }

    const baseUrl = this.getServiceBaseUrl();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      });

      clearTimeout(timer);

      if (!res.ok) {
        throw new Error(`AI service returned HTTP ${res.status}`);
      }

      const data: HealthResponse = await res.json();
      return data;
    } catch (err) {
      clearTimeout(timer);
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn('SYSTEM', `AI service health check unreachable at ${baseUrl}`, { error: msg });
      return {
        status: 'unreachable',
        service: 'KarigarSaathi AI Image Studio',
        version: '0.1.0',
        model_ready: false,
      };
    }
  }

  /**
   * Submits an image for AI enhancement (background removal, lighting normalization, centring).
   */
  public async enhanceImage(params: EnhanceImageRequestParams): Promise<JobResult> {
    const {
      imageBlob,
      consentGranted,
      requestId,
      productId,
      artisanId,
      operations = ['background_removal', 'lighting_correction', 'centring', 'standard_resize'],
      outputSize = 512,
      background = 'white',
      signal,
    } = params;

    // 1. Feature Flag & Auth Check
    if (!this.isAiEnabled()) {
      throw new AIEnhancementError({
        errorCode: 'AI_DISABLED',
        message: 'AI image enhancement is currently disabled. You can continue using your authentic original photo.',
        retryable: false,
        requestId,
      });
    }

    const resolvedArtisanId = (artisanId && artisanId.trim()) || auth?.currentUser?.uid || '';
    if (!resolvedArtisanId || resolvedArtisanId === 'artisan_default') {
      throw new AIEnhancementError({
        errorCode: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required: Please sign in before submitting images for AI enhancement.',
        retryable: false,
        requestId,
      });
    }

    // 2. Connectivity Check
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (!isOnline) {
      throw new AIEnhancementError({
        errorCode: 'OFFLINE_SERVICE_UNAVAILABLE',
        message: 'AI image enhancement requires an active internet connection. Your original photo is safely saved offline.',
        retryable: true,
        requestId,
      });
    }

    // 3. Explicit Artisan Consent Gate
    if (!consentGranted) {
      throw new AIEnhancementError({
        errorCode: 'CONSENT_REQUIRED',
        message: 'Explicit artisan consent is required before processing product photographs.',
        retryable: false,
        requestId,
      });
    }

    // 4. Register AbortController for Cancellation
    const internalController = new AbortController();
    this.activeAbortControllers.set(requestId, internalController);

    // Forward external signal if supplied
    if (signal) {
      signal.addEventListener('abort', () => {
        internalController.abort();
        this.activeAbortControllers.delete(requestId);
      });
    }

    const token = await this.getAuthToken();
    const baseUrl = this.getServiceBaseUrl();

    const formData = new FormData();
    const filename = `product_${productId}_${requestId}.jpg`;
    formData.append('image', imageBlob, filename);
    formData.append('consent_granted', 'true');
    formData.append('request_id', requestId);
    formData.append('product_id', productId);
    formData.append('artisan_id', resolvedArtisanId);
    formData.append('output_size', String(outputSize));
    formData.append('background', background);

    // Add operations as individual form fields or JSON
    for (const op of operations) {
      formData.append('operations', op);
    }

    try {
      logger.info('SYSTEM', 'Submitting image to AI enhancement microservice', {
        requestId,
        productId,
        artisanId,
        operations,
      });

      const response = await fetch(`${baseUrl}/v1/enhancements`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: formData,
        signal: internalController.signal,
      });

      this.activeAbortControllers.delete(requestId);

      if (!response.ok) {
        let errJson: Record<string, unknown> = {};
        try {
          errJson = await response.json();
        } catch {
          // ignore non-json
        }

        const detail = (errJson.detail || errJson) as Record<string, unknown> | Array<unknown>;
        const errorCode = (!Array.isArray(detail) && (detail.error_code as string)) || `HTTP_${response.status}`;
        const message = (!Array.isArray(detail) && (detail.message as string))
          || (Array.isArray(detail) ? detail.map((d: any) => `${d.loc?.join('.')}: ${d.msg}`).join(', ') : `AI service enhancement failed with status ${response.status}`);
        const retryable = !Array.isArray(detail) && detail.retryable !== false && response.status >= 500;

        throw new AIEnhancementError({
          errorCode,
          message,
          retryable,
          requestId,
          details: (Array.isArray(detail) ? { errors: detail } : detail) as Record<string, unknown>,
        });
      }

      const jobResult: JobResult = await response.json();

      // If enhanced image reference is returned, format the full URL or fetch blob preview
      if (jobResult.enhanced_image_reference) {
        jobResult.enhancedDataUrl = jobResult.enhanced_image_reference.startsWith('http')
          ? jobResult.enhanced_image_reference
          : `${baseUrl}${jobResult.enhanced_image_reference.startsWith('/') ? '' : '/'}${jobResult.enhanced_image_reference}`;
      }

      if (jobResult.preview_image_reference) {
        jobResult.previewDataUrl = jobResult.preview_image_reference.startsWith('http')
          ? jobResult.preview_image_reference
          : `${baseUrl}${jobResult.preview_image_reference.startsWith('/') ? '' : '/'}${jobResult.preview_image_reference}`;
      }

      logger.info('SYSTEM', 'AI enhancement successfully completed', {
        jobId: jobResult.job_id,
        status: jobResult.status,
        durationMs: jobResult.processing_duration_ms,
      });

      return jobResult;
    } catch (err) {
      this.activeAbortControllers.delete(requestId);

      if (err instanceof AIEnhancementError) {
        throw err;
      }

      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new AIEnhancementError({
          errorCode: 'OPERATION_CANCELLED',
          message: 'AI enhancement was cancelled by the user.',
          retryable: true,
          requestId,
        });
      }

      const rawMsg = err instanceof Error ? err.message : String(err);
      throw new AIEnhancementError({
        errorCode: 'NETWORK_ERROR',
        message: `Could not connect to AI image service at ${baseUrl}. Please verify your network or continue with the authentic original photo.`,
        retryable: true,
        requestId,
        details: { rawError: rawMsg },
      });
    }
  }

  /**
   * Cancels an in-flight enhancement job request.
   */
  public cancelEnhancement(requestId: string): void {
    const controller = this.activeAbortControllers.get(requestId);
    if (controller) {
      controller.abort();
      this.activeAbortControllers.delete(requestId);
      logger.info('SYSTEM', 'Cancelled in-flight AI enhancement request', { requestId });
    }
  }

  /**
   * Helper: Converts an image URL / Data URL / Object URL to a Blob for submission.
   */
  public async urlToBlob(url: string): Promise<Blob> {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to load image from URL for AI processing: HTTP ${res.status}`);
    }
    return await res.blob();
  }
}

export const aiEnhancementService = new AIEnhancementService();