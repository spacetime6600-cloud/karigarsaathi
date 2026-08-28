"""Validation and error handling tests for Phase 15 Pricing Engine."""
from decimal import Decimal
import pytest

from backend.app.pricing_engine import (
    LabourInput,
    MarkupScenarioInput,
    MaterialInput,
    OverheadInput,
    PricingInput,
    calculate_price,
)
from backend.app.pricing_engine.enums import MarginMode
from backend.app.pricing_engine.exceptions import (
    InvalidCostError,
    InvalidHoursError,
    InvalidQuantityError,
    InvalidRateError,
    InvalidScenarioOrderError,
    UnsupportedCurrencyError,
)


def test_reject_negative_material_quantity():
    """Verify rejection of negative material quantity."""
    materials = (
        MaterialInput(name="Silk", quantity=Decimal("-2"), unit="m", cost_per_unit=Decimal("100")),
    )
    req = PricingInput(
        materials=materials,
        labour=(),
        overhead=(),
        packaging=(),
        margin_mode=MarginMode.PERCENTAGE_MARKUP,
        margin_value=Decimal("20"),
    )
    with pytest.raises(InvalidQuantityError):
        calculate_price(req)


def test_reject_negative_labour_hours():
    """Verify rejection of negative labour hours."""
    labour = (
        LabourInput(task_name="Weaving", hours=Decimal("-5"), hourly_rate=Decimal("100"), rate_source="Guild"),
    )
    req = PricingInput(
        materials=(),
        labour=labour,
        overhead=(),
        packaging=(),
        margin_mode=MarginMode.PERCENTAGE_MARKUP,
        margin_value=Decimal("20"),
    )
    with pytest.raises(InvalidHoursError):
        calculate_price(req)


def test_reject_negative_hourly_wage_rate():
    """Verify rejection of negative wage rate."""
    labour = (
        LabourInput(task_name="Weaving", hours=Decimal("5"), hourly_rate=Decimal("-100"), rate_source="Guild"),
    )
    req = PricingInput(
        materials=(),
        labour=labour,
        overhead=(),
        packaging=(),
        margin_mode=MarginMode.PERCENTAGE_MARKUP,
        margin_value=Decimal("20"),
    )
    with pytest.raises(InvalidRateError):
        calculate_price(req)


def test_reject_contradictory_scenario_ordering():
    """Verify rejection when Low markup exceeds Base markup."""
    materials = (
        MaterialInput(name="Clay", quantity=Decimal("1"), unit="kg", cost_per_unit=Decimal("50")),
    )
    scenarios = (
        MarkupScenarioInput(name="low", markup_percentage=Decimal("35")),   # 35% > 20%
        MarkupScenarioInput(name="base", markup_percentage=Decimal("20")),
        MarkupScenarioInput(name="high", markup_percentage=Decimal("50")),
    )
    req = PricingInput(
        materials=materials,
        labour=(),
        overhead=(),
        packaging=(),
        margin_mode=MarginMode.PERCENTAGE_MARKUP,
        margin_value=Decimal("20"),
        scenarios=scenarios,
    )
    with pytest.raises(InvalidScenarioOrderError):
        calculate_price(req)


def test_reject_unsupported_currency():
    """Verify rejection of unsupported non-INR currencies."""
    materials = (
        MaterialInput(name="Clay", quantity=Decimal("1"), unit="kg", cost_per_unit=Decimal("50")),
    )
    req = PricingInput(
        materials=materials,
        labour=(),
        overhead=(),
        packaging=(),
        currency="USD",  # Unsupported
        margin_mode=MarginMode.PERCENTAGE_MARKUP,
        margin_value=Decimal("20"),
    )
    with pytest.raises(UnsupportedCurrencyError):
        calculate_price(req)


def test_zero_versus_missing_inputs():
    """Verify that explicitly entered zero costs are distinguished from missing costs."""
    materials = (
        MaterialInput(name="Upcycled Fabric Scraps", quantity=Decimal("1"), unit="kg", cost_per_unit=Decimal("0")),
    )
    labour = (
        LabourInput(task_name="Family volunteer stitching", hours=Decimal("2"), hourly_rate=Decimal("0"), rate_source="Voluntary"),
    )

    req = PricingInput(
        materials=materials,
        labour=labour,
        overhead=(),
        packaging=(),
        margin_mode=MarginMode.PERCENTAGE_MARKUP,
        margin_value=Decimal("20"),
    )

    res = calculate_price(req)
    assert res.cost_floor == Decimal("0")
    # Explanations must transparently note the zero entries
    assert any("₹0.00" in a for a in res.assumptions)
