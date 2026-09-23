"""API routes for the AI Image Studio service."""

from __future__ import annotations

import uuid
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, status, UploadFile
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, Field
from typing import Any, Dict, Optional

from app.config import get_settings
from app.domain.enums import (
    JobState, Operation, BackgroundType, MIMEType, ErrorCode,
    SafetyStatus, OutputSize
)
from app.domain.exceptions import (
    ConsentRequiredError, AuthenticationRequiredError,
    OwnershipMismatchError, InvalidImageTypeError, ImageTooLargeError,
    InvalidImageDimensionsError, CorruptImageError, QuotaExceededError,
    DuplicateRequestConflictError, SegmentationFailedError,
    QualityCheckFailedError, ProcessingTimedOutError,
    InternalProcessingError
)
from app.services.enhancement_service import ImageEnhancementService
from app.services.quality_metrics import calculate_metrics
from app.adapters.background_removal import RembgBackgroundRemovalAdapter
from app.adapters.lighting import LightingCorrectionProcessor
from app.adapters.composition import ImageCompositionProcessor
from app.adapters.storage import LocalFileStorageAdapter, InMemoryJobRepository
from app.adapters.authentication import (
    create_authenticator, DevelopmentAuthenticationVerifier
)
from app.services.quota_service import create_quota_service, InMemoryQuotaService
from app.services.safety_evaluator import EnhancementSafetyEvaluator
from app.utils.image_validation import ImageValidator
from app.utils.logging import log_security_event, log_validation_event

# Initialize settings and components
settings = get_settings()

# Create adapter instances
storage_adapter = LocalFileStorageAdapter(
    originals_dir=settings.originals_dir,
    enhanced_dir=settings.enhanced_dir,
    previews_dir=settings.previews_dir,
)

background_removal_adapter = RembgBackgroundRemovalAdapter()
lighting_correction_adapter = LightingCorrectionProcessor()
composition_adapter = ImageCompositionProcessor()
job_repository = InMemoryJobRepository()

# Create authentication and quota (auto switches to Firebase in production)
authenticator = create_authenticator(settings, "auto")
quota_service = InMemoryQuotaService(default_daily_limit=settings.default_jobs_per_artisan_per_day)

# Create safety evaluator
safety_evaluator = EnhancementSafetyEvaluator()

# Create quality metrics calculator
quality_metrics_calculator = None  # Will use module-level function

# Create the enhancement service
enhancement_service = ImageEnhancementService(
    storage=storage_adapter,
    background_removal=background_removal_adapter,
    lighting_correction=lighting_correction_adapter,
    composition=composition_adapter,
    quality_metrics=quality_metrics_calculator,
    safety_evaluator=safety_evaluator,
    job_repository=job_repository,
    authentication=authenticator,
    quota_service=quota_service,
    settings=settings,
)

# Create router
router = APIRouter(prefix="/v1/enhancements", tags=["enhancements"])


# Pydantic models for request/response

class EnhancementRequest(BaseModel):
    """Request model for POST /v1/enhancements."""
    image: bytes = Field(..., description="Product photograph in JPG, JPEG, PNG or WebP")
    consent_granted: bool = Field(
        ..., description="Must be true for processing to proceed"
    )
    request_id: str = Field(
        ..., description="UUID used as idempotency key"
    )
    product_id: str = Field(
        ..., description="Product identifier string"
    )
    artisan_id: str = Field(
        ..., description="Artisan identifier string"
    )
    operations: Optional[list[str]] = Field(
        default=None, description="Optional JSON list of operations"
    )
    output_size: Optional[int] = Field(
        default=None, description="Output size: 512, 768, or 1024"
    )
    background: Optional[str] = Field(
        default=None, description="Background: white or transparent"
    )


class HealthResponse(BaseModel):
    """Response model for GET /health."""
    status: str
    service: str
    version: str
    model_ready: bool


