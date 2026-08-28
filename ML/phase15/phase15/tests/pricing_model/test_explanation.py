from datetime import date, timedelta
from decimal import Decimal

from pricing_model.calculator import calculate_price
from pricing_model.models import (
    ComparableInput,
    ComparableStatus,
    LabourInput,
    MarginMode,
    MaterialInput,
    OverheadInput,
    PricingInput,
    ValueStatus,
)


class TestExplanationOutput:
    def test_complete_explanation_structure(self):
        materials = (
            MaterialInput(name="Wood", quantity=Decimal("10"), unit="kg", cost_per_unit=Decimal("50"), value_status=ValueStatus.EXACT),
        )
        labour = (
            LabourInput(task_name="Carving", hours=Decimal("5"), hourly_rate=Decimal("200"), rate_source="Market rate", hours_status=ValueStatus.EXACT),
        )
        overhead = (
            OverheadInput(name="Electricity", amount=Decimal("500"), explanation="Monthly bill", value_status=ValueStatus.EXACT),
        )
        comparables = (
            ComparableInput(
                id="c1", product_title="Bowl", category="Decor", craft_type="Wood", material="Teak",
                listed_price=Decimal("2000"), source_name="Market", source_reference="ref1",
                capture_date=date.today() - timedelta(days=30), status=ComparableStatus.VERIFIED,
                verification_date=date.today() - timedelta(days=20), verified_by="u1",
                verification_note="Verified", evidence_reference="e1", selected=True
            ),
        )

        request = PricingInput(
            materials=materials,
            labour=labour,
            overhead=overhead,
            margin_mode=MarginMode.PERCENTAGE_MARKUP,
            margin_value=Decimal("20"),
            comparables=comparables,
            calculation_date=date(2025, 1, 15),
        )

        result = calculate_price(request)

        assert result.formula_version == "fair-price-rules-v1"
        assert result.currency == "INR"
        assert len(result.materials) == 1
        assert result.materials[0].line_total == Decimal("500")
        assert result.total_material_cost == Decimal("500")
        assert len(result.labour) == 1
        assert result.labour[0].line_total == Decimal("1000")
        assert result.total_labour_cost == Decimal("1000")
        assert len(result.overhead) == 1
        assert result.total_overhead == Decimal("500")
        assert result.production_cost == Decimal("2000")
        assert result.margin_mode == MarginMode.PERCENTAGE_MARKUP
        assert result.margin_input == Decimal("20")
        assert result.margin_amount == Decimal("400")
        assert result.cost_based_base_price == Decimal("2400")
        assert result.comparable_adjustment.eligible_comparables is not None
        assert result.suggested_base_price is not None
        assert result.suggested_range.suggested_low_rounded is not None
        assert result.suggested_range.suggested_base_rounded is not None
        assert result.suggested_range.suggested_high_rounded is not None
        assert len(result.assumptions) > 0
        assert result.confidence_level is not None
        assert len(result.confidence_reasons) > 0
        assert result.artisan_final_price is None

    def test_every_rupee_traceable(self):
        materials = (
            MaterialInput(name="Wood", quantity=Decimal("10"), unit="kg", cost_per_unit=Decimal("50")),
        )
        labour = (
            LabourInput(task_name="Carving", hours=Decimal("5"), hourly_rate=Decimal("200"), rate_source="Market rate"),
        )
        overhead = ()

        request = PricingInput(
            materials=materials,
            labour=labour,
            overhead=overhead,
            margin_mode=MarginMode.FIXED_INR,
            margin_value=Decimal("500"),
            calculation_date=date(2025, 1, 15),
        )

        result = calculate_price(request)

        assert result.total_material_cost == Decimal("500")
        assert result.total_labour_cost == Decimal("1000")
        assert result.total_overhead == Decimal("0")
        assert result.production_cost == Decimal("1500")
        assert result.margin_amount == Decimal("500")
        assert result.cost_based_base_price == Decimal("2000")
        assert result.suggested_base_price == Decimal("2000")
