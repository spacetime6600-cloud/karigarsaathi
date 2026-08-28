from decimal import Decimal

import pytest

from pricing_model.exceptions import (
    InvalidMarginError,
    InvalidPercentageError,
    UnreasonableValueError,
)
from pricing_model.models import MarginMode
from pricing_model.validation import validate_margin


class TestPercentageMarkup:
    def test_valid_percentage_markup(self):
        validate_margin(MarginMode.PERCENTAGE_MARKUP, Decimal("20"))

    def test_zero_percentage_allowed(self):
        validate_margin(MarginMode.PERCENTAGE_MARKUP, Decimal("0"))

    def test_negative_percentage_rejected(self):
        with pytest.raises(InvalidPercentageError):
            validate_margin(MarginMode.PERCENTAGE_MARKUP, Decimal("-10"))

    def test_high_percentage_allowed(self):
        validate_margin(MarginMode.PERCENTAGE_MARKUP, Decimal("500"))


class TestFixedMargin:
    def test_valid_fixed_margin(self):
        validate_margin(MarginMode.FIXED_INR, Decimal("1000"))

    def test_zero_fixed_allowed(self):
        validate_margin(MarginMode.FIXED_INR, Decimal("0"))

    def test_negative_fixed_rejected(self):
        with pytest.raises(InvalidMarginError):
            validate_margin(MarginMode.FIXED_INR, Decimal("-100"))

    def test_unreasonable_fixed_rejected(self):
        with pytest.raises(UnreasonableValueError):
            validate_margin(MarginMode.FIXED_INR, Decimal("200000000"))