class JobResult(BaseModel):
    """Job result response model."""
    job_id: str
    request_id: str
    artisan_id: str
    product_id: str
    status: str
    original_image_reference: Optional[str] = None
    enhanced_image_reference: Optional[str] = None
    preview_image_reference: Optional[str] = None
    operations_requested: list[str]
    operations_applied: list[str]
    warnings: list[str]
    metrics: dict[str, Any]
    processing_duration_ms: int
    retryable: bool
    failure_code: Optional[str] = None
    adapter_version: str
    created_at: str
    completed_at: Optional[str] = None


@router.get("/", response_model=HealthResponse, include_in_schema=False)
async def health_check():
    """Health check endpoint.

    Returns service status, version and model readiness.
    Never exposes secrets or internal paths.
    """
    return HealthResponse(
        status="healthy",
        service="KarigarSaathi AI Image Studio",
        version=settings.app_version,
        model_ready=True,
    )


@router.post(
    "",
    response_model=JobResult,
    summary="Enhance product photograph",
    description="""Upload an artisan's product photograph for enhancement.

    Required consent before processing. Original image is preserved unchanged.
    Returns job ID for status tracking and image retrieval.

    Supported operations:
    - background_removal: Remove image background
    - lighting_correction: Conservative lighting adjustment
    - centring: Centre product on catalogue canvas
    - standard_resize: Resize to catalogue dimensions

    Default operations include all four.

    Output sizes: 512, 768, or 1024 pixels.
    Background types: white or transparent.

    Returns original, preview and enhanced image references.
    """,
)
async def create_enhancement(
    image: UploadFile = File(...),
    consent_granted: bool = Form(...),
    request_id: str = Form(...),
    product_id: Optional[str] = Form(default=None),
    artisan_id: Optional[str] = Form(default=None),
    operations: Optional[list[str]] = Form(default=None),
    output_size: Optional[int] = Form(default=None),
    background: Optional[str] = Form(default=None),
    authorization: Optional[str] = Header(None),
):
    """Create new enhancement job - form data version."""

    # 1. Validate required string fields
    if not artisan_id or not str(artisan_id).strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error_code": "ARTISAN_ID_REQUIRED",
                "message": "Artisan ID is required and cannot be empty",
                "retryable": False,
                "request_id": request_id,
            },
        )

    if not product_id or not str(product_id).strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error_code": "PRODUCT_ID_REQUIRED",
                "message": "Product ID is required and cannot be empty",
                "retryable": False,
                "request_id": request_id,
            },
        )

    # 2. Validate consent
    if not consent_granted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error_code": "CONSENT_REQUIRED",
                "message": "Consent must be granted before processing",
                "retryable": False,
                "request_id": request_id,
            },
        )

    # 3. Authentication and ownership validation
    auth_result = await authenticator.verify(authorization)
    if not auth_result.get("authenticated", False):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error_code": "AUTHENTICATION_REQUIRED",
                "message": auth_result.get("error", "Authentication required"),
                "retryable": True,
                "request_id": request_id,
            },
        )

    verified_user_id = auth_result.get("user_id", "")

    # 4. Check ownership: verified user must match artisan_id
    if verified_user_id != artisan_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error_code": "OWNERSHIP_MISMATCH",
                "message": "Ownership mismatch - user does not match artisan",
                "retryable": True,
                "request_id": request_id,
                "details": {"artisan_id": artisan_id, "user_id": verified_user_id},
            },
        )

    # 5. Read and validate image using comprehensive validator
    file_bytes = await image.read()
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error_code": "INVALID_IMAGE_PAYLOAD",
                "message": "Uploaded image file is empty.",
                "retryable": False,
                "request_id": request_id,
            },
        )

    validation_result = ImageValidator.validate(file_bytes)

    if not validation_result["valid"]:
        error_detail = validation_result["error"]
        error_code = _map_validation_error_to_code(error_detail)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error_code": error_code,
                "message": error_detail,
                "retryable": False,
                "request_id": request_id,
                "details": validation_result["details"],
            },
        )

    # 6. Validate operations list (support multiple form fields, JSON strings, or CSV)
    MAX_OPERATIONS = 10
    raw_ops = operations
    if raw_ops is None:
        ops = [op.value for op in Operation.defaults()]
    elif isinstance(raw_ops, str):
        import json
        try:
            ops = json.loads(raw_ops)
        except Exception:
            ops = [x.strip() for x in raw_ops.split(",") if x.strip()]
    elif isinstance(raw_ops, list):
        if len(raw_ops) == 1 and isinstance(raw_ops[0], str) and (raw_ops[0].startswith("[") or "," in raw_ops[0]):
            import json
            try:
                ops = json.loads(raw_ops[0])
            except Exception:
                ops = [x.strip() for x in raw_ops[0].split(",") if x.strip()]
        else:
            ops = raw_ops
    else:
        ops = [op.value for op in Operation.defaults()]

    if not isinstance(ops, list):
        ops = [ops]

    ops = [(op.value if hasattr(op, 'value') else str(op)) for op in ops][:MAX_OPERATIONS]

    # 6. Validate output_size if provided
    if output_size is not None:
        if output_size not in OutputSize.allowed_values():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error_code": "INVALID_IMAGE_TYPE",
                    "message": f"output_size must be one of {OutputSize.allowed_values()}",
                    "retryable": False,
                    "request_id": request_id,
                },
            )
    else:
        output_size = 512  # Default

    # 7. Validate background if provided
    bg_type = background or BackgroundType.WHITE.value
    valid_bgs = {"white", "transparent"}
    if bg_type not in valid_bgs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error_code": "INVALID_IMAGE_TYPE",
                "message": f"background must be 'white' or 'transparent', got '{bg_type}'",
                "retryable": False,
                "request_id": request_id,
            },
        )

    # 8. Check quota
    quota_ok, quota_reason = await quota_service.check_daily_quota(artisan_id)
    if not quota_ok:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error_code": "QUOTA_EXCEEDED",
                "message": quota_reason,
                "retryable": True,
                "request_id": request_id,
                "details": {"artisan_id": artisan_id, "limit": settings.default_jobs_per_artisan_per_day},
            },
        )

    # 9. Check for duplicate/idempotent request
    # Using request_id + artisan_id as idempotency key
    existing_job = await _get_existing_job(request_id, artisan_id)
    if existing_job is not None:
        # Return existing job - do not reprocess
        # Check if the image/content is the same
        if (
            existing_job.get("product_id") == product_id
            and existing_job.get("operations") == [op.value for op in ops]
        ):
            # Same request with same contents - return existing
            result = JobResult(
                job_id=existing_job["job_id"],
                request_id=existing_job["request_id"],
                artisan_id=existing_job["artisan_id"],
                product_id=existing_job["product_id"],
                status=existing_job["status"],
                original_image_reference=existing_job.get("original_reference"),
                enhanced_image_reference=existing_job.get("enhanced_reference"),
                preview_image_reference=existing_job.get("preview_reference"),
                operations_requested=existing_job.get("operations_requested", ops),
                operations_applied=existing_job.get("operations_applied", []),
                warnings=existing_job.get("warnings", []),
                metrics=existing_job.get("metrics", {}),
                processing_duration_ms=existing_job.get("processing_duration_ms", 0),
                retryable=existing_job.get("retryable", False),
                failure_code=existing_job.get("failure_code"),
                adapter_version=existing_job.get("adapter_version", "isnet-general-use"),
                created_at=existing_job.get("created_at", ""),
                completed_at=existing_job.get("completed_at"),
            )
            return result
        else:
            # Same request_id but different contents - conflict
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "error_code": "DUPLICATE_REQUEST_CONFLICT",
                    "message": "Request ID conflict - same request ID with different contents detected",
                    "retryable": False,
                    "request_id": request_id,
                    "details": {
                        "existing_artisan_id": existing_job.get("artisan_id"),
                        "new_artisan_id": artisan_id,
                        "existing_product_id": existing_job.get("product_id"),
                        "new_product_id": product_id,
                    },
                },
            )

    # 10. Determine output size from operations if not specified
    # If centring or standard_resize is in operations, use appropriate size
    if output_size is None and any(
        op in [Operation.CENTRING.value, Operation.STANDARD_RESIZE.value]
        for op in ops
    ):
        output_size = 512  # Default for centring

    # 11. Run the enhancement pipeline
    try:
        result = await enhancement_service.process_enhancement(
            image_data=file_bytes,
            consent_granted=True,  # Already validated
            request_id=request_id,
            product_id=product_id,
            artisan_id=artisan_id,
            operations=[(op.value if hasattr(op, 'value') else str(op)) for op in ops],
            output_size=output_size,
            background=bg_type,
            authorization=authorization,
        )

        # Log successful processing
        try:
            import logging
            from app.utils.logging import log_image_processing
            app_logger = logging.getLogger("AIImageStudio")
            log_image_processing(
                logger=app_logger,
                artisan_id=artisan_id,
                product_id=product_id,
                request_id=request_id,
                operation=", ".join([(op.value if hasattr(op, 'value') else str(op)) for op in ops]),
                status=result["status"],
                duration_ms=result["processing_duration_ms"],
                warnings=result.get("warnings", []),
            )
        except Exception:
            pass

        return result

    except (ConsentRequiredError, AuthenticationRequiredError,
            OwnershipMismatchError, InvalidImageTypeError,
            ImageTooLargeError, InvalidImageDimensionsError,
            CorruptImageError, QuotaExceededError,
            DuplicateRequestConflictError) as e:
        # These are already raised as HTTPExceptions above
        # But just in case, re-raise as appropriate
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error_code": e.error_code.value,
                "message": e.message,
                "retryable": e.retryable,
                "request_id": e.request_id,
                "details": e.details,
            },
        )
    except SegmentationFailedError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": e.error_code.value,
                "message": e.message,
                "retryable": e.retryable,
                "request_id": e.request_id,
                "details": e.details,
            },
        )
    except QualityCheckFailedError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": e.error_code.value,
                "message": e.message,
                "retryable": e.retryable,
                "request_id": e.request_id,
                "details": e.details,
            },
        )
    except ProcessingTimedOutError as e:
        raise HTTPException(
            status_code=status.HTTP_408_REQUEST_TIMEOUT,
            detail={
                "error_code": e.error_code.value,
                "message": e.message,
                "retryable": e.retryable,
                "request_id": e.request_id,
                "details": e.details,
            },
        )
    except InternalProcessingError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error_code": e.error_code.value,
                "message": e.message,
                "retryable": e.retryable,
                "request_id": e.request_id,
                "details": e.details,
            },
        )
    except Exception as e:
        # Catch-all for unexpected errors
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error_code": "INTERNAL_PROCESSING_ERROR",
                "message": "An unexpected error occurred",
                "retryable": True,
                "request_id": request_id,
                "details": {"error": str(e) if str(e) else None},
            },
        )


