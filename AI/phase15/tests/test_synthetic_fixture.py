"""Synthetic Calculation Fixture Test for Phase 15 Explainable Fair Price Assistant.

Exact Arithmetic Verification:
Material: ₹200
Labour: 2 hours × ₹100 = ₹200
Overhead: ₹50
Packaging: ₹0

Cost Floor: ₹450

Explicit Scenarios:
- Low (10% markup): ₹450 + 10% (₹45) = ₹495
- Base (20% markup): ₹450 + 20% (₹90) = ₹540
- High (30% markup): ₹450 + 30% (₹135) = ₹585

Market adjustment: ₹0.00
"""
from decimal import Decimal
import pytest

from backend.app.pricing_engine import (
    LabourInput,
    MarkupScenarioInput,
    MaterialInput,
    OverheadInput,
    PackagingInput,
    PricingInput,
    calculate_price,
)
from backend.app.pricing_engine.enums import MarginMode, ValueStatus


def test_synthetic_arithmetic_fixture_exact():
    """Verify exact synthetic calculation fixture matching user specification."""
    materials = (
        MaterialInput(
            name="Mulberry Raw Silk",
            quantity=Decimal("1"),
            unit="piece",
            cost_per_unit=Decimal("200"),
            value_status=ValueStatus.EXACT,
        ),
    )

    labour = (
        LabourInput(
            task_name="Hand-weaving",
            hours=Decimal("2"),
            hourly_rate=Decimal("100"),
            rate_source="Artisan guild standard card 2026",
            hours_status=ValueStatus.EXACT,
        ),
    )

    overhead = (
        OverheadInput(
            name="Workshop electricity & maintenance",
            amount=Decimal("50"),
            explanation="Allocated workshop lighting and maintenance per item",
            value_status=ValueStatus.EXACT,
        ),
    )

    packaging = (
        PackagingInput(
            name="Packaging",
            cost_per_unit=Decimal("0"),
            explanation="No special packaging required",
            value_status=ValueStatus.EXACT,
        ),
    )

    scenarios = (
        MarkupScenarioInput(name="low", markup_percentage=Decimal("10"), label="Low (10%)"),
        MarkupScenarioInput(name="base", markup_percentage=Decimal("20"), label="Base (20%)"),
        MarkupScenarioInput(name="high", markup_percentage=Decimal("30"), label="High (30%)"),
    )

    pricing_req = PricingInput(
        materials=materials,
        labour=labour,
        overhead=overhead,
        packaging=packaging,
        margin_mode=MarginMode.PERCENTAGE_MARKUP,
        margin_value=Decimal("20"),
        scenarios=scenarios,
        comparables=(),  # No comparables
    )

    result = calculate_price(pricing_req)

    # 1. Cost breakdown verification
    assert result.total_material_cost == Decimal("200")
    assert result.total_labour_cost == Decimal("200")
    assert result.total_overhead == Decimal("50")
    assert result.total_packaging == Decimal("0")

    # 2. Production Cost Floor
    assert result.cost_floor == Decimal("450")

    # 3. Base Calculation
    assert result.profit_amount == Decimal("90")  # 20% of 450
    assert result.cost_based_base_price == Decimal("540")
    assert result.suggested_base_price == Decimal("540")

    # 4. Market Adjustment
    assert result.comparable_adjustment.final_adjustment == Decimal("0")
    assert len(result.comparable_adjustment.eligible_comparables) == 0

    # 5. Scenarios (Low / Base / High)
    sc_map = {s.name: s for s in result.scenarios}
    assert sc_map["low"].cost_floor == Decimal("450")
    assert sc_map["low"].markup_percentage == Decimal("10")
    assert sc_map["low"].profit_amount == Decimal("45")
    assert sc_map["low"].resulting_price_rounded == Decimal("495")

    assert sc_map["base"].cost_floor == Decimal("450")
    assert sc_map["base"].markup_percentage == Decimal("20")
    assert sc_map["base"].profit_amount == Decimal("90")
    assert sc_map["base"].resulting_price_rounded == Decimal("540")

    assert sc_map["high"].cost_floor == Decimal("450")
    assert sc_map["high"].markup_percentage == Decimal("30")
    assert sc_map["high"].profit_amount == Decimal("135")
    assert sc_map["high"].resulting_price_rounded == Decimal("585")
