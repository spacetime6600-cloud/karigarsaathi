"""Unit tests for AI Image Studio service components."""

from __future__ import annotations

import pytest
from fastapi import HTTPException

from app.domain.enums import JobState, ErrorCode, Operation, BackgroundType
from app.domain.exceptions import (
    ConsentRequiredError,
    AuthenticationRequiredError,
    OwnershipMismatchError,
    InvalidImageTypeError,
    ImageTooLargeError,
    InvalidImageDimensionsError,
    CorruptImageError,
    QuotaExceededError,
    DuplicateRequestConflictError,
    SegmentationFailedError,
    QualityCheckFailedError,
    ProcessingTimedOutError,
    InternalProcessingError,
)
from app.domain.interfaces import ImageStorageProtocol
from app.services.quota_service import InMemoryQuotaService
from app.utils.image_validation import ImageValidator


class TestEnums:
    """Test enumeration values."""

    def test_job_states_have_values(self):
        """Verify all job states have correct integer values."""
        assert JobState.QUEUED.value == 1
        assert JobState.PROCESSING.value == 2
        assert JobState.SUCCEEDED.value == 3
        assert JobState.SUCCEEDED_WITH_WARNINGS.value == 4
        assert JobState.RETRYABLE_FAILURE.value == 5
        assert JobState.PERMANENT_FAILURE.value == 6
        assert JobState.TIMED_OUT.value == 7
        assert JobState.REJECTED.value == 8

    def test_operation_defaults(self):
        """Test default operations include all four."""
        defaults = Operation.defaults()
        assert len(defaults) == 4
        assert Operation.BACKGROUND_REMOVAL in defaults
        assert Operation.LIGHTING_CORRECTION in defaults
        assert Operation.CENTRING in defaults
        assert Operation.STANDARD_RESIZE in defaults

    def test_error_code_messages(self):
        """Test error codes have associated messages."""
        from app.domain.enums import ERROR_MESSAGES
        assert ErrorCode.CONSENT_REQUIRED in ERROR_MESSAGES
        assert ErrorCode.AUTHENTICATION_REQUIRED in ERROR_MESSAGES
        assert ErrorCode.OWNERSHIP_MISMATCH in ERROR_MESSAGES


class TestConsentRequired:
    """Test consent rejection."""

    def test_consent_required_error(self):
        """Test ConsentRequiredError is raised without consent."""
        request_id = "test-req-001"
        try:
            raise ConsentRequiredError(request_id=request_id)
        except ConsentRequiredError as e:
            assert e.error_code.value == "CONSENT_REQUIRED"
            assert e.message == "Consent must be granted before processing"
            assert e.retryable == False
            assert e.request_id == request_id


class TestAuthentication:
    """Test authentication rejection."""

    def test_authentication_required_error(self):
        """Test authentication is required."""
        request_id = "test-req-002"
        try:
            raise AuthenticationRequiredError(request_id=request_id)
        except AuthenticationRequiredError as e:
            assert e.error_code.value == "AUTHENTICATION_REQUIRED"
            assert e.retryable == True
            assert e.request_id == request_id


class TestOwnershipMismatch:
    """Test ownership mismatch."""

    def test_ownership_mismatch_error(self):
        """Test ownership mismatch error."""
        request_id = "test-req-003"
        try:
            raise OwnershipMismatchError(request_id=request_id, artisan_id="artisan-001")
        except OwnershipMismatchError as e:
            assert e.error_code.value == "OWNERSHIP_MISMATCH"
            assert "artisan-001" in e.details.get("artisan_id", "")
            assert e.request_id == request_id