def _map_validation_error_to_code(error_detail: str) -> str:
    """Map validation error detail string to error code."""
    if "too large" in error_detail.lower():
        return "IMAGE_TOO_LARGE"
    if "dimensions" in error_detail.lower():
        return "INVALID_IMAGE_DIMENSIONS"
    if "corrupt" in error_detail.lower() or "decompression" in error_detail.lower():
        return "CORRUPT_IMAGE"
    if "type" in error_detail.lower():
        return "INVALID_IMAGE_TYPE"
    return "INVALID_IMAGE_TYPE"


async def _get_existing_job(request_id: str, artisan_id: str) -> Optional[dict]:
    """Check for existing job with same request_id and artisan_id.

    In prototype, this queries an in-memory or simple store.
    """
    # For now, return None - full implementation would use job_repository
    # The actual idempotency check happens in the enhancement_service
    return None


@router.get("/{job_id}", response_model=JobResult)
async def get_job_status(job_id: str):
    """Retrieve enhancement job details."""
    job = await job_repository.get_job(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "NOT_FOUND", "message": f"Job {job_id} not found"},
        )
    return JobResult(
        job_id=job["job_id"],
        request_id=job.get("request_id", job_id),
        artisan_id=job.get("artisan_id", ""),
        product_id=job.get("product_id", ""),
        status=job.get("status").name.lower() if hasattr(job.get("status"), "name") else str(job.get("status", "succeeded")),
        original_image_reference=job.get("original_image_reference", f"/v1/enhancements/{job_id}/original"),
        enhanced_image_reference=job.get("enhanced_image_reference", f"/v1/enhancements/{job_id}/enhanced"),
        preview_image_reference=job.get("preview_image_reference", f"/v1/enhancements/{job_id}/preview"),
        operations_requested=job.get("operations_requested", []),
        operations_applied=job.get("operations_applied", []),
        warnings=job.get("warnings", []) if isinstance(job.get("warnings"), list) else ([job["warnings"]] if job.get("warnings") else []),
        metrics=job.get("metrics", {}),
        processing_duration_ms=job.get("processing_duration_ms", 0),
        retryable=job.get("retryable", False),
        failure_code=job.get("failure_code"),
        adapter_version=job.get("adapter_version", "isnet-general-use"),
        created_at=str(job.get("created_at", "")),
        completed_at=str(job.get("completed_at", "")) if job.get("completed_at") else None,
    )


