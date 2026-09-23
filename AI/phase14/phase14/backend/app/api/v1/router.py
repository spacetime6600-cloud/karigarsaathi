from __future__ import annotations

import os
import uuid
import json
import logging
from datetime import datetime
from uuid import UUID
from typing import Optional, Dict, Any, List

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Body
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.core.config import settings
from backend.app.security import create_dev_token, decode_dev_token, verify_session_token
from backend.app.adapters.speech import FasterWhisperSpeechAdapter, get_speech_adapter
from backend.app.adapters.speech.base import SpeechTranscriptionRequest
from backend.app.adapters.catalogue import OpenAILikeCatalogueAdapter
from backend.app.domain.models import (
    User,
    VoiceCatalogueSession,
    SessionStatus,
    Transcript,
    TranscriptSegment,
    CatalogueDraft,
    GeneratedContent,
    FieldValue,
    ApprovalRecord,
    ApprovedSnapshot,
    IdempotencyKey,
    AuditEvent,
    AuditEventType,
    RecordingMetadata,
    ConsentRecord,
)
from backend.app.repositories import (
    UserRepository,
    VoiceCatalogueSessionRepository,
    ConsentRecordRepository,
    RecordingMetadataRepository,
    TranscriptRepository,
    TranscriptSegmentRepository,
    CatalogueDraftRepository,
    FieldValueRepository,
    ApprovalRecordRepository,
    ApprovedSnapshotRepository,
    AuditEventRepository,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["v1"])
http_bearer = HTTPBearer(auto_error=False)

# Singleton instances of adapters
speech_adapter = get_speech_adapter()
catalogue_adapter = OpenAILikeCatalogueAdapter()


# --- Dependencies ---

async def get_db_session() -> AsyncSession:
    from backend.app.core.database import get_session
    async for session in get_session():
        yield session


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer),
    db: AsyncSession = Depends(get_db_session),
) -> User:
    """Get or create authenticated user from Bearer token."""
    user_id_str = "artisan_dev_001"

    if credentials and credentials.credentials:
        payload = verify_session_token(credentials.credentials)
        if payload and payload.get("sub"):
            user_id_str = payload.get("sub")
        else:
            user_id_str = credentials.credentials.strip()

    # Create deterministic UUID for user if not valid UUID
    try:
        user_uuid = UUID(user_id_str)
    except (ValueError, AttributeError):
        user_uuid = uuid.uuid5(uuid.NAMESPACE_DNS, user_id_str or "default_artisan")

    # Fetch or auto-provision in DB
    user = await db.get(User, user_uuid)
    if user is None:
        user = User(
            id=user_uuid,
            email=f"{user_uuid.hex[:8]}@karigarsaathi.local",
            hashed_password="dev_hash_password",
            display_name=f"Artisan {user_id_str[:12]}",
            is_active=True,
            language_preference="hi",
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    return user


# --- Health & Capabilities ---

@router.get("/health", tags=["health"])
async def health():
    return {
        "status": "ok",
        "service": "karigarSaathi-phase14",
        "model_ready": True,
        "whisper_model": getattr(settings, "whisper_model", "base"),
        "supported_languages": ["en", "hi", "or", "bn"],
    }


# --- Development Auth ---

@router.post("/auth/dev-token", tags=["auth"])
async def dev_token(user_id: str = "dev-user"):
    token = create_dev_token({"sub": user_id})
    return {"access_token": token, "token_type": "bearer"}


# --- Catalogue Sessions ---

@router.post("/catalogue-sessions", tags=["catalogue-sessions"])
async def create_session(
    payload: Dict[str, Any] = Body(default={}),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    """Create a new voice catalogue session."""
    selected_language = payload.get("selected_language", "hi")
    consent_granted = bool(payload.get("consent_granted", True))
    retention_choice = payload.get("retention_choice", "30_days")

    session = VoiceCatalogueSession(
        user_id=user.id,
        status=SessionStatus.created,
        selected_language=selected_language,
        consent_granted=consent_granted,
        retention_choice=retention_choice,
    )
    db.add(session)
    await db.flush()

    # Save consent record
    consent = ConsentRecord(
        session_id=session.id,
        consent_granted=consent_granted,
        consent_policy_version=getattr(settings, "consent_policy_version", "v1"),
        retention_choice=retention_choice,
    )
    db.add(consent)
    await db.commit()

    return {
        "session_id": str(session.id),
        "status": session.status,
        "selected_language": session.selected_language,
        "user_id": str(user.id),
    }


@router.get("/catalogue-sessions/{session_id}", tags=["catalogue-sessions"])
async def get_session(
    session_id: str,
    db: AsyncSession = Depends(get_db_session),
):
    try:
        s_uuid = UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid session UUID")

    session = await db.get(VoiceCatalogueSession, s_uuid)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    return {
        "session_id": str(session.id),
        "status": session.status,
        "selected_language": session.selected_language,
        "user_id": str(session.user_id),
        "consent_granted": session.consent_granted,
    }


# --- Audio Upload ---

@router.post("/catalogue-sessions/{session_id}/audio", tags=["catalogue-sessions"])
async def upload_audio(
    session_id: str,
    audio_file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db_session),
):
    try:
        s_uuid = UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid session UUID")

    session = await db.get(VoiceCatalogueSession, s_uuid)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    content = await audio_file.read()
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty audio file")

    # Validate audio
    ext = os.path.splitext(audio_file.filename or "audio.wav")[1].lower().replace(".", "") or "wav"
    is_valid, err_msg = speech_adapter.validate_audio(content, ext)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)

    # Save to private uploads directory
    upload_dir = getattr(settings, "private_upload_dir", "./private/uploads")
    os.makedirs(upload_dir, exist_ok=True)
    safe_filename = f"{uuid.uuid4().hex}.{ext}"
    stored_path = os.path.join(upload_dir, safe_filename)

    with open(stored_path, "wb") as f:
        f.write(content)

    recording = RecordingMetadata(
        session_id=session.id,
        original_filename=audio_file.filename or "recording.wav",
        stored_filename=safe_filename,
        file_size_bytes=len(content),
        duration_seconds=0.0,
        format=ext,
    )
    db.add(recording)

    session.status = SessionStatus.uploaded
    await db.commit()

    return {
        "recording_id": str(recording.id),
        "stored_filename": safe_filename,
        "file_size_bytes": len(content),
        "status": session.status,
    }


