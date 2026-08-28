"""Verified Market Comparables and Floor Protection tests for Phase 15."""
from datetime import date, timedelta
from decimal import Decimal
import pytest

from backend.app.pricing_engine import (
    ComparableInput,
    LabourInput,
    MaterialInput,
    PricingInput,
    calculate_price,
)
from backend.app.pricing_engine.enums import ComparableStatus, MarginMode


def test_zero_comparables_handling():
    """Verify that zero comparables results in zero market adjustment and truthful note."""
    materials = (
        MaterialInput(name="Terracotta Clay", quantity=Decimal("5"), unit="kg", cost_per_unit=Decimal("40")),
    )
    labour = (
        LabourInput(task_name="Moulding", hours=Decimal("2"), hourly_rate=Decimal("150"), rate_source="Guild"),
    )

    req = PricingInput(
        materials=materials,
        labour=labour,
        overhead=(),
        packaging=(),
        margin_mode=MarginMode.PERCENTAGE_MARKUP,
        margin_value=Decimal("20"),
        comparables=(),
    )

    res = calculate_price(req)
    # Materials: 200, Labour: 300 -> Cost floor: 500, Margin: 100 -> Base: 600
    assert res.cost_floor == Decimal("500")
    assert res.comparable_adjustment.final_adjustment == Decimal("0")
    assert "No verified market comparison available" in res.explanation_text


def test_rejection_of_unverified_and_stale_comparables():
    """Verify that unverified, missing provenance, and stale comparables are strictly excluded."""
    today = date.today()

    comp_unverified = ComparableInput(
        id="comp_001",
        product_title="Handmade Clay Vase",
        category="Pottery",
        craft_type="Terracotta",
        material="Clay",
        listed_price=Decimal("850"),
        source_name="Market Bazaar",
        source_reference="http://example.com/item1",
        capture_date=today,
        status=ComparableStatus.UNVERIFIED,  # Unverified
        selected=True,
    )

    comp_missing_provenance = ComparableInput(
        id="comp_002",
        product_title="Handmade Clay Vase",
        category="Pottery",
        craft_type="Terracotta",
        material="Clay",
        listed_price=Decimal("900"),
        source_name="Craft Fair",
        source_reference="http://example.com/item2",
        capture_date=today,
        status=ComparableStatus.VERIFIED,
        verification_date=today,
        verified_by=None,  # Missing verifier
        verification_note=None,
        evidence_reference=None,  # Missing evidence
        selected=True,
    )

    comp_stale = ComparableInput(
        id="comp_003",
        product_title="Handmade Clay Vase",
        category="Pottery",
        craft_type="Terracotta",
        material="Clay",
        listed_price=Decimal("950"),
        source_name="Historical Exhibition",
        source_reference="http://example.com/item3",
        capture_date=today - timedelta(days=200),  # > 180 days stale
        status=ComparableStatus.VERIFIED,
        verification_date=today - timedelta(days=200),
        verified_by="verifier_01",
        verification_note="Verified exhibition catalogue",
        evidence_reference="http://evidence.org/cat.pdf",
        selected=True,
    )

    materials = (
        MaterialInput(name="Clay", quantity=Decimal("5"), unit="kg", cost_per_unit=Decimal("40")),
    )
    labour = (
        LabourInput(task_name="Moulding", hours=Decimal("2"), hourly_rate=Decimal("150"), rate_source="Guild"),
    )

    req = PricingInput(
        materials=materials,
        labour=labour,
        overhead=(),
        packaging=(),
        margin_mode=MarginMode.PERCENTAGE_MARKUP,
        margin_value=Decimal("20"),
        comparables=(comp_unverified, comp_missing_provenance, comp_stale),
        calculation_date=today,
    )

    res = calculate_price(req)
    # All 3 must be excluded from adjustment
    assert len(res.comparable_adjustment.eligible_comparables) == 0
    assert res.comparable_adjustment.final_adjustment == Decimal("0")
    assert any("comp_001" in w for w in res.warnings)
    assert any("comp_002" in w for w in res.warnings)
    assert any("comp_003" in w for w in res.warnings)


def test_verified_comparable_adjustment_with_cap_and_floor_protection():
    """Verify that verified comparables apply capped adjustment without breaching cost floor."""
    today = date.today()

    # Create 3 valid, verified comparables with median ₹1000
    comp1 = ComparableInput(
        id="comp_v1",
        product_title="Pure Silk Saree",
        category="Apparel",
        craft_type="Handloom",
        material="Silk",
        listed_price=Decimal("900"),
        source_name="Silk Guild",
        source_reference="http://guild.org/saree1",
        capture_date=today - timedelta(days=10),
        status=ComparableStatus.VERIFIED,
        verification_date=today - timedelta(days=10),
        verified_by="lead_auditor_01",
        verification_note="Inspected store invoice",
        evidence_reference="http://guild.org/proof1.pdf",
        selected=True,
    )
    comp2 = ComparableInput(
        id="comp_v2",
        product_title="Pure Silk Saree",
        category="Apparel",
        craft_type="Handloom",
        material="Silk",
        listed_price=Decimal("1000"),
        source_name="Silk Guild",
        source_reference="http://guild.org/saree2",
        capture_date=today - timedelta(days=15),
        status=ComparableStatus.VERIFIED,
        verification_date=today - timedelta(days=15),
        verified_by="lead_auditor_01",
        verification_note="Inspected store invoice",
        evidence_reference="http://guild.org/proof2.pdf",
        selected=True,
    )
    comp3 = ComparableInput(
        id="comp_v3",
        product_title="Pure Silk Saree",
        category="Apparel",
        craft_type="Handloom",
        material="Silk",
        listed_price=Decimal("1100"),
        source_name="Silk Guild",
        source_reference="http://guild.org/saree3",
        capture_date=today - timedelta(days=20),
        status=ComparableStatus.VERIFIED,
        verification_date=today - timedelta(days=20),
        verified_by="lead_auditor_01",
        verification_note="Inspected store invoice",
        evidence_reference="http://guild.org/proof3.pdf",
        selected=True,
    )

    materials = (
        MaterialInput(name="Silk", quantity=Decimal("1"), unit="saree", cost_per_unit=Decimal("400")),
    )
    labour = (
        LabourInput(task_name="Weaving", hours=Decimal("2"), hourly_rate=Decimal("100"), rate_source="Guild"),
    )

    req = PricingInput(
        materials=materials,
        labour=labour,
        overhead=(),
        packaging=(),
        margin_mode=MarginMode.PERCENTAGE_MARKUP,
        margin_value=Decimal("20"),  # Cost: 600, Base price: 720
        comparables=(comp1, comp2, comp3),
        comparable_influence=Decimal("20"),  # 20% of (1000 - 720) = ₹56
        max_adjustment=Decimal("10"),        # 10% cap of 720 = ₹72
        calculation_date=today,
    )

    res = calculate_price(req)
    # Cost: 600, Base: 720, Gap: 280, Uncapped: 56, Cap: 72 -> Adjustment = 56
    assert len(res.comparable_adjustment.eligible_comparables) == 3
    assert res.comparable_adjustment.comparable_median == Decimal("1000")
    assert res.comparable_adjustment.final_adjustment == Decimal("56")
    assert res.suggested_base_price == Decimal("776")
    # Must never drop below cost floor
    assert res.suggested_base_price >= res.cost_floor
