"""Provider-neutral interfaces for dependency injection."""

from __future__ import annotations

from typing import Protocol, TypeVar, Generic, runtime_checkable

# Type variable for generic repository patterns
T = TypeVar("T")


@runtime_checkable
class ImageStorageProtocol(Protocol):
    """Protocol for image storage adapters."""

    async def store_original(self, filename: str, data: bytes) -> str:
        """Store an original image and return the stored path."""
        ...

    async def retrieve_original(self, filename: str) -> bytes:
        """Retrieve an original image by filename."""
        ...

    async def store_enhanced(self, filename: str, data: bytes) -> str:
        """Store an enhanced image and return the stored path."""
        ...

    async def retrieve_enhanced(self, filename: str) -> bytes:
        """Retrieve an enhanced image by filename."""
        ...

    async def store_preview(self, filename: str, data: bytes) -> str:
        """Store a preview image and return the stored path."""
        ...

    async def retrieve_preview(self, filename: str) -> bytes:
        """Retrieive a preview image by filename."""
        ...

    async def original_exists(self, filename: str) -> bool:
        """Check if an original image exists."""
        ...

    async def enhanced_exists(self, filename: str) -> bool:
        """Check if an enhanced image exists."""
        ...

    async def preview_exists(self, filename: str) -> bool:
        """Check if a preview image exists."""
        ...


@runtime_checkable
class BackgroundRemovalAdapterProtocol(Protocol):
    """Protocol for background removal adapters."""

    async def remove_background(
        self, image_data: bytes, model_name: str = "isnet-general-use"
    ) -> dict:
        """Remove background from image.

        Returns dict with:
        - foreground: RGBA bytes
        - mask: mask bytes
        - foreground_coverage: float (0-1)
        - warnings: list of warning strings
        """
        ...


@runtime_checkable
class LightingCorrectionProtocol(Protocol):
    """Protocol for lighting correction processors."""

    async def correct_lighting(
        self, foreground_data: bytes, alpha_data: bytes, image_width: int,
        image_height: int, config: dict[str, any]
    ) -> dict:
        """Apply conservative lighting correction to foreground.

        Returns dict with:
        - corrected_foreground: RGBA bytes
        - warnings: list of warning strings
        """
        ...


@runtime_checkable
class ImageCompositionProtocol(Protocol):
    """Protocol for image composition/composition processors."""

    async def compose_image(
        self, foreground_rgba: bytes, background_rgba: bytes,
        canvas_size: int, padding: int = 32
    ) -> dict:
        """Compose foreground on canvas with background.

        Returns dict with:
        - result: RGBA bytes
        - preview: bytes (320x320)
        - warnings: list of warning strings
        """
        ...


@runtime_checkable
class ImageQualityMetricsProtocol(Protocol):
    """Protocol for quality metrics calculators."""

    async def calculate_metrics(
        self, original_rgba: bytes, enhanced_rgba: bytes,
        original_alpha: bytes, enhanced_alpha: bytes
    ) -> dict[str, any]:
        """Calculate quality metrics between original and enhanced images.

        Returns dict with optional metrics:
        - mean_delta_e: float or None
        - p95_delta_e: float or None
        - luminance_ssim: float or None
        - edge_preservation_ratio: float or None
        - foreground_coverage: float or None
        - highlight_clipping_percent: float or None
        - shadow_clipping_percent: float or None
        - mask_boundary_retention: float or None
        """
        ...


@runtime_checkable
class SafetyEvaluatorProtocol(Protocol):
    """Protocol for enhancement safety evaluators."""

    async def evaluate_safety(
        self, metrics: dict[str, any],
        config: dict[str, any]
    ) -> dict[str, any]:
        """Evaluate whether enhanced image is safe to return.

        Returns dict with:
        - status: SafetyStatus
        - warnings: list[str]
        - fallback_to_original: bool
        """
        ...


@runtime_checkable
class JobRepositoryProtocol(Protocol):
    """Protocol for job persistence adapters."""

    async def create_job(self, job_id: str, artisan_id: str, product_id: str,
                        request_id: str, status: JobState, **kwargs) -> None:
        """Create a new job record."""

    async def get_job(self, job_id: str) -> dict | None:
        """Retrieve a job by ID."""

    async def update_job(self, job_id: str, **updates: Any) -> None:
        """Update job status and fields."""

    async def get_artisan_quotas(self, artisan_id: str) -> dict[str, any]:
        """Get quota information for an artisan."""


@runtime_checkable
class AuthenticationVerifierProtocol(Protocol):
    """Protocol for authentication verifiers."""

    async def verify(self, authorization: str | None) -> dict[str, any]:
        """Verify bearer token and return user info.

        Returns dict with:
        - authenticated: bool
        - user_id: str | None
        - error: str | None
        """
        ...


@runtime_checkable
class FileStorageAdapterProtocol(Protocol):
    """Protocol for file system storage adapters."""

    async def ensure_directory(self, path: str) -> None:
        """Ensure a directory exists."""

    async def write_file(self, path: str, data: bytes) -> None:
        """Write data to a file."""

    async def read_file(self, path: str) -> bytes:
        """Read data from a file."""

    async def delete_file(self, path: str) -> None:
        """Delete a file."""