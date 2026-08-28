from __future__ import annotations

from typing import Optional, List, Dict, Any, Literal, Union
from pydantic import BaseModel, Field, root_validator, validator
from uuid import UUID
from datetime import datetime

from backend.app.domain.models import (
    SessionStatus,
    CatalogueDraftStatus,
    ApprovalStatus,
    TranscriptStatus,
    FieldValue,
    User,
    VoiceCatalogueSession,
)


# ---- API Request/Response Schemas ----

class HealthCheck(BaseModel):
    """Health check response."""
    status: str = "ok"
    service: str = "karigarSaathi-phase14"


# ---- Session Creation ----

class CreateSessionRequest(BaseModel):
    """Request to create a new catalogue session."""
    # No fields required - session created for authenticated user

    class Config:
        extra = "forbid"


class CreateSessionResponse(BaseModel):
    """Response from creating a session."""
    session_id: str
    status: str


# ---- Audio Upload ----

class AudioUploadRequest(BaseModel):
    """Request to upload audio for a session."""
    filename: str
    format: str | None = None
    file_size_bytes: int


class AudioUploadResponse(BaseModel):
    """Response from audio upload."""
    recording_id: str
    stored_filename: str
    file_size_bytes: int
    duration_seconds: float | None = None
    status: str


# ---- Transcript ----

class TranscriptResponse(BaseModel):
    """Transcript response."""
    session_id: str
    source_language: str
    original_text: str
    corrected_text: str | None = None
    confidence: float | None = None
    detected_language: str | None = None


# ---- Draft ----

class DraftFieldUpdate(BaseModel):
    """Update a single draft field."""
    title_hi: Optional[str] = None
    title_en: Optional[str] = None
    description_hi: Optional[str] = None
    description_en: Optional[str] = None
    tags_hi: Optional[str] = None
    tags_en: Optional[str] = None


class DraftUpdateResponse(BaseModel):
    """Response from draft update."""
    session_id: str
    status: str
    title_hi: Optional[str] = None
    title_en: Optional[str] = None
    description_hi: Optional[str] = None
    description_en: Optional[str] = None
    tags_hi: Optional[str] = None
    tags_en: Optional[str] = None


# ---- Clarification ----

class ClarificationCreateRequest(BaseModel):
    """Request to create a clarification question."""
    target_field: str = Field(..., description="The field needing clarification")
    reason: str = Field(..., description="Why clarification is needed")


class ClarificationCreateResponse(BaseModel):
    """Response from creating clarification."""
    clarification_id: str
    target_field: str
    reason: str
    source_language_question: str
    hindi_question: str
    english_question: str
    status: str = "open"


class ClarificationAnswerRequest(BaseModel):
    """Request to answer a clarification question."""
    clarification_id: str = Field(..., description="The clarification ID")
    answer_text: Optional[str] = Field(
        None, description="Artisan's answer text"
    )
    mark_unknown: bool = Field(
        False, description="Mark field as unknown"
    )
    answer_source: str = Field(
        default="artisan", description="Source of the answer"
    )


class ClarificationAnswerResponse(BaseModel):
    """Response from answering clarification."""
    clarification_id: str
    target_field: str
    answer: Optional[str]
    mark_unknown: bool
    answer_source: str
    status: str = "answered"


# ---- Approval ----

class ApproveRequest(BaseModel):
    """Request to approve the catalogue."""
    approving_user_id: str = Field(
        ..., description="User ID of the approver"
    )


class ApproveResponse(BaseModel):
    """Response from approval."""
    approved: bool
    snapshot_id: str | None = None
    catalogue_json: dict | None = None
    revision_number: int = 1


# ---- Field Value ----

class FieldValueResponse(BaseModel):
    """Response for a field value."""
    field_name: str
    value: Optional[str] = None
    confidence: Optional[float] = None
    confidence_method: Optional[str] = None
    status: str = "unknown"
    source: str = "generated_copy"
    evidence: Optional[str] = None
    last_updated_at: Optional[str] = None
    corrected_by: Optional[str] = None
    revision: int = 1


# ---- Catalogue JSON ----

class CatalogueJSONResponse(BaseModel):
    """Schema-validated catalogue JSON response."""
    catalogue_json: dict
    approved_at: str
    revision: int
    is_immutable: bool = True


# ---- Error Responses ----

class APIError(BaseModel):
    """Standard API error response."""
    error_code: str
    user_safe_message: str
    request_id: str
    retryable: bool = False
    details: Optional[Dict[str, Any]] = None


class ValidationError(BaseModel):
    """Schema validation error."""
    field: str
    reason: str
    value: Any


# ---- Language Selection ----

class LanguageSelection(BaseModel):
    """Language selection request."""
    language_code: str = Field(
        ..., description="Language code: hi, en, or, bn, te"
    )

    @validator("language_code")
    def validate_language(cls, v):
        """Validate that the language is in the allowed list."""
        allowed = ["hi", "en", "or", "bn", "te"]
        if v not in allowed:
            raise ValueError(
                f"Language '{v}' is not supported. "
                f"Supported languages: {', '.join(allowed)}"
            )
        return v


# ---- Retention Choice ----

class RetentionChoice(BaseModel):
    """Recording retention choice."""
    choice: str = Field(
        ..., description="Retention mode: immediate, until_approval, configurable"
    )
    configurable_days: Optional[int] = Field(
        None, description="Number of days for configurable retention"
    )


# ---- Consent ----

class ConsentRequest(BaseModel):
    """Consent request."""
    consent_granted: bool = Field(
        ..., description="Explicit consent for recording and transcription"
    )
    retention_choice: RetentionChoice
    consent_policy_version: str = Field(
        default="v1", description="Consent policy version"
    )


class ConsentResponse(BaseModel):
    """Consent response."""
    consent_granted: bool
    retention_choice: str
    policy_version: str


# ---- Delete Data ----

class DeleteDataRequest(BaseModel):
    """Request to delete session data."""
    delete_recording: bool = False
    delete_transcript: bool = False


class DeleteDataResponse(BaseModel):
    """Response from data deletion."""
    session_id: str
    recording_deleted: bool = False
    transcript_deleted: bool = False
    both_deleted: bool = False


# ---- Pydantic Configuration ----

class KarigarSaathiBaseModel(BaseModel):
    """Base model with common configuration."""
    
    model_config = {
        "extra": "forbid",  # Reject unexpected fields
        "validate_by_alias": True,
        "str_strip": True,
    }

    @root_validator(pre=True)
    def reject_unknown_fields(cls, values):
        """Reject any fields not explicitly defined."""
        # This is enforced by model_config extra = "forbid"
        return values