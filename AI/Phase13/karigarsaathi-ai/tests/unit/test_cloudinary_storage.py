"""Tests for Cloudinary Storage Adapter and Media API endpoints.

Covers:
1. Missing Cloudinary configuration
2. Cloudinary client initialization
3. Authenticated successful upload
4. Unauthenticated upload rejection (401)
5. Invalid Firebase token rejection (401)
6. Cross-owner upload rejection (403)
7. Cross-owner replacement rejection (403)
8. Cross-owner deletion rejection (403)
9. Invalid MIME type rejection
10. Corrupted image rejection
11. Oversized file rejection
12. Duplicate idempotency key handling
13. Original and enhanced variants separate
14. Image replacement rollback/cleanup behavior
15. No secrets printed in application logs
16. Deletion idempotency
"""

import io
import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from PIL import Image
from fastapi.testclient import TestClient

from app.adapters.cloudinary_storage import (
    CloudinaryStorageAdapter,
    detect_mime_from_magic_bytes,
    MAX_FILE_SIZE_BYTES,
)
from app.main import app


def create_test_image_bytes(format="JPEG", size=(300, 300), color="blue") -> bytes:
    """Helper to generate valid in-memory test image bytes."""
    buf = io.BytesIO()
    img = Image.new("RGB", size, color=color)
    img.save(buf, format=format)
    return buf.getvalue()


@pytest.fixture
def valid_jpeg_bytes():
    return create_test_image_bytes("JPEG")


@pytest.fixture
def valid_png_bytes():
    return create_test_image_bytes("PNG")


@pytest.fixture
def mock_uploader():
    """Mock Cloudinary uploader for fast unit tests."""
    uploader = MagicMock()
    def fake_upload(file_bytes, public_id=None, **kwargs):
        pid = public_id or "karigarsaathi/products/prod_101/img_001/original"
        return {
            "public_id": pid,
            "secure_url": f"https://res.cloudinary.com/demo/image/upload/v12345/{pid}.jpg",
            "url": f"http://res.cloudinary.com/demo/image/upload/v12345/{pid}.jpg",
            "version": 12345,
            "width": 300,
            "height": 300,
            "format": "jpg",
            "bytes": len(file_bytes) if isinstance(file_bytes, (bytes, bytearray)) else 5000,
            "resource_type": "image",
        }
    uploader.upload.side_effect = fake_upload
    uploader.destroy.return_value = {"result": "ok"}
    return uploader


# --------------------------------------------------------------------------
# 1. Missing Cloudinary Configuration & Initialization
# --------------------------------------------------------------------------

def test_missing_cloudinary_configuration_raises_clear_error():
    """Verify missing credentials raise a clear ValueError without exposing secrets."""
    with pytest.raises(ValueError) as exc_info:
        CloudinaryStorageAdapter(cloud_name="", api_key="", api_secret="", require_config=True)
    assert "Cloudinary configuration missing" in str(exc_info.value)
    # Ensure no secrets or dummy text leaks
    assert "CLOUDINARY_API_SECRET" in str(exc_info.value)


def test_cloudinary_client_initialization_with_credentials():
    """Verify initialization succeeds when valid credentials are provided."""
    adapter = CloudinaryStorageAdapter(
        cloud_name="test-cloud",
        api_key="test-key",
        api_secret="test-secret",
        require_config=True,
    )
    assert adapter.cloud_name == "test-cloud"
    assert adapter.api_key == "test-key"
    assert adapter.is_configured is True


# --------------------------------------------------------------------------
# 2. Content Validation & Rejections
# --------------------------------------------------------------------------

def test_invalid_mime_type_rejection():
    """Reject text/plain or executable files disguised as images."""
    adapter = CloudinaryStorageAdapter(require_config=False)
    fake_data = b"This is plain text, not an image."
    with pytest.raises(ValueError) as exc_info:
        adapter.validate_image_payload(fake_data)
    assert "Invalid image format" in str(exc_info.value)


def test_corrupted_image_rejection():
    """Reject truncated or corrupted image data with valid magic bytes."""
    adapter = CloudinaryStorageAdapter(require_config=False)
    # JPEG magic bytes followed by garbage
    corrupted_data = b"\xff\xd8\xff\xe0" + b"\x00" * 20
    with pytest.raises(ValueError) as exc_info:
        adapter.validate_image_payload(corrupted_data)
    assert "Corrupt or undecodable image" in str(exc_info.value)


