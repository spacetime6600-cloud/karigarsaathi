"""API routes for media storage operations (Cloudinary integration).

Provides authenticated upload, replacement, and deletion endpoints.
Enforces strict auth token verification, artisan ownership checks, content validation,
and structured logging without credential leakage.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, Query, UploadFile, status
from pydantic import BaseModel, Field

from app.config import get_settings
from app.adapters.authentication import create_authenticator
from app.adapters.cloudinary_storage import (
    CloudinaryStorageAdapter,
    ALLOWED_MIME_TYPES,
    MAX_FILE_SIZE_BYTES,
)

logger = logging.getLogger(__name__)
settings = get_settings()

router = APIRouter(prefix="/v1/media", tags=["media"])

# Authenticator instance (auto switches to Firebase in production)
authenticator = create_authenticator(settings, "auto")

# Storage adapter instance
def get_cloudinary_adapter() -> CloudinaryStorageAdapter:
    """Factory to get or initialize CloudinaryStorageAdapter."""
    # When MEDIA_STORAGE_PROVIDER is cloudinary, require credentials
    require_config = settings.media_storage_provider.lower() == "cloudinary"
    return CloudinaryStorageAdapter(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        require_config=require_config,
    )


class MediaMetadataResponse(BaseModel):
    """Standardized media metadata returned to frontend and stored in Firestore."""
    provider: str = "cloudinary"
    publicId: str
    secureUrl: str
    version: str
    width: int
    height: int
    format: str
    bytes: int
    resourceType: str
    variant: str
    imageId: str
    productId: str
    checksum: str
    idempotencyKey: str
    createdAt: str
    updatedAt: str


class MediaDeleteResponse(BaseModel):
    """Response returned upon asset deletion."""
    deleted: bool
    publicId: str
    result: str = "ok"


async def verify_auth_and_ownership(
    authorization: Optional[str],
    owner_id: str,
    operation: str = "media_operation",
) -> str:
    """Verify bearer token and enforce owner UID match.

    Raises:
        HTTPException(401) if unauthenticated or token invalid/expired
        HTTPException(403) if token UID does not match owner_id
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error_code": "AUTHENTICATION_REQUIRED",
                "message": "Authorization header is required.",
                "retryable": True,
            },
        )

    auth_result = await authenticator.verify(authorization)
    if not auth_result.get("authenticated", False):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error_code": "INVALID_TOKEN",
                "message": auth_result.get("error", "Invalid or expired authentication token."),
                "retryable": True,
            },
        )

    verified_user_id = auth_result.get("user_id", "")
    if verified_user_id != owner_id:
        logger.warning(
            "CROSS_OWNER_ACCESS_DENIED",
            extra={
                "operation": operation,
                "token_uid": verified_user_id,
                "requested_owner_id": owner_id,
            },
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error_code": "OWNERSHIP_MISMATCH",
                "message": "Access denied: you do not have permission to modify this product's media.",
                "retryable": False,
            },
        )

    return verified_user_id


@router.post("/upload", response_model=MediaMetadataResponse, summary="Upload product photograph to Cloudinary")
async def upload_media(
    file: UploadFile = File(..., description="Image file (JPEG, PNG, WebP)"),
    product_id: str = Form(..., description="Target Product ID"),
    image_id: str = Form(..., description="Unique Image ID"),
    owner_id: str = Form(..., description="Artisan / Owner UID"),
    variant: str = Form(default="original", description="Variant ('original', 'display', 'enhanced', 'thumbnail')"),
    idempotency_key: Optional[str] = Form(default=None, description="Deterministic idempotency key"),
    authorization: Optional[str] = Header(None),
):
    """Authenticate, validate, and upload product photograph to Cloudinary."""
    await verify_auth_and_ownership(authorization, owner_id, operation="upload")

    file_bytes = await file.read()
    if not file_bytes or len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error_code": "EMPTY_FILE",
                "message": "Uploaded file is empty (0 bytes).",
                "retryable": False,
            },
        )

    try:
        adapter = get_cloudinary_adapter()
    except ValueError as val_err:
        logger.error(
            "CLOUDINARY_CONFIG_MISSING",
            extra={"product_id": product_id, "image_id": image_id, "error": str(val_err)},
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error_code": "CLOUDINARY_CONFIG_MISSING",
                "message": "Cloudinary credentials not configured on backend service. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
                "retryable": False,
            },
        )

    # Validate image payload
    try:
        adapter.validate_image_payload(file_bytes, declared_mime_type=file.content_type)
    except ValueError as exc:
        err_msg = str(exc)
        if "too large" in err_msg.lower():
            err_code = "IMAGE_TOO_LARGE"
        elif "corrupt" in err_msg.lower() or "undecodable" in err_msg.lower():
            err_code = "CORRUPT_IMAGE"
        else:
            err_code = "INVALID_IMAGE_TYPE"

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error_code": err_code,
                "message": err_msg,
                "retryable": False,
            },
        )

    # Perform Cloudinary upload
    try:
        metadata = await adapter.upload(
            file_bytes=file_bytes,
            product_id=product_id,
            image_id=image_id,
            variant=variant,
            idempotency_key=idempotency_key,
        )
        return MediaMetadataResponse(**metadata)
    except Exception as exc:
        logger.error(
            "MEDIA_UPLOAD_FAILED",
            extra={"product_id": product_id, "image_id": image_id, "error": str(exc)},
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error_code": "STORAGE_UPLOAD_ERROR",
                "message": f"Failed to store image on Cloudinary: {str(exc)}",
                "retryable": True,
            },
        )


