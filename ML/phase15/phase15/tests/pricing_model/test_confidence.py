from datetime import date, timedelta
from decimal import Decimal

from pricing_model.confidence import classify_confidence, get_eligible_comparables
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


class TestConfidenceClassification:
    def test_high_confidence_all_exact_three_comparables(self):
        materials = (
            MaterialInput(name="Wood", quantity=Decimal("10"), unit="kg", cost_per_unit=Decimal("50"), value_status=ValueStatus.EXACT),
        )
        labour = (
            LabourInput(task_name="Carving", hours=Decimal("5"), hourly_rate=Decimal("200"), rate_source="Market rate", hours_status=ValueStatus.EXACT),
        )
        overhead = (
            OverheadInput(name="Electricity", amount=Decimal("500"), explanation="Monthly bill", value_status=ValueStatus.EXACT),
        )
        comparables = [
            ComparableInput(
                id="c1", product_title="Bowl", category="Decor", craft_type="Wood", material="Teak",
                listed_price=Decimal("2000"), source_name="Market", source_reference="ref1",
                capture_date=date.today() - timedelta(days=30), status=ComparableStatus.VERIFIED,
                verification_date=date.today() - timedelta(days=20), verified_by="u1",
                verification_note="Verified", evidence_reference="e1", selected=True
            ),
            ComparableInput(
                id="c2", product_title="Bowl", category="Decor", craft_type="Wood", material="Teak",
                listed_price=Decimal("2100"), source_name="Market", source_reference="ref2",
                capture_date=date.today() - timedelta(days=30), status=ComparableStatus.VERIFIED,
                verification_date=date.today() - timedelta(days=20), verified_by="u1",
                verification_note="Verified", evidence_reference="e2", selected=True
            ),
            ComparableInput(
                id="c3", product_title="Bowl", category="Decor", craft_type="Wood", material="Teak",
                listed_price=Decimal("2200"), source_name="Market", source_reference="ref3",
                capture_date=date.today() - timedelta(days=30), status=ComparableStatus.VERIFIED,
                verification_date=date.today() - timedelta(days=20), verified_by="u1",
                verification_note="Verified", evidence_reference="e3", selected=True
            ),
        ]

        request = PricingInput(
            materials=materials,
            labour=labour,
            overhead=overhead,
            margin_mode=MarginMode.PERCENTAGE_MARKUP,
            margin_value=Decimal("20"),
            comparables=tuple(comparables),
            calculation_date=date.today()
        )

        eligible = get_eligible_comparables(comparables, date.today())
        result = classify_confidence(request, eligible)

        assert result.level.value == "HIGH"
        assert "All cost inputs are exact" in result.reasons
        assert "3 fresh verified comparables selected" in result.reasons[4]

    def test_medium_confidence_some_estimated(self):
        materials = (
            MaterialInput(name="Wood", quantity=Decimal("10"), unit="kg", cost_per_unit=Decimal("50"), value_status=ValueStatus.ESTIMATED),
        )
        labour = (
            LabourInput(task_name="Carving", hours=Decimal("5"), hourly_rate=Decimal("200"), rate_source="Market rate", hours_status=ValueStatus.EXACT),
        )
        overhead = (
            OverheadInput(name="Electricity", amount=Decimal("500"), explanation="Monthly bill", value_status=ValueStatus.EXACT),
        )

        request = PricingInput(
            materials=materials,
            labour=labour,
            overhead=overhead,
            margin_mode=MarginMode.PERCENTAGE_MARKUP,
            margin_value=Decimal("20"),
            calculation_date=date.today()
        )

        result = classify_confidence(request, [])
        assert result.level.value == "MEDIUM"
        assert any("estimated" in r.lower() for r in result.reasons)

    def test_medium_confidence_missing_rate_source(self):
        materials = (
            MaterialInput(name="Wood", quantity=Decimal("10"), unit="kg", cost_per_unit=Decimal("50"), value_status=ValueStatus.EXACT),
        )
        labour = (
            LabourInput(task_name="Carving", hours=Decimal("5"), hourly_rate=Decimal("200"), rate_source="", hours_status=ValueStatus.EXACT),
        )
        overhead = (
            OverheadInput(name="Electricity", amount=Decimal("500"), explanation="Monthly bill", value_status=ValueStatus.EXACT),
        )

        request = PricingInput(
            materials=materials,
            labour=labour,
            overhead=overhead,
            margin_mode=MarginMode.PERCENTAGE_MARKUP,
            margin_value=Decimal("20"),
            calculation_date=date.today()
        )

        result = classify_confidence(request, [])
        assert result.level.value == "MEDIUM"
        assert any("rate source" in r.lower() for r in result.reasons)

    def test_medium_confidence_few_comparables(self):
        materials = (
            MaterialInput(name="Wood", quantity=Decimal("10"), unit="kg", cost_per_unit=Decimal("50"), value_status=ValueStatus.EXACT),
        )
        labour = (
            LabourInput(task_name="Carving", hours=Decimal("5"), hourly_rate=Decimal("200"), rate_source="Market rate", hours_status=ValueStatus.EXACT),
        )
        overhead = (
            OverheadInput(name="Electricity", amount=Decimal("500"), explanation="Monthly bill", value_status=ValueStatus.EXACT),
        )
        comparables = [
            ComparableInput(
                id="c1", product_title="Bowl", category="Decor", craft_type="Wood", material="Teak",
                listed_price=Decimal("2000"), source_name="Market", source_reference="ref1",
                capture_date=date.today() - timedelta(days=30), status=ComparableStatus.VERIFIED,
                verification_date=date.today() - timedelta(days=20), verified_by="u1",
                verification_note="Verified", evidence_reference="e1", selected=True
            ),
            ComparableInput(
                id="c2", product_title="Bowl", category="Decor", craft_type="Wood", material="Teak",
                listed_price=Decimal("2100"), source_name="Market", source_reference="ref2",
                capture_date=date.today() - timedelta(days=30), status=ComparableStatus.VERIFIED,
                verification_date=date.today() - timedelta(days=20), verified_by="u1",
                verification_note="Verified", evidence_reference="e2", selected=True
            ),
        ]

        request = PricingInput(
            materials=materials,
            labour=labour,
            overhead=overhead,
            margin_mode=MarginMode.PERCENTAGE_MARKUP,
            margin_value=Decimal("20"),
            comparables=tuple(comparables),
            calculation_date=date.today()
        )

        eligible = get_eligible_comparables(comparables, date.today())
        result = classify_confidence(request, eligible)
        assert result.level.value == "MEDIUM"
        assert any("2 eligible comparables" in r for r in result.reasons)

    def test_low_confidence_weak_estimates(self):
        materials = (
            MaterialInput(name="Wood", quantity=Decimal("10"), unit="kg", cost_per_unit=Decimal("50"), value_status=ValueStatus.ESTIMATED),
        )
        labour = (
            LabourInput(task_name="Carving", hours=Decimal("5"), hourly_rate=Decimal("200"), rate_source="", hours_status=ValueStatus.ESTIMATED),
        )
        overhead = (
            OverheadInput(name="Electricity", amount=Decimal("500"), explanation="", value_status=ValueStatus.ESTIMATED),
        )

        request = PricingInput(
            materials=materials,
            labour=labour,
            overhead=overhead,
            margin_mode=MarginMode.PERCENTAGE_MARKUP,
            margin_value=Decimal("20"),
            calculation_date=date.today()
        )

        result = classify_confidence(request, [])
        assert result.level.value == "LOW"
