"""
Phase 14 — Sarvam / Saaras Speech-to-Text Adapter.
Integrates with Sarvam AI's Saaras speech recognition API (https://api.sarvam.ai/speech-to-text).
Strictly raises TranscriptionError on failure without silent fallback.
"""
from __future__ import annotations

import logging
from typing import Optional, Tuple, List, Dict, Any

import httpx

from backend.app.core.config import settings
from backend.app.adapters.speech.base import (
    SpeechAdapter,
    SpeechTranscriptionRequest,
    SpeechTranscriptionResponse,
    TranscriptSegment,
    TranscriptionStatus,
    LanguageDetection,
)
from backend.app.adapters.speech.errors import TranscriptionError

logger = logging.getLogger(__name__)

# BCP-47 language mappings for Sarvam Saaras API
SARVAM_LANGUAGE_MAP: dict[str, str] = {
    "hi": "hi-IN",
    "en": "en-IN",
    "bn": "bn-IN",
    "te": "te-IN",
    "or": "od-IN",
    "ta": "ta-IN",
    "gu": "gu-IN",
    "mr": "mr-IN",
    "kn": "kn-IN",
    "ml": "ml-IN",
    "pa": "pa-IN",
}


class SarvamSpeechAdapter(SpeechAdapter):
    """Production Sarvam AI / Saaras Speech Transcription Adapter.

    Strictly communicates with Sarvam Saaras STT endpoint.
    Does NOT silently fall back to local Faster Whisper.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        base_url: str = "https://api.sarvam.ai",
        timeout_seconds: float = 30.0,
    ) -> None:
        self.engine_name = "sarvam"
        self._api_key = api_key or (
            settings.sarvam_api_key.get_secret_value()
            if getattr(settings, "sarvam_api_key", None)
            else None
        )
        self.model_name = model or getattr(settings, "sarvam_model", "saaras:v3")
        self._base_url = base_url.rstrip("/")
        self._timeout_seconds = timeout_seconds

    async def transcribe(
        self, request: SpeechTranscriptionRequest
    ) -> SpeechTranscriptionResponse:
        """Transcribe speech audio via Sarvam Saaras API.

        Raises TranscriptionError on missing key, API error, or network failure.
        """
        if not self._api_key:
            raise TranscriptionError(
                message="SARVAM_API_KEY is not configured on the server",
                error_code="SARVAM_KEY_MISSING",
                retryable=False,
            )

        # Prepare request payload
        ext = (request.format or "wav").lower().replace(".", "")
        content_type = f"audio/{ext}" if ext in ["wav", "mp3", "ogg", "webm", "m4a"] else "audio/wav"
        filename = f"audio.{ext}"

        lang_code = SARVAM_LANGUAGE_MAP.get(request.language_hint) if request.language_hint else None
        form_data: Dict[str, Any] = {"model": self.model_name}
        if lang_code:
            form_data["language_code"] = lang_code

        headers = {
            "api-subscription-key": self._api_key,
        }

        try:
            async with httpx.AsyncClient(timeout=self._timeout_seconds) as client:
                files = {
                    "file": (filename, request.audio_data, content_type),
                }
                response = await client.post(
                    f"{self._base_url}/speech-to-text",
                    headers=headers,
                    data=form_data,
                    files=files,
                )

            if response.status_code == 200:
                data = response.json()
                transcript = data.get("transcript", "").strip()
                detected_lang_code = data.get("language_code", lang_code or "hi-IN")
                short_lang = detected_lang_code.split("-")[0]

                segment = TranscriptSegment(
                    id=0,
                    text=transcript,
                    start=0.0,
                    end=0.0,
                    confidence=0.95,
                    is_low_confidence=False,
                )

                logger.info(
                    f"Sarvam Saaras transcription successful (lang={short_lang}, length={len(transcript)})"
                )

                return SpeechTranscriptionResponse(
                    status=TranscriptionStatus.COMPLETED.value,
                    detected_language=short_lang,
                    detected_language_confidence=0.95,
                    original_text=transcript,
                    corrected_text=transcript,
                    confidence=0.95,
                    segments=[segment] if transcript else [],
                    low_confidence_segments=[],
                    language=short_lang,
                    text=transcript,
                )

            # Upstream error (400, 401, 402 quota, 429, 500, etc.)
            try:
                err_json = response.json()
                err_msg = (
                    err_json.get("error", {}).get("message")
                    or err_json.get("detail")
                    or response.text
                )
                err_code = (
                    err_json.get("error", {}).get("code")
                    or f"SARVAM_HTTP_{response.status_code}"
                )
            except Exception:
                err_msg = response.text or f"HTTP {response.status_code}"
                err_code = f"SARVAM_HTTP_{response.status_code}"

            logger.error(
                f"Sarvam Saaras STT failed ({response.status_code}): {err_msg}"
            )
            raise TranscriptionError(
                message=f"Sarvam Saaras STT failed ({response.status_code}): {err_msg}",
                error_code=err_code,
                retryable=response.status_code in (429, 500, 502, 503, 504),
            )

        except TranscriptionError:
            raise
        except Exception as exc:
            logger.error(f"Sarvam Saaras STT request failed: {exc}")
            raise TranscriptionError(
                message=f"Sarvam Saaras STT request failed: {str(exc)}",
                error_code="SARVAM_REQUEST_FAILED",
                retryable=True,
            ) from exc

    def validate_audio(
        self, audio_data: bytes, format: str | None
    ) -> Tuple[bool, str]:
        """Validate audio payload size and format for Sarvam API."""
        if not audio_data or len(audio_data) == 0:
            return False, "Audio file is empty"

        max_size = getattr(settings, "max_audio_size_mb", 50) * 1024 * 1024
        if len(audio_data) > max_size:
            return False, f"Audio exceeds maximum size of {getattr(settings, 'max_audio_size_mb', 50)}MB"

        allowed = ["wav", "mp3", "m4a", "webm", "ogg", "flac", "aac"]
        if format and format.lower().replace(".", "") not in allowed:
            return False, f"Unsupported audio format: {format}"

        return True, ""

    async def detect_language(self, audio_data: bytes) -> LanguageDetection:
        """Language detection for Sarvam adapter (defaults to Indic primary hi)."""
        return LanguageDetection(code="hi", confidence=0.9)
