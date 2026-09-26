"""API routes for media storage operations (Cloudinary integration).

Provides authenticated upload, replacement, and deletion endpoints.
Enforces strict auth token verification, artisan ownership checks, content validation,
and structured logging without credential leakage.
"""

from __future__ import annotations

import logging
import re
from typing import Any, Dict, Optional, Tuple

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


def sanitize_error_message(msg: str, cloud_name: str = "", api_key: str = "", api_secret: str = "") -> str:
    """Sanitize error messages to remove sensitive credentials, tokens, or signatures.

    Never exposes api_secret, api_key, bearer tokens, or full signature payloads.
    """
    if not msg:
        return "Unknown error"

    sanitized = str(msg)

    # Redact known secrets if present in message
    if api_secret and len(api_secret) > 4:
        sanitized = sanitized.replace(api_secret, "[REDACTED_SECRET]")
    if api_key and len(api_key) > 4:
        sanitized = sanitized.replace(api_key, "[REDACTED_KEY]")

    # Redact Bearer tokens
    sanitized = re.sub(r"Bearer\s+[a-zA-Z0-9_\-\.]+", "Bearer [REDACTED_TOKEN]", sanitized, flags=re.IGNORECASE)

    # Redact String to sign / signatures: e.g. "String to sign - '...'"
    sanitized = re.sub(r"String to sign\s*-\s*['\"][^'\"]*['\"]", "String to sign - '[REDACTED]'", sanitized, flags=re.IGNORECASE)
    sanitized = re.sub(r"Invalid Signature\s+[a-fA-F0-9]+", "Invalid Signature [REDACTED]", sanitized, flags=re.IGNORECASE)
    sanitized = re.sub(r"api_secret=[^\s&'\"]+", "api_secret=[REDACTED]", sanitized, flags=re.IGNORECASE)
    sanitized = re.sub(r"api_key=[^\s&'\"]+", "api_key=[REDACTED]", sanitized, flags=re.IGNORECASE)

    if len(sanitized) > 500:
        sanitized = sanitized[:500] + "... [truncated]"

    return sanitized


def extract_provider_error_details(
    exc: Exception, adapter: Optional[CloudinaryStorageAdapter] = None
) -> Tuple[str, Optional[int], bool, str, int]:
    """Extract structured, safe diagnostic details from a Cloudinary exception.

    Returns:
        (exc_type, provider_status_code, is_retryable, safe_msg, http_status)
    """
    exc_type = type(exc).__name__
    raw_code = getattr(exc, "status_code", None) or getattr(exc, "http_code", None)

    provider_status_code = None
    if isinstance(raw_code, int):
        provider_status_code = raw_code
    elif "AuthorizationRequired" in exc_type or "Invalid Signature" in str(exc) or "Must supply api_key" in str(exc):
        provider_status_code = 401
    elif "NotAllowed" in exc_type:
        provider_status_code = 403
    elif "NotFound" in exc_type:
        provider_status_code = 404
    elif "BadRequest" in exc_type:
        provider_status_code = 400
    elif "RateLimited" in exc_type:
        provider_status_code = 429
    elif "GeneralError" in exc_type:
        provider_status_code = 500

    # Determine retryability: auth/credential/bad request errors are PERMANENT (never retryable)
    is_retryable = True
    if provider_status_code in {400, 401, 403, 404}:
        is_retryable = False
    elif any(term in str(exc).lower() for term in ["signature", "api_key", "credentials", "unauthorized", "forbidden", "unknown cloud", "not found"]):
        is_retryable = False

    cloud_name = getattr(adapter, "cloud_name", "") if adapter else ""
    api_key = getattr(adapter, "api_key", "") if adapter else ""
    api_secret = getattr(adapter, "api_secret", "") if adapter else ""

    safe_msg = sanitize_error_message(str(exc), cloud_name=cloud_name, api_key=api_key, api_secret=api_secret)

    # Determine outward HTTP status code
    if provider_status_code in {401, 403}:
        http_status = status.HTTP_502_BAD_GATEWAY  # Upstream Cloudinary auth failed
    elif provider_status_code == 400:
        http_status = status.HTTP_400_BAD_REQUEST
    elif provider_status_code == 429:
        http_status = status.HTTP_429_TOO_MANY_REQUESTS
    else:
        http_status = status.HTTP_500_INTERNAL_SERVER_ERROR

    return exc_type, provider_status_code, is_retryable, safe_msg, http_status


