from __future__ import annotations

import asyncio
import logging
from typing import Optional, Tuple, List, Dict, Any

import numpy as np

from faster_whisper import WhisperModel

from backend.app.core.config import settings
from backend.app.adapters.speech.base import (
    SpeechTranscriptionRequest,
    SpeechTranscriptionResponse,
    SpeechAdapter,
    LanguageDetection,
    TranscriptSegment,
    TranscriptionResult,
    TranscriptionStatus,
)
from backend.app.adapters.speech.errors import TranscriptionError

logger = logging.getLogger(__name__)


class FasterWhisperSpeechAdapter(SpeechAdapter):
    """Production Faster Whisper speech transcription adapter.

    Accepts normalized audio, detects spoken language, returns transcript
    with segment timestamps and segment-level confidence scores.
    """

    def __init__(self) -> None:
        self._model: Optional[WhisperModel] = None

    @property
    def model(self) -> WhisperModel:
        """Lazy-loaded Faster Whisper model instance."""
        if self._model is None:
            model_name = getattr(settings, "whisper_model", "medium")
            device = getattr(settings, "whisper_device", "cpu")
            compute_type = getattr(settings, "whisper_compute_type", "int8")

            logger.info(
                f"Loading Faster Whisper model: {model_name} on {device} ({compute_type})"
            )
            try:
                self._model = WhisperModel(
                    model_name,
                    device=device,
                    compute_type=compute_type,
                )
            except Exception as e:
                logger.warning(f"Failed to load Whisper model '{model_name}' ({e}); falling back to 'small'")
                try:
                    self._model = WhisperModel(
                        "small",
                        device=device,
                        compute_type=compute_type,
                    )
                except Exception:
                    self._model = WhisperModel(
                        "base",
                        device=device,
                        compute_type=compute_type,
                    )
            logger.info("Faster Whisper model loaded successfully")
        return self._model

    async def transcribe(
        self, request: SpeechTranscriptionRequest
    ) -> SpeechTranscriptionResponse:
        """Transcribe speech audio into structured text with timestamps.

        Args:
            request: Transcription request with audio data and options.

        Returns:
            Transcription response with text, segments, language, and confidence.

        Raises:
            TranscriptionError: If transcription fails.
        """
        # Odia speech recognition check
        if request.language_hint == "or":
            raise TranscriptionError(
                message="Speech recognition for Odia is not supported by standard Whisper models. Please type your craft description in Odia, or speak in Hindi, Bengali, or English.",
                error_code="ODIA_SPEECH_UNSUPPORTED",
                retryable=False,
            )

        # Validate language if provided
        if request.language_hint and request.language_hint not in self._allowed_languages():
            raise TranscriptionError(
                message=f"Unsupported language: {request.language_hint}",
                error_code="UNSUPPORTED_LANGUAGE",
                retryable=False,
            )

        # Ensure model is loaded
        _ = self.model

        # Process audio: normalize and convert to 16kHz float32 array
        audio_array = self._process_audio(request.audio_data, request.format)

        # Map language hint to Whisper supported language code
        language_hint = request.language_hint
        whisper_lang = language_hint if language_hint in ["hi", "bn", "en", "te"] else None

        if not whisper_lang:
            det = await self._detect_language(audio_array)
            whisper_lang = det.get("code", "en") if det.get("code") in ["hi", "bn", "en", "te"] else "en"

        logger.info(f"Transcribing audio with Whisper language={whisper_lang}, samples={len(audio_array)}")

        from backend.app.adapters.speech.script_normalizer import (
            normalize_transcript_for_language,
            clean_repetitive_hallucinations,
        )

        # Transcribe with language hint, repetition suppression, and VAD filter
        segments_gen, info = self.model.transcribe(
            audio_array,
            language=whisper_lang,
            task="transcribe",
            beam_size=getattr(settings, "beam_size", 5),
            best_of=5,
            temperature=0.0,
            compression_ratio_threshold=2.4,
            no_speech_threshold=0.6,
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=400, speech_pad_ms=200),
            repetition_penalty=1.2,
            no_repeat_ngram_size=3,
            condition_on_previous_text=False,
            without_timestamps=False,
        )

        # Parse segments
        transcript_segments: List[TranscriptSegment] = []
        low_confidence_segments: List[TranscriptSegment] = []
        full_text_parts = []
        threshold = getattr(settings, "low_confidence_threshold", 0.5)

        for idx, segment in enumerate(segments_gen):
            prob = getattr(segment, "avg_logprob", None)
            # Convert logprob to confidence approx (0 to 1)
            seg_conf = float(np.exp(prob)) if prob is not None else float(getattr(segment, "probability", 0.85))
            seg_conf = min(1.0, max(0.0, seg_conf))

            text_raw = segment.text.strip()
            if not text_raw:
                continue

            text_cleaned = normalize_transcript_for_language(text_raw, whisper_lang)
            if not text_cleaned:
                continue

            # Suppress degenerate single-word stutter repetitions
            words = text_cleaned.split()
            if len(words) >= 4 and len(set(words)) <= 1:
                continue

            segment_data = TranscriptSegment(
                id=idx,
                text=text_cleaned,
                start=float(segment.start),
                end=float(segment.end),
                start_time=float(segment.start),
                end_time=float(segment.end),
                confidence=seg_conf,
                is_low_confidence=seg_conf < threshold,
            )
            transcript_segments.append(segment_data)
            full_text_parts.append(text_cleaned)

            if seg_conf < threshold:
                low_confidence_segments.append(segment_data)

        full_text = " ".join(full_text_parts).strip()
        full_text = normalize_transcript_for_language(full_text, whisper_lang)

        # Compute average segment confidence instead of raw language probability
        if transcript_segments:
            overall_confidence = float(np.mean([s.confidence for s in transcript_segments if s.confidence is not None]))
        else:
            overall_confidence = 0.85

        detected_lang_code = getattr(info, "language", whisper_lang or "en")

        response = SpeechTranscriptionResponse(
            status=TranscriptionStatus.COMPLETED.value,
            detected_language=detected_lang_code,
            detected_language_confidence=float(getattr(info, "language_probability", 1.0)),
            original_text=full_text,
            corrected_text=full_text,
            confidence=overall_confidence,
            segments=transcript_segments,
            low_confidence_segments=low_confidence_segments,
            language=detected_lang_code,
            text=full_text,
        )

        logger.info(
            f"Transcription complete: language={response.detected_language}, "
            f"confidence={overall_confidence:.2f}, segments={len(transcript_segments)}, text_length={len(full_text)}"
        )

        return response


    async def detect_language(self, audio_data: bytes) -> LanguageDetection:
        """Detect the spoken language in an audio snippet."""
        audio_array = self._process_audio(audio_data, None)
        res = await self._detect_language(audio_array)
        return LanguageDetection(code=res["code"], confidence=res["confidence"])

    async def _detect_language(
        self, audio_data: np.ndarray
    ) -> Dict[str, Any]:
        """Detect the spoken language from audio data."""
        try:
            _, info = self.model.transcribe(
                audio_data,
                language=None,
                beam_size=5,
                without_timestamps=True,
            )

            detected_code = info.language
            language_confidence = float(getattr(info, "language_probability", 1.0))

            allowed = self._allowed_languages()
            if detected_code not in allowed:
                detected_code = "en"
                language_confidence = 0.5

            return {
                "code": detected_code,
                "confidence": language_confidence,
            }
        except Exception as e:
            logger.error(f"Language detection failed: {e}")
            return {
                "code": "en",
                "confidence": 0.0,
            }

    def _process_audio(
        self, audio_data: bytes, format: str | None
    ) -> np.ndarray:
        """Normalize and convert audio to 16kHz mono float32 numpy array for Faster Whisper."""
        try:
            import io
            from faster_whisper import decode_audio

            buf = io.BytesIO(audio_data)
            buf.seek(0)
            arr = decode_audio(buf, sampling_rate=16000)

            if len(arr) == 0:
                raise ValueError("Decoded audio is empty")

            # Peak normalize if audio is very quiet (e.g. max < 0.1) without clipping
            max_val = float(np.max(np.abs(arr)))
            if max_val > 0 and max_val < 0.1:
                arr = arr / max_val * 0.7

            return arr
        except Exception as e:
            logger.error(f"Audio decoding failed via decode_audio: {e}")
            raise TranscriptionError(
                message=f"Audio processing failed: {str(e)}",
                error_code="AUDIO_PROCESSING_FAILED",
                retryable=True,
            )

    def _allowed_languages(self) -> List[str]:
        """Return the list of allowed languages for detection."""
        return ["hi", "en", "or", "bn", "te"]

    def _get_allowed_formats(self) -> List[str]:
        formats = getattr(settings, "allowed_audio_formats", "wav,mp3,m4a,webm,ogg")
        return [f.strip().lower() for f in formats.split(",")]

    def validate_audio(
        self, audio_data: bytes, format: str | None
    ) -> Tuple[bool, str]:
        """Validate audio decodability and basic properties."""
        try:
            if not audio_data or len(audio_data) == 0:
                return False, "Audio file is empty"

            file_size = len(audio_data)
            max_size = getattr(settings, "max_audio_size_mb", 50) * 1024 * 1024
            if file_size > max_size:
                return False, f"Audio exceeds maximum size of {getattr(settings, 'max_audio_size_mb', 50)}MB"

            if format and format.lower() not in self._get_allowed_formats():
                return False, f"Unsupported audio format: {format}"

            import io
            from faster_whisper import decode_audio
            buf = io.BytesIO(audio_data)
            buf.seek(0)
            arr = decode_audio(buf, sampling_rate=16000)
            duration = len(arr) / 16000.0

            max_duration = getattr(settings, "max_audio_duration_seconds", 300)
            if duration > max_duration:
                return False, f"Audio duration ({duration:.1f}s) exceeds maximum of {max_duration}s"

            return True, ""
        except Exception as e:
            return False, f"Audio validation failed: {str(e)}"