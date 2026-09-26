"""Focused tests for Vercel Serverless Function compatibility.

Covers:
1. Authentication & Ownership enforcement across media and enhancement endpoints.
2. Upload authorization (sign-upload) and server-side finalization (verify-upload).
3. Polling across fresh app instances (durable job persistence across isolated function containers).
4. Oversized payload handling (10MB boundary and direct-URL workflow).
5. Durable result retrieval (HTTP 307 redirect to permanent Cloudinary CDN URLs).
"""

import io
import json
import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from PIL import Image
from fastapi.testclient import TestClient

from app.main import app
from app.adapters.storage import DurableJobRepository, DurableImageStorageAdapter
from app.domain.enums import JobState


def create_test_jpeg(size=(100, 100), color="blue") -> bytes:
    """Helper to generate in-memory valid JPEG bytes."""
    buf = io.BytesIO()
    img = Image.new("RGB", size, color=color)
    img.save(buf, format="JPEG")
    return buf.getvalue()


@pytest.fixture
def client():
    return TestClient(app)


# --------------------------------------------------------------------------
# 1. Authentication & Ownership Checks
# --------------------------------------------------------------------------

def test_sign_upload_requires_authentication(client):
    """Verify sign-upload rejects unauthenticated requests with 401."""
    response = client.post(
        "/v1/media/sign-upload",
        json={
            "product_id": "prod_1",
            "image_id": "img_1",
            "owner_id": "artisan_1",
            "variant": "original",
        },
    )
    assert response.status_code == 401
    assert response.json()["detail"]["error_code"] == "AUTHENTICATION_REQUIRED"


def test_sign_upload_rejects_cross_owner(client):
    """Verify sign-upload rejects cross-owner mismatch with 403."""
    response = client.post(
        "/v1/media/sign-upload",
        headers={"Authorization": "Bearer dev-token-artisan_owner"},
        json={
            "product_id": "prod_1",
            "image_id": "img_1",
            "owner_id": "artisan_attacker",
            "variant": "original",
        },
    )
    assert response.status_code == 403
    assert response.json()["detail"]["error_code"] == "OWNERSHIP_MISMATCH"


def test_verify_upload_requires_authentication(client):
    """Verify verify-upload rejects unauthenticated requests with 401."""
    response = client.post(
        "/v1/media/verify-upload",
        json={
            "product_id": "prod_1",
            "image_id": "img_1",
            "owner_id": "artisan_1",
            "variant": "original",
            "public_id": "karigarsaathi/products/prod_1/img_1/original",
        },
    )
    assert response.status_code == 401
    assert response.json()["detail"]["error_code"] == "AUTHENTICATION_REQUIRED"


def test_verify_upload_rejects_cross_owner(client):
    """Verify verify-upload rejects cross-owner mismatch with 403."""
    response = client.post(
        "/v1/media/verify-upload",
        headers={"Authorization": "Bearer dev-token-artisan_owner"},
        json={
            "product_id": "prod_1",
            "image_id": "img_1",
            "owner_id": "artisan_attacker",
            "variant": "original",
            "public_id": "karigarsaathi/products/prod_1/img_1/original",
        },
    )
    assert response.status_code == 403
    assert response.json()["detail"]["error_code"] == "OWNERSHIP_MISMATCH"


# --------------------------------------------------------------------------
# 2. Upload Authorization & Server-Side Finalization
# --------------------------------------------------------------------------

