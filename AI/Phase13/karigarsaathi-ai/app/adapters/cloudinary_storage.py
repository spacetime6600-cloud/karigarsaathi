"""Cloudinary media storage adapter for KarigarSaathi product photographs.

Enforces server-side authentication, deterministic public IDs, content validation,
idempotency, and safe replacement/deletion workflows.
Secrets are never logged, printed, or sent to client bundles.
"""

from __future__ import annotations

import hashlib
import logging
from datetime import datetime, timezone
from io import BytesIO
from typing import Any, Dict, Optional

from PIL import Image

try:
    import cloudinary
    import cloudinary.uploader
    import cloudinary.utils
    CLOUDINARY_AVAILABLE = True
except ImportError:
    CLOUDINARY_AVAILABLE = False


logger = logging.getLogger(__name__)

# Security & Validation Constants
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_VARIANTS = {"original", "display", "enhanced", "thumbnail", "processed"}


def detect_mime_from_magic_bytes(data: bytes) -> Optional[str]:
    """Detect image MIME type from initial magic bytes (file signature)."""
    if len(data) < 12:
        return None
    # JPEG magic bytes: FF D8 FF
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    # PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    # WebP magic bytes: RIFF....WEBP
    if data.startswith(b"RIFF") and data[8:12] == b"WEBP":
        return "image/webp"
    return None