# --- Process Audio (Faster Whisper Transcription) ---

@router.post("/catalogue-sessions/{session_id}/process", tags=["catalogue-sessions"])
async def process_session(
    session_id: str,
    db: AsyncSession = Depends(get_db_session),
):
    try:
        s_uuid = UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid session UUID")

    session = await db.get(VoiceCatalogueSession, s_uuid)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    # Find recording
    recording_repo = RecordingMetadataRepository()
    recording = await recording_repo.get_by_session(db, session.id)
    if not recording:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No audio uploaded for this session")

    upload_dir = getattr(settings, "private_upload_dir", "./private/uploads")
    audio_path = os.path.join(upload_dir, recording.stored_filename)
    if not os.path.exists(audio_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audio file not found on server")

    with open(audio_path, "rb") as f:
        audio_bytes = f.read()

    # Transcribe via Faster Whisper
    session.status = SessionStatus.transcribing
    await db.commit()

    try:
        transcription = await speech_adapter.transcribe(
            SpeechTranscriptionRequest(
                audio_data=audio_bytes,
                format=recording.format,
                language_hint=session.selected_language,
            )
        )
    except Exception as e:
        session.status = SessionStatus.transcription_failed
        await db.commit()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Transcription failed: {str(e)}")

    # Save Transcript record
    transcript = Transcript(
        session_id=session.id,
        source_language=transcription.language or session.selected_language,
        original_text=transcription.original_text,
        corrected_text=transcription.corrected_text,
        confidence=transcription.confidence,
        detected_language=transcription.detected_language,
        detected_language_confidence=transcription.detected_language_confidence,
    )
    db.add(transcript)
    await db.flush()

    # Save segments
    segments_payload = []
    for seg in transcription.segments:
        s_time = float(getattr(seg, "start_time", getattr(seg, "start", 0.0)))
        e_time = float(getattr(seg, "end_time", getattr(seg, "end", 0.0)))
        seg_model = TranscriptSegment(
            transcript_id=transcript.id,
            text=seg.text,
            start_time=s_time,
            end_time=e_time,
            confidence=seg.confidence,
            is_low_confidence=seg.is_low_confidence,
        )
        db.add(seg_model)
        segments_payload.append({
            "id": seg.id,
            "text": seg.text,
            "start": s_time,
            "end": e_time,
            "confidence": seg.confidence,
            "is_low_confidence": seg.is_low_confidence,
        })

    session.status = SessionStatus.awaiting_transcript_review
    await db.commit()

    return {
        "session_id": str(session.id),
        "status": session.status,
        "transcript_id": str(transcript.id),
        "original_text": transcript.original_text,
        "corrected_text": transcript.corrected_text,
        "confidence": transcript.confidence,
        "detected_language": transcript.detected_language,
        "segments": segments_payload,
    }


# --- Transcript Endpoints ---

@router.get("/catalogue-sessions/{session_id}/transcript", tags=["catalogue-sessions"])
async def get_transcript(
    session_id: str,
    db: AsyncSession = Depends(get_db_session),
):
    try:
        s_uuid = UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid session UUID")

    transcript_repo = TranscriptRepository()
    transcript = await transcript_repo.get_by_session(db, s_uuid)
    if transcript is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transcript not found")

    segments_repo = TranscriptSegmentRepository()
    segments = await segments_repo.get_by_transcript(db, transcript.id)

    return {
        "session_id": str(session_id),
        "source_language": transcript.source_language,
        "original_text": transcript.original_text,
        "corrected_text": transcript.corrected_text or transcript.original_text,
        "confidence": transcript.confidence,
        "detected_language": transcript.detected_language,
        "segments": [
            {
                "id": str(seg.id),
                "text": seg.text,
                "start": seg.start_time,
                "end": seg.end_time,
                "confidence": seg.confidence,
                "is_low_confidence": seg.is_low_confidence,
            }
            for seg in segments
        ],
    }


@router.patch("/catalogue-sessions/{session_id}/transcript", tags=["catalogue-sessions"])
async def update_transcript(
    session_id: str,
    payload: Dict[str, Any] = Body(...),
    db: AsyncSession = Depends(get_db_session),
):
    try:
        s_uuid = UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid session UUID")

    transcript_repo = TranscriptRepository()
    transcript = await transcript_repo.get_by_session(db, s_uuid)
    if transcript is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transcript not found")

    corrected_text = payload.get("corrected_text", "")
    transcript.corrected_text = corrected_text
    await db.commit()

    return {
        "session_id": str(session_id),
        "corrected_text": transcript.corrected_text,
    }


# --- Generate / Regenerate Catalogue Suggestions ---

@router.post("/catalogue-sessions/{session_id}/generate", tags=["catalogue-sessions"])
@router.post("/catalogue-sessions/{session_id}/regenerate", tags=["catalogue-sessions"])
async def generate_catalogue(
    session_id: str,
    payload: Optional[Dict[str, Any]] = Body(default=None),
    db: AsyncSession = Depends(get_db_session),
):
    try:
        s_uuid = UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid session UUID")

    session = await db.get(VoiceCatalogueSession, s_uuid)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    # Get transcript or direct text from payload
    transcript_repo = TranscriptRepository()
    transcript = await transcript_repo.get_by_session(db, s_uuid)
    
    text = None
    if payload and payload.get("text"):
        text = payload.get("text")
    elif transcript:
        text = transcript.corrected_text or transcript.original_text

    if not text:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No transcript text available for catalogue generation")

    source_lang = getattr(transcript, "source_language", session.selected_language)
    target_lang = session.selected_language

    # Run catalogue generation
    gen_result = await catalogue_adapter.generate_catalogue_from_text(
        text=text,
        source_language=source_lang,
        target_language=target_lang,
        existing_fields=payload.get("existing_fields") if payload else None,
    )

    # Save to CatalogueDraft
    draft_repo = CatalogueDraftRepository()
    draft = await draft_repo.get_by_session(db, s_uuid)
    if draft is None:
        draft = CatalogueDraft(
            session_id=session.id,
            status="draft_ready",
        )
        db.add(draft)
        await db.flush()

    draft.title_en = gen_result.get("title_en") or gen_result.get("english_title")
    draft.title_hi = gen_result.get("title_hi") or gen_result.get("hindi_title")
    draft.description_en = gen_result.get("description_en") or gen_result.get("english_description")
    draft.description_hi = gen_result.get("description_hi") or gen_result.get("hindi_description")
    draft.tags_en = gen_result.get("tags_en") or gen_result.get("english_tags")
    draft.tags_hi = gen_result.get("tags_hi") or gen_result.get("hindi_tags")
    draft.structured_fields = gen_result.get("structured_fields")
    draft.status = "draft_ready"

    session.status = SessionStatus.draft_ready
    await db.commit()

    return {
        "session_id": str(session.id),
        "status": session.status,
        "draft": {
            "title_en": draft.title_en,
            "title_hi": draft.title_hi,
            "title_bn": gen_result.get("title_bn") or gen_result.get("bengali_title"),
            "title_or": gen_result.get("title_or") or gen_result.get("odia_title"),
            "target_language_title": gen_result.get("title_regional") or gen_result.get("target_language_title"),
            "description_en": draft.description_en,
            "description_hi": draft.description_hi,
            "description_bn": gen_result.get("description_bn") or gen_result.get("bengali_description"),
            "description_or": gen_result.get("description_or") or gen_result.get("odia_description"),
            "target_language_description": gen_result.get("description_regional") or gen_result.get("target_language_description"),
            "tags_en": draft.tags_en,
            "tags_hi": draft.tags_hi,
            "tags_bn": gen_result.get("tags_bn") or gen_result.get("bengali_tags"),
            "tags_or": gen_result.get("tags_or") or gen_result.get("odia_tags"),
            "target_language_tags": gen_result.get("tags_regional") or gen_result.get("target_language_tags"),
        },
        "structured_fields": gen_result.get("structured_fields"),
        "clarification_questions": gen_result.get("clarification_questions", []),
        "unknown_fields": gen_result.get("unknown_fields", []),
    }


@router.get("/catalogue-sessions/{session_id}/draft", tags=["catalogue-sessions"])
async def get_draft(
    session_id: str,
    db: AsyncSession = Depends(get_db_session),
):
    try:
        s_uuid = UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid session UUID")

    draft_repo = CatalogueDraftRepository()
    draft = await draft_repo.get_by_session(db, s_uuid)
    if draft is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft not found")

    return {
        "session_id": str(session_id),
        "status": draft.status,
        "title_hi": draft.title_hi,
        "title_en": draft.title_en,
        "description_hi": draft.description_hi,
        "description_en": draft.description_en,
        "tags_hi": draft.tags_hi,
        "tags_en": draft.tags_en,
        "structured_fields": draft.structured_fields or {},
    }


# --- Explicit Approval ---

@router.post("/catalogue-sessions/{session_id}/approve", tags=["catalogue-sessions"])
async def approve_catalogue(
    session_id: str,
    payload: Dict[str, Any] = Body(default={}),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    try:
        s_uuid = UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid session UUID")

    session = await db.get(VoiceCatalogueSession, s_uuid)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    draft_repo = CatalogueDraftRepository()
    draft = await draft_repo.get_by_session(db, s_uuid)
    if draft is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft not found")

    snapshot_data = {
        "title_hi": draft.title_hi,
        "title_en": draft.title_en,
        "description_hi": draft.description_hi,
        "description_en": draft.description_en,
        "tags_hi": draft.tags_hi,
        "tags_en": draft.tags_en,
        "structured_fields": draft.structured_fields or {},
        "approved_at": datetime.utcnow().isoformat(),
    }

    snapshot = ApprovedSnapshot(
        session_id=session.id,
        draft_id=draft.id,
        catalogue_json=json.dumps(snapshot_data),
        approved_by=current_user.id,
        revision_number=1,
        is_immutable=True,
    )
    db.add(snapshot)

    draft.status = "approved"
    session.status = SessionStatus.approved
    await db.commit()

    return {
        "session_id": str(session_id),
        "status": "approved",
        "approved": True,
        "snapshot_id": str(snapshot.id),
        "catalogue_json": snapshot_data,
    }


# --- Delete Source Data (Privacy & Retention Control) ---

@router.delete("/catalogue-sessions/{session_id}/source-data", tags=["catalogue-sessions"])
async def delete_source_data(
    session_id: str,
    db: AsyncSession = Depends(get_db_session),
):
    try:
        s_uuid = UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid session UUID")

    session = await db.get(VoiceCatalogueSession, s_uuid)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    # Delete audio file
    recording_repo = RecordingMetadataRepository()
    recording = await recording_repo.get_by_session(db, s_uuid)
    if recording:
        upload_dir = getattr(settings, "private_upload_dir", "./private/uploads")
        path = os.path.join(upload_dir, recording.stored_filename)
        if os.path.exists(path):
            try:
                os.remove(path)
            except OSError:
                pass
        await db.delete(recording)

    # Delete transcript
    transcript_repo = TranscriptRepository()
    transcript = await transcript_repo.get_by_session(db, s_uuid)
    if transcript:
        await db.delete(transcript)

    session.status = SessionStatus.source_deleted
    await db.commit()

    return {
        "session_id": str(session_id),
        "status": session.status,
        "detail": "Audio recording and raw transcript deleted from server.",
    }


# --- Direct Stateless Endpoints (Fast Inference & Testing) ---

@router.post("/transcribe", tags=["direct-inference"])
async def transcribe_direct(
    audio_file: UploadFile = File(...),
    language_hint: Optional[str] = Form(None),
):
    """Direct multipart audio transcription via Faster Whisper."""
    content = await audio_file.read()
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty audio file")

    ext = os.path.splitext(audio_file.filename or "audio.wav")[1].lower().replace(".", "") or "wav"
    is_valid, err_msg = speech_adapter.validate_audio(content, ext)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)

    transcription = await speech_adapter.transcribe(
        SpeechTranscriptionRequest(
            audio_data=content,
            format=ext,
            language_hint=language_hint,
        )
    )

    return {
        "status": transcription.status,
        "detected_language": transcription.detected_language,
        "confidence": transcription.confidence,
        "original_text": transcription.original_text,
        "corrected_text": transcription.corrected_text,
        "segments": [
            {
                "id": seg.id,
                "text": seg.text,
                "start": seg.start_time,
                "end": seg.end_time,
                "confidence": seg.confidence,
                "is_low_confidence": seg.is_low_confidence,
            }
            for seg in transcription.segments
        ],
    }


@router.post("/generate", tags=["direct-inference"])
async def generate_direct(
    payload: Dict[str, Any] = Body(...),
):
    """Direct factual extraction and bilingual catalogue suggestion generation."""
    text = payload.get("text", "")
    if not text or not text.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Text is required")

    source_language = payload.get("source_language", "en")
    target_language = payload.get("target_language", "hi")
    existing_fields = payload.get("existing_fields")

    result = await catalogue_adapter.generate_catalogue_from_text(
        text=text,
        source_language=source_language,
        target_language=target_language,
        existing_fields=existing_fields,
    )

    return result


@router.post("/translate", tags=["direct-inference"])
async def translate_direct(
    payload: Dict[str, Any] = Body(...),
):
    """Translate confirmed source transcript faithfully into target language (default English)."""
    text = payload.get("text", "")
    if not text or not text.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Text is required")

    source_language = payload.get("source_language", "hi")
    target_language = payload.get("target_language", "en")

    result = await catalogue_adapter.translate_text(
        text=text,
        source_language=source_language,
        target_language=target_language,
    )

    return result


# --- Phase 14 Pipeline: Transcribe + Translate (phase14-sarvam via Ollama /api/generate) ---

@router.post("/pipeline/transcribe-translate", tags=["pipeline"])
async def pipeline_transcribe_translate(
    audio_file: UploadFile = File(...),
    source_language: str = Form(...),
    corrected_transcript: Optional[str] = Form(None),
):
    """
    Complete pipeline endpoint:
    1. Accept audio + explicitly selected source_language
    2. Surface blocker if speech recognition unsupported (Odia -> manual entry required)
    3. Transcribe with Faster Whisper
    4. If corrected_transcript supplied, use that (artisan review applied)
    5. Route through phase14-sarvam (Ollama /api/generate):
       - Hindi:   preserve Hindi; produce English
       - English: preserve English; produce Hindi
       - Odia / Bengali / Telugu: -> English -> Hindi
    6. Return original_transcript, corrected_transcript, hindi_output, english_output
    """
    from backend.app.adapters.translation import OllamaSarvamTranslator, check_speech_support

    if source_language not in ["hi", "en", "or", "bn", "te"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported language: {source_language}. Choose from: hi, en, or, bn, te",
        )

    original_transcript = ""
    speech_blocked = False
    blocker_message = None

    speech_ok, blocker_msg = check_speech_support(source_language)
    if not speech_ok:
        speech_blocked = True
        blocker_message = blocker_msg
        if not corrected_transcript or not corrected_transcript.strip():
            return {
                "speech_blocked": True,
                "blocker_message": blocker_msg,
                "source_language": source_language,
                "original_transcript": None,
                "corrected_transcript": None,
                "hindi_output": None,
                "english_output": None,
                "routing_path": [],
                "review_required": True,
                "review_reason": blocker_msg,
            }
        original_transcript = corrected_transcript.strip()
    else:
        content = await audio_file.read()
        if not content:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty audio file")
        ext = os.path.splitext(audio_file.filename or "audio.wav")[1].lower().replace(".", "") or "wav"
        is_valid, err_msg = speech_adapter.validate_audio(content, ext)
        if not is_valid:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)
        try:
            transcription = await speech_adapter.transcribe(
                SpeechTranscriptionRequest(
                    audio_data=content,
                    format=ext,
                    language_hint=source_language,
                )
            )
            original_transcript = transcription.original_text or ""
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Transcription failed: {str(exc)}",
            )

    final_transcript = (
        corrected_transcript.strip()
        if corrected_transcript and corrected_transcript.strip()
        else original_transcript
    )

    if not final_transcript:
        return {
            "speech_blocked": speech_blocked,
            "blocker_message": blocker_message,
            "source_language": source_language,
            "original_transcript": original_transcript,
            "corrected_transcript": final_transcript,
            "hindi_output": None,
            "english_output": None,
            "routing_path": [],
            "review_required": True,
            "review_reason": "Empty transcript — manual entry required",
        }

    try:
        translator = OllamaSarvamTranslator()
        translation = translator.translate(final_transcript, source_language)
    except Exception as exc:
        logger.error(f"Translation adapter failed: {exc}")
        translation = {
            "original_transcript": final_transcript,
            "corrected_transcript": final_transcript,
            "hindi_output": None,
            "english_output": None,
            "routing_path": [],
            "review_required": True,
            "review_reason": f"Translation failed: {str(exc)}",
        }

    return {
        "speech_blocked": speech_blocked,
        "blocker_message": blocker_message,
        "source_language": source_language,
        "original_transcript": original_transcript,
        "corrected_transcript": final_transcript,
        "hindi_output": translation.get("hindi_output"),
        "english_output": translation.get("english_output"),
        "routing_path": translation.get("routing_path", []),
        "review_required": translation.get("review_required", False),
        "review_reason": translation.get("review_reason"),
    }


@router.post("/pipeline/translate-only", tags=["pipeline"])
async def pipeline_translate_only(
    payload: Dict[str, Any] = Body(...),
):
    """
    Translate a corrected/manual transcript through phase14-sarvam with routing rules.
    Useful after artisan has reviewed and typed/corrected the transcript.
    Body: { "corrected_transcript": "...", "source_language": "hi" }
    """
    from backend.app.adapters.translation import OllamaSarvamTranslator, check_speech_support

    corrected_transcript = payload.get("corrected_transcript", "").strip()
    source_language = payload.get("source_language", "hi")

    if source_language not in ["hi", "en", "or", "bn", "te"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported language: {source_language}",
        )
    if not corrected_transcript:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="corrected_transcript is required",
        )

    try:
        translator = OllamaSarvamTranslator()
        result = translator.translate(corrected_transcript, source_language)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Translation failed: {str(exc)}",
        )

    return result