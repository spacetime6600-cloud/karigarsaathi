from __future__ import annotations

from typing import Optional, Dict, Any

from fastapi import HTTPException
from http import HTTPStatus


class TranscriptionError(HTTPException):
    """Raised when transcription fails."""

    def __init__(
        self,
        message: str,
        error_code: str,
        retryable: bool = False,
    ):
        super().__init__(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
            detail=message,
        )
        self.error_code = error_code
        self.retryable = retryable


class ModelNotLoadedError(TranscriptionError):
    """Raised when the speech model is not loaded."""

    def __init__(self):
        super().__init__(
            message="Speech transcription model not loaded",
            error_code="MODEL_NOT_LOADED",
            retryable=True,
        )


class AudioValidationError(TranscriptionError):
    """Raised when audio validation fails."""

    def __init__(self, message: str = "Audio validation failed"):
        super().__init__(
            message=message,
            error_code="AUDIO_VALIDATION_FAILED",
            retryable=True,
        )


class UnsupportedLanguageError(TranscriptionError):
    """Raised when the detected language is not in the allowlist."""

    def __init__(self, language: str):
        super().__init__(
            message=f"Unsupported language: {language}",
            error_code="UNSUPPORTED_LANGUAGE",
            retryable=False,
        )


class NoSpeechDetectedError(TranscriptionError):
    """Raised when no speech is detected in the audio."""

    def __init__(self):
        super().__init__(
            message="No speech detected in the audio recording",
            error_code="NO_SPEECH_DETECTED",
            retryable=True,
        )


class ModelLoadingError(TranscriptionError):
    """Raised when the speech model fails to load."""

    def __init__(self, message: str = "Failed to load speech model"):
        super().__init__(
            message=message,
            error_code="MODEL_LOADING_FAILED",
            retryable=True,
        )