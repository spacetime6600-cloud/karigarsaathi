from __future__ import annotations

from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete

from backend.app.core.config import settings
from backend.app.domain.models import (
    VoiceCatalogueSession,
    Transcript,
    CatalogueDraft,
    GeneratedContent,
    FieldValue,
    ApprovalRecord,
    ApprovedSnapshot,
    User,
    SessionStatus,
    CatalogueDraftStatus,
    ApprovalStatus,
    TranscriptStatus,
    TranscriptCorrection,
    AuditEvent,
    AuditEventType,
    ConsentRecord,
    RecordingMetadata,
    TranscriptSegment,
)
from backend.app.repositories import (
    VoiceCatalogueSessionRepository,
    TranscriptRepository,
    CatalogueDraftRepository,
    FieldValueRepository,
    ApprovalRecordRepository,
    ApprovedSnapshotRepository,
    AuditEventRepository,
    RecordingMetadataRepository,
)


# ---- Status Transition Service ----

class StatusTransitionError(Exception):
    """Raised when an invalid status transition is attempted."""

    pass


# Valid status transitions for voice catalogue sessions
VALID_TRANSITIONS = {
    "created": {"awaiting_audio", "failed"},
    "awaiting_audio": {"uploaded", "failed"},
    "uploaded": {"transcribing", "failed"},
    "transcribing": {"transcription_failed", "awaiting_transcript_review"},
    "transcription_failed": {"uploaded", "failed"},
    "awaiting_transcript_review": {
        "generating_catalogue",
        "clarification_required",
        "failed",
    },
    "generating_catalogue": {"clarification_required", "draft_ready", "failed"},
    "clarification_required": {
        "awaiting_transcript_review",
        "generating_catalogue",
        "draft_ready",
    },
    "draft_ready": {"approved", "clarification_required", "failed"},
    "approved": set(),  # Terminal state
    "failed": {"created"},  # Can reset
    "source_deleted": set(),  # Terminal state
}


def validate_transition(from_status: str, to_status: str) -> bool:
    """Validate if a status transition is allowed."""
    allowed = VALID_TRANSITIONS.get(from_status, set())
    return to_status in allowed


# ---- Consent Service ----

class ConsentService:
    """Service for managing consent records."""

    @staticmethod
    async def grant_consent(
        db: AsyncSession,
        session_id: UUID,
        retention_choice: str,
        user_id: UUID,
        audit_repo,
    ) -> None:
        """Grant consent for a session."""
        # Create consent record
        consent = ConsentRecord(
            session_id=session_id,
            consent_granted=True,
            consent_policy_version=settings.consent_policy_version,
            retention_choice=retention_choice,
        )
        db.add(consent)
        await db.flush()

        # Update session
        session = await db.get(VoiceCatalogueSession, session_id)
        if session:
            session.consent_granted = True

        # Audit event
        await audit_repo.create_audit_event(
            db=db,
            session_id=session_id,
            event_type=AuditEventType.consent_granted,
            entity_id=user_id,
            details=f"Consent granted with retention: {retention_choice}",
        )

    @staticmethod
    async def can_proceed(db: AsyncSession, session_id: UUID) -> bool:
        """Check if consent has been granted for a session."""
        stmt = select(ConsentRecord).where(ConsentRecord.session_id == session_id)
        result = await db.execute(stmt)
        consent = result.scalar_one_or_none()
        return consent is not None and consent.consent_granted


# ---- Recording Retention Service ----

