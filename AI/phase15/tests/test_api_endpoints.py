"""API Integration tests for Phase 15 Explainable Fair Price Assistant endpoints."""
import pytest
from httpx import ASGITransport, AsyncClient

from backend.main import app


@pytest.mark.asyncio
async def test_health_endpoint():
    """Verify GET /health returns ready status and port 8002 metadata."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "ok"
        assert data["service"] == "karigarSaathi-phase15"
        assert data["port"] == 8002
        assert data["pricing_rules_ready"] is True


@pytest.mark.asyncio
async def test_estimate_endpoint_synthetic_fixture():
    """Verify POST /api/v1/pricing/estimate with synthetic fixture payload."""
    payload = {
        "materials": [
            {"name": "Mulberry Raw Silk", "quantity": 1, "unit": "piece", "cost_per_unit": 200}
        ],
        "labour": [
            {"task_name": "Hand-weaving", "hours": 2, "hourly_rate": 100, "rate_source": "Guild Card 2026"}
        ],
        "overhead": [
            {"name": "Workshop lighting", "amount": 50, "explanation": "Allocated light & maintenance"}
        ],
        "packaging": [
            {"name": "Basic Wrap", "cost_per_unit": 0, "explanation": "Standard wrapper"}
        ],
        "margin_mode": "percentage_markup",
        "margin_value": 20,
        "scenarios": [
            {"name": "low", "markup_percentage": 10, "label": "Low (10%)"},
            {"name": "base", "markup_percentage": 20, "label": "Base (20%)"},
            {"name": "high", "markup_percentage": 30, "label": "High (30%)"},
        ],
        "currency": "INR",
        "locale": "en",
    }

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post("/api/v1/pricing/estimate", json=payload)
        assert res.status_code == 200
        data = res.json()

        assert data["cost_floor"] == 450.0
        assert data["total_material_cost"] == 200.0
        assert data["total_labour_cost"] == 200.0
        assert data["total_overhead"] == 50.0
        assert data["cost_based_base_price"] == 540.0
        assert data["suggested_base_price"] == 540.0

        sc_map = {s["name"]: s for s in data["scenarios"]}
        assert sc_map["low"]["resulting_price_rounded"] == 495.0
        assert sc_map["base"]["resulting_price_rounded"] == 540.0
        assert sc_map["high"]["resulting_price_rounded"] == 585.0


@pytest.mark.asyncio
async def test_validate_endpoint():
    """Verify POST /api/v1/pricing/validate endpoint."""
    valid_payload = {
        "materials": [{"name": "Clay", "quantity": 1, "unit": "kg", "cost_per_unit": 50}],
        "labour": [{"task_name": "Throwing", "hours": 1, "hourly_rate": 100, "rate_source": "Guild"}],
        "overhead": [],
        "packaging": [],
        "margin_mode": "percentage_markup",
        "margin_value": 20,
    }

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post("/api/v1/pricing/validate", json=valid_payload)
        assert res.status_code == 200
        data = res.json()
        assert data["valid"] is True
        assert len(data["errors"]) == 0
