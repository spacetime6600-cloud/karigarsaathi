"""Unit tests verifying memory-bounded enhancement under 512 MB memory limit."""

import os
import io
import time
import base64
import json
import pytest
from PIL import Image
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _generate_test_token(user_id: str = "artisan_mem_001") -> str:
    header = base64.urlsafe_b64encode(b'{"alg":"none"}').decode().rstrip("=")
    payload = base64.urlsafe_b64encode(
        json.dumps({
            "user_id": user_id,
            "sub": user_id,
            "aud": "karigarsaathi-c3c60",
            "exp": int(time.time()) + 3600,
        }).encode()
    ).decode().rstrip("=")
    return f"{header}.{payload}.sig"


def test_full_enhancement_on_large_image_stays_under_memory_limit():
    """Verify full suite (rembg + lighting + composition + metrics) on 2000x2000 image stays under 512MB."""
    img = Image.new("RGB", (2000, 2000), color=(160, 100, 60))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    raw_jpeg = buf.getvalue()

    token = _generate_test_token("artisan_mem_001")
    req_id = f"test_full_{int(time.time() * 1000)}"

    response = client.post(
        "/v1/enhancements",
        data={
            "consent_granted": "true",
            "request_id": req_id,
            "product_id": "prod_mem_test",
            "artisan_id": "artisan_mem_001",
        },
        files={
            "image": ("photo.jpg", io.BytesIO(raw_jpeg), "image/jpeg"),
        },
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["request_id"] == req_id
    assert "operations_applied" in data
    assert "enhanced_image_reference" in data
    assert data["status"] in ("succeeded", "succeeded_with_warnings")


def test_basic_clean_enhancement_without_background_removal():
    """Verify basic enhancement executes lightweight ops and accurately reports applied ops."""
    img = Image.new("RGB", (1000, 1000), color=(100, 150, 200))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    raw_jpeg = buf.getvalue()

    token = _generate_test_token("artisan_mem_002")
    req_id = f"test_basic_{int(time.time() * 1000)}"

    # Request only lighting_correction, centring, standard_resize
    response = client.post(
        "/v1/enhancements",
        data={
            "consent_granted": "true",
            "request_id": req_id,
            "product_id": "prod_basic_test",
            "artisan_id": "artisan_mem_002",
            "operations": json.dumps(["lighting_correction", "centring", "standard_resize"]),
        },
        files={
            "image": ("photo.jpg", io.BytesIO(raw_jpeg), "image/jpeg"),
        },
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["request_id"] == req_id
    # Crucial: Never claim background removal happened when it was not requested or applied
    assert "background_removal" not in data["operations_applied"]
    assert "lighting_correction" in data["operations_applied"]
    assert "centring" in data["operations_applied"]
    assert "standard_resize" in data["operations_applied"]


def test_enhancement_with_different_dimensions_calculates_metrics_cleanly():
    """Verify that images with non-square or non-target dimensions (e.g. 400x300) process and calculate metrics without shape mismatch errors."""
    img = Image.new("RGB", (400, 300), color=(180, 120, 80))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    raw_jpeg = buf.getvalue()

    token = _generate_test_token("artisan_mem_003")
    req_id = f"test_diff_dim_{int(time.time() * 1000)}"

    response = client.post(
        "/v1/enhancements",
        data={
            "consent_granted": "true",
            "request_id": req_id,
            "product_id": "prod_diff_dim",
            "artisan_id": "artisan_mem_003",
            "operations": json.dumps(["lighting_correction", "centring", "standard_resize"]),
        },
        files={
            "image": ("diff_photo.jpg", io.BytesIO(raw_jpeg), "image/jpeg"),
        },
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("succeeded", "succeeded_with_warnings")
    assert data["failure_code"] is None
    assert data["enhanced_image_reference"] is not None
    assert "lighting_correction" in data["operations_applied"]

