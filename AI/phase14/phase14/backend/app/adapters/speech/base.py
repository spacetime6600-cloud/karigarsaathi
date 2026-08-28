"""
Abstract base classes and dataclasses for speech-to-text adapters.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional, Any, Dict


class TranscriptionStatus(str, Enum):
    COMPLETED = "completed"
    FAILED = "failed"
    PENDING = "pending"
    PROCESSING = "processing"
    completed = "completed"
    failed = "failed"
    pending = "pending"
    processing = "processing"


@dataclass
class SpeechTranscriptionRequest:
    """Request object for speech transcription."""

    audio_data: bytes
    format: str | None = None  # Original audio format (wav, mp3, etc.)
    language_hint: str | None = None  # Optional language code hint


@dataclass
class TranscriptSegment:
    """A segment of transcribed speech with timing and confidence."""

    id: int
    text: str
    start: float = 0.0
    end: float = 0.0
    confidence: float | None = None
    is_low_confidence: bool = False
    start_time: float | None = None
    end_time: float | None = None

    def __post_init__(self):
        if self.start_time is not None and self.start == 0.0:
            self.start = float(self.start_time)
        if self.start_time is None:
            self.start_time = float(self.start)
        if self.end_time is not None and self.end == 0.0:
            self.end = float(self.end_time)
        if self.end_time is None:
            self.end_time = float(self.end)


@dataclass
class LanguageDetection:
    """Language detection result."""

    code: str
    confidence: float


@dataclass
class TranscriptionResult:
    """Result of a transcription operation."""

    status: str
    detected_language: str
    detected_language_confidence: float
    original_text: str
    corrected_text: str
    confidence: float
    segments: List[TranscriptSegment]
    low_confidence_segments: List[TranscriptSegment]
    language: str


@dataclass
class SpeechTranscriptionResponse:
    """Response object for speech transcription."""

    status: str = "completed"
    detected_language: str = "en"
    detected_language_confidence: float = 1.0
    original_text: str = ""
    corrected_text: str = ""
    confidence: float = 1.0
    segments: List[TranscriptSegment] = field(default_factory=list)
    low_confidence_segments: List[TranscriptSegment] = field(default_factory=list)
    language: str = "en"
    text: str = ""


class SpeechAdapter(ABC):
    """Abstract interface for speech transcription services."""

    @abstractmethod
    async def transcribe(
        self, request: SpeechTranscriptionRequest
    ) -> Any:
        """Transcribe speech audio into text."""
        pass

    async def detect_language(self, audio_data: bytes) -> LanguageDetection:
        """Detect the spoken language in an audio snippet."""
        return LanguageDetection(code="en", confidence=1.0)


BaseSpeechAdapter = SpeechAdapter