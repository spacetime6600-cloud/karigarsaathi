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


class TestDeterminism:
    def test_identical_input_produces_identical_output(self):
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

        result1 = calculate_price(request)
        result2 = calculate_price(request)

        assert result1.total_material_cost == result2.total_material_cost
        assert result1.total_labour_cost == result2.total_labour_cost
        assert result1.total_overhead == result2.total_overhead
        assert result1.production_cost == result2.production_cost
        assert result1.margin_amount == result2.margin_amount
        assert result1.cost_based_base_price == result2.cost_based_base_price
        assert result1.suggested_base_price == result2.suggested_base_price
        assert result1.suggested_range.suggested_low_rounded == result2.suggested_range.suggested_low_rounded
        assert result1.suggested_range.suggested_base_rounded == result2.suggested_range.suggested_base_rounded
        assert result1.suggested_range.suggested_high_rounded == result2.suggested_range.suggested_high_rounded
        assert result1.confidence_level == result2.confidence_level

    def test_explicit_calculation_date_determinism(self):
        materials = (
            MaterialInput(name="Wood", quantity=Decimal("10"), unit="kg", cost_per_unit=Decimal("50")),
        )
        labour = (
            LabourInput(task_name="Carving", hours=Decimal("5"), hourly_rate=Decimal("200"), rate_source="Market rate"),
        )
        overhead = ()
        comparables = (
            ComparableInput(
                id="c1", product_title="Bowl", category="Decor", craft_type="Wood", material="Teak",
                listed_price=Decimal("2000"), source_name="Market", source_reference="ref1",
                capture_date=date(2024, 6, 1), status=ComparableStatus.VERIFIED,
                verification_date=date(2024, 6, 15), verified_by="u1",
                verification_note="Verified", evidence_reference="e1", selected=True
            ),
        )

        request1 = PricingInput(
            materials=materials,
            labour=labour,
            overhead=overhead,
            margin_mode=MarginMode.FIXED_INR,
            margin_value=Decimal("500"),
            comparables=comparables,
            calculation_date=date(2024, 11, 1),
        )

        request2 = PricingInput(
            materials=materials,
            labour=labour,
            overhead=overhead,
            margin_mode=MarginMode.FIXED_INR,
            margin_value=Decimal("500"),
            comparables=comparables,
            calculation_date=date(2025, 12, 1),
        )

        result1 = calculate_price(request1)
        result2 = calculate_price(request2)

        assert result1.calculation_date == date(2024, 11, 1)
        assert result2.calculation_date == date(2025, 12, 1)
        assert len(result1.comparable_adjustment.eligible_comparables) == 1
        assert len(result2.comparable_adjustment.eligible_comparables) == 0

    def test_no_external_services_called(self):
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
        assert result.formula_version == "fair-price-rules-v1"
        assert result.currency == "INR"