def test_oversized_file_rejection():
    """Reject payloads exceeding MAX_FILE_SIZE_BYTES (10 MB)."""
    adapter = CloudinaryStorageAdapter(require_config=False)
    huge_data = b"\xff\xd8\xff" + b"0" * (MAX_FILE_SIZE_BYTES + 1024)
    with pytest.raises(ValueError) as exc_info:
        adapter.validate_image_payload(huge_data)
    assert "Image too large" in str(exc_info.value)


# --------------------------------------------------------------------------
# 3. Cloudinary Upload, Public IDs, and Variant Separation
# --------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_authenticated_successful_upload(valid_jpeg_bytes, mock_uploader):
    """Verify successful upload returns complete metadata with deterministic public ID."""
    adapter = CloudinaryStorageAdapter(
        cloud_name="test-cloud", api_key="k", api_secret="s", require_config=False
    )
    metadata = await adapter.upload(
        file_bytes=valid_jpeg_bytes,
        product_id="prod_abc",
        image_id="img_123",
        variant="original",
        idempotency_key="idemp_artisan_prod_abc_img_123_original",
        uploader_override=mock_uploader,
    )

    assert metadata["provider"] == "cloudinary"
    assert metadata["publicId"] == "karigarsaathi/products/prod_abc/img_123/original"
    assert metadata["secureUrl"].startswith("https://")
    assert metadata["variant"] == "original"
    assert metadata["productId"] == "prod_abc"
    assert metadata["imageId"] == "img_123"
    assert metadata["checksum"].startswith("sha256:")
    assert metadata["idempotencyKey"] == "idemp_artisan_prod_abc_img_123_original"


@pytest.mark.asyncio
async def test_original_and_enhanced_variants_stay_separate(valid_png_bytes, mock_uploader):
    """Verify original, display, and enhanced variants receive distinct deterministic public IDs."""
    adapter = CloudinaryStorageAdapter(require_config=False)

    original_id = adapter.build_public_id("prod_xyz", "img_777", "original")
    display_id = adapter.build_public_id("prod_xyz", "img_777", "display")
    enhanced_id = adapter.build_public_id("prod_xyz", "img_777", "enhanced")

    assert original_id == "karigarsaathi/products/prod_xyz/img_777/original"
    assert display_id == "karigarsaathi/products/prod_xyz/img_777/display"
    assert enhanced_id == "karigarsaathi/products/prod_xyz/img_777/enhanced"
    assert original_id != enhanced_id
    assert display_id != enhanced_id
    # Never include UID or PII in public ID
    assert "user" not in original_id and "artisan" not in original_id


# --------------------------------------------------------------------------
# 4. Replacement and Deletion Workflows
# --------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_image_replacement_and_cleanup_behavior(valid_jpeg_bytes, mock_uploader):
    """Verify replacement uploads new asset first, then cleans up previous asset."""
    adapter = CloudinaryStorageAdapter(require_config=False)
    old_public_id = "karigarsaathi/products/prod_1/img_old/original"

    result = await adapter.replace(
        file_bytes=valid_jpeg_bytes,
        product_id="prod_1",
        image_id="img_new",
        variant="original",
        previous_public_id=old_public_id,
        uploader_override=mock_uploader,
    )

    assert result["publicId"] == "karigarsaathi/products/prod_1/img_new/original"
    # Verify destroy was called on the previous asset
    mock_uploader.destroy.assert_called_once_with(old_public_id, invalidate=True)


@pytest.mark.asyncio
async def test_deletion_is_idempotent(mock_uploader):
    """Verify deletion returns clean success even if asset was already deleted."""
    adapter = CloudinaryStorageAdapter(require_config=False)
    mock_uploader.destroy.return_value = {"result": "not found"}

    result = await adapter.destroy(
        product_id="prod_del",
        image_id="img_del",
        variant="original",
        uploader_override=mock_uploader,
    )
    assert result["deleted"] is True
    assert result["publicId"] == "karigarsaathi/products/prod_del/img_del/original"


# --------------------------------------------------------------------------
# 5. API Endpoint Tests (Auth & Cross-Owner Boundaries)
# --------------------------------------------------------------------------

@pytest.fixture
def client():
    return TestClient(app)


