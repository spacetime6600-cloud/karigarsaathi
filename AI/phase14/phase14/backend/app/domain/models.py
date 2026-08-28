from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    String,
    Integer,
    Boolean,
    Float,
    DateTime,
    Text,
    JSON,
    UUID,
    ForeignKey,
    Index,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base


def uuid_gen() -> uuid.UUID:
    return uuid.uuid4()


# ---- User / Artisan ----

class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid_gen, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Authentication identifiers
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Profile
    display_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    language_preference: Mapped[str] = mapped_column(
        String(10), default="en", nullable=False
    )


# ---- Voice Catalogue Session ----

class SessionStatus:
    created = "created"
    awaiting_audio = "awaiting_audio"
    uploaded = "uploaded"
    transcribing = "transcribing"
    transcription_failed = "transcription_failed"
    awaiting_transcript_review = "awaiting_transcript_review"
    generating_catalogue = "generating_catalogue"
    clarification_required = "clarification_required"
    draft_ready = "draft_ready"
    approved = "approved"
    failed = "failed"
    source_deleted = "source_deleted"


class VoiceCatalogueSession(Base):
    __tablename__ = "voice_catalogue_sessions"

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid_gen, nullable=False
    )
    user_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(50), default=SessionStatus.created, nullable=False
    )
    selected_language: Mapped[str] = mapped_column(
        String(10), nullable=False
    )
    source_language: Mapped[str | None] = mapped_column(
        String(10), nullable=True
    )
    consent_granted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    retention_choice: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )
    retention_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships (lazy loaded)
    transcript: Mapped["Transcript"] = relationship(
        "Transcript", back_populates="session", uselist=False, cascade="all, delete-orphan"
    )
    draft: Mapped["CatalogueDraft"] = relationship(
        "CatalogueDraft", back_populates="session", uselist=False, cascade="all, delete-orphan"
    )
    approval: Mapped["ApprovalRecord"] = relationship(
        "ApprovalRecord", back_populates="session", uselist=False, cascade="all, delete-orphan"
    )
    audit_events: Mapped[list["AuditEvent"]] = relationship(
        "AuditEvent", back_populates="session", cascade="all, delete-orphan"
    )


# ---- Consent Record ----

class ConsentRecord(Base):
    __tablename__ = "consent_records"

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid_gen, nullable=False
    )
    session_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("voice_catalogue_sessions.id", ondelete="CASCADE"), nullable=False
    )
    consent_granted: Mapped[bool] = mapped_column(Boolean, nullable=False)
    consent_policy_version: Mapped[str] = mapped_column(String(20), nullable=False)
    consent_timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    retention_choice: Mapped[str] = mapped_column(String(50), nullable=False)
    retention_timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


# ---- Recording Metadata ----

class RecordingMetadata(Base):
    __tablename__ = "recording_metadata"

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid_gen, nullable=False
    )
    session_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("voice_catalogue_sessions.id", ondelete="CASCADE"), nullable=False
    )
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    stored_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    duration_seconds: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    format: Mapped[str] = mapped_column(String(20), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


# ---- Transcript ----

class TranscriptStatus:
    valid = "valid"
    failed = "failed"
    placeholder = "placeholder"


class Transcript(Base):
    __tablename__ = "transcripts"

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid_gen, nullable=False
    )
    session_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("voice_catalogue_sessions.id", ondelete="CASCADE"), nullable=False
    )
    source_language: Mapped[str] = mapped_column(
        String(10), nullable=False
    )
    original_text: Mapped[str] = mapped_column(Text, nullable=False)
    corrected_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    detected_language: Mapped[str | None] = mapped_column(
        String(10), nullable=True
    )
    detected_language_confidence: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    segments: Mapped[list["TranscriptSegment"]] = relationship(
        "TranscriptSegment", back_populates="transcript", cascade="all, delete-orphan"
    )
    session: Mapped["VoiceCatalogueSession"] = relationship(
        "VoiceCatalogueSession", back_populates="transcript"
    )


class TranscriptSegment(Base):
    __tablename__ = "transcript_segments"

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid_gen, nullable=False
    )
    transcript_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("transcripts.id", ondelete="CASCADE"), nullable=False
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    start_time: Mapped[float] = mapped_column(Float, nullable=False)
    end_time: Mapped[float] = mapped_column(Float, nullable=False)
    speaker: Mapped[str | None] = mapped_column(String(100), nullable=True)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_low_confidence: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    transcript: Mapped["Transcript"] = relationship(
        "Transcript", back_populates="segments"
    )


# ---- Transcript Correction ----

class TranscriptCorrection(Base):
    __tablename__ = "transcript_corrections"

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid_gen, nullable=False
    )
    transcript_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("transcripts.id", ondelete="CASCADE"), nullable=False
    )
    corrected_text: Mapped[str] = mapped_column(Text, nullable=False)
    correction_type: Mapped[str] = mapped_column(
        String(50), default="manual", nullable=False
    )
    corrected_by: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    evidence_span_start: Mapped[float | None] = mapped_column(Float, nullable=True)
    evidence_span_end: Mapped[float | None] = mapped_column(Float, nullable=True)


# ---- Structured Catalogue Draft ----

class CatalogueDraftStatus:
    draft_ready = "draft_ready"
    generating = "generating"
    clarification_needed = "clarification_needed"
    ready_for_approval = "ready_for_approval"


