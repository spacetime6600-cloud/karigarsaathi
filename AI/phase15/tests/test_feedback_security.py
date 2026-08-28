"""Security and isolated feedback storage tests for Phase 15."""
import pytest
from httpx import ASGITransport, AsyncClient

from backend.app.security import create_access_token
from backend.main import app


@pytest.mark.asyncio
async def test_feedback_submission_with_jwt_auth():
    """Verify feedback capture derives owner UID from Bearer JWT and persists safely."""
    test_artisan_uid = "artisan_verified_9988"
    token = create_access_token({"sub": test_artisan_uid, "role": "artisan"})

    payload = {
        "suggested_price": 540.0,
        "artisan_selected_price": 550.0,
        "decision": "edited",
        "cost_floor": 450.0,
        "reason": "Rounded up to clean ₹550 for boutique exhibition",
        "calculation_summary": "Synthetic Silk Saree",
    }

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/v1/pricing/feedback",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "recorded"
        assert data["owner_uid"] == test_artisan_uid
        assert data["feedback_id"].startswith("fb_")


@pytest.mark.asyncio
async def test_feedback_submission_dev_header_fallback():
    """Verify fallback behavior in development environment."""
    payload = {
        "suggested_price": 540.0,
        "artisan_selected_price": 495.0,
        "decision": "accepted",
        "cost_floor": 450.0,
    }

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/v1/pricing/feedback",
            json=payload,
            headers={"X-Artisan-Uid": "artisan_dev_123"},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "recorded"
        assert "artisan_dev_123" in data["owner_uid"]
