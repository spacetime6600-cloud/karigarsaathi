from datetime import date
from decimal import Decimal

import pytest

from pricing_model.exceptions import (
    InvalidComparableStatusError,
    InvalidDateError,
    InvalidDecimalError,
    InvalidHoursError,
    InvalidMarginError,
    InvalidOverheadError,
    InvalidPercentageError,
    InvalidQuantityError,
    InvalidRateError,
    MissingInputsError,
    UnreasonableValueError,
    UnsupportedCurrencyError,
    UnsupportedLocaleError,
)
from pricing_model.models import (
    ComparableInput,
    LabourInput,
    MarginMode,
    MaterialInput,
    OverheadInput,
    PricingInput,
)
from pricing_model.validation import validate_pricing_input


class TestValidation:
    def test_missing_materials_and_labour_rejected(self):
        request = PricingInput(
            materials=(),
            labour=(),
            overhead=(),
            margin_mode=MarginMode.FIXED_INR,
            margin_value=Decimal("500"),
            calculation_date=date.today(),
        )
        with pytest.raises(MissingInputsError):
            validate_pricing_input(request)

    def test_unsupported_currency_rejected(self):
        materials = (MaterialInput(name="Wood", quantity=Decimal("10"), unit="kg", cost_per_unit=Decimal("50")),)
        labour = (LabourInput(task_name="Carving", hours=Decimal("5"), hourly_rate=Decimal("200"), rate_source="Market rate"),)
        request = PricingInput(
            materials=materials,
            labour=labour,
            overhead=(),
            margin_mode=MarginMode.FIXED_INR,
            margin_value=Decimal("500"),
            currency="USD",
            calculation_date=date.today(),
        )
        with pytest.raises(UnsupportedCurrencyError):
            validate_pricing_input(request)

    def test_unsupported_locale_rejected(self):
        materials = (MaterialInput(name="Wood", quantity=Decimal("10"), unit="kg", cost_per_unit=Decimal("50")),)
        labour = (LabourInput(task_name="Carving", hours=Decimal("5"), hourly_rate=Decimal("200"), rate_source="Market rate"),)
        request = PricingInput(
            materials=materials,
            labour=labour,
            overhead=(),
            margin_mode=MarginMode.FIXED_INR,
            margin_value=Decimal("500"),
            locale="fr",
            calculation_date=date.today(),
        )
        with pytest.raises(UnsupportedLocaleError):
            validate_pricing_input(request)

    def test_negative_quantity_rejected(self):
        materials = (MaterialInput(name="Wood", quantity=Decimal("-10"), unit="kg", cost_per_unit=Decimal("50")),)
        labour = (LabourInput(task_name="Carving", hours=Decimal("5"), hourly_rate=Decimal("200"), rate_source="Market rate"),)
        request = PricingInput(
            materials=materials,
            labour=labour,
            overhead=(),
            margin_mode=MarginMode.FIXED_INR,
            margin_value=Decimal("500"),
            calculation_date=date.today(),
        )
        with pytest.raises(InvalidQuantityError):
            validate_pricing_input(request)

    def test_negative_labour_hours_rejected(self):
        materials = (MaterialInput(name="Wood", quantity=Decimal("10"), unit="kg", cost_per_unit=Decimal("50")),)
        labour = (LabourInput(task_name="Carving", hours=Decimal("-5"), hourly_rate=Decimal("200"), rate_source="Market rate"),)
        request = PricingInput(
            materials=materials,
            labour=labour,
            overhead=(),
            margin_mode=MarginMode.FIXED_INR,
            margin_value=Decimal("500"),
            calculation_date=date.today(),
        )
        with pytest.raises(InvalidHoursError):
            validate_pricing_input(request)

    def test_negative_labour_rate_rejected(self):
        materials = (MaterialInput(name="Wood", quantity=Decimal("10"), unit="kg", cost_per_unit=Decimal("50")),)
        labour = (LabourInput(task_name="Carving", hours=Decimal("5"), hourly_rate=Decimal("-200"), rate_source="Market rate"),)
        request = PricingInput(
            materials=materials,
            labour=labour,
            overhead=(),
            margin_mode=MarginMode.FIXED_INR,
            margin_value=Decimal("500"),
            calculation_date=date.today(),
        )
        with pytest.raises(InvalidRateError):
            validate_pricing_input(request)

    def test_negative_overhead_rejected(self):
        materials = (MaterialInput(name="Wood", quantity=Decimal("10"), unit="kg", cost_per_unit=Decimal("50")),)
        labour = (LabourInput(task_name="Carving", hours=Decimal("5"), hourly_rate=Decimal("200"), rate_source="Market rate"),)
        overhead = (OverheadInput(name="Electricity", amount=Decimal("-100"), explanation="Bill"),)
        request = PricingInput(
            materials=materials,
            labour=labour,
            overhead=overhead,
            margin_mode=MarginMode.FIXED_INR,
            margin_value=Decimal("500"),
            calculation_date=date.today(),
        )
        with pytest.raises(InvalidOverheadError):
            validate_pricing_input(request)

    def test_negative_fixed_margin_rejected(self):
        materials = (MaterialInput(name="Wood", quantity=Decimal("10"), unit="kg", cost_per_unit=Decimal("50")),)
        labour = (LabourInput(task_name="Carving", hours=Decimal("5"), hourly_rate=Decimal("200"), rate_source="Market rate"),)
        request = PricingInput(
            materials=materials,
            labour=labour,
            overhead=(),
            margin_mode=MarginMode.FIXED_INR,
            margin_value=Decimal("-500"),
            calculation_date=date.today(),
        )
        with pytest.raises(InvalidMarginError):
            validate_pricing_input(request)

    def test_invalid_percentage_rejected(self):
        materials = (MaterialInput(name="Wood", quantity=Decimal("10"), unit="kg", cost_per_unit=Decimal("50")),)
        labour = (LabourInput(task_name="Carving", hours=Decimal("5"), hourly_rate=Decimal("200"), rate_source="Market rate"),)
        request = PricingInput(
            materials=materials,
            labour=labour,
            overhead=(),
            margin_mode=MarginMode.PERCENTAGE_MARKUP,
            margin_value=Decimal("150"),
            comparable_influence=Decimal("150"),
            calculation_date=date.today(),
        )
        with pytest.raises(InvalidPercentageError):
            validate_pricing_input(request)

    def test_invalid_date_rejected(self):
        materials = (MaterialInput(name="Wood", quantity=Decimal("10"), unit="kg", cost_per_unit=Decimal("50")),)
        labour = (LabourInput(task_name="Carving", hours=Decimal("5"), hourly_rate=Decimal("200"), rate_source="Market rate"),)
        request = PricingInput(
            materials=materials,
            labour=labour,
            overhead=(),
            margin_mode=MarginMode.FIXED_INR,
            margin_value=Decimal("500"),
            calculation_date="not-a-date",
        )
        with pytest.raises(InvalidDateError):
            validate_pricing_input(request)

    def test_invalid_comparable_status_rejected(self):
        materials = (MaterialInput(name="Wood", quantity=Decimal("10"), unit="kg", cost_per_unit=Decimal("50")),)
        labour = (LabourInput(task_name="Carving", hours=Decimal("5"), hourly_rate=Decimal("200"), rate_source="Market rate"),)
        comparables = (ComparableInput(
            id="c1", product_title="Bowl", category="Decor", craft_type="Wood", material="Teak",
            listed_price=Decimal("2000"), source_name="Market", source_reference="ref1",
            capture_date=date.today(), status="invalid_status",
        ),)
        request = PricingInput(
            materials=materials,
            labour=labour,
            overhead=(),
            margin_mode=MarginMode.FIXED_INR,
            margin_value=Decimal("500"),
            comparables=comparables,
            calculation_date=date.today(),
        )
        with pytest.raises(InvalidComparableStatusError):
            validate_pricing_input(request)

    def test_invalid_decimal_string_rejected(self):
        materials = (MaterialInput(name="Wood", quantity="not-a-number", unit="kg", cost_per_unit=Decimal("50")),)
        labour = (LabourInput(task_name="Carving", hours=Decimal("5"), hourly_rate=Decimal("200"), rate_source="Market rate"),)
        request = PricingInput(
            materials=materials,
            labour=labour,
            overhead=(),
            margin_mode=MarginMode.FIXED_INR,
            margin_value=Decimal("500"),
            calculation_date=date.today(),
        )
        with pytest.raises(InvalidDecimalError):
            validate_pricing_input(request)

    def test_unreasonable_large_values_rejected(self):
        materials = (MaterialInput(name="Wood", quantity=Decimal("2000000"), unit="kg", cost_per_unit=Decimal("50")),)
        labour = (LabourInput(task_name="Carving", hours=Decimal("5"), hourly_rate=Decimal("200"), rate_source="Market rate"),)
        request = PricingInput(
            materials=materials,
            labour=labour,
            overhead=(),
            margin_mode=MarginMode.FIXED_INR,
            margin_value=Decimal("500"),
            calculation_date=date.today(),
        )
        with pytest.raises(UnreasonableValueError):
            validate_pricing_input(request)
