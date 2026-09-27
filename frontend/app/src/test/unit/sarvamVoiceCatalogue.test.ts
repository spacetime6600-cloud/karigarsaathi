import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  voiceCatalogueService,
} from '../../services/ai/voiceCatalogueService';

describe('Sarvam AI Voice & Multilingual Studio Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Production Service URL Resolution', () => {
    it('is enabled and provides base URL', () => {
      expect(voiceCatalogueService.isVoiceEnabled()).toBe(true);
      const url = voiceCatalogueService.getServiceBaseUrl();
      expect(url).toBeDefined();
      expect(typeof url).toBe('string');
    });
  });

  describe('Error Sanitization and Translation', () => {
    it('converts legacy Ollama connection refused into user-friendly message', () => {
      const rawError = 'Ollama unreachable: <urlopen error [Errno 111] Connection refused>';
      const sanitized = voiceCatalogueService.extractErrorMessage(rawError);
      expect(sanitized).not.toContain('<urlopen error');
      expect(sanitized).not.toContain('Errno 111');
      expect(sanitized).toContain('Voice backend could not reach the translation service');
    });

    it('translates SARVAM_KEY_MISSING into clear setup message', () => {
      const rawError = 'SARVAM_KEY_MISSING: SARVAM_API_KEY is not configured on the server';
      const sanitized = voiceCatalogueService.extractErrorMessage(rawError);
      expect(sanitized).toContain('Sarvam API key is not configured on the voice server');
    });

    it('translates SARVAM_KEY_INVALID into clear key error message', () => {
      const rawError = 'SARVAM_KEY_INVALID: Invalid or expired Sarvam API key';
      const sanitized = voiceCatalogueService.extractErrorMessage(rawError);
      expect(sanitized).toContain('Invalid or expired Sarvam API key');
    });

    it('translates SARVAM_INSUFFICIENT_CREDITS into quota notification', () => {
      const rawError = 'SARVAM_INSUFFICIENT_CREDITS: Insufficient Sarvam API credits or quota exhausted';
      const sanitized = voiceCatalogueService.extractErrorMessage(rawError);
      expect(sanitized).toContain('Insufficient Sarvam API credits');
    });

    it('translates SARVAM_RATE_LIMITED into retry message', () => {
      const rawError = 'SARVAM_RATE_LIMITED: Sarvam API rate limit exceeded';
      const sanitized = voiceCatalogueService.extractErrorMessage(rawError);
      expect(sanitized).toContain('rate limit exceeded');
    });
  });

  describe('Cold-Start and Health Check Resilience', () => {
    it('returns starting status on timeout or abort', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementationOnce(() => {
        const error = new Error('The operation was aborted');
        error.name = 'AbortError';
        return Promise.reject(error);
      });

      const health = await voiceCatalogueService.checkHealth();
      expect(health.status).toBe('starting');
      expect(health.service).toBe('KarigarSaathi Voice Studio');
    });

    it('parses online Sarvam health check response', async () => {
      const mockHealth = {
        status: 'ok',
        service: 'karigarSaathi-phase14',
        model_ready: true,
        speech_engine: 'sarvam',
        speech_model: 'saaras:v3',
        supported_languages: ['en', 'hi', 'or', 'bn', 'te'],
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealth,
      } as Response);

      const health = await voiceCatalogueService.checkHealth();
      expect(health.status).toBe('ok');
      expect(health.speech_engine).toBe('sarvam');
      expect(health.speech_model).toBe('saaras:v3');
      expect(health.supported_languages).toContain('or');
    });
  });

  describe('Artisan Edited Transcript Translation Workflow', () => {
    it('translates edited transcript via translateWithSarvam and returns bilingual outputs', async () => {
      const editedHindiTranscript = 'यह हाथ से बुनी गई 100% शुद्ध रेशम साड़ी है।';
      const mockTranslateResponse = {
        hindi_output: editedHindiTranscript,
        english_output: 'This is a hand-woven 100% pure silk saree.',
        routing_path: ['hi (preserved)', 'hi -> en (Sarvam)'],
        review_required: false,
        review_reason: null,
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockTranslateResponse,
      } as Response);

      const result = await voiceCatalogueService.translateWithSarvam({
        correctedTranscript: editedHindiTranscript,
        sourceLanguage: 'hi',
      });

      expect(result.hindi_output).toBe(editedHindiTranscript);
      expect(result.english_output).toBe('This is a hand-woven 100% pure silk saree.');
      expect(result.routing_path).toContain('hi -> en (Sarvam)');
      expect(result.review_required).toBe(false);
    });

    it('supports Odia source language in translateText', async () => {
      const odiaTranscript = 'ଏହା ଏକ ହାତ ତିଆରି ଶାଢ଼ୀ।';
      const mockTranslateResponse = {
        source_text: odiaTranscript,
        source_language: 'or',
        target_language: 'en',
        translated_text: 'This is a handmade saree.',
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockTranslateResponse,
      } as Response);

      const result = await voiceCatalogueService.translateText({
        text: odiaTranscript,
        sourceLanguage: 'or',
        targetLanguage: 'en',
      });

      expect(result.source_text).toBe(odiaTranscript);
      expect(result.translated_text).toBe('This is a handmade saree.');
      expect(result.source_language).toBe('or');
    });
  });
});
