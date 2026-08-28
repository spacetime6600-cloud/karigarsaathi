from decimal import Decimal

import pytest

from pricing_model.exceptions import (
    InvalidOverheadError,
    UnreasonableValueError,
)
from pricing_model.models import OverheadInput, ValueStatus
from pricing_model.validation import validate_overhead


class TestItemizedOverhead:
    def test_valid_overhead(self):
        overhead = OverheadInput(
            name="Electricity",
            amount=Decimal("500"),
            explanation="Monthly electricity bill",
            value_status=ValueStatus.EXACT
        )
        validate_overhead(overhead)

    def test_negative_overhead_rejected(self):
        overhead = OverheadInput(
            name="Electricity",
            amount=Decimal("-100"),
            explanation="Monthly electricity bill",
        )
        with pytest.raises(InvalidOverheadError):
            validate_overhead(overhead)

    def test_zero_overhead_allowed(self):
        overhead = OverheadInput(
            name="Electricity",
            amount=Decimal("0"),
            explanation="Monthly electricity bill",
        )
        validate_overhead(overhead)

    def test_empty_name_rejected(self):
        overhead = OverheadInput(
            name="",
            amount=Decimal("500"),
            explanation="Monthly electricity bill",
        )
        with pytest.raises(InvalidOverheadError):
            validate_overhead(overhead)

    def test_unreasonable_overhead_rejected(self):
        overhead = OverheadInput(
            name="Electricity",
            amount=Decimal("200000000"),
            explanation="Monthly electricity bill",
        )
        with pytest.raises(UnreasonableValueError):
            validate_overhead(overhead)


class TestZeroOverhead:
    def test_zero_overhead_valid(self):
        overhead = OverheadInput(
            name="No overhead",
            amount=Decimal("0"),
            explanation="No overhead costs",
        )
        validate_overhead(overhead)