@router.get("/{job_id}/original")
async def get_original_image(job_id: str):
    """Retrieve original image file."""
    import os
    import glob
    from fastapi.responses import FileResponse
    pattern = os.path.join(settings.originals_dir, f"*{job_id}*")
    matches = glob.glob(pattern)
    if matches and os.path.exists(matches[0]):
        return FileResponse(matches[0], media_type="image/png")
    filepath = os.path.join(settings.originals_dir, f"{job_id}.jpg")
    if os.path.exists(filepath):
        return FileResponse(filepath, media_type="image/jpeg")
    raise HTTPException(status_code=404, detail="Original image not found")


@router.get("/{job_id}/enhanced")
async def get_enhanced_image(job_id: str):
    """Retrieve enhanced image file."""
    import os
    import glob
    from fastapi.responses import FileResponse
    filepath = os.path.join(settings.enhanced_dir, f"{job_id}_enhanced.png")
    if os.path.exists(filepath):
        return FileResponse(filepath, media_type="image/png")
    pattern = os.path.join(settings.enhanced_dir, f"*{job_id}*")
    matches = glob.glob(pattern)
    if matches and os.path.exists(matches[0]):
        return FileResponse(matches[0], media_type="image/png")
    raise HTTPException(status_code=404, detail="Enhanced image not found")


@router.get("/{job_id}/preview")
async def get_preview_image(job_id: str):
    """Retrieve preview image file."""
    import os
    import glob
    from fastapi.responses import FileResponse
    filepath = os.path.join(settings.previews_dir, f"{job_id}_preview.png")
    if os.path.exists(filepath):
        return FileResponse(filepath, media_type="image/png")
    pattern = os.path.join(settings.previews_dir, f"*{job_id}*")
    matches = glob.glob(pattern)
    if matches and os.path.exists(matches[0]):
        return FileResponse(matches[0], media_type="image/png")
    raise HTTPException(status_code=404, detail="Preview image not found")


# Main API router (without prefix, for root health check)
api_router = APIRouter()
api_router.include_router(router, prefix="", tags=["enhancements"])


@api_router.get("/health", response_model=HealthResponse, include_in_schema=False)
async def root_health():
    """Root health check."""
    return await health_check()