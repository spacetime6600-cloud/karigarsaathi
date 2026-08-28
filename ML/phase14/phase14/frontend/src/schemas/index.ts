import { z } from 'zod';

export const languageSelectionSchema = z.object({
  language_code: z.enum(['hi', 'en', 'or', 'bn', 'te']),
});

export type LanguageSelectionInput = z.infer<typeof languageSelectionSchema>;

export const retentionChoiceSchema = z.object({
  choice: z.enum(['immediate', 'until_approval', 'configurable']),
  configurable_days: z.number().int().positive().optional(),
});

export type RetentionChoiceInput = z.infer<typeof retentionChoiceSchema>;

export const consentSchema = z.object({
  consent_granted: z.boolean().refine((val) => val === true, {
    message: 'Consent is required to proceed',
  }),
  retention_choice: retentionChoiceSchema,
  consent_policy_version: z.string().default('v1'),
});

export type ConsentInput = z.infer<typeof consentSchema>;

export const audioUploadSchema = z.object({
  filename: z.string().min(1),
  format: z.string().optional(),
  file_size_bytes: z.number().int().positive(),
});

export type AudioUploadInput = z.infer<typeof audioUploadSchema>;

export const transcriptUpdateSchema = z.object({
  corrected_text: z.string().min(1, 'Corrected text cannot be empty'),
});

export type TranscriptUpdateInput = z.infer<typeof transcriptUpdateSchema>;

export const draftUpdateSchema = z.object({
  title_hi: z.string().optional(),
  title_en: z.string().optional(),
  description_hi: z.string().optional(),
  description_en: z.string().optional(),
  tags_hi: z.string().optional(),
  tags_en: z.string().optional(),
});

export type DraftUpdateInput = z.infer<typeof draftUpdateSchema>;

export const clarificationCreateSchema = z.object({
  target_field: z.string().min(1),
  reason: z.string().min(1),
});

export type ClarificationCreateInput = z.infer<typeof clarificationCreateSchema>;

export const clarificationAnswerSchema = z.object({
  clarification_id: z.string().uuid(),
  answer_text: z.string().nullable().optional(),
  mark_unknown: z.boolean().default(false),
  answer_source: z.string().default('artisan'),
});

export type ClarificationAnswerInput = z.infer<typeof clarificationAnswerSchema>;

export const approveSchema = z.object({
  approving_user_id: z.string().uuid(),
});

export type ApproveInput = z.infer<typeof approveSchema>;

export const deleteDataSchema = z.object({
  delete_recording: z.boolean().default(false),
  delete_transcript: z.boolean().default(false),
});

export type DeleteDataInput = z.infer<typeof deleteDataSchema>;

export const devTokenSchema = z.object({
  user_id: z.string().default('dev-user'),
});

export type DevTokenInput = z.infer<typeof devTokenSchema>;

export const fieldValueSchema = z.object({
  field_name: z.string(),
  value: z.string().nullable(),
  confidence: z.number().nullable(),
  confidence_method: z.string().nullable(),
  status: z.enum(['unknown', 'low_confidence', 'generated', 'manually_corrected', 'artisan_confirmed']),
  source: z.enum(['transcript', 'clarification', 'manual', 'generated_copy']),
  evidence: z.string().nullable(),
  last_updated_at: z.string(),
  corrected_by: z.string().nullable(),
  revision: z.number().int().positive(),
});

export type FieldValue = z.infer<typeof fieldValueSchema>;