class CatalogueDraft(Base):
    __tablename__ = "catalogue_drafts"

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid_gen, nullable=False
    )
    session_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("voice_catalogue_sessions.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(50), default=CatalogueDraftStatus.draft_ready, nullable=False
    )
    # Hindi/English/Indic bilingual content
    title_hi: Mapped[str | None] = mapped_column(Text, nullable=True)
    title_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    description_hi: Mapped[str | None] = mapped_column(Text, nullable=True)
    description_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    tags_hi: Mapped[str | None] = mapped_column(String(500), nullable=True)
    tags_en: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Field-level value and confidence
    structured_fields: Mapped[dict] = mapped_column(
        JSON, nullable=True, default=dict
    )

    # Evidence tracking
    evidence: Mapped[dict | None] = mapped_column(
        JSON, nullable=True, default=None
    )

    # Clarification tracking
    clarification_ids: Mapped[list[UUID]] = mapped_column(
        JSON, nullable=True, default=list
    )

    session: Mapped["VoiceCatalogueSession"] = relationship(
        "VoiceCatalogueSession", back_populates="draft"
    )


# ---- Generated Bilingual Content ----

class GeneratedContent(Base):
    __tablename__ = "generated_content"

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid_gen, nullable=False
    )
    draft_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("catalogue_drafts.id", ondelete="CASCADE"), nullable=False
    )
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    title_hi: Mapped[str] = mapped_column(Text, nullable=False)
    title_en: Mapped[str] = mapped_column(Text, nullable=False)
    description_hi: Mapped[str] = mapped_column(Text, nullable=False)
    description_en: Mapped[str] = mapped_column(Text, nullable=False)
    tags_hi: Mapped[str] = mapped_column(String(500), nullable=False)
    tags_en: Mapped[str] = mapped_column(String(500), nullable=False)
    model_name: Mapped[str] = mapped_column(String(255), nullable=False)
    model_version: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


# ---- Field-level Value and Confidence ----

class FieldValue(Base):
    __tablename__ = "field_values"

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid_gen, nullable=False
    )
    draft_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("catalogue_drafts.id", ondelete="CASCADE"), nullable=False
    )
    field_name: Mapped[str] = mapped_column(String(100), nullable=False)
    value: Mapped[str | None] = mapped_column(Text, nullable=True)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    confidence_method: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(50), default="unknown", nullable=False
    )
    source: Mapped[str] = mapped_column(
        String(50), default="generated_copy", nullable=False
    )
    evidence: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    last_updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    corrected_by: Mapped[UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    revision: Mapped[int] = mapped_column(Integer, default=1, nullable=False)


# ---- Approval Record ----

class ApprovalStatus:
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class ApprovalRecord(Base):
    __tablename__ = "approval_records"

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid_gen, nullable=False
    )
    draft_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("catalogue_drafts.id", ondelete="CASCADE"), nullable=False
    )
    session_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("voice_catalogue_sessions.id", ondelete="CASCADE"), nullable=False
    )
    approved_by: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(50), default=ApprovalStatus.pending, nullable=False
    )
    approved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    revision_id: Mapped[UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    session: Mapped["VoiceCatalogueSession"] = relationship(
        "VoiceCatalogueSession", back_populates="approval"
    )


# ---- Immutable Approved Snapshot ----

class ApprovedSnapshot(Base):
    __tablename__ = "approved_snapshots"

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid_gen, nullable=False
    )
    session_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("voice_catalogue_sessions.id", ondelete="CASCADE"), nullable=False
    )
    draft_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("catalogue_drafts.id", ondelete="CASCADE"), nullable=False
    )
    catalogue_json: Mapped[str] = mapped_column(
        Text, nullable=False
    )
    approved_by: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    approved_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    revision_number: Mapped[int] = mapped_column(
        Integer, default=1, nullable=False
    )
    is_immutable: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


# ---- Idempotency Record ----

class IdempotencyKey(Base):
    __tablename__ = "idempotency_keys"

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid_gen, nullable=False
    )
    key: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False
    )
    used_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


# ---- Audit Event ----

class AuditEventType:
    session_created = "session_created"
    consent_granted = "consent_granted"
    recording_stored = "recording_stored"
    transcription_completed = "transcription_completed"
    transcript_corrected = "transcript_corrected"
    catalogue_generated = "catalogue_generated"
    clarification_answered = "clarification_answered"
    catalogue_approved = "catalogue_approved"
    source_data_deleted = "source_data_deleted"


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid_gen, nullable=False
    )
    session_id: Mapped[UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("voice_catalogue_sessions.id", ondelete="CASCADE"), nullable=True
    )
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    details: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    session: Mapped["VoiceCatalogueSession"] = relationship(
        "VoiceCatalogueSession", back_populates="audit_events"
    )


# Indexes
Index("ix_users_email", User.email, unique=True)
Index("ix_sessions_status", VoiceCatalogueSession.status)
Index("ix_sessions_user", VoiceCatalogueSession.user_id)
Index("ix_transcript_session", Transcript.session_id)
Index("ix_catalogue_session", CatalogueDraft.session_id)
Index("ix_approval_draft", ApprovalRecord.draft_id)
Index("ix_approved_session", ApprovedSnapshot.session_id)
Index("ix_field_draft", FieldValue.draft_id)
Index("ix_audit_session", AuditEvent.session_id)