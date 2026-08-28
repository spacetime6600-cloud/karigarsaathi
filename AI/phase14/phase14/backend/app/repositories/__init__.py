from __future__ import annotations

from uuid import UUID
from typing import Generic, TypeVar, Optional, List, Dict, Any
from abc import ABC, abstractmethod

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, insert

from backend.app.core.database import Base
from backend.app.domain.models import (
    User,
    VoiceCatalogueSession,
    ConsentRecord,
    RecordingMetadata,
    Transcript,
    TranscriptSegment,
    TranscriptCorrection,
    CatalogueDraft,
    GeneratedContent,
    FieldValue,
    ApprovalRecord,
    ApprovedSnapshot,
    IdempotencyKey,
    AuditEvent,
    SessionStatus,
    CatalogueDraftStatus,
    ApprovalStatus,
    TranscriptStatus,
)

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType], ABC):
    """Base repository interface for all repositories."""

    @abstractmethod
    def model(self) -> type[ModelType]:
        """Return the SQLAlchemy model class."""

    async def get_by_id(self, db: AsyncSession, id: UUID) -> ModelType | None:
        """Get a model by its UUID primary key."""
        stmt = select(self.model()).where(self.model().id == id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, db: AsyncSession, **kwargs) -> ModelType:
        """Create a new model instance."""
        instance = self.model()(**kwargs)
        db.add(instance)
        await db.flush()
        await db.refresh(instance)
        return instance

    async def update(self, db: AsyncSession, instance: ModelType, **kwargs) -> ModelType:
        """Update a model instance with given fields."""
        for key, value in kwargs.items():
            if hasattr(instance, key):
                setattr(instance, key, value)
        await db.flush()
        await db.refresh(instance)
        return instance

    async def delete(self, db: AsyncSession, instance: ModelType) -> None:
        """Delete a model instance."""
        await db.delete(instance)
        await db.flush()


# ---- User Repository ----

class UserRepository(BaseRepository[User]):
    """Repository for User entities."""

    def model(self) -> type[User]:
        return User  # type: ignore[return-value]

    async def get_by_email(self, db: AsyncSession, email: str) -> User | None:
        """Get user by email address."""
        stmt = select(User).where(User.email == email)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()


# ---- Session Repository ----

class VoiceCatalogueSessionRepository(
    BaseRepository[VoiceCatalogueSession]
):
    """Repository for VoiceCatalogueSession entities."""

    def model(self) -> type[VoiceCatalogueSession]:
        return VoiceCatalogueSession  # type: ignore[return-value]

    async def get_by_user(self, db: AsyncSession, user_id: UUID) -> List[VoiceCatalogueSession]:
        """Get sessions by user."""
        stmt = select(VoiceCatalogueSession).where(
            VoiceCatalogueSession.user_id == user_id
        ).order_by(VoiceCatalogueSession.created_at.desc())
        result = await db.execute(stmt)
        return result.scalars().all()

    async def get_by_status(
        self, db: AsyncSession, status: str
    ) -> List[VoiceCatalogueSession]:
        """Get sessions by status."""
        stmt = select(VoiceCatalogueSession).where(
            VoiceCatalogueSession.status == status
        ).order_by(VoiceCatalogueSession.created_at.desc())
        result = await db.execute(stmt)
        return result.scalars().all()

    async def update_status(
        self, db: AsyncSession,
        instance: VoiceCatalogueSession,
        status: str,
        **updates,
    ) -> VoiceCatalogueSession:
        """Update session status with optional extra fields."""
        instance.status = status
        for key, value in updates.items():
            setattr(instance, key, value)
        await db.flush()
        await db.refresh(instance)
        return instance


# ---- Consent Record Repository ----

