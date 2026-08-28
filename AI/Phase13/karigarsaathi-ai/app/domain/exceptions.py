"""Custom exceptions for the AI Image Studio service."""

from __future__ import annotations

from typing import Any, Optional

from app.domain.enums import ErrorCode


class KarigarSaathiException(Exception):
    """Base exception for all KarigarSaathi-related errors."""

    def __init__(
        self,
        error_code: ErrorCode,
        message: str,
        retryable: bool = False,
        details: Optional[dict[str, Any]] = None,
        request_id: Optional[str] = None,
    ):
        self.error_code = error_code
        self.message = message
        self.retryable = retryable
        self.details = details or {}
        self.request_id = request_id
        super().__init__(message)


class ConsentRequiredError(KarigarSaathiException):
    """Raised when consent has not been granted."""

    def __init__(self, request_id: str):
        super().__init__(
            error_code=ErrorCode.CONSENT_REQUIRED,
            message="Consent must be granted before processing",
            retryable=False,
            request_id=request_id,
        )


class AuthenticationRequiredError(KarigarSaathiException):
    """Raised when valid authentication is missing."""

    def __init__(self, request_id: str):
        super().__init__(
            error_code=ErrorCode.AUTHENTICATION_REQUIRED,
            message="Authentication required",
            retryable=True,
            request_id=request_id,
        )


class OwnershipMismatchError(KarigarSaathiException):
    """Raised when the authenticated user does not match the artisan."""

    def __init__(self, request_id: str, artisan_id: str):
        super().__init__(
            error_code=ErrorCode.OWNERSHIP_MISMATCH,
            message="Ownership mismatch - user does not match artisan",
            retryable=True,
            details={"artisan_id": artisan_id},
            request_id=request_id,
        )


class InvalidImageTypeError(KarigarSaathiException):
    """Raised when the uploaded image type is not supported."""

    def __init__(self, mime_type: str, request_id: str):
        super().__init__(
            error_code=ErrorCode.INVALID_IMAGE_TYPE,
            message=f"Invalid image type: {mime_type}. Allowed: JPEG, PNG, WebP",
            retryable=False,
            details={"mime_type": mime_type},
            request_id=request_id,
        )


class ImageTooLargeError(KarigarSaathiException):
    """Raised when the uploaded image exceeds size limits."""

    def __init__(self, size_bytes: int, max_bytes: int, request_id: str):
        super().__init__(
            error_code=ErrorCode.IMAGE_TOO_LARGE,
            message=f"Image size {size_bytes} bytes exceeds maximum {max_bytes} bytes",
            retryable=False,
            details={"size_bytes": size_bytes, "max_bytes": max_bytes},
            request_id=request_id,
        )


class InvalidImageDimensionsError(KarigarSaathiException):
    """Raised when image dimensions are out of allowed range."""

    def __init__(
        self, width: int, height: int, min_dim: int, max_dim: int, request_id: str
    ):
        super().__init__(
            error_code=ErrorCode.INVALID_IMAGE_DIMENSIONS,
            message=f"Image dimensions {width}x{height} must be between {min_dim}x{min_dim} and {max_dim}x{max_dim}",
            retryable=False,
            details={"width": width, "height": height, "min_dim": min_dim, "max_dim": max_dim},
            request_id=request_id,
        )


class CorruptImageError(KarigarSaathiException):
    """Raised when the image appears corrupt or is a decompression bomb."""

    def __init__(self, request_id: str):
        super().__init__(
            error_code=ErrorCode.CORRUPT_IMAGE,
            message="Image appears to be corrupt or is a decompression bomb",
            retryable=True,
            request_id=request_id,
        )


class QuotaExceededError(KarigarSaathiException):
    """Raised when the artisan has exceeded their daily quota."""

    def __init__(self, artisan_id: str, limit: int, request_id: str):
        super().__init__(
            error_code=ErrorCode.QUOTA_EXCEEDED,
            message="Daily enhancement quota exceeded",
            retryable=True,
            details={"artisan_id": artisan_id, "limit": limit},
            request_id=request_id,
        )


class DuplicateRequestConflictError(KarigarSaathiException):
    """Raised when a request_id is reused with different contents."""

    def __init__(self, request_id: str, existing_artisan_id: str, new_artisan_id: str):
        super().__init__(
            error_code=ErrorCode.DUPLICATE_REQUEST_CONFLICT,
            message="Request ID conflict - same request ID with different contents detected",
            retryable=False,
            details={
                "existing_artisan_id": existing_artisan_id,
                "new_artisan_id": new_artisan_id,
            },
            request_id=request_id,
        )


class SegmentationFailedError(KarigarSaathiException):
    """Raised when background removal segmentation fails."""

    def __init__(self, request_id: str, warnings: list[str], fallback: bool = True):
        super().__init__(
            error_code=ErrorCode.SEGMENTATION_FAILED,
            message="Segmentation failed - unable to detect product",
            retryable=True,
            details={"warnings": warnings, "fallback": fallback},
            request_id=request_id,
        )


class QualityCheckFailedError(KarigarSaathiException):
    """Raised when quality metrics exceed acceptable thresholds."""

    def __init__(self, metrics: dict[str, any], request_id: str):
        super().__init__(
            error_code=ErrorCode.QUALITY_CHECK_FAILED,
            message="Quality check failed - enhancements may alter product identity",
            retryable=True,
            details={"metrics": metrics},
            request_id=request_id,
        )


class ProcessingTimedOutError(KarigarSaathiException):
    """Raised when processing exceeds the maximum time limit."""

    def __init__(self, request_id: str, elapsed_ms: int, max_ms: int):
        super().__init__(
            error_code=ErrorCode.PROCESSING_TIMED_OUT,
            message=f"Processing exceeded maximum time limit of {max_ms} ms",
            retryable=True,
            details={"elapsed_ms": elapsed_ms, "max_ms": max_ms},
            request_id=request_id,
        )


class InternalProcessingError(KarigarSaathiException):
    """Raised for unexpected internal errors."""

    def __init__(self, request_id: str, original_error: str):
        super().__init__(
            error_code=ErrorCode.INTERNAL_PROCESSING_ERROR,
            message="An internal processing error occurred",
            retryable=True,
            details={"error": original_error},
            request_id=request_id,
        )