def test_sign_upload_generates_signed_parameters_without_secret_leak(client):
    """Verify sign-upload returns correct parameters and keeps secrets server-side."""
    with patch("app.api.media_routes.get_cloudinary_adapter") as mock_get_adapter:
        mock_adapter = MagicMock()
        mock_adapter.generate_upload_signature.return_value = {
            "cloud_name": "skq4sow9",
            "api_key": "891319182379413",
            "public_id": "karigarsaathi/products/prod_10/img_20/original",
            "timestamp": 1790000000,
            "signature": "mock_signature_hash",
            "upload_url": "https://api.cloudinary.com/v1_1/skq4sow9/image/upload",
        }
        mock_get_adapter.return_value = mock_adapter

        response = client.post(
            "/v1/media/sign-upload",
            headers={"Authorization": "Bearer dev-token-artisan_10"},
            json={
                "product_id": "prod_10",
                "image_id": "img_20",
                "owner_id": "artisan_10",
                "variant": "original",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["cloud_name"] == "skq4sow9"
        assert data["api_key"] == "891319182379413"
        assert data["public_id"] == "karigarsaathi/products/prod_10/img_20/original"
        assert data["signature"] == "mock_signature_hash"
        # Strictly verify no secret is present
        assert "api_secret" not in data
        assert "secret" not in data


def test_verify_upload_checks_server_side_resource(client):
    """Verify verify-upload queries Cloudinary and returns canonical metadata."""
    with patch("app.api.media_routes.get_cloudinary_adapter") as mock_get_adapter:
        mock_adapter = MagicMock()
        mock_adapter.build_public_id.return_value = "karigarsaathi/products/prod_10/img_20/original"
        mock_adapter.verify_asset = AsyncMock(return_value={
            "bytes": 500000,
            "format": "jpg",
            "width": 1200,
            "height": 1200,
            "version": "1790000001",
            "resource_type": "image",
            "secure_url": "https://res.cloudinary.com/skq4sow9/image/upload/v1790000001/karigarsaathi/products/prod_10/img_20/original.jpg",
            "etag": "abcdef123456",
            "created_at": "2026-09-26T00:00:00Z",
        })
        mock_get_adapter.return_value = mock_adapter

        response = client.post(
            "/v1/media/verify-upload",
            headers={"Authorization": "Bearer dev-token-artisan_10"},
            json={
                "product_id": "prod_10",
                "image_id": "img_20",
                "owner_id": "artisan_10",
                "variant": "original",
                "public_id": "karigarsaathi/products/prod_10/img_20/original",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["provider"] == "cloudinary"
        assert data["publicId"] == "karigarsaathi/products/prod_10/img_20/original"
        assert data["width"] == 1200
        assert data["height"] == 1200
        assert data["format"] == "jpg"
        assert data["bytes"] == 500000
        assert data["secureUrl"].startswith("https://res.cloudinary.com/")


def test_verify_upload_rejects_tampered_public_id(client):
    """Verify verify-upload rejects a public ID that doesn't match the expected product/image path."""
    with patch("app.api.media_routes.get_cloudinary_adapter") as mock_get_adapter:
        mock_adapter = MagicMock()
        mock_adapter.build_public_id.return_value = "karigarsaathi/products/prod_10/img_20/original"
        mock_get_adapter.return_value = mock_adapter

        response = client.post(
            "/v1/media/verify-upload",
            headers={"Authorization": "Bearer dev-token-artisan_10"},
            json={
                "product_id": "prod_10",
                "image_id": "img_20",
                "owner_id": "artisan_10",
                "variant": "original",
                "public_id": "karigarsaathi/products/other_prod/other_img/original",
            },
        )
        assert response.status_code == 400
        assert response.json()["detail"]["error_code"] == "INVALID_PUBLIC_ID"


# --------------------------------------------------------------------------
# 3. Polling Across Fresh Function Instances
# --------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_durable_job_repository_cross_instance_polling(tmp_path):
    """Simulate Instance A creating a job, and Instance B polling it with a cold in-memory cache."""
    shared_jobs_dir = str(tmp_path / "shared_jobs")

    # Instance A: creates and updates job
    instance_a_repo = DurableJobRepository(jobs_dir=shared_jobs_dir)
    await instance_a_repo.create_job(
        job_id="job_cross_instance_123",
        artisan_id="artisan_77",
        product_id="prod_88",
        request_id="req_99",
        status=JobState.PROCESSING,
    )
    await instance_a_repo.update_job(
        job_id="job_cross_instance_123",
        status=JobState.SUCCEEDED,
        enhanced_image_reference="https://res.cloudinary.com/skq4sow9/image/upload/v1/enhanced.png",
        metrics={"psnr": 35.5},
    )

    # Instance B: completely separate instance with empty memory cache
    instance_b_repo = DurableJobRepository(jobs_dir=shared_jobs_dir)
    assert len(instance_b_repo._jobs) == 0  # In-memory cache is empty

    # Instance B polls the job
    retrieved_job = await instance_b_repo.get_job("job_cross_instance_123")
    assert retrieved_job is not None
    assert retrieved_job["job_id"] == "job_cross_instance_123"
    assert retrieved_job["status"] == "succeeded"
    assert retrieved_job["enhanced_image_reference"] == "https://res.cloudinary.com/skq4sow9/image/upload/v1/enhanced.png"
    assert retrieved_job["metrics"]["psnr"] == 35.5


# --------------------------------------------------------------------------
# 4. Oversized Payload Handling & Direct-URL Workflow
# --------------------------------------------------------------------------

def test_enhancement_rejects_oversized_direct_upload(client):
    """Verify that uploading >10MB directly to /v1/enhancements raises IMAGE_TOO_LARGE."""
    oversized_bytes = b"\xff\xd8\xff" + b"0" * (10 * 1024 * 1024 + 1024)

    response = client.post(
        "/v1/enhancements",
        headers={"Authorization": "Bearer dev-token-artisan_1"},
        data={
            "consent_granted": "true",
            "request_id": "req_oversized",
            "product_id": "prod_1",
            "artisan_id": "artisan_1",
        },
        files={"image": ("large.jpg", oversized_bytes, "image/jpeg")},
    )
    assert response.status_code == 400
    assert response.json()["detail"]["error_code"] == "IMAGE_TOO_LARGE"


def test_enhancement_accepts_durable_image_url(client):
    """Verify that /v1/enhancements accepts an image_url (<1KB request body) for direct-uploaded photos."""
    valid_jpeg = create_test_jpeg((300, 300), color="green")

    with patch("urllib.request.urlopen") as mock_urlopen:
        mock_resp = MagicMock()
        mock_resp.read.return_value = valid_jpeg
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        response = client.post(
            "/v1/enhancements",
            headers={"Authorization": "Bearer dev-token-artisan_url"},
            data={
                "consent_granted": "true",
                "request_id": "req_via_url",
                "product_id": "prod_url",
                "artisan_id": "artisan_url",
                "image_url": "https://res.cloudinary.com/skq4sow9/image/upload/v1/original.jpg",
                "operations": json.dumps(["lighting_correction", "standard_resize"]),
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["request_id"] == "req_via_url"
        assert data["product_id"] == "prod_url"
        assert data["artisan_id"] == "artisan_url"
        assert data["status"] in ("succeeded", "succeeded_with_warnings")


# --------------------------------------------------------------------------
# 5. Durable Result Retrieval (Redirect to CDN)
# --------------------------------------------------------------------------

def test_enhanced_image_retrieval_redirects_to_durable_url(client):
    """Verify GET /v1/enhancements/{job_id}/enhanced redirects (HTTP 307) to permanent Cloudinary URL."""
    with patch("app.api.routes.job_repository.get_job") as mock_get_job:
        mock_get_job.return_value = {
            "job_id": "job_durable_cdn",
            "enhanced_image_reference": "https://res.cloudinary.com/skq4sow9/image/upload/v12345/enhanced.png",
        }

        response = client.get("/v1/enhancements/job_durable_cdn/enhanced", follow_redirects=False)
        assert response.status_code == 307
        assert response.headers["location"] == "https://res.cloudinary.com/skq4sow9/image/upload/v12345/enhanced.png"
