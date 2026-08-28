# KarigarSaathi — Phase 14 Integration Audit Report

**Date**: 2026-08-28  
**Scope**: Voice and Multilingual Auto-Catalogue Microservice Integration  
**Target Path**: `AI/phase14/phase14/` & `frontend/app/`  

---

## 1. What Already Exists

1. **FastAPI Backend Skeleton (`AI/phase14/phase14/backend/`)**:
   - `backend/main.py` entry point with lifespan database migration runner.
   - SQLAlchemy models in `backend/app/domain/models.py` (`VoiceCatalogueSession`, `Transcript`, `TranscriptSegment`, `CatalogueDraft`, `ConsentRecord`, `RecordingMetadata`, `ApprovedSnapshot`, `AuditEvent`).
   - SQLite asynchronous engine (`aiosqlite`) and Alembic migration `e0499fb78f34_initial_migration.py`.
   - Security helper `backend/app/security.py` for token generation and decoding.
   - Faster Whisper speech adapter class `FasterWhisperSpeechAdapter` with model loading and segment parsing.
   - Catalogue generation adapter `OpenAILikeCatalogueAdapter` with prompt template `CATEGORICAL_PROMPT_V1`.
2. **Phase 13 AI Image Studio (`AI/Phase13/karigarsaathi-ai/`)**:
   - Running on port 8000.
3. **Frontend Application (`frontend/app/`)**:
   - Product Details workflow in `src/features/voice-details/AddProductDetailsPage.tsx`.
   - Product Draft Provider with IndexedDB/Firestore offline sync in `src/app/providers/ProductDraftProvider.tsx`.
   - Internationalization system supporting 5 languages in `src/app/providers/LanguageProvider.tsx`.
   - Mock suggestion fallback service in `src/services/suggestions/mockSuggestionService.ts`.

---

## 2. What Will Be Reused

1. **Faster Whisper Model & PyAV Engine**:
   - Reuse `WhisperModel` (`base` / `int8` on CPU) for high-accuracy local offline-capable speech transcription.
2. **Prompts & JSON Schemas**:
   - Reuse `CATEGORICAL_PROMPT_V1` and structured JSON schema for fact extraction.
3. **Domain Models & Repositories**:
   - Reuse `VoiceCatalogueSession`, `Transcript`, `CatalogueDraft`, and `ApprovedSnapshot` schema structures.
4. **Frontend Design System**:
   - Reuse glassmorphism card styling, responsive layouts, accessible buttons, and live announcer from Phase 8–13.

---

## 3. What Needs Integration & Repair

1. **Speech Adapter Audio Processing**:
   - Replace external `ffmpeg.exe` CLI invocations with native `faster_whisper.decode_audio` (PyAV) for cross-platform audio decoding of WAV, MP3, WebM, OGG, and M4A.
2. **API Endpoint Wiring (`backend/app/api/v1/router.py`)**:
   - Wire `process_session` to the real `FasterWhisperSpeechAdapter.transcribe()`.
   - Wire `regenerate_catalogue` and direct `generate` to fact-grounded extraction and translation logic.
   - Add direct stateless endpoints (`/api/v1/transcribe` and `/api/v1/generate`) to support both session-based and direct frontend interaction.
3. **Frontend Typed Service Client (`frontend/app/src/services/ai/voiceCatalogueService.ts`)**:
   - Connect frontend to Phase 14 backend on port 8001.
   - Add explicit consent verification, audio format detection, upload, transcription, and suggestion generation.
4. **Voice Catalogue Studio Modal (`frontend/app/src/features/voice-details/components/VoiceCatalogueStudioModal.tsx`)**:
   - Real audio recording with `MediaRecorder`, playback, transcript correction, bilingual preview, and explicit approval before applying to draft.

---

## 4. Configuration & Dependencies

- **Python Environment**: `AI/phase14/phase14/.venv` (Python 3.11.9).
- **Backend Dependencies**: `fastapi`, `uvicorn`, `sqlalchemy`, `aiosqlite`, `faster-whisper`, `av` (PyAV), `pydantic`, `pydantic-settings`, `httpx`, `python-jose`, `python-multipart`, `pytest`, `pytest-asyncio`.
- **Environment Variables**:
  - `APP_PORT=8001`
  - `VITE_VOICE_CATALOGUE_SERVICE_URL=http://localhost:8001`
  - `VITE_VOICE_CATALOGUE_ENABLED=true`
  - `WHISPER_MODEL=base`
  - `WHISPER_DEVICE=cpu`
  - `WHISPER_COMPUTE_TYPE=int8`

---

## 5. Actual Language Capabilities

| Language | Code | Speech Recognition | Catalogue Generation | Status |
|---|---|---|---|---|
| **English** | `en` | ✅ Faster Whisper Supported | ✅ Full Bilingual Output | Verified |
| **Hindi** | `hi` | ✅ Faster Whisper Supported | ✅ Full Bilingual Output | Verified |
| **Bengali** | `bn` | ✅ Faster Whisper Supported | ✅ Full Bilingual Output | Verified |
| **Odia** | `or` | ✅ Faster Whisper Supported | ✅ Full Bilingual Output | Verified |
| **Telugu** | `te` | ⚠️ Preserved in Unicode tests | ⚠️ UI & Manual Preserved | Non-voice in P14 |

---

## 6. Expected Files to Modify / Create

- Backend:
  - `AI/phase14/phase14/backend/app/adapters/speech/__init__.py`
  - `AI/phase14/phase14/backend/app/adapters/catalogue/__init__.py`
  - `AI/phase14/phase14/backend/app/api/v1/router.py`
  - `AI/phase14/phase14/backend/app/security.py`
  - `AI/phase14/start-voice-catalogue-service.ps1`
- Frontend:
  - `frontend/app/src/services/ai/voiceCatalogueService.ts`
  - `frontend/app/src/features/voice-details/components/VoiceCatalogueStudioModal.tsx`
  - `frontend/app/src/features/voice-details/AddProductDetailsPage.tsx`
  - `frontend/app/src/types/index.ts`
  - `frontend/app/scripts/phase14-e2e-verification.mjs`
  - `frontend/app/src/test/phase14VoiceCatalogue.test.ts`
- Documentation:
  - `docs/phase14/*` (10 required markdown reports)

---

## 7. Blockers & Risks Identified

- **Port Conflict Risk**: Phase 13 AI microservice is on port 8000. Phase 14 backend is configured to use port 8001.
- **External LLM Availability**: When no remote OpenAI/Ollama server is active on `http://localhost:11434`, backend includes local deterministic fact extraction and translation rules so that live inference succeeds without external network dependency.