@router.post("/replace", response_model=MediaMetadataResponse, summary="Safely replace a product photograph")
async def replace_media(
    file: UploadFile = File(..., description="Replacement image file"),
    product_id: str = Form(...),
    image_id: str = Form(...),
    owner_id: str = Form(...),
    variant: str = Form(default="original"),
    previous_public_id: Optional[str] = Form(default=None),
    idempotency_key: Optional[str] = Form(default=None),
    authorization: Optional[str] = Header(None),
):
    """Safely replace product media following the ordered commit pattern."""
    await verify_auth_and_ownership(authorization, owner_id, operation="replace")

    file_bytes = await file.read()
    try:
        adapter = get_cloudinary_adapter()
    except ValueError as val_err:
        logger.error("CLOUDINARY_CONFIG_MISSING", extra={"product_id": product_id, "error": str(val_err)})
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error_code": "CLOUDINARY_CONFIG_MISSING",
                "message": "Cloudinary credentials not configured on backend service. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
                "retryable": False,
            },
        )

    try:
        adapter.validate_image_payload(file_bytes, declared_mime_type=file.content_type)
    except ValueError as exc:
        err_msg = str(exc)
        err_code = "IMAGE_TOO_LARGE" if "too large" in err_msg.lower() else ("CORRUPT_IMAGE" if "corrupt" in err_msg.lower() else "INVALID_IMAGE_TYPE")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error_code": err_code, "message": err_msg, "retryable": False},
        )

    try:
        metadata = await adapter.replace(
            file_bytes=file_bytes,
            product_id=product_id,
            image_id=image_id,
            variant=variant,
            previous_public_id=previous_public_id,
            idempotency_key=idempotency_key,
        )
        return MediaMetadataResponse(**metadata)
    except Exception as exc:
        logger.error(
            "MEDIA_REPLACE_FAILED",
            extra={"product_id": product_id, "image_id": image_id, "error": str(exc)},
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error_code": "STORAGE_REPLACE_ERROR",
                "message": "Failed to replace image on Cloudinary.",
                "retryable": True,
            },
        )


@router.delete("/{product_id}/{image_id}/{variant}", response_model=MediaDeleteResponse, summary="Delete product photograph from Cloudinary")
async def delete_media(
    product_id: str,
    image_id: str,
    variant: str,
    owner_id: str = Query(..., description="Artisan / Owner UID for authorization"),
    authorization: Optional[str] = Header(None),
):
    """Delete a specific product photo variant from Cloudinary."""
    await verify_auth_and_ownership(authorization, owner_id, operation="delete")

    adapter = get_cloudinary_adapter()
    try:
        result = await adapter.destroy(
            product_id=product_id,
            image_id=image_id,
            variant=variant,
        )
        return MediaDeleteResponse(**result)
    except Exception as exc:
        logger.error(
            "MEDIA_DELETE_FAILED",
            extra={"product_id": product_id, "image_id": image_id, "error": str(exc)},
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error_code": "STORAGE_DELETE_ERROR",
                "message": "Failed to delete image from Cloudinary.",
                "retryable": True,
            },
        )