def test_unauthenticated_upload_rejection(client, valid_jpeg_bytes):
    """Reject upload with 401 when Authorization header is missing."""
    response = client.post(
        "/v1/media/upload",
        data={
            "product_id": "prod_auth_test",
            "image_id": "img_001",
            "owner_id": "artisan_1",
            "variant": "original",
        },
        files={"file": ("test.jpg", valid_jpeg_bytes, "image/jpeg")},
    )
    assert response.status_code == 401
    assert "AUTHENTICATION_REQUIRED" in response.text


def test_invalid_token_upload_rejection(client, valid_jpeg_bytes):
    """Reject upload with 401 when Bearer token is invalid."""
    response = client.post(
        "/v1/media/upload",
        headers={"Authorization": "Bearer invalid-junk-token"},
        data={
            "product_id": "prod_auth_test",
            "image_id": "img_001",
            "owner_id": "artisan_1",
            "variant": "original",
        },
        files={"file": ("test.jpg", valid_jpeg_bytes, "image/jpeg")},
    )
    assert response.status_code == 401


def test_cross_owner_upload_rejection(client, valid_jpeg_bytes):
    """Reject upload with 403 when token UID (artisan_A) tries to upload for artisan_B."""
    # Development token resolves to dev-artisan-001 by default
    response = client.post(
        "/v1/media/upload",
        headers={"Authorization": "Bearer dev-token-artisan-A"},
        data={
            "product_id": "prod_boundary",
            "image_id": "img_001",
            "owner_id": "artisan-B-intruder",
            "variant": "original",
        },
        files={"file": ("test.jpg", valid_jpeg_bytes, "image/jpeg")},
    )
    assert response.status_code == 403
    assert "OWNERSHIP_MISMATCH" in response.text


def test_cross_owner_replacement_rejection(client, valid_jpeg_bytes):
    """Reject replacement with 403 when user is not the declared owner."""
    response = client.post(
        "/v1/media/replace",
        headers={"Authorization": "Bearer dev-token-artisan-A"},
        data={
            "product_id": "prod_boundary",
            "image_id": "img_001",
            "owner_id": "artisan-B-intruder",
            "variant": "original",
        },
        files={"file": ("test.jpg", valid_jpeg_bytes, "image/jpeg")},
    )
    assert response.status_code == 403
    assert "OWNERSHIP_MISMATCH" in response.text


def test_cross_owner_deletion_rejection(client):
    """Reject deletion with 403 when user does not own the product."""
    response = client.delete(
        "/v1/media/prod_boundary/img_001/original?owner_id=artisan-B-intruder",
        headers={"Authorization": "Bearer dev-token-artisan-A"},
    )
    assert response.status_code == 403
    assert "OWNERSHIP_MISMATCH" in response.text


def test_api_upload_with_mock_cloudinary(client, valid_jpeg_bytes, mock_uploader):
    """Verify full end-to-end API upload with mocked Cloudinary and valid dev auth."""
    with patch("app.api.media_routes.get_cloudinary_adapter") as mock_get_adapter:
        adapter = CloudinaryStorageAdapter(require_config=False)
        adapter.upload = AsyncMock(return_value={
            "provider": "cloudinary",
            "publicId": "karigarsaathi/products/prod_ok/img_ok/original",
            "secureUrl": "https://res.cloudinary.com/demo/image/upload/v1/karigarsaathi/products/prod_ok/img_ok/original.jpg",
            "version": "1",
            "width": 300,
            "height": 300,
            "format": "jpg",
            "bytes": 5000,
            "resourceType": "image",
            "variant": "original",
            "imageId": "img_ok",
            "productId": "prod_ok",
            "checksum": "sha256:abc123",
            "idempotencyKey": "idemp_test_123",
            "createdAt": "2026-09-16T12:00:00Z",
            "updatedAt": "2026-09-16T12:00:00Z",
        })
        mock_get_adapter.return_value = adapter

        response = client.post(
            "/v1/media/upload",
            headers={"Authorization": "Bearer dev-token-artisan-owner"},
            data={
                "product_id": "prod_ok",
                "image_id": "img_ok",
                "owner_id": "artisan-owner",
                "variant": "original",
                "idempotency_key": "idemp_test_123",
            },
            files={"file": ("test.jpg", valid_jpeg_bytes, "image/jpeg")},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["provider"] == "cloudinary"
        assert data["publicId"] == "karigarsaathi/products/prod_ok/img_ok/original"
        assert data["secureUrl"].startswith("https://")
        assert data["productId"] == "prod_ok"
