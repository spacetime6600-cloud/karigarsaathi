"""Unit tests for Phase 15 Core Pricing Engine."""
from decimal import Decimal
import pytest

from backend.app.pricing_engine import (
    LabourInput,
    MarkupScenarioInput,
    MaterialInput,
    OverheadInput,
    PackagingInput,
    PricingInput,
    apply_artisan_decision,
    calculate_price,
)
from backend.app.pricing_engine.enums import MarginMode, SelectionType, ValueStatus


def test_batch_to_unit_conversion():
    """Verify that batch material costs are accurately converted to per-unit cost."""
    materials = (
        MaterialInput(
            name="Indigo Natural Dye",
            quantity=Decimal("500"),  # 500 grams total
            unit="grams",
            cost_per_unit=Decimal("2"),  # ₹2 per gram = ₹1000 batch cost
            is_batch=True,
            batch_quantity=Decimal("10"),  # 10 sarees in batch
        ),
    )

    labour = (
        LabourInput(
            task_name="Dyeing",
            hours=Decimal("1"),
            hourly_rate=Decimal("150"),
            rate_source="State Wage Card",
        ),
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
    # 500 / 10 = 50 grams per unit @ ₹2 = ₹100 material cost per unit
    assert res.materials[0].unit_quantity == Decimal("50")
    assert res.materials[0].line_total == Decimal("100")
    assert res.total_material_cost == Decimal("100")
    assert res.total_labour_cost == Decimal("150")
    assert res.cost_floor == Decimal("250")


def test_fixed_margin_mode():
    """Verify fixed INR profit amount calculation."""
    materials = (
        MaterialInput(name="Clay", quantity=Decimal("2"), unit="kg", cost_per_unit=Decimal("50")),
    )
    labour = (
        LabourInput(task_name="Pottery wheel", hours=Decimal("3"), hourly_rate=Decimal("100"), rate_source="Guild"),
    )

    req = PricingInput(
        materials=materials,
        labour=labour,
        overhead=(),
        packaging=(),
        margin_mode=MarginMode.FIXED_AMOUNT,
        margin_value=Decimal("250"),  # Fixed ₹250 profit
    )

    res = calculate_price(req)
    # Materials: 2*50=100, Labour: 3*100=300 -> Cost floor: 400
    assert res.cost_floor == Decimal("400")
    assert res.profit_amount == Decimal("250")
    assert res.cost_based_base_price == Decimal("650")


def test_below_cost_selection_warning():
    """Verify that selecting a price below the cost floor triggers a clear shortfall warning."""
    materials = (
        MaterialInput(name="Brass Sheet", quantity=Decimal("1"), unit="kg", cost_per_unit=Decimal("600")),
    )
    labour = (
        LabourInput(task_name="Engraving", hours=Decimal("4"), hourly_rate=Decimal("150"), rate_source="Guild"),
    )

    req = PricingInput(
        materials=materials,
        labour=labour,
        overhead=(),
        packaging=(),
        margin_mode=MarginMode.PERCENTAGE_MARKUP,
        margin_value=Decimal("20"),
        artisan_final_price=Decimal("800"),  # Artisan selects ₹800 (below cost floor ₹1200)
        artisan_selection_type=SelectionType.CUSTOM,
    )

    res = calculate_price(req)
    # Cost floor: 600 + 600 = 1200
    assert res.cost_floor == Decimal("1200")
    assert res.is_below_cost is True
    assert res.shortfall_amount == Decimal("400")
    assert any("below the cost floor" in w for w in res.warnings)


def test_determinism_repeated_execution():
    """Verify that multiple calculations with the same input produce identical Decimal outputs."""
    materials = (
        MaterialInput(name="Wood Block", quantity=Decimal("1"), unit="pc", cost_per_unit=Decimal("350.50")),
    )
    labour = (
        LabourInput(task_name="Carving", hours=Decimal("5.5"), hourly_rate=Decimal("120"), rate_source="Guild"),
    )
    overhead = (
        OverheadInput(name="Chisel sharpening", amount=Decimal("45.25")),
    )

    req = PricingInput(
        materials=materials,
        labour=labour,
        overhead=overhead,
        packaging=(),
        margin_mode=MarginMode.PERCENTAGE_MARKUP,
        margin_value=Decimal("25"),
    )

    res1 = calculate_price(req)
    res2 = calculate_price(req)

    assert res1.cost_floor == res2.cost_floor
    assert res1.profit_amount == res2.profit_amount
    assert res1.suggested_base_price == res2.suggested_base_price
    assert res1.suggested_range.suggested_base_rounded == res2.suggested_range.suggested_base_rounded