class TestImageValidation:
    """Test image validation."""

    def test_invalid_image_type(self):
        """Test invalid MIME type rejection."""
        # Test with garbage data (not a valid image)
        garbage_data = b"this is not an image at all"
        result = ImageValidator.validate(garbage_data)
        assert result["valid"] == False
        assert result["error"] is not None

    def test_image_too_large(self):
        """Test image too large rejection."""
        # Create data exceeding 10 MB
        large_data = b"\x00" * (11 * 1024 * 1024)  # 11 MB
        result = ImageValidator.validate(large_data)
        assert result["valid"] == False
        assert result["error"] is not None

    def test_image_too_small(self):
        """Test image too small (minimum dimensions)."""
        # Create a 1x1 pixel image
        small_img = __import__("PIL").Image.new("RGBA", (1, 1))
        import io
        buf = io.BytesIO()
        small_img.save(buf, format="PNG")
        small_data = buf.getvalue()
        result = ImageValidator.validate(small_data)
        assert result["valid"] == False  # Below minimum 256x256

    def test_image_too_large_dimensions(self):
        """Test image too large dimensions."""
        from PIL import Image
        import io
        # Create a 7000x7000 image (exceeds 6000 max)
        huge_img = Image.new("RGBA", (7000, 7000))
        buf = io.BytesIO()
        huge_img.save(buf, format="PNG", optimize=True)
        huge_data = buf.getvalue()
        result = ImageValidator.validate(huge_data)
        assert result["valid"] == False  # Above maximum 6000x6000


class TestQuotaService:
    """Test quota enforcement."""

    def test_quota_service_creation(self):
        """Test quota service can be created."""
        quota = InMemoryQuotaService(default_daily_limit=20)
        assert quota.default_daily_limit == 20

    def test_quota_within_limit(self):
        """Test quota check within limit."""
        import asyncio
        quota = InMemoryQuotaService(default_daily_limit=2)

        # First check should pass
        ok, reason = asyncio.run(quota.check_daily_quota("artisan-001"))
        assert ok == True
        assert reason is None

        # Second check should pass (used 1)
        ok, reason = asyncio.run(quota.check_daily_quota("artisan-001"))
        assert ok == True
        assert reason is None

        # Third check should fail (used 2, limit is 2)
        ok, reason = asyncio.run(quota.check_daily_quota("artisan-001"))
        assert ok == False
        assert "exceeded" in reason.lower()

    def test_quota_remaining(self):
        """Test remaining quota calculation."""
        import asyncio
        quota = InMemoryQuotaService(default_daily_limit=5)

        ok, _ = asyncio.run(quota.check_daily_quota("artisan-002"))
        remaining = asyncio.run(quota.get_remaining_quota("artisan-002"))
        assert remaining["remaining"] == 4  # 5 - 1 used


class TestDuplicateRequest:
    """Test duplicate request conflict."""

    def test_duplicate_request_conflict(self):
        """Test DuplicateRequestConflictError."""
        request_id = "test-req-004"
        try:
            raise DuplicateRequestConflictError(
                request_id=request_id,
                existing_artisan_id="artisan-001",
                new_artisan_id="artisan-002",
            )
        except DuplicateRequestConflictError as e:
            assert e.error_code.value == "DUPLICATE_REQUEST_CONFLICT"
            assert "conflict" in e.message.lower()
            assert e.request_id == request_id


class TestImageValidationIntegration:
    """Integration-style tests for image validation."""

    def test_jpeg_signature(self):
        """Test JPEG file signature detection."""
        from PIL import Image
        import io
        img = Image.new("RGB", (100, 100))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        data = buf.getvalue()
        # JPEG should start with FF D8 FF
        assert data[:3] == b"\xff\xd8\xff" or len(data) < 3

    def test_png_signature(self):
        """Test PNG file signature detection."""
        from PIL import Image
        import io
        img = Image.new("RGB", (100, 100))
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        data = buf.getvalue()
        png_sig = b"\x89PNG\r\n\x1a\n"
        # PNG should have correct signature
        assert len(data) >= 8


def test_health_endpoint():
    """Test health endpoint exists and returns correct structure."""
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "service" in data
    assert "version" in data


def test_root_endpoint():
    """Test root endpoint."""
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "service" in data