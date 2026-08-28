from datetime import date, timedelta
from decimal import Decimal

import pytest

from pricing_model.calculator import _check_comparable_eligibility
from pricing_model.exceptions import (
    InvalidComparableStatusError,
    InvalidCostError,
    InvalidDateError,
)
from pricing_model.models import ComparableInput, ComparableStatus
from pricing_model.validation import validate_comparable


class TestComparableValidation:
    def test_valid_verified_comparable(self):
        comp = ComparableInput(
            id="comp-1",
            product_title="Wooden Bowl",
            category="Home Decor",
            craft_type="Wood Carving",
            material="Teak",
            listed_price=Decimal("2000"),
            source_name="Marketplace A",
            source_reference="ref-123",
            capture_date=date.today() - timedelta(days=30),
            status=ComparableStatus.VERIFIED,
            verification_date=date.today() - timedelta(days=20),
            verified_by="user-1",
            verification_note="Verified by admin",
            evidence_reference="evidence-1",
            selected=True
        )
        validate_comparable(comp)

    def test_negative_price_rejected(self):
        comp = ComparableInput(
            id="comp-1",
            product_title="Wooden Bowl",
            category="Home Decor",
            craft_type="Wood Carving",
            material="Teak",
            listed_price=Decimal("-100"),
            source_name="Marketplace A",
            source_reference="ref-123",
            capture_date=date.today(),
            status=ComparableStatus.VERIFIED,
        )
        with pytest.raises(InvalidCostError):
            validate_comparable(comp)

    def test_empty_required_fields_rejected(self):
        comp = ComparableInput(
            id="",
            product_title="Wooden Bowl",
            category="Home Decor",
            craft_type="Wood Carving",
            material="Teak",
            listed_price=Decimal("1000"),
            source_name="Marketplace A",
            source_reference="ref-123",
            capture_date=date.today(),
            status=ComparableStatus.VERIFIED,
        )
        with pytest.raises(InvalidComparableStatusError):
            validate_comparable(comp)

    def test_invalid_date_rejected(self):
        comp = ComparableInput(
            id="comp-1",
            product_title="Wooden Bowl",
            category="Home Decor",
            craft_type="Wood Carving",
            material="Teak",
            listed_price=Decimal("1000"),
            source_name="Marketplace A",
            source_reference="ref-123",
            capture_date="not-a-date",
            status=ComparableStatus.VERIFIED,
        )
        with pytest.raises(InvalidDateError):
            validate_comparable(comp)