class RetentionService:
    """Service for managing recording and transcript retention."""

    @staticmethod
    async def check_retention(
        db: AsyncSession, session_id: UUID
    ) -> dict | None:
        """Check if retained data exists and for how long."""

        # Get consent record
        consent_stmt = select(ConsentRecord).where(
            ConsentRecord.session_id == session_id
        )
        consent_result = await db.execute(consent_stmt)
        consent = consent_result.scalar_one_or_none()

        if not consent:
            return None

        result = {
            "retention_choice": consent.retention_choice,
            "retention_days": consent.retention_days,
            "consent_timestamp": consent.consent_timestamp.isoformat(),
        }

        # Get recording metadata
        recording_stmt = select(RecordingMetadata).where(
            RecordingMetadata.session_id == session_id
        )
        recording_result = await db.execute(recording_stmt)
        recording = recording_result.scalar_one_or_none()
        if recording:
            result["recording_stored"] = True
            result["recording_duration"] = recording.duration_seconds
            result["recording_size"] = recording.file_size_bytes
        else:
            result["recording_stored"] = False

        # Get transcript
        transcript_stmt = select(Transcript).where(
            Transcript.session_id == session_id
        )
        transcript_result = await db.execute(transcript_stmt)
        transcript = transcript_result.scalar_one_or_none()
        if transcript:
            result["transcript_stored"] = True
            result["transcript_source_language"] = transcript.source_language
        else:
            result["transcript_stored"] = False

        # Check expiry
        if consent.retention_choice == "configurable" and consent.retention_days:
            expiry_date = datetime.now() + timedelta(
                days=consent.retention_days
            )
            result["expires_at"] = expiry_date.isoformat()
        else:
            result["expires_at"] = None

        return result

    @staticmethod
    async def delete_recording(
        db: AsyncSession,
        session_id: UUID,
        audit_repo,
        user_id: UUID,
    ) -> None:
        """Delete the recording for a session."""
        recording_stmt = select(RecordingMetadata).where(
            RecordingMetadata.session_id == session_id
        )
        recording_result = await db.execute(recording_stmt)
        recording = recording_result.scalar_one_or_none()

        if recording and recording.stored_filename:
            import os
            file_path = f"private/uploads/{recording.stored_filename}"
            if os.path.exists(file_path):
                os.remove(file_path)

        if recording:
            await db.delete(recording)
            await db.flush()

        # Audit event
        await audit_repo.create_audit_event(
            db=db,
            session_id=session_id,
            event_type=AuditEventType.source_data_deleted,
            entity_id=user_id,
            details="Recording deleted per retention policy",
        )

    @staticmethod
    async def delete_transcript(
        db: AsyncSession,
        session_id: UUID,
        audit_repo,
        user_id: UUID,
    ) -> None:
        """Delete the transcript for a session."""
        transcript_stmt = select(Transcript).where(
            Transcript.session_id == session_id
        )
        transcript_result = await db.execute(transcript_stmt)
        transcript = transcript_result.scalar_one_or_none()

        if transcript:
            # Delete segments
            seg_stmt = select(TranscriptSegment).where(
                TranscriptSegment.transcript_id == transcript.id
            )
            seg_result = await db.execute(seg_stmt)
            for seg in seg_result.scalars().all():
                await db.delete(seg)

            await db.delete(transcript)
            await db.flush()

        # Audit event
        await audit_repo.create_audit_event(
            db=db,
            session_id=session_id,
            event_type=AuditEventType.source_data_deleted,
            entity_id=user_id,
            details="Transcript deleted per retention policy",
        )

    @staticmethod
    async def delete_both(
        db: AsyncSession,
        session_id: UUID,
        audit_repo,
        user_id: UUID,
    ) -> None:
        """Delete both recording and transcript."""
        await RetentionService.delete_recording(
            db, session_id, audit_repo, user_id
        )
        await RetentionService.delete_transcript(
            db, session_id, audit_repo, user_id
        )

        # Audit event for combined deletion
        await audit_repo.create_audit_event(
            db=db,
            session_id=session_id,
            event_type=AuditEventType.source_data_deleted,
            entity_id=user_id,
            details="Both recording and transcript deleted",
        )


# ---- Clarification Service ----