# Storage adapter instance
def get_cloudinary_adapter() -> CloudinaryStorageAdapter:
    """Factory to get or initialize CloudinaryStorageAdapter.

    Calls to /v1/media/* strictly require Cloudinary credentials to be configured.
    """
    current_settings = get_settings()
    return CloudinaryStorageAdapter(
        cloud_name=current_settings.cloudinary_cloud_name,
        api_key=current_settings.cloudinary_api_key,
        api_secret=current_settings.cloudinary_api_secret,
        require_config=True,
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


class SignUploadRequest(BaseModel):
    """Request model for server-side pre-signed upload signature."""
    product_id: str = Field(..., description="Target Product ID")
    image_id: str = Field(..., description="Unique Image ID")
    owner_id: str = Field(..., description="Artisan / Owner UID")
    variant: str = Field(default="original", description="Variant ('original', 'display', 'enhanced', 'thumbnail')")
    idempotency_key: Optional[str] = Field(default=None, description="Deterministic idempotency key")


class SignUploadResponse(BaseModel):
    """Pre-signed upload parameters returned to client for direct Cloudinary upload."""
    cloud_name: str
    api_key: str
    public_id: str
    timestamp: int
    signature: str
    upload_url: str


@router.post("/sign-upload", response_model=SignUploadResponse, summary="Generate server-side upload signature for direct 10MB upload")
async def sign_upload(
    payload: SignUploadRequest,
    authorization: Optional[str] = Header(None),
):
    """Authenticate, verify artisan ownership, and generate a secure pre-signed Cloudinary upload signature.

    Preserves the full 10 MB image upload capability on serverless platforms (which enforce a 4.5 MB payload limit)
    while keeping the Cloudinary API secret strictly protected on the server.
    """
    await verify_auth_and_ownership(authorization, payload.owner_id, operation="sign_upload")

    try:
        adapter = get_cloudinary_adapter()
        return adapter.generate_upload_signature(
            product_id=payload.product_id,
            image_id=payload.image_id,
            variant=payload.variant,
        )
    except Exception as exc:
        safe_msg = sanitize_error_message(str(exc))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error_code": "SIGNATURE_GENERATION_FAILED",
                "message": f"Failed to generate upload signature: {safe_msg}",
                "retryable": False,
            },
        )


class VerifyUploadRequest(BaseModel):
    """Request model for server-side verification of direct Cloudinary upload."""
    product_id: str = Field(..., description="Target Product ID")
    image_id: str = Field(..., description="Unique Image ID")
    owner_id: str = Field(..., description="Artisan / Owner UID")
    variant: str = Field(default="original", description="Variant ('original', 'display', 'enhanced', 'thumbnail')")
    public_id: str = Field(..., description="Cloudinary public ID returned by direct upload")
    idempotency_key: Optional[str] = Field(default=None, description="Deterministic idempotency key")