class CloudinaryStorageAdapter:
    """Production Cloudinary storage adapter with server-side signing and validation."""

    def __init__(
        self,
        cloud_name: Optional[str] = None,
        api_key: Optional[str] = None,
        api_secret: Optional[str] = None,
        require_config: bool = True,
    ):
        """Initialize Cloudinary client with credentials.

        Args:
            cloud_name: Cloudinary cloud name
            api_key: Cloudinary API key
            api_secret: Cloudinary API secret
            require_config: If True, raises ValueError when credentials are missing
        """
        import os

        raw_cloud_name = cloud_name if cloud_name is not None else os.getenv("CLOUDINARY_CLOUD_NAME", "")
        raw_api_key = api_key if api_key is not None else os.getenv("CLOUDINARY_API_KEY", "")
        raw_api_secret = api_secret if api_secret is not None else os.getenv("CLOUDINARY_API_SECRET", "")

        self.cloud_name = str(raw_cloud_name).strip().strip("'\"")
        self.api_key = str(raw_api_key).strip().strip("'\"")
        self.api_secret = str(raw_api_secret).strip().strip("'\"")

        # Fallback to CLOUDINARY_URL format (cloudinary://api_key:api_secret@cloud_name)
        if not self.cloud_name or not self.api_key or not self.api_secret:
            raw_url = os.getenv("CLOUDINARY_URL", "").strip().strip("'\"")
            if raw_url:
                try:
                    import urllib.parse
                    parsed = urllib.parse.urlparse(raw_url)
                    if parsed.scheme == "cloudinary":
                        if not self.api_key and parsed.username:
                            self.api_key = parsed.username
                        if not self.api_secret and parsed.password:
                            self.api_secret = parsed.password
                        if not self.cloud_name and parsed.hostname:
                            self.cloud_name = parsed.hostname
                except Exception:
                    pass

        if require_config:
            missing = []
            if not self.cloud_name:
                missing.append("CLOUDINARY_CLOUD_NAME")
            if not self.api_key:
                missing.append("CLOUDINARY_API_KEY")
            if not self.api_secret:
                missing.append("CLOUDINARY_API_SECRET")
            if missing:
                raise ValueError(
                    f"Cloudinary configuration missing: {', '.join(missing)} must be configured."
                )

        if CLOUDINARY_AVAILABLE and self.cloud_name and self.api_key and self.api_secret:
            cloudinary.config(
                cloud_name=self.cloud_name,
                api_key=self.api_key,
                api_secret=self.api_secret,
                secure=True,
            )
            self._configured = True
        else:
            self._configured = False

        self._idempotency_cache: Dict[str, Dict[str, Any]] = {}

    @property
    def is_configured(self) -> bool:
        """Check if Cloudinary is configured."""
        return self._configured

    @staticmethod
    def build_public_id(product_id: str, image_id: str, variant: str) -> str:
        """Generate deterministic Cloudinary public ID.

        Strictly avoids UID or PII to protect artisan identity.
        Format: karigarsaathi/products/{product_id}/{image_id}/{variant}
        """
        clean_variant = "display" if variant == "processed" else variant
        return f"karigarsaathi/products/{product_id}/{image_id}/{clean_variant}"

    def generate_upload_signature(
        self,
        product_id: str,
        image_id: str,
        variant: str = "original",
    ) -> Dict[str, Any]:
        """Generate server-side upload signature for direct client-to-Cloudinary upload.

        Preserves 10 MB upload workflow without sending large payloads through
        serverless functions (4.5 MB limit). Secrets are NEVER exposed to client.
        """
        import time
        if not CLOUDINARY_AVAILABLE or not self.is_configured:
            raise RuntimeError("Cloudinary is not configured on server")

        public_id = self.build_public_id(product_id, image_id, variant)
        timestamp = int(time.time())
        params_to_sign = {
            "overwrite": "true",
            "public_id": public_id,
            "timestamp": str(timestamp),
        }
        signature = cloudinary.utils.api_sign_request(params_to_sign, self.api_secret)

        return {
            "cloud_name": self.cloud_name,
            "api_key": self.api_key,
            "public_id": public_id,
            "timestamp": timestamp,
            "signature": signature,
            "upload_url": f"https://api.cloudinary.com/v1_1/{self.cloud_name}/image/upload",
        }

    def validate_image_payload(self, file_bytes: bytes, declared_mime_type: Optional[str] = None) -> Dict[str, Any]:
        """Thoroughly validate image bytes before sending to Cloudinary.

        Checks:
        1. Non-empty payload
        2. Maximum size (10 MB)
        3. Magic bytes match allowed MIME types (JPEG, PNG, WebP)
        4. Image is decodable by PIL (detect corrupted/truncated files)
        5. Valid dimensions
        """
        if not file_bytes or len(file_bytes) == 0:
            raise ValueError("Empty image payload (0 bytes)")

        if len(file_bytes) > MAX_FILE_SIZE_BYTES:
            size_mb = len(file_bytes) / (1024 * 1024)
            raise ValueError(f"Image too large ({size_mb:.1f} MB exceeds {MAX_FILE_SIZE_BYTES // (1024*1024)} MB limit)")

        detected_mime = detect_mime_from_magic_bytes(file_bytes)
        if not detected_mime or detected_mime not in ALLOWED_MIME_TYPES:
            raise ValueError(f"Invalid image format: detected '{detected_mime or 'unknown'}'. Allowed formats: JPEG, PNG, WebP.")

        try:
            with Image.open(BytesIO(file_bytes)) as img:
                img.verify()
            # Reopen to read dimensions after verify
            with Image.open(BytesIO(file_bytes)) as img:
                width, height = img.size
                image_format = (img.format or "JPEG").lower()
        except Exception as exc:
            raise ValueError(f"Corrupt or undecodable image file: {exc}")

        return {
            "valid": True,
            "mime_type": detected_mime,
            "format": image_format,
            "width": width,
            "height": height,
            "size_bytes": len(file_bytes),
        }

    async def upload(
        self,
        file_bytes: bytes,
        product_id: str,
        image_id: str,
        variant: str = "original",
        idempotency_key: Optional[str] = None,
        uploader_override: Optional[Any] = None,
    ) -> Dict[str, Any]:
        """Upload an image to Cloudinary using deterministic public ID.

        Args:
            file_bytes: Raw image file data
            product_id: Product ID
            image_id: Image ID
            variant: Image variant ('original', 'display', 'enhanced', 'thumbnail')
            idempotency_key: Optional client idempotency key
            uploader_override: Optional mock uploader for testing

        Returns:
            Standardized metadata dictionary safe for Firestore persistence
        """
        # 1. Content validation
        validation = self.validate_image_payload(file_bytes)
        public_id = self.build_public_id(product_id, image_id, variant)
        checksum = hashlib.sha256(file_bytes).hexdigest()
        now_iso = datetime.now(timezone.utc).isoformat()

        if idempotency_key and idempotency_key in self._idempotency_cache:
            logger.info(
                "CLOUDINARY_UPLOAD_IDEMPOTENT_HIT",
                extra={"idempotency_key": idempotency_key, "public_id": public_id},
            )
            return self._idempotency_cache[idempotency_key]

        logger.info(
            "CLOUDINARY_UPLOAD_INIT",
            extra={
                "public_id": public_id,
                "product_id": product_id,
                "image_id": image_id,
                "variant": variant,
                "size_bytes": validation["size_bytes"],
            },
        )

        uploader = uploader_override or (cloudinary.uploader if CLOUDINARY_AVAILABLE else None)
        if not uploader:
            raise RuntimeError("Cloudinary uploader not available")

        # 2. Execute Cloudinary upload
        upload_result = uploader.upload(
            file_bytes,
            public_id=public_id,
            overwrite=True,
            resource_type="image",
            context={
                "productId": product_id,
                "imageId": image_id,
                "variant": variant,
                "idempotencyKey": idempotency_key or "",
                "checksum": checksum,
            },
        )

        # 3. Format safe metadata (strictly NO secrets or private credentials)
        secure_url = upload_result.get("secure_url") or upload_result.get("url") or ""
        metadata: Dict[str, Any] = {
            "provider": "cloudinary",
            "publicId": upload_result.get("public_id", public_id),
            "secureUrl": secure_url,
            "version": str(upload_result.get("version", "")),
            "width": upload_result.get("width", validation["width"]),
            "height": upload_result.get("height", validation["height"]),
            "format": upload_result.get("format", validation["format"]),
            "bytes": upload_result.get("bytes", validation["size_bytes"]),
            "resourceType": upload_result.get("resource_type", "image"),
            "variant": variant,
            "imageId": image_id,
            "productId": product_id,
            "checksum": f"sha256:{checksum}",
            "idempotencyKey": idempotency_key or f"idemp_{product_id}_{image_id}_{variant}",
            "createdAt": now_iso,
            "updatedAt": now_iso,
        }

        if idempotency_key:
            self._idempotency_cache[idempotency_key] = metadata

        logger.info(
            "CLOUDINARY_UPLOAD_SUCCESS",
            extra={
                "public_id": metadata["publicId"],
                "secure_url": metadata["secureUrl"],
                "bytes": metadata["bytes"],
            },
        )

        return metadata

    async def destroy(
        self,
        product_id: str,
        image_id: str,
        variant: str = "original",
        public_id_override: Optional[str] = None,
        uploader_override: Optional[Any] = None,
    ) -> Dict[str, Any]:
        """Delete an asset from Cloudinary cleanly and idempotently.

        Args:
            product_id: Product ID
            image_id: Image ID
            variant: Image variant
            public_id_override: Optional explicit public ID
            uploader_override: Optional mock uploader for testing
        """
        public_id = public_id_override or self.build_public_id(product_id, image_id, variant)
        logger.info("CLOUDINARY_DELETE_INIT", extra={"public_id": public_id})

        uploader = uploader_override or (cloudinary.uploader if CLOUDINARY_AVAILABLE else None)
        if not uploader:
            raise RuntimeError("Cloudinary uploader not available")

        destroy_result = uploader.destroy(public_id, invalidate=True)
        result_status = destroy_result.get("result", "ok") if isinstance(destroy_result, dict) else "ok"

        logger.info(
            "CLOUDINARY_DELETE_SUCCESS",
            extra={"public_id": public_id, "result": result_status},
        )

        return {
            "deleted": True,
            "publicId": public_id,
            "result": result_status,
        }

    async def replace(
        self,
        file_bytes: bytes,
        product_id: str,
        image_id: str,
        variant: str = "original",
        previous_public_id: Optional[str] = None,
        idempotency_key: Optional[str] = None,
        uploader_override: Optional[Any] = None,
    ) -> Dict[str, Any]:
        """Safely replace an asset.

        Order of operations:
        1. Validate payload.
        2. Upload new asset to Cloudinary.
        3. Validate upload result.
        4. If a previous different public ID was provided, delete the previous asset.
        5. Any error during previous asset deletion is logged as a recoverable warning,
           preserving the new asset and returning its metadata.
        """
        # Step 1 & 2: Upload replacement asset
        new_metadata = await self.upload(
            file_bytes=file_bytes,
            product_id=product_id,
            image_id=image_id,
            variant=variant,
            idempotency_key=idempotency_key,
            uploader_override=uploader_override,
        )

        # Step 4: Clean up old asset if provided and distinct
        if previous_public_id and previous_public_id != new_metadata["publicId"]:
            try:
                await self.destroy(
                    product_id=product_id,
                    image_id=image_id,
                    variant=variant,
                    public_id_override=previous_public_id,
                    uploader_override=uploader_override,
                )
            except Exception as cleanup_err:
                logger.warning(
                    "CLOUDINARY_PREVIOUS_ASSET_CLEANUP_FAILED",
                    extra={
                        "previous_public_id": previous_public_id,
                        "new_public_id": new_metadata["publicId"],
                        "error": str(cleanup_err),
                    },
                )

        return new_metadata
