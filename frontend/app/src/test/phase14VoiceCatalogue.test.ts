import { describe, it, expect, vi, beforeEach } from 'vitest';
import { voiceCatalogueService } from '../services/ai/voiceCatalogueService';

describe('Phase 14 — Voice & Multilingual Auto-Catalogue Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('voiceCatalogueService Client', () => {
    it('is configured and enabled by default', () => {
      expect(voiceCatalogueService.isVoiceEnabled()).toBe(true);
    });

    it('resolves microservice base URL on port 8001', () => {
      const url = voiceCatalogueService.getServiceBaseUrl();
      expect(url).toContain('8001');
    });

    it('health check parses microservice status', async () => {
      const mockHealth = {
        status: 'ok',
        service: 'karigarSaathi-phase14',
        model_ready: true,
        supported_languages: ['en', 'hi', 'or', 'bn'],
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealth,
      } as Response);

      const health = await voiceCatalogueService.checkHealth();
      expect(health.status).toBe('ok');
      expect(health.model_ready).toBe(true);
      expect(health.supported_languages).toContain('hi');
      expect(health.supported_languages).toContain('or');
      expect(health.supported_languages).toContain('bn');
    });

    it('creates catalogue session with consent and language preference', async () => {
      const mockSession = {
        session_id: 'session-uuid-1234',
        status: 'created',
        selected_language: 'hi',
        user_id: 'artisan-uuid-5678',
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockSession,
      } as Response);

      const result = await voiceCatalogueService.createSession({
        selectedLanguage: 'hi',
        consentGranted: true,
        retentionChoice: '30_days',
      });

      expect(result.session_id).toBe('session-uuid-1234');
      expect(result.selected_language).toBe('hi');
    });

    it('processes speech audio and returns Faster Whisper transcription segments', async () => {
      const mockTranscription = {
        session_id: 'session-uuid-1234',
        status: 'awaiting_transcript_review',
        detected_language: 'hi',
        confidence: 0.96,
        original_text: 'यह पारंपरिक हथकरघा जामदानी रेशम साड़ी है।',
        corrected_text: 'यह पारंपरिक हथकरघा जामदानी रेशम साड़ी है।',
        segments: [
          {
            id: 0,
            text: 'यह पारंपरिक हथकरघा जामदानी रेशम साड़ी है।',
            start: 0.0,
            end: 3.2,
            confidence: 0.96,
            is_low_confidence: false,
          },
        ],
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockTranscription,
      } as Response);

      const result = await voiceCatalogueService.processAudio({
        sessionId: 'session-uuid-1234',
      });

      expect(result.status).toBe('awaiting_transcript_review');
      expect(result.confidence).toBeGreaterThan(0.9);
      expect(result.segments.length).toBe(1);
      expect(result.segments[0].text).toContain('जामदानी');
    });

    it('generates fact-grounded bilingual suggestions and clarification questions for missing facts', async () => {
      const mockGeneration = {
        session_id: 'session-uuid-1234',
        status: 'draft_ready',
        draft: {
          title_en: 'Jamdani Weaving Pure Silk Saree',
          title_hi: 'जामदानी बुनाई शुद्ध रेशम साड़ी',
          description_en: 'Authentic handcrafted saree made from pure silk using traditional jamdani weaving techniques.',
          description_hi: 'प्रामाणिक हस्तनिर्मित साड़ी, जो शुद्ध रेशम से निर्मित है और जामदानी बुनाई की पारंपरिक तकनीक से तैयार किया गया है।',
          tags_en: 'jamdani weaving, pure silk, saree, handcrafted, artisan',
          tags_hi: 'जामदानी बुनाई, शुद्ध रेशम, साड़ी, हस्तशिल्प, कारीगर',
        },
        structured_fields: {
          craft_technique: {
            value: 'Jamdani Weaving',
            confidence: 0.9,
            status: 'generated',
            source: 'transcript',
          },
          materials: {
            value: 'Pure Silk',
            confidence: 0.9,
            status: 'generated',
            source: 'transcript',
          },
          dimensions: {
            value: null,
            status: 'unknown',
          },
          price: {
            value: null,
            status: 'unknown',
          },
        },
        clarification_questions: [
          {
            field: 'dimensions',
            question: 'What are the exact dimensions (length and width) of this product?',
            question_hi: 'इस उत्पाद की सटीक लंबाई और चौड़ाई (माप) क्या है?',
          },
        ],
        unknown_fields: ['dimensions', 'price', 'quantity_available'],
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeneration,
      } as Response);

      const result = await voiceCatalogueService.generateCatalogue({
        sessionId: 'session-uuid-1234',
        text: 'यह पारंपरिक हथकरघा जामदानी रेशम साड़ी है।',
      });

      expect(result.draft.title_en).toContain('Jamdani');
      expect(result.draft.title_hi).toContain('जामदानी');
      expect(result.structured_fields.craft_technique?.value).toBe('Jamdani Weaving');
      expect(result.structured_fields.materials?.value).toBe('Pure Silk');
      // Zero-hallucination guarantee: unmentioned dimensions are null + produce clarification questions
      expect(result.structured_fields.dimensions?.value).toBeNull();
      expect(result.clarification_questions?.some((q) => q.field === 'dimensions')).toBe(true);
    });

    it('approves catalogue and records immutable snapshot', async () => {
      const mockApproval = {
        session_id: 'session-uuid-1234',
        approved: true,
        snapshot_id: 'snapshot-uuid-9999',
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockApproval,
      } as Response);

      const result = await voiceCatalogueService.approveCatalogue({
        sessionId: 'session-uuid-1234',
      });

      expect(result.approved).toBe(true);
      expect(result.snapshot_id).toBe('snapshot-uuid-9999');
    });

    it('deletes audio recording and raw server transcript on privacy request', async () => {
      const mockDelete = {
        session_id: 'session-uuid-1234',
        status: 'source_deleted',
        detail: 'Audio recording and raw transcript deleted from server.',
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockDelete,
      } as Response);

      const result = await voiceCatalogueService.deleteSourceData({
        sessionId: 'session-uuid-1234',
      });

      expect(result.status).toBe('source_deleted');
    });
  });
});