class ClarificationService:
    """Service for managing clarification questions and answers."""

    @staticmethod
    async def create_clarification(
        db: AsyncSession,
        session_id: UUID,
        target_field: str,
        reason: str,
        source_language: str,
        audit_repo,
        user_id: UUID,
    ) -> dict:
        """Create a clarification question for a field."""
        import uuid

        clarification_id = uuid.uuid4()

        # Generate questions in different languages
        questions = ClarificationService._generate_questions(
            target_field, reason, source_language
        )

        # Store clarification (in production, would be a clarifications table)
        clarification = {
            "id": clarification_id,
            "target_field": target_field,
            "reason": reason,
            "source_language_question": questions["source"],
            "hindi_question": questions["hi"],
            "english_question": questions["en"],
            "status": "open",
            "artisan_answer": None,
            "answer_source": None,
            "timestamp": datetime.utcnow().isoformat(),
        }

        # Audit event
        await audit_repo.create_audit_event(
            db=db,
            session_id=session_id,
            event_type=AuditEventType.clarification_answered,
            entity_id=user_id,
            details=f"Clarification created for field: {target_field}",
        )

        return clarification

    @staticmethod
    def _generate_questions(
        target_field: str, reason: str, source_language: str
    ) -> dict:
        """Generate clarification questions in supported languages."""
        base_question = f"Why is the {target_field} not available or unclear?"

        # Source language questions
        source_questions = {
            "hi": f"{target_field} के बारे में जानकारी स्पष्ट नहीं है। {reason}",
            "en": f"The {target_field} information is unclear. {reason}",
            "or": f"{target_field} ପ୍ରାକାଶ ସ୍ଥିର ସ୍ନ୍ତୁଲ ଅଛି। {reason}",
            "bn": f"{target_field} তথ্য স্পষ্ট নই। {reason}",
            "te": f"{target_field} వివరణ స్పష్టంగా లేduit.",
        }

        hindi_question = source_questions.get(
            source_language, base_question
        )

        english_question = source_questions.get(
            source_language, base_question
        )

        if source_language != "en":
            english_question = f"(Translation) {base_question}"

        return {
            "source": source_questions.get(source_language, base_question),
            "hi": hindi_question,
            "en": english_question,
        }

    @staticmethod
    async def answer_clarification(
        db: AsyncSession,
        session_id: UUID,
        clarification_id,
        answer_text: str | None,
        mark_unknown: bool,
        answer_source: str,
        audit_repo,
        user_id: UUID,
    ) -> dict:
        """Process an artisan's answer to a clarification question."""
        await audit_repo.create_audit_event(
            db=db,
            session_id=session_id,
            event_type=AuditEventType.clarification_answered,
            entity_id=user_id,
            details=f"Clarification answered: {clarification_id}, "
                    f"answer_source={answer_source}, mark_unknown={mark_unknown}",
        )

        return {
            "clarification_id": str(clarification_id),
            "answer": answer_text,
            "mark_unknown": mark_unknown,
            "answer_source": answer_source,
            "status": "answered",
        }


# ---- Catalogue Generation Service ----

class CatalogueGenerationService:
    """Service for generating catalogue content from transcript and draft."""

    PERMITTED_FACTUAL_FIELDS = [
        "product_name",
        "product_type",
        "category",
        "materials",
        "craft_technique",
        "colors",
        "dimensions",
        "weight",
        "quantity_available",
        "production_time",
        "customization_availability",
        "care_instructions",
        "place_of_origin",
        "price",
        "artisan_story",
    ]

    @staticmethod
    async def generate_from_draft(
        db: AsyncSession,
        draft_id: UUID,
        llm_adapter,
        audit_repo,
        user_id: UUID,
    ) -> GeneratedContent:
        """Generate bilingual catalogue content from a draft using the LLM adapter."""

        # Get the draft
        draft = await db.get(CatalogueDraft, draft_id)
        if draft is None:
            raise ValueError("Draft not found")

        # Call the LLM adapter to generate content
        try:
            generated = await llm_adapter.generate_catalogue(draft)
        except Exception:
            await audit_repo.create_audit_event(
                db=db,
                session_id=draft.session_id,
                event_type=AuditEventType.catalogue_generated,
                entity_id=user_id,
                details="Catalogue generation failed",
            )
            raise

        # Create generated content record
        content = GeneratedContent(
            draft_id=draft.id,
            version=1,
            title_hi=generated.get("title_hi", ""),
            title_en=generated.get("title_en", ""),
            description_hi=generated.get("description_hi", ""),
            description_en=generated.get("description_en", ""),
            tags_hi=generated.get("tags_hi", ""),
            tags_en=generated.get("tags_en", ""),
            model_name=llm_adapter.model_name,
            model_version=llm_adapter.model_version,
        )

        db.add(content)
        await db.flush()

        # Audit event
        await audit_repo.create_audit_event(
            db=db,
            session_id=draft.session_id,
            event_type=AuditEventType.catalogue_generated,
            entity_id=user_id,
            details="Catalogue generated by LLM adapter",
        )

        return content

    @staticmethod
    def validate_generated_fields(
        generated: dict,
        permitted_fields: List[str],
    ) -> dict:
        """Validate generated fields against the permitted field list.

        Reject any fields not in the permitted list.
        """
        validated = {}
        for key, value in generated.items():
            if key in permitted_fields and value is not None:
                validated[key] = value
        return validated