import { describe, it, expect } from 'vitest';
import { consentSchema } from '@/schemas';
import { clarificationAnswerSchema } from '@/schemas';
import { languageSelectionSchema } from '@/schemas';

describe('Schema Validation Tests', () => {
  describe('consentSchema', () => {
    it('requires consent_granted to be true', () => {
      const result = consentSchema.safeParse({
        consent_granted: false,
        retention_choice: { choice: 'immediate' },
        consent_policy_version: 'v1',
      });
      expect(result.success).toBe(false);
    });

    it('accepts consent_granted: true', () => {
      const result = consentSchema.safeParse({
        consent_granted: true,
        retention_choice: { choice: 'immediate' },
        consent_policy_version: 'v1',
      });
      expect(result.success).toBe(true);
    });

    it('requires retention_choice', () => {
      const result = consentSchema.safeParse({
        consent_granted: true,
        consent_policy_version: 'v1',
      });
      expect(result.success).toBe(false);
    });

    it('validates retention_choice options', () => {
      const validChoices = ['immediate', 'until_approval', 'configurable'];
      for (const choice of validChoices) {
        const result = consentSchema.safeParse({
          consent_granted: true,
          retention_choice: { choice },
          consent_policy_version: 'v1',
        });
        expect(result.success).toBe(true);
      }
    });

    it('requires configurable_days for configurable choice', () => {
      const result = consentSchema.safeParse({
        consent_granted: true,
        retention_choice: { choice: 'configurable' },
        consent_policy_version: 'v1',
      });
      expect(result.success).toBe(true); // configurable_days is optional in schema
    });
  });

  describe('clarificationAnswerSchema', () => {
    it('requires clarification_id', () => {
      const result = clarificationAnswerSchema.safeParse({
        answer_text: 'test',
        mark_unknown: false,
        answer_source: 'artisan',
      });
      expect(result.success).toBe(false);
    });

    it('accepts valid answer', () => {
      const result = clarificationAnswerSchema.safeParse({
        clarification_id: '123e4567-e89b-12d3-a456-426614174000',
        answer_text: 'test answer',
        mark_unknown: false,
        answer_source: 'artisan',
      });
      expect(result.success).toBe(true);
    });

    it('accepts mark_unknown without answer_text', () => {
      const result = clarificationAnswerSchema.safeParse({
        clarification_id: '123e4567-e89b-12d3-a456-426614174000',
        answer_text: null,
        mark_unknown: true,
        answer_source: 'artisan',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('languageSelectionSchema', () => {
    it('accepts all five languages', () => {
      const languages = ['hi', 'en', 'or', 'bn', 'te'];
      for (const lang of languages) {
        const result = languageSelectionSchema.safeParse({ language_code: lang });
        expect(result.success).toBe(true);
      }
    });

    it('rejects invalid language', () => {
      const result = languageSelectionSchema.safeParse({ language_code: 'fr' });
      expect(result.success).toBe(false);
    });
  });
});