class ConsentRecordRepository(BaseRepository[ConsentRecord]):
    """Repository for ConsentRecord entities."""

    def model(self) -> type[ConsentRecord]:
        return ConsentRecord  # type: ignore[return-value]

    async def get_by_session(self, db: AsyncSession, session_id: UUID) -> ConsentRecord | None:
        """Get consent record for a session."""
        stmt = select(ConsentRecord).where(ConsentRecord.session_id == session_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()


# ---- Recording Metadata Repository ----

class RecordingMetadataRepository(BaseRepository[RecordingMetadata]):
    """Repository for RecordingMetadata entities."""

    def model(self) -> type[RecordingMetadata]:
        return RecordingMetadata  # type: ignore[return-value]

    async def get_by_session(
        self, db: AsyncSession, session_id: UUID
    ) -> RecordingMetadata | None:
        """Get recording metadata for a session."""
        stmt = select(RecordingMetadata).where(
            RecordingMetadata.session_id == session_id
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()


# ---- Transcript Repository ----

class TranscriptRepository(BaseRepository[Transcript]):
    """Repository for Transcript entities."""

    def model(self) -> type[Transcript]:
        return Transcript  # type: ignore[return-value]

    async def get_by_session(
        self, db: AsyncSession, session_id: UUID
    ) -> Transcript | None:
        """Get transcript for a session."""
        stmt = select(Transcript).where(Transcript.session_id == session_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()


# ---- Transcript Segment Repository ----

class TranscriptSegmentRepository(BaseRepository[TranscriptSegment]):
    """Repository for TranscriptSegment entities."""

    def model(self) -> type[TranscriptSegment]:
        return TranscriptSegment  # type: ignore[return-value]

    async def get_by_transcript(
        self, db: AsyncSession, transcript_id: UUID
    ) -> List[TranscriptSegment]:
        """Get all segments for a transcript."""
        stmt = select(TranscriptSegment).where(
            TranscriptSegment.transcript_id == transcript_id
        ).order_by(TranscriptSegment.start_time.asc())
        result = await db.execute(stmt)
        return result.scalars().all()


# ---- Draft Repository ----

class CatalogueDraftRepository(BaseRepository[CatalogueDraft]):
    """Repository for CatalogueDraft entities."""

    def model(self) -> type[CatalogueDraft]:
        return CatalogueDraft  # type: ignore[return-value]

    async def get_by_session(
        self, db: AsyncSession, session_id: UUID
    ) -> CatalogueDraft | None:
        """Get draft for a session."""
        stmt = select(CatalogueDraft).where(CatalogueDraft.session_id == session_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()


# ---- Approval Record Repository ----

class ApprovalRecordRepository(BaseRepository[ApprovalRecord]):
    """Repository for ApprovalRecord entities."""

    def model(self) -> type[ApprovalRecord]:
        return ApprovalRecord  # type: ignore[return-value]

    async def get_by_draft(
        self, db: AsyncSession, draft_id: UUID
    ) -> ApprovalRecord | None:
        """Get approval record for a draft."""
        stmt = select(ApprovalRecord).where(ApprovalRecord.draft_id == draft_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()


# ---- Approved Snapshot Repository ----

class ApprovedSnapshotRepository(BaseRepository[ApprovedSnapshot]):
    """Repository for ApprovedSnapshot entities."""

    def model(self) -> type[ApprovedSnapshot]:
        return ApprovedSnapshot  # type: ignore[return-value]

    async def get_by_session(
        self, db: AsyncSession, session_id: UUID
    ) -> ApprovedSnapshot | None:
        """Get approved snapshot for a session."""
        stmt = select(ApprovedSnapshot).where(
            ApprovedSnapshot.session_id == session_id
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()


# ---- Field Value Repository ----

class FieldValueRepository(BaseRepository[FieldValue]):
    """Repository for FieldValue entities."""

    def model(self) -> type[FieldValue]:
        return FieldValue  # type: ignore[return-value]

    async def get_by_draft_and_field(
        self, db: AsyncSession, draft_id: UUID, field_name: str
    ) -> FieldValue | None:
        """Get field value by draft and field name."""
        stmt = select(FieldValue).where(
            FieldValue.draft_id == draft_id, FieldValue.field_name == field_name
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def update_value(
        self, db: AsyncSession, instance: FieldValue, **kwargs
    ) -> FieldValue:
        """Update a field value."""
        return await self.update(db, instance, **kwargs)


# ---- Audit Event Repository ----

class AuditEventRepository(BaseRepository[AuditEvent]):
    """Repository for AuditEvent entities."""

    def model(self) -> type[AuditEvent]:
        return AuditEvent  # type: ignore[return-value]

    async def create_audit_event(
        self, db: AsyncSession,
        session_id: UUID | None,
        event_type: str,
        entity_id: UUID | None = None,
        details: str | None = None,
    ) -> AuditEvent:
        """Create an audit event."""
        event = AuditEvent(
            session_id=session_id,
            event_type=event_type,
            entity_id=entity_id,
            details=details,
        )
        db.add(event)
        await db.flush()
        return event