class TestComparableEligibility:
    def test_selected_verified_with_evidence_eligible(self):
        comp = ComparableInput(
            id="comp-1",
            product_title="Wooden Bowl",
            category="Home Decor",
            craft_type="Wood Carving",
            material="Teak",
            listed_price=Decimal("2000"),
            source_name="Marketplace A",
            source_reference="ref-123",
            capture_date=date.today() - timedelta(days=30),
            status=ComparableStatus.VERIFIED,
            verification_date=date.today() - timedelta(days=20),
            verified_by="user-1",
            verification_note="Verified by admin",
            evidence_reference="evidence-1",
            selected=True
        )
        result = _check_comparable_eligibility(comp, date.today())
        assert result.eligible is True

    def test_not_selected_excluded(self):
        comp = ComparableInput(
            id="comp-1",
            product_title="Wooden Bowl",
            category="Home Decor",
            craft_type="Wood Carving",
            material="Teak",
            listed_price=Decimal("2000"),
            source_name="Marketplace A",
            source_reference="ref-123",
            capture_date=date.today() - timedelta(days=30),
            status=ComparableStatus.VERIFIED,
            verification_date=date.today() - timedelta(days=20),
            verified_by="user-1",
            verification_note="Verified by admin",
            evidence_reference="evidence-1",
            selected=False
        )
        result = _check_comparable_eligibility(comp, date.today())
        assert result.eligible is False
        assert "Not selected" in result.exclusion_reason

    def test_pending_status_excluded(self):
        comp = ComparableInput(
            id="comp-1",
            product_title="Wooden Bowl",
            category="Home Decor",
            craft_type="Wood Carving",
            material="Teak",
            listed_price=Decimal("2000"),
            source_name="Marketplace A",
            source_reference="ref-123",
            capture_date=date.today() - timedelta(days=30),
            status=ComparableStatus.PENDING,
            verification_date=date.today() - timedelta(days=20),
            verified_by="user-1",
            verification_note="Verified by admin",
            evidence_reference="evidence-1",
            selected=True
        )
        result = _check_comparable_eligibility(comp, date.today())
        assert result.eligible is False
        assert "not verified" in result.exclusion_reason

    def test_rejected_status_excluded(self):
        comp = ComparableInput(
            id="comp-1",
            product_title="Wooden Bowl",
            category="Home Decor",
            craft_type="Wood Carving",
            material="Teak",
            listed_price=Decimal("2000"),
            source_name="Marketplace A",
            source_reference="ref-123",
            capture_date=date.today() - timedelta(days=30),
            status=ComparableStatus.REJECTED,
            verification_date=date.today() - timedelta(days=20),
            verified_by="user-1",
            verification_note="Verified by admin",
            evidence_reference="evidence-1",
            selected=True
        )
        result = _check_comparable_eligibility(comp, date.today())
        assert result.eligible is False
        assert "not verified" in result.exclusion_reason

    def test_expired_status_excluded(self):
        comp = ComparableInput(
            id="comp-1",
            product_title="Wooden Bowl",
            category="Home Decor",
            craft_type="Wood Carving",
            material="Teak",
            listed_price=Decimal("2000"),
            source_name="Marketplace A",
            source_reference="ref-123",
            capture_date=date.today() - timedelta(days=30),
            status=ComparableStatus.EXPIRED,
            verification_date=date.today() - timedelta(days=20),
            verified_by="user-1",
            verification_note="Verified by admin",
            evidence_reference="evidence-1",
            selected=True
        )
        result = _check_comparable_eligibility(comp, date.today())
        assert result.eligible is False
        assert "not verified" in result.exclusion_reason

    def test_missing_verification_date_excluded(self):
        comp = ComparableInput(
            id="comp-1",
            product_title="Wooden Bowl",
            category="Home Decor",
            craft_type="Wood Carving",
            material="Teak",
            listed_price=Decimal("2000"),
            source_name="Marketplace A",
            source_reference="ref-123",
            capture_date=date.today() - timedelta(days=30),
            status=ComparableStatus.VERIFIED,
            verification_date=None,
            verified_by="user-1",
            verification_note="Verified by admin",
            evidence_reference="evidence-1",
            selected=True
        )
        result = _check_comparable_eligibility(comp, date.today())
        assert result.eligible is False
        assert "Missing verification date" in result.exclusion_reason

    def test_missing_verified_by_excluded(self):
        comp = ComparableInput(
            id="comp-1",
            product_title="Wooden Bowl",
            category="Home Decor",
            craft_type="Wood Carving",
            material="Teak",
            listed_price=Decimal("2000"),
            source_name="Marketplace A",
            source_reference="ref-123",
            capture_date=date.today() - timedelta(days=30),
            status=ComparableStatus.VERIFIED,
            verification_date=date.today() - timedelta(days=20),
            verified_by=None,
            verification_note="Verified by admin",
            evidence_reference="evidence-1",
            selected=True
        )
        result = _check_comparable_eligibility(comp, date.today())
        assert result.eligible is False
        assert "Missing verified-by" in result.exclusion_reason

    def test_missing_verification_note_excluded(self):
        comp = ComparableInput(
            id="comp-1",
            product_title="Wooden Bowl",
            category="Home Decor",
            craft_type="Wood Carving",
            material="Teak",
            listed_price=Decimal("2000"),
            source_name="Marketplace A",
            source_reference="ref-123",
            capture_date=date.today() - timedelta(days=30),
            status=ComparableStatus.VERIFIED,
            verification_date=date.today() - timedelta(days=20),
            verified_by="user-1",
            verification_note=None,
            evidence_reference="evidence-1",
            selected=True
        )
        result = _check_comparable_eligibility(comp, date.today())
        assert result.eligible is False
        assert "Missing verification note" in result.exclusion_reason

    def test_missing_evidence_reference_excluded(self):
        comp = ComparableInput(
            id="comp-1",
            product_title="Wooden Bowl",
            category="Home Decor",
            craft_type="Wood Carving",
            material="Teak",
            listed_price=Decimal("2000"),
            source_name="Marketplace A",
            source_reference="ref-123",
            capture_date=date.today() - timedelta(days=30),
            status=ComparableStatus.VERIFIED,
            verification_date=date.today() - timedelta(days=20),
            verified_by="user-1",
            verification_note="Verified by admin",
            evidence_reference=None,
            selected=True
        )
        result = _check_comparable_eligibility(comp, date.today())
        assert result.eligible is False
        assert "Missing evidence reference" in result.exclusion_reason

    def test_stale_comparable_excluded(self):
        comp = ComparableInput(
            id="comp-1",
            product_title="Wooden Bowl",
            category="Home Decor",
            craft_type="Wood Carving",
            material="Teak",
            listed_price=Decimal("2000"),
            source_name="Marketplace A",
            source_reference="ref-123",
            capture_date=date.today() - timedelta(days=200),
            status=ComparableStatus.VERIFIED,
            verification_date=date.today() - timedelta(days=190),
            verified_by="user-1",
            verification_note="Verified by admin",
            evidence_reference="evidence-1",
            selected=True
        )
        result = _check_comparable_eligibility(comp, date.today())
        assert result.eligible is False
        assert "Stale" in result.exclusion_reason
