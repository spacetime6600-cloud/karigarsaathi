export interface LanguageOption {
  code: SupportedLanguageCode;
  label: string;
}

export type SupportedLanguageCode = 'hi' | 'en' | 'or' | 'bn' | 'te';

export interface SessionStatus {
  status: string;
  session_id: string;
}

export interface CreateSessionResponse {
  session_id: string;
  status: string;
}

export interface AudioUploadResponse {
  recording_id: string;
  stored_filename: string;
  file_size_bytes: number;
  duration_seconds: number | null;
  status: string;
}

export interface ProcessSessionResponse {
  session_id: string;
  status: string;
  transcript_id: string;
}

export interface TranscriptResponse {
  session_id: string;
  source_language: string;
  original_text: string;
  corrected_text: string | null;
  confidence: number | null;
  detected_language: string | null;
}

export interface TranscriptUpdateRequest {
  corrected_text: string;
}

export interface TranscriptUpdateResponse {
  session_id: string;
  corrected_text: string;
}

export interface TranscriptSegment {
  id: number;
  text: string;
  start: number;
  end: number;
  confidence: number | null;
  is_low_confidence: boolean;
}

export interface DraftResponse {
  session_id: string;
  status: string;
  title_hi: string | null;
  title_en: string | null;
  description_hi: string | null;
  description_en: string | null;
  tags_hi: string | null;
  tags_en: string | null;
  structured_fields: Record<string, FieldValue>;
}

export interface FieldValue {
  value: string | null;
  confidence: number | null;
  confidence_method: string | null;
  status: 'unknown' | 'low_confidence' | 'generated' | 'manually_corrected' | 'artisan_confirmed';
  source: 'transcript' | 'clarification' | 'manual' | 'generated_copy';
  evidence: string | null;
  last_updated_at: string;
}

export interface DraftUpdateRequest {
  title_hi?: string;
  title_en?: string;
  description_hi?: string;
  description_en?: string;
  tags_hi?: string;
  tags_en?: string;
}

export interface DraftUpdateResponse {
  session_id: string;
  status: string;
  title_hi: string | null;
  title_en: string | null;
  description_hi: string | null;
  description_en: string | null;
  tags_hi: string | null;
  tags_en: string | null;
}

export interface ClarificationRequest {
  target_field: string;
  reason: string;
}

export interface ClarificationResponse {
  clarification_id: string;
  target_field: string;
  reason: string;
  source_language_question: string;
  hindi_question: string;
  english_question: string;
  status: string;
}

export interface ClarificationAnswerRequest {
  clarification_id: string;
  answer_text: string | null;
  mark_unknown: boolean;
  answer_source: string;
}

export interface ClarificationAnswerResponse {
  clarification_id: string;
  target_field: string;
  answer: string | null;
  mark_unknown: boolean;
  answer_source: string;
  status: string;
}

export interface RegenerateResponse {
  session_id: string;
  status: string;
}

export interface ApproveRequest {
  approving_user_id: string;
}

export interface ApproveResponse {
  approved: boolean;
  snapshot_id: string | null;
  catalogue_json: Record<string, unknown> | null;
  revision_number: number;
}

export interface ApprovedSnapshotResponse {
  id: string;
  session_id: string;
  catalogue_json: Record<string, unknown>;
  approved_at: string;
  revision: number;
  is_immutable: boolean;
}

export interface DeleteDataRequest {
  delete_recording: boolean;
  delete_transcript: boolean;
}

export interface DeleteDataResponse {
  session_id: string;
  recording_deleted: boolean;
  transcript_deleted: boolean;
  both_deleted: boolean;
}

export interface ConsentRequest {
  consent_granted: boolean;
  retention_choice: RetentionChoice;
  consent_policy_version: string;
}

export interface RetentionChoice {
  choice: 'immediate' | 'until_approval' | 'configurable';
  configurable_days?: number;
}

export interface ConsentResponse {
  consent_granted: boolean;
  retention_choice: string;
  policy_version: string;
}

export interface LanguageSelectionRequest {
  language_code: SupportedLanguageCode;
}

export interface ApiError {
  error_code: string;
  user_safe_message: string;
  request_id: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}

export interface HealthResponse {
  status: string;
  service: string;
}

export interface RetentionInfo {
  retention_choice: string;
  retention_days: number | null;
  consent_timestamp: string;
  recording_stored: boolean;
  recording_duration?: number;
  recording_size?: number;
  transcript_stored: boolean;
  transcript_source_language?: string;
  expires_at?: string | null;
}

export interface SessionWithDetails {
  session_id: string;
  status: string;
  selected_language: string;
  source_language: string | null;
  consent_granted: boolean;
  retention_choice: string | null;
  retention_days: number | null;
  created_at: string;
  updated_at: string;
  transcript?: TranscriptResponse | null;
  draft?: DraftResponse | null;
  approved_snapshot?: ApprovedSnapshotResponse | null;
}