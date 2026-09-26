"""Main image enhancement service orchestrating all processing steps."""

from __future__ import annotations

import time
import hashlib
from datetime import datetime
from io import BytesIO
from typing import Any, Dict, List, Optional, Tuple

from app.domain.enums import (
    JobState, Operation, BackgroundType, MIMEType, ErrorCode,
    SafetyStatus
)
from app.domain.exceptions import (
    ConsentRequiredError, AuthenticationRequiredError,
    OwnershipMismatchError, InvalidImageTypeError, ImageTooLargeError,
    InvalidImageDimensionsError, CorruptImageError, QuotaExceededError,
    DuplicateRequestConflictError, SegmentationFailedError,
    QualityCheckFailedError, ProcessingTimedOutError,
    InternalProcessingError
)
from app.domain.interfaces import (
    ImageStorageProtocol, BackgroundRemovalAdapterProtocol,
    LightingCorrectionProtocol, ImageCompositionProtocol,
    ImageQualityMetricsProtocol, SafetyEvaluatorProtocol,
    JobRepositoryProtocol, AuthenticationVerifierProtocol,
    FileStorageAdapterProtocol
)
from app.services.quality_metrics import calculate_metrics
from app.services.safety_evaluator import EnhancementSafetyEvaluator


class ImageEnhancementService:
    """Core service orchestrating image enhancement pipeline."""

    def __init__(
        self,
        storage: FileStorageAdapterProtocol,
        background_removal: BackgroundRemovalAdapterProtocol,
        lighting_correction: LightingCorrectionProtocol,
        composition: ImageCompositionProtocol,
        quality_metrics: ImageQualityMetricsProtocol,
        safety_evaluator: EnhancementSafetyEvaluator,
        job_repository: JobRepositoryProtocol,
        authentication: AuthenticationVerifierProtocol,
        quota_service: Any,
        settings: Any,
    ):
        """Initialize enhancement service with dependencies.

        Args:
            storage: File storage adapter for images
            background_removal: Background removal adapter
            lighting_correction: Lighting correction processor
            composition: Image composition processor
            quality_metrics: Quality metrics calculator
            safety_evaluator: Safety evaluator
            job_repository: Job repository for persistence
            authentication: Authentication verifier
            quota_service: Quota service instance
            settings: Application settings
        """
        self.storage = storage
        self.background_removal = background_removal
        self.lighting_correction = lighting_correction
        self.composition = composition
        self.quality_metrics = quality_metrics
        self.safety_evaluator = safety_evaluator
        self.job_repository = job_repository
        self.authentication = authentication
        self.quota_service = quota_service
        self.settings = settings

    async def process_enhancement(
        self,
        image_data: bytes,
        consent_granted: bool,
        request_id: str,
        product_id: str,
        artisan_id: str,
        operations: List[str],
        output_size: int | None,
        background: str | None,
        authorization: str | None = None,
    ) -> dict[str, any]:
        """Process an image enhancement job.

        Args:
            image_data: Raw image bytes (original, will be preserved)
            consent_granted: Whether user consent was provided
            request_id: UUID idempotency key
            product_id: Product identifier
            artisan_id: Artisan identifier
            operations: List of operations to apply
            output_size: Target output size (512, 768, 1024)
            background: Background type (white or transparent)
            authorization: Optional Authorization header

        Returns:
            Job result dict with references and status
        """
        start_ms = time.time()
        job_id = request_id  # Using request_id as job_id for idempotency

        try:
            # 1. Validate consent
            if not consent_granted:
                raise ConsentRequiredError(request_id=request_id)

            # 2. Authenticate and check ownership (if authorization header provided)
            if authorization is not None and self.authentication is not None:
                auth_result = await self.authentication.verify(authorization)
                if not auth_result.get("authenticated", False):
                    raise AuthenticationRequiredError(request_id=request_id)

                verified_user_id = auth_result.get("user_id", "")
                if verified_user_id and verified_user_id != artisan_id:
                    raise OwnershipMismatchError(
                        request_id=request_id, artisan_id=artisan_id
                    )

            # 3. Check quota
            quota_ok, quota_reason = await self.quota_service.check_daily_quota(
                artisan_id
            )
            if not quota_ok:
                raise QuotaExceededError(
                    artisan_id=artisan_id, limit=self.settings.default_jobs_per_artisan_per_day,
                    request_id=request_id,
                )

            # 4. Check for duplicate/idempotent request
            existing_job = await self.job_repository.get_job(job_id)
            if existing_job is not None:
                # Return existing job - do not reprocess
                existing_job["retryable"] = False
                existing_job["processing_duration_ms"] = (
                    int((time.time() - start_ms) * 1000)
                )
                return self._build_job_result(existing_job)

            # 5. Validate image
            validation_result = await self._validate_image(image_data)
            if not validation_result.get("valid", False) or validation_result.get("error"):
                raise InvalidImageTypeError(
                    request_id=request_id,
                    details=validation_result.get("details", {}),
                )

            details = validation_result.get("details", {})
            img_width = details.get("width", 512)
            img_height = details.get("height", 512)
            img_mime = details.get("mime_type", "image/jpeg")
            img_size = details.get("file_size", len(image_data))

            # 6. Store original image immutably
            checksum = hashlib.sha256(image_data).hexdigest()
            original_filename = f"{request_id}_original.jpg"
            await self.storage.store_original(
                original_filename, image_data
            )

            # 7. Initialize job tracking
            initial_state = JobState.QUEUED
            await self.job_repository.create_job(
                job_id=job_id,
                artisan_id=artisan_id,
                product_id=product_id,
                request_id=request_id,
                status=initial_state,
                original_checksum=checksum,
                original_filename=original_filename,
                image_width=img_width,
                image_height=img_height,
                mime_type=img_mime,
                file_size=img_size,
            )

            # 8. Begin processing
            await self.job_repository.update_job(job_id, status=JobState.PROCESSING)

            # 9. Process pipeline
            enhanced_bytes, preview_bytes, warnings, applied_operations = await self._enhance_pipeline(
                image_data,
                operations,
                output_size,
                background,
                validation_result,
            )

            # 10. Calculate processing duration
            processing_duration_ms = int((time.time() - start_ms) * 1000)

            # 11. Calculate quality metrics (on foreground regions)
            metrics = await self._calculate_quality_metrics(
                image_data, enhanced_bytes, validation_result
            )

            # 12. Safety evaluation
            safety_result = self.safety_evaluator.evaluate(metrics)

            # 13. Determine final job state
            final_state = self._determine_final_state(
                safety_result, warnings, metrics
            )

            # 14. Store results
            enhanced_filename = f"{request_id}_enhanced.png"
            preview_filename = f"{request_id}_preview.png"

            enhanced_ref = await self.storage.store_enhanced(enhanced_filename, enhanced_bytes)
            preview_ref = await self.storage.store_preview(preview_filename, preview_bytes)

            enhanced_image_ref = enhanced_ref if str(enhanced_ref).startswith("http") else f"/v1/enhancements/{job_id}/enhanced"
            preview_image_ref = preview_ref if str(preview_ref).startswith("http") else f"/v1/enhancements/{job_id}/preview"
            orig_ref = original_filename if str(original_filename).startswith("http") else f"/v1/enhancements/{job_id}/original"

            # 15. Verify original checksum unchanged
            verified_checksum = await self._verify_original_checksum(
                original_filename, checksum
            )

            # 17. Update job repository
            final_status = self._map_safety_to_job_state(
                safety_result, final_state
            )

            await self.job_repository.update_job(
                job_id=job_id,
                status=final_status,
                enhanced_filename=enhanced_filename,
                preview_filename=preview_filename,
                enhanced_image_reference=enhanced_image_ref,
                preview_image_reference=preview_image_ref,
                original_image_reference=orig_ref,
                original_checksum_verified=verified_checksum,
                warnings="; ".join(warnings) if warnings else None,
                metrics=metrics,
                completed_at=datetime.utcnow(),
                processing_duration_ms=processing_duration_ms,
            )

            # Clean up intermediate garbage to prevent memory buildup
            import gc
            gc.collect()

            # 18. Return job result
            result = self._build_job_result({
                "job_id": job_id,
                "request_id": request_id,
                "artisan_id": artisan_id,
                "product_id": product_id,
                "status": final_status,
                "original_image_reference": orig_ref,
                "enhanced_image_reference": enhanced_image_ref,
                "preview_image_reference": preview_image_ref,
                "operations_requested": operations,
                "operations_applied": applied_operations,
                "warnings": warnings,
                "metrics": metrics,
                "processing_duration_ms": processing_duration_ms,
                "retryable": final_status in (
                    JobState.RETRYABLE_FAILURE,
                    JobState.PERMANENT_FAILURE,
                ),
                "failure_code": None,
                "adapter_version": "isnet-general-use/rembg-2.0.0",
                "created_at": datetime.utcnow(),
                "completed_at": datetime.utcnow(),
            })

            return result

        except (ConsentRequiredError, AuthenticationRequiredError,
                OwnershipMismatchError, InvalidImageTypeError,
                ImageTooLargeError, InvalidImageDimensionsError,
                CorruptImageError, QuotaExceededError,
                DuplicateRequestConflictError) as e:
            # Re-raise known exceptions
            raise
        except SegmentationFailedError as e:
            # Handle segmentation failure - fall back to original
            await self.job_repository.update_job(
                job_id=job_id,
                status=JobState.SUCCEEDED_WITH_WARNINGS,
                warnings=f"Segmentation issue: {e.details.get('warnings', [])}",
                enhanced_filename=None,
                preview_filename=None,
            )
            return self._build_job_result({
                "job_id": job_id,
                "request_id": request_id,
                "artisan_id": artisan_id,
                "product_id": product_id,
                "status": JobState.SUCCEEDED_WITH_WARNINGS,
                "original_image_reference": f"/v1/enhancements/{job_id}/original",
                "enhanced_image_reference": None,
                "preview_image_reference": None,
                "operations_requested": operations,
                "operations_applied": [],
                "warnings": e.details.get("warnings", []) if e.details else [],
                "metrics": {},
                "processing_duration_ms": int((time.time() - start_ms) * 1000),
                "retryable": False,
                "failure_code": "SEGMENTATION_FAILED",
                "adapter_version": "isnet-general-use",
                "created_at": datetime.utcnow(),
                "completed_at": datetime.utcnow(),
            })
        except (QualityCheckFailedError, ProcessingTimedOutError) as e:
            # Handle quality/timeout failures
            await self.job_repository.update_job(
                job_id=job_id,
                status=JobState.RETRYABLE_FAILURE,
                warnings=e.details.get("messages", []) if e.details else [],
            )
            return self._build_job_result({
                "job_id": job_id,
                "request_id": request_id,
                "artisan_id": artisan_id,
                "product_id": product_id,
                "status": JobState.RETRYABLE_FAILURE,
                "original_image_reference": f"/v1/enhancements/{job_id}/original",
                "enhanced_image_reference": None,
                "preview_image_reference": None,
                "operations_requested": operations,
                "operations_applied": [],
                "warnings": e.details.get("messages", []) if e.details else [],
                "metrics": e.details.get("metrics", {}) if e.details else {},
                "processing_duration_ms": int((time.time() - start_ms) * 1000),
                "retryable": True,
                "failure_code": e.error_code.value,
                "adapter_version": "isnet-general-use",
                "created_at": datetime.utcnow(),
                "completed_at": datetime.utcnow(),
            })
        except InternalProcessingError as e:
            # Handle unexpected errors - preserve original
            await self.job_repository.update_job(
                job_id=job_id,
                status=JobState.PERMANENT_FAILURE,
                warnings=f"Internal error: {e.message}",
            )
            return self._build_job_result({
                "job_id": job_id,
                "request_id": request_id,
                "artisan_id": artisan_id,
                "product_id": product_id,
                "status": JobState.PERMANENT_FAILURE,
                "original_image_reference": f"/v1/enhancements/{job_id}/original",
                "enhanced_image_reference": None,
                "preview_image_reference": None,
                "operations_requested": operations,
                "operations_applied": [],
                "warnings": [e.message],
                "metrics": {},
                "processing_duration_ms": int((time.time() - start_ms) * 1000),
                "retryable": True,
                "failure_code": e.error_code.value,
                "adapter_version": "isnet-general-use",
                "created_at": datetime.utcnow(),
                "completed_at": datetime.utcnow(),
            })
        except Exception as e:
            # Catch-all for unexpected errors
            import traceback
            traceback.print_exc()
            await self.job_repository.update_job(
                job_id=job_id,
                status=JobState.PERMANENT_FAILURE,
                warnings="Unexpected processing error",
            )
            return self._build_job_result({
                "job_id": job_id,
                "request_id": request_id,
                "artisan_id": artisan_id,
                "product_id": product_id,
                "status": JobState.PERMANENT_FAILURE,
                "original_image_reference": f"/v1/enhancements/{job_id}/original",
                "enhanced_image_reference": None,
                "preview_image_reference": None,
                "operations_requested": operations,
                "operations_applied": [],
                "warnings": ["Unexpected processing error"],
                "metrics": {},
                "processing_duration_ms": int((time.time() - start_ms) * 1000),
                "retryable": False,
                "failure_code": "INTERNAL_PROCESSING_ERROR",
                "adapter_version": "isnet-general-use",
                "created_at": datetime.utcnow(),
                "completed_at": datetime.utcnow(),
            })

    async def _validate_image(
        self, image_data: bytes
    ) -> dict[str, any]:
        """Validate uploaded image data."""
        from app.utils.image_validation import ImageValidator

        validator = ImageValidator()
        return validator.validate(image_data)

    async def _enhance_pipeline(
        self,
        image_data: bytes,
        operations: List[str],
        output_size: int | None,
        background: str | None,
        validation_result: dict[str, any],
    ) -> Tuple[bytes, bytes, List[str], List[str]]:
        """Run the enhancement pipeline on image copies.

        Returns:
            (enhanced_bytes, preview_bytes, warnings_list, applied_operations_list)
        """
        import gc
        from PIL import Image
        from io import BytesIO

        warnings: List[str] = []
        applied_operations: List[str] = []
        target_size = output_size or 512

        # 1. Downscale working image to target canvas size (default 512) to bound memory strictly
        try:
            pil_init = Image.open(BytesIO(image_data))
            init_w, init_h = pil_init.size
            max_dim = max(init_w, init_h)
            if max_dim > target_size:
                scale = target_size / max_dim
                current_width = max(1, int(init_w * scale))
                current_height = max(1, int(init_h * scale))
                pil_init = pil_init.resize((current_width, current_height), Image.Resampling.LANCZOS)
                buf = BytesIO()
                pil_init.save(buf, format="PNG")
                current_image = buf.getvalue()
            else:
                current_width, current_height = init_w, init_h
                current_image = image_data
            del pil_init
            gc.collect()
        except Exception:
            current_image = image_data
            details = validation_result.get("details", validation_result)
            current_width = min(details.get("width", 512), target_size)
            current_height = min(details.get("height", 512), target_size)

        for op in operations:
            if op == "background_removal":
                try:
                    bg_result = await self.background_removal.remove_background(
                        current_image, current_width, current_height
                    )
                    if not bg_result.get("fallback", False):
                        current_image = bg_result.get("foreground", current_image)
                        applied_operations.append("background_removal")
                    else:
                        warnings.append("Background removal omitted: authentic background preserved.")
                    op_warnings = bg_result.get("warnings", [])
                    warnings.extend(op_warnings)
                except Exception as exc:
                    warnings.append(f"Background removal skipped ({type(exc).__name__}): authentic background preserved.")
                gc.collect()

            elif op == "lighting_correction":
                try:
                    current_image, op_warnings = (
                        await self.lighting_correction.correct_lighting(
                            current_image, current_width, current_height
                        )
                    )
                    applied_operations.append("lighting_correction")
                    warnings.extend(op_warnings)
                except Exception as exc:
                    warnings.append(f"Lighting correction skipped ({type(exc).__name__})")
                gc.collect()

            elif op == "centring":
                try:
                    bg_enum = BackgroundType.TRANSPARENT if background == "transparent" else BackgroundType.WHITE
                    comp_result = await self.composition.compose_image(
                        current_image,
                        canvas_size=target_size,
                        padding=32,
                        background_type=bg_enum,
                    )
                    current_image = comp_result.get("result", current_image)
                    applied_operations.append("centring")
                    warnings.extend(comp_result.get("warnings", []))
                except Exception as exc:
                    warnings.append(f"Centring skipped ({type(exc).__name__})")
                gc.collect()

            elif op == "standard_resize":
                try:
                    current_image = await self._resize_image(
                        current_image, target_size, target_size
                    )
                    applied_operations.append("standard_resize")
                    warnings.append(f"Resized to {target_size}x{target_size}")
                except Exception as exc:
                    warnings.append(f"Standard resize skipped ({type(exc).__name__})")
                gc.collect()

        # Generate preview (320x320) from the final composed image
        preview_bytes = await self._generate_preview(current_image, 320, 320)

        # Ensure we return RGBA bytes
        if current_image is not None:
            enhanced_bytes = current_image
        else:
            enhanced_bytes = image_data

        gc.collect()
        return enhanced_bytes, preview_bytes, warnings, applied_operations

    async def _calculate_quality_metrics(
        self, original_data: bytes, enhanced_bytes: bytes,
        validation_result: dict[str, any],
    ) -> dict[str, float | None]:
        """Calculate quality metrics comparing original and enhanced with bounded resolution."""
        details = validation_result.get("details", validation_result)
        width = details.get("width", 512)
        height = details.get("height", 512)

        if width == 0 or height == 0:
            return {
                "mean_delta_e": None,
                "p95_delta_e": None,
                "luminance_ssim": None,
                "edge_preservation_ratio": None,
                "foreground_coverage": None,
                "highlight_clipping_percent": None,
                "shadow_clipping_percent": None,
                "mask_boundary_retention": None,
            }

        # Bound evaluation dimensions to max 512 to prevent large intermediate arrays
        eval_w = min(width, 512)
        eval_h = min(height, 512)

        try:
            return calculate_metrics(
                original_rgba=original_data,
                enhanced_rgba=enhanced_bytes,
                original_alpha=details.get("alpha_data", b""),
                enhanced_alpha=b"",
                original_width=eval_w,
                original_height=eval_h,
            )
        except Exception:
            return {
                "mean_delta_e": None,
                "p95_delta_e": None,
                "luminance_ssim": None,
                "edge_preservation_ratio": None,
                "foreground_coverage": None,
                "highlight_clipping_percent": None,
                "shadow_clipping_percent": None,
                "mask_boundary_retention": None,
            }

    def _determine_final_state(
        self, safety_result: dict[str, any], warnings: List[str],
        metrics: dict[str, float | None],
    ) -> JobState:
        """Determine final job state based on safety evaluation.

        Returns one of: SUCCEEDED, SUCCEEDED_WITH_WARNINGS, RETRYABLE_FAILURE, PERMANENT_FAILURE
        """
        status = safety_result.get("status", SafetyStatus.WARNING)
        fallback = safety_result.get("fallback_to_original", False)

        if status == SafetyStatus.SAFE and not fallback:
            return JobState.SUCCEEDED
        elif status == SafetyStatus.WARNING:
            return JobState.SUCCEEDED_WITH_WARNINGS
        elif status == SafetyStatus.UNSAFE or fallback:
            # Fall back to original - enhanced image not safe to deliver
            return JobState.SUCCEEDED_WITH_WARNINGS
        elif safety_result.get("threshold_violations", []):
            return JobState.SUCCEEDED_WITH_WARNINGS
        else:
            return JobState.PROCESSING  # Should not happen

    def _map_safety_to_job_state(
        self, safety_result: dict[str, any], requested_state: JobState
    ) -> JobState:
        """Map safety result to final job state."""
        status = safety_result.get("status", SafetyStatus.WARNING)
        if status == SafetyStatus.SAFE:
            return JobState.SUCCEEDED
        return JobState.SUCCEEDED_WITH_WARNINGS

    def _get_applied_operations(self, requested: List[str]) -> List[str]:
        """Return the operations that were actually applied."""
        # In a full implementation, we'd track which ops succeeded
        # For now, return what was requested
        return requested

    def _get_background_color(
        self, background: str | None
    ) -> Tuple[int, int, int] | None:
        """Get background colour tuple based on background type."""
        if background == BackgroundType.WHITE.value:
            return (255, 255, 255)
        if background == BackgroundType.TRANSPARENT.value:
            return None
        return None

    def _generate_safe_filename(self, request_id: str) -> str:
        """Generate a random server-side filename.

        Uses SHA-256 hash of request_id as base, but adds random suffix
        to prevent prediction.
        """
        import os
        random_suffix = os.urandom(8).hex()
        # Use request_id as base but hash it for safety
        hashed = hashlib.sha256(request_id.encode()).hexdigest()[:16]
        return f"{hashed}_{random_suffix}.png"

    async def _verify_original_checksum(
        self, original_filename: str, expected_checksum: str
    ) -> bool:
        """Verify that original image checksum is unchanged.

        Non-negotiable requirement: original must always match.
        """
        try:
            stored_data = await self.storage.retrieve_original(original_filename)
            actual_checksum = hashlib.sha256(stored_data).hexdigest()
            return actual_checksum == expected_checksum
        except Exception:
            return False

    async def _resize_image(
        self, image_data: bytes, target_width: int, target_height: int
    ) -> bytes:
        """Resize image maintaining aspect ratio with padding."""
        from PIL import Image

        img = Image.open(BytesIO(image_data))
        img = img.convert("RGBA")

        # Calculate resize maintaining aspect ratio
        img_width, img_height = img.size

        # Calculate scale to fit target while maintaining aspect
        scale = min(target_width / img_width, target_height / img_height)
        new_width = int(img_width * scale)
        new_height = int(img_height * scale)

        # Resize
        resized = img.resize((new_width, new_height), Image.LANCZOS)

        # Create new target-size canvas with transparent background
        new_img = Image.new("RGBA", (target_width, target_height), (0, 0, 0, 0))
        # Center the resized image
        x_offset = (target_width - new_width) // 2
        y_offset = (target_height - new_height) // 2
        new_img.paste(resized, (x_offset, y_offset))

        # Convert to bytes
        buf = BytesIO()
        new_img.save(buf, format="PNG")
        return buf.getvalue()

    async def _generate_preview(
        self, image_data: bytes, preview_width: int, preview_height: int
    ) -> bytes:
        """Generate a 320x320 preview from image data."""
        from PIL import Image
        from io import BytesIO

        img = Image.open(BytesIO(image_data))
        img = img.convert("RGBA")

        # Resize to exactly preview dimensions
        resized = img.resize((preview_width, preview_height), Image.LANCZOS)

        # Save to bytes
        buf = BytesIO()
        resized.save(buf, format="PNG")
        return buf.getvalue()

    def _build_job_result(self, data: dict[str, Any]) -> dict[str, Any]:
        """Convert internal job dict to serialized API result."""
        status = data.get("status")
        if hasattr(status, "name"):
            status_str = status.name.lower()
        elif hasattr(status, "value") and isinstance(status.value, str):
            status_str = status.value.lower()
        else:
            status_str = str(status).lower() if status else "succeeded"

        # Map JobState enum names to contract strings
        state_map = {
            "succeeded": "succeeded",
            "succeeded_with_warnings": "succeeded_with_warnings",
            "retryable_failure": "failed",
            "permanent_failure": "failed",
            "timed_out": "failed",
            "rejected": "rejected",
            "processing": "processing",
            "queued": "queued",
        }
        status_str = state_map.get(status_str, status_str)

        created_at = data.get("created_at")
        if hasattr(created_at, "isoformat"):
            created_at_str = created_at.isoformat()
        else:
            created_at_str = str(created_at) if created_at else datetime.utcnow().isoformat()

        completed_at = data.get("completed_at")
        if hasattr(completed_at, "isoformat"):
            completed_at_str = completed_at.isoformat()
        elif completed_at:
            completed_at_str = str(completed_at)
        else:
            completed_at_str = None

        return {
            "job_id": data.get("job_id", ""),
            "request_id": data.get("request_id", ""),
            "artisan_id": data.get("artisan_id", ""),
            "product_id": data.get("product_id", ""),
            "status": status_str,
            "original_image_reference": data.get("original_image_reference"),
            "enhanced_image_reference": data.get("enhanced_image_reference"),
            "preview_image_reference": data.get("preview_image_reference"),
            "operations_requested": data.get("operations_requested", []),
            "operations_applied": data.get("operations_applied", []),
            "warnings": data.get("warnings", []) if isinstance(data.get("warnings"), list) else ([data["warnings"]] if data.get("warnings") else []),
            "metrics": data.get("metrics", {}),
            "processing_duration_ms": data.get("processing_duration_ms", 0),
            "retryable": bool(data.get("retryable", False)),
            "failure_code": data.get("failure_code"),
            "adapter_version": data.get("adapter_version", "isnet-general-use"),
            "created_at": created_at_str,
            "completed_at": completed_at_str,
        }