@router.post("/verify-upload", response_model=MediaMetadataResponse, summary="Verify direct-to-Cloudinary upload and record ownership")
async def verify_upload(
    payload: VerifyUploadRequest,
    authorization: Optional[str] = Header(None),
):
    """Authenticate, verify artisan ownership, and verify direct upload with Cloudinary.

    Confirms asset exists in Cloudinary, adheres to security limits (<=10MB, allowed image MIME),
    matches expected deterministic public ID, and returns canonical metadata for Firestore persistence.
    """
    await verify_auth_and_ownership(authorization, payload.owner_id, operation="verify_upload")

    adapter = get_cloudinary_adapter()
    expected_public_id = adapter.build_public_id(payload.product_id, payload.image_id, payload.variant)
    if payload.public_id != expected_public_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error_code": "INVALID_PUBLIC_ID",
                "message": f"Asset public ID does not match expected product/image path. Expected '{expected_public_id}', got '{payload.public_id}'.",
                "retryable": False,
            },
        )

    try:
        resource_info = await adapter.verify_asset(payload.public_id)
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error_code": "INVALID_IMAGE_PAYLOAD",
                "message": str(val_err),
                "retryable": False,
            },
        )
    except Exception as exc:
        exc_type, provider_status_code, is_retryable, safe_msg, http_status = extract_provider_error_details(exc, adapter)
        raise HTTPException(
            status_code=http_status,
            detail={
                "error_code": "ASSET_VERIFICATION_FAILED",
                "provider": "cloudinary",
                "provider_error_type": exc_type,
                "provider_status_code": provider_status_code,
                "message": f"Failed to verify asset on Cloudinary: {safe_msg}",
                "retryable": is_retryable,
            },
        )

    from datetime import datetime, timezone
    now_iso = datetime.now(timezone.utc).isoformat()
    secure_url = resource_info.get("secure_url") or resource_info.get("url") or f"https://res.cloudinary.com/{adapter.cloud_name}/image/upload/{payload.public_id}.{resource_info.get('format', 'jpg')}"

    return MediaMetadataResponse(
        provider="cloudinary",
        publicId=payload.public_id,
        secureUrl=secure_url,
        version=str(resource_info.get("version", "")),
        width=int(resource_info.get("width", 0)),
        height=int(resource_info.get("height", 0)),
        format=str(resource_info.get("format", "jpg")),
        bytes=int(resource_info.get("bytes", 0)),
        resourceType=str(resource_info.get("resource_type", "image")),
        variant=payload.variant,
        imageId=payload.image_id,
        productId=payload.product_id,
        checksum=f"sha256:{resource_info.get('etag', '')}",
        idempotencyKey=payload.idempotency_key or f"idemp_{payload.product_id}_{payload.image_id}_{payload.variant}",
        createdAt=str(resource_info.get("created_at", now_iso)),
        updatedAt=now_iso,
    )


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
        safe_cfg_err = sanitize_error_message(str(val_err))
        logger.error("CLOUDINARY_CONFIG_MISSING [product_id=%s, image_id=%s]: %s", product_id, image_id, safe_cfg_err)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error_code": "CLOUDINARY_CONFIG_MISSING",
                "provider": "cloudinary",
                "provider_error_type": "ValueError",
                "provider_status_code": 503,
                "message": f"Cloudinary configuration missing: {safe_cfg_err}",
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
        exc_type, provider_status_code, is_retryable, safe_msg, http_status = extract_provider_error_details(exc, adapter)
        logger.error(
            "MEDIA_UPLOAD_FAILED [provider=cloudinary, exc_type=%s, provider_code=%s, retryable=%s, product_id=%s, image_id=%s]: %s",
            exc_type,
            provider_status_code or "N/A",
            is_retryable,
            product_id,
            image_id,
            safe_msg,
        )
        raise HTTPException(
            status_code=http_status,
            detail={
                "error_code": "STORAGE_UPLOAD_ERROR",
                "provider": "cloudinary",
                "provider_error_type": exc_type,
                "provider_status_code": provider_status_code,
                "message": f"Failed to store image on Cloudinary: {safe_msg}",
                "retryable": is_retryable,
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
        safe_cfg_err = sanitize_error_message(str(val_err))
        logger.error("CLOUDINARY_CONFIG_MISSING [product_id=%s, image_id=%s]: %s", product_id, image_id, safe_cfg_err)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error_code": "CLOUDINARY_CONFIG_MISSING",
                "provider": "cloudinary",
                "provider_error_type": "ValueError",
                "provider_status_code": 503,
                "message": f"Cloudinary configuration missing: {safe_cfg_err}",
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
        exc_type, provider_status_code, is_retryable, safe_msg, http_status = extract_provider_error_details(exc, adapter)
        logger.error(
            "MEDIA_REPLACE_FAILED [provider=cloudinary, exc_type=%s, provider_code=%s, retryable=%s, product_id=%s, image_id=%s]: %s",
            exc_type,
            provider_status_code or "N/A",
            is_retryable,
            product_id,
            image_id,
            safe_msg,
        )
        raise HTTPException(
            status_code=http_status,
            detail={
                "error_code": "STORAGE_REPLACE_ERROR",
                "provider": "cloudinary",
                "provider_error_type": exc_type,
                "provider_status_code": provider_status_code,
                "message": f"Failed to replace image on Cloudinary: {safe_msg}",
                "retryable": is_retryable,
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

    try:
        adapter = get_cloudinary_adapter()
    except ValueError as val_err:
        safe_cfg_err = sanitize_error_message(str(val_err))
        logger.error("CLOUDINARY_CONFIG_MISSING [product_id=%s, image_id=%s]: %s", product_id, image_id, safe_cfg_err)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error_code": "CLOUDINARY_CONFIG_MISSING",
                "provider": "cloudinary",
                "provider_error_type": "ValueError",
                "provider_status_code": 503,
                "message": f"Cloudinary configuration missing: {safe_cfg_err}",
                "retryable": False,
            },
        )

    try:
        result = await adapter.destroy(
            product_id=product_id,
            image_id=image_id,
            variant=variant,
        )
        return MediaDeleteResponse(**result)
    except Exception as exc:
        exc_type, provider_status_code, is_retryable, safe_msg, http_status = extract_provider_error_details(exc, adapter)
        logger.error(
            "MEDIA_DELETE_FAILED [provider=cloudinary, exc_type=%s, provider_code=%s, retryable=%s, product_id=%s, image_id=%s]: %s",
            exc_type,
            provider_status_code or "N/A",
            is_retryable,
            product_id,
            image_id,
            safe_msg,
        )
        raise HTTPException(
            status_code=http_status,
            detail={
                "error_code": "STORAGE_DELETE_ERROR",
                "provider": "cloudinary",
                "provider_error_type": exc_type,
                "provider_status_code": provider_status_code,
                "message": f"Failed to delete image from Cloudinary: {safe_msg}",
                "retryable": is_retryable,
            },
        )
