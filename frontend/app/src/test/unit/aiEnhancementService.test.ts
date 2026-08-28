import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  aiEnhancementService,
  AIEnhancementError,
} from '@/services/ai/aiEnhancementService';

describe('AIEnhancementService', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('verifies AI is enabled by default when VITE_AI_ENABLED is not set to false', () => {
    expect(aiEnhancementService.isAiEnabled()).toBe(true);
  });

  it('checks service health successfully when microservice is reachable', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'healthy',
        service: 'KarigarSaathi AI Image Studio',
        version: '0.1.0',
        model_ready: true,
      }),
    });

    const health = await aiEnhancementService.checkHealth();
    expect(health.status).toBe('healthy');
    expect(health.model_ready).toBe(true);
    expect(health.service).toBe('KarigarSaathi AI Image Studio');
  });

  it('handles unreachable service health check gracefully without throwing', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Connection refused'));

    const health = await aiEnhancementService.checkHealth(100);
    expect(health.status).toBe('unreachable');
    expect(health.model_ready).toBe(false);
  });

  it('throws CONSENT_REQUIRED error when consent is false', async () => {
    const fakeBlob = new Blob(['image-data'], { type: 'image/jpeg' });

    await expect(
      aiEnhancementService.enhanceImage({
        imageBlob: fakeBlob,
        consentGranted: false,
        requestId: 'req_001',
        productId: 'prod_001',
        artisanId: 'artisan_001',
      })
    ).rejects.toThrowError(AIEnhancementError);
  });

  it('successfully submits image and parses JobResult response', async () => {
    const fakeBlob = new Blob(['image-bytes-content'], { type: 'image/jpeg' });

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        job_id: 'job_123',
        request_id: 'req_123',
        artisan_id: 'artisan_001',
        product_id: 'prod_001',
        status: 'succeeded',
        original_image_reference: '/v1/enhancements/job_123/original',
        enhanced_image_reference: '/v1/enhancements/job_123/enhanced',
        preview_image_reference: '/v1/enhancements/job_123/preview',
        operations_requested: ['background_removal', 'lighting_correction', 'centring', 'standard_resize'],
        operations_applied: ['background_removal', 'lighting_correction', 'centring', 'standard_resize'],
        warnings: [],
        metrics: {
          mean_delta_e: 1.45,
          luminance_ssim: 0.96,
          edge_preservation_ratio: 0.94,
        },
        processing_duration_ms: 1250,
        retryable: false,
        adapter_version: 'isnet-general-use',
        created_at: '2026-08-28T00:00:00Z',
      }),
    });

    const result = await aiEnhancementService.enhanceImage({
      imageBlob: fakeBlob,
      consentGranted: true,
      requestId: 'req_123',
      productId: 'prod_001',
      artisanId: 'artisan_001',
      outputSize: 512,
      background: 'white',
    });

    expect(result.job_id).toBe('job_123');
    expect(result.status).toBe('succeeded');
    expect(result.metrics.mean_delta_e).toBe(1.45);
    expect(result.metrics.luminance_ssim).toBe(0.96);
    expect(result.enhancedDataUrl).toContain('/v1/enhancements/job_123/enhanced');
  });

  it('correctly translates HTTP 429 quota error to typed AIEnhancementError', async () => {
    const fakeBlob = new Blob(['image-bytes-content'], { type: 'image/jpeg' });

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({
        detail: {
          error_code: 'QUOTA_EXCEEDED',
          message: 'Daily enhancement quota of 25 jobs exceeded.',
          retryable: false,
        },
      }),
    });

    await expect(
      aiEnhancementService.enhanceImage({
        imageBlob: fakeBlob,
        consentGranted: true,
        requestId: 'req_quota',
        productId: 'prod_001',
        artisanId: 'artisan_001',
      })
    ).rejects.toThrowError('Daily enhancement quota of 25 jobs exceeded.');
  });

  it('supports cancellation via cancelEnhancement', async () => {
    const fakeBlob = new Blob(['image-bytes-content'], { type: 'image/jpeg' });

    // Mock fetch that responds to AbortSignal abort event immediately
    global.fetch = vi.fn().mockImplementation((_url, init) => {
      return new Promise((_, reject) => {
        const signal = init?.signal;
        if (signal) {
          if (signal.aborted) {
            reject(new DOMException('The operation was aborted', 'AbortError'));
            return;
          }
          signal.onabort = () => {
            reject(new DOMException('The operation was aborted', 'AbortError'));
          };
        }
      });
    });

    const promise = aiEnhancementService.enhanceImage({
      imageBlob: fakeBlob,
      consentGranted: true,
      requestId: 'req_cancel_test',
      productId: 'prod_001',
      artisanId: 'artisan_001',
    });

    // Trigger cancellation
    aiEnhancementService.cancelEnhancement('req_cancel_test');

    await expect(promise).rejects.toThrowError('AI enhancement was cancelled by the user.');
  });
});