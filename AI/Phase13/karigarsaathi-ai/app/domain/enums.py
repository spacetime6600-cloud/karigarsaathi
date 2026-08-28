"""Enumerations used throughout the AI Image Studio service."""

from __future__ import annotations

from enum import Enum, auto


class JobState(Enum):
    """Valid job states as specified in the contract."""

    QUEUED = auto()
    PROCESSING = auto()
    SUCCEEDED = auto()
    SUCCEEDED_WITH_WARNINGS = auto()
    RETRYABLE_FAILURE = auto()
    PERMANENT_FAILURE = auto()
    TIMED_OUT = auto()
    REJECTED = auto()


class Operation(Enum):
    """Supported enhancement operations."""

    BACKGROUND_REMOVAL = "background_removal"
    LIGHTING_CORRECTION = "lighting_correction"
    CENTRING = "centring"
    STANDARD_RESIZE = "standard_resize"

    @classmethod
    def defaults(cls) -> list[Operation]:
        """Return the default set of operations."""
        return [
            Operation.BACKGROUND_REMOVAL,
            Operation.LIGHTING_CORRECTION,
            Operation.CENTRING,
            Operation.STANDARD_RESIZE,
        ]


class BackgroundType(Enum):
    """Supported background types."""

    WHITE = "white"
    TRANSPARENT = "transparent"


class OutputSize(int):
    """Valid output catalogue sizes."""

    _512 = 512
    _768 = 768
    _1024 = 1024

    @classmethod
    def allowed_values(cls) -> list[int]:
        """Return allowed output sizes."""
        return [512, 768, 1024]


class MIMEType(Enum):
    """Allowed upload MIME types."""

    JPEG = "image/jpeg"
    PNG = "image/png"
    WEBP = "image/webp"


class BackgroundRemovalResult(Enum):
    """Result of background removal operation."""

    SUCCESS = "success"
    FALLBACK_TO_ORIGINAL = "fallback_to_original"
    WARNING_SUSPICIOUS_MASK = "warning_suspicious_mask"
    REJECTED = "rejected"


class SafetyStatus(Enum):
    """Safety evaluation status."""

    SAFE = "safe"
    WARNING = "warning"
    UNSAFE = "unsafe"


class AuthResult(Enum):
    """Authentication result."""

    AUTHENTICATED = "authenticated"
    UNAUTHENTICATED = "unauthenticated"
    OWNERSHIP_MISMATCH = "ownership_mismatch"


class ErrorCode(Enum):
    """Standard error codes for API responses."""

    CONSENT_REQUIRED = "CONSENT_REQUIRED"
    AUTHENTICATION_REQUIRED = "AUTHENTICATION_REQUIRED"
    OWNERSHIP_MISMATCH = "OWNERSHIP_MISMATCH"
    INVALID_IMAGE_TYPE = "INVALID_IMAGE_TYPE"
    IMAGE_TOO_LARGE = "IMAGE_TOO_LARGE"
    INVALID_IMAGE_DIMENSIONS = "INVALID_IMAGE_DIMENSIONS"
    CORRUPT_IMAGE = "CORRUPT_IMAGE"
    QUOTA_EXCEEDED = "QUOTA_EXCEEDED"
    DUPLICATE_REQUEST_CONFLICT = "DUPLICATE_REQUEST_CONFLICT"
    SEGMENTATION_FAILED = "SEGMENTATION_FAILED"
    QUALITY_CHECK_FAILED = "QUALITY_CHECK_FAILED"
    PROCESSING_TIMED_OUT = "PROCESSING_TIMED_OUT"
    INTERNAL_PROCESSING_ERROR = "INTERNAL_PROCESSING_ERROR"


# Mapping for human-readable error messages
ERROR_MESSAGES: dict[ErrorCode, str] = {
    ErrorCode.CONSENT_REQUIRED: "Consent must be granted before processing",
    ErrorCode.AUTHENTICATION_REQUIRED: "Authentication required",
    ErrorCode.OWNERSHIP_MISMATCH: "Ownership mismatch - user does not match artisan",
    ErrorCode.INVALID_IMAGE_TYPE: "Invalid image type. Allowed: JPEG, PNG, WebP",
    ErrorCode.IMAGE_TOO_LARGE: "Image exceeds maximum file size of 10 MB",
    ErrorCode.INVALID_IMAGE_DIMENSIONS: "Image dimensions must be between 256x256 and 6000x6000",
    ErrorCode.CORRUPT_IMAGE: "Image appears to be corrupt or a decompression bomb",
    ErrorCode.QUOTA_EXCEEDED: "Daily enhancement quota exceeded",
    ErrorCode.DUPLICATE_REQUEST_CONFLICT:
        "Request ID conflict - same request ID with different contents detected",
    ErrorCode.SEGMENTATION_FAILED: "Segmentation failed - unable to detect product",
    ErrorCode.QUALITY_CHECK_FAILED: "Quality check failed - enhancements may alter product identity",
    ErrorCode.PROCESSING_TIMED_OUT: "Processing exceeded maximum time limit",
    ErrorCode.INTERNAL_PROCESSING_ERROR: "Internal processing error occurred",
}