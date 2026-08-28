"""Validation logic for Phase 15 Pricing Engine."""
from datetime import date
from decimal import Decimal, InvalidOperation
from typing import Any

from .constants import (
    CURRENCY,
    MAX_REASONABLE_HOURS,
    MAX_REASONABLE_QUANTITY,
    MAX_REASONABLE_RATE,
    MAX_REASONABLE_VALUE,
    SUPPORTED_LOCALES,
)
from .enums import ComparableStatus, MarginMode, RateType, ValueStatus, SelectionType
from .exceptions import (
    InvalidBatchQuantityError,
    InvalidComparableStatusError,
    InvalidCostError,
    InvalidDateError,
    InvalidDecimalError,
    InvalidHoursError,
    InvalidMarginError,
    InvalidOverheadError,
    InvalidPackagingError,
    InvalidPercentageError,
    InvalidQuantityError,
    InvalidRateError,
    InvalidScenarioOrderError,
    MissingInputsError,
    UnreasonableValueError,
    UnsupportedCurrencyError,
    UnsupportedLocaleError,
)
from .models import (
    ComparableInput,
    LabourInput,
    MarkupScenarioInput,
    MaterialInput,
    OverheadInput,
    PackagingInput,
    PricingInput,
)


def parse_decimal(value: Any, field_name: str) -> Decimal:
    """Parse any input into a Decimal, rejecting invalid formats, NaNs, and infinities."""
    if isinstance(value, Decimal):
        if value.is_nan() or value.is_infinite():
            raise InvalidDecimalError(f"Decimal for {field_name} must not be NaN or Infinity")
        return value
    try:
        val_str = str(value).strip()
        if not val_str:
            raise InvalidDecimalError(f"Value for {field_name} cannot be empty")
        d = Decimal(val_str)
        if d.is_nan() or d.is_infinite():
            raise InvalidDecimalError(f"Decimal for {field_name} must not be NaN or Infinity")
        return d
    except (InvalidOperation, ValueError, TypeError) as e:
        raise InvalidDecimalError(f"Invalid decimal value for {field_name}: {value}") from e


def validate_non_negative(value: Decimal, field_name: str, error_class: type) -> None:
    if value < 0:
        raise error_class(f"{field_name} must be non-negative, got {value}")


def validate_positive(value: Decimal, field_name: str, error_class: type) -> None:
    if value <= 0:
        raise error_class(f"{field_name} must be strictly positive (> 0), got {value}")


def validate_reasonable(value: Decimal, max_value: Decimal, field_name: str) -> None:
    if value > max_value:
        raise UnreasonableValueError(f"{field_name} exceeds maximum reasonable value: {value} > {max_value}")


def validate_percentage(value: Decimal, field_name: str, max_value: Decimal = Decimal("1000")) -> None:
    if value < 0 or value > max_value:
        raise InvalidPercentageError(f"{field_name} must be between 0 and {max_value}%, got {value}")


def validate_currency(currency: str) -> None:
    if currency.upper() != CURRENCY:
        raise UnsupportedCurrencyError(f"Unsupported currency: {currency}. Only {CURRENCY} is supported.")


def validate_locale(locale: str) -> None:
    if locale not in SUPPORTED_LOCALES:
        raise UnsupportedLocaleError(f"Unsupported locale: {locale}. Supported locales: {', '.join(SUPPORTED_LOCALES)}")


def validate_date(value: date, field_name: str) -> None:
    if not isinstance(value, date):
        raise InvalidDateError(f"{field_name} must be a date object")


def validate_comparable_status(status: ComparableStatus) -> None:
    if not isinstance(status, ComparableStatus):
        raise InvalidComparableStatusError(f"Invalid comparable status: {status}")


def validate_material(material: MaterialInput) -> None:
    qty = parse_decimal(material.quantity, f"material.{material.name}.quantity")
    cost = parse_decimal(material.cost_per_unit, f"material.{material.name}.cost_per_unit")

    validate_non_negative(qty, f"material.{material.name}.quantity", InvalidQuantityError)
    validate_non_negative(cost, f"material.{material.name}.cost_per_unit", InvalidCostError)
    validate_reasonable(qty, MAX_REASONABLE_QUANTITY, f"material.{material.name}.quantity")
    validate_reasonable(cost, MAX_REASONABLE_VALUE, f"material.{material.name}.cost_per_unit")

    if not material.name or not material.name.strip():
        raise InvalidQuantityError("Material name cannot be empty")
    if not material.unit or not material.unit.strip():
        raise InvalidQuantityError("Material unit cannot be empty")

    if not isinstance(material.value_status, ValueStatus):
        raise InvalidQuantityError(f"Invalid value_status for material {material.name}")

    if material.is_batch:
        if material.batch_quantity is None:
            raise InvalidBatchQuantityError(f"Material '{material.name}' marked as batch but batch_quantity is missing")
        batch_qty = parse_decimal(material.batch_quantity, f"material.{material.name}.batch_quantity")
        validate_positive(batch_qty, f"material.{material.name}.batch_quantity", InvalidBatchQuantityError)


def validate_labour(labour: LabourInput) -> None:
    hours = parse_decimal(labour.hours, f"labour.{labour.task_name}.hours")
    rate = parse_decimal(labour.hourly_rate, f"labour.{labour.task_name}.hourly_rate")

    validate_non_negative(hours, f"labour.{labour.task_name}.hours", InvalidHoursError)
    validate_non_negative(rate, f"labour.{labour.task_name}.hourly_rate", InvalidRateError)
    validate_reasonable(hours, MAX_REASONABLE_HOURS, f"labour.{labour.task_name}.hours")
    validate_reasonable(rate, MAX_REASONABLE_RATE, f"labour.{labour.task_name}.hourly_rate")

    if not labour.task_name or not labour.task_name.strip():
        raise InvalidHoursError("Labour task name cannot be empty")
    if not labour.rate_source or not labour.rate_source.strip():
        raise InvalidRateError("Labour rate source cannot be empty")

    if not isinstance(labour.rate_type, RateType):
        raise InvalidRateError(f"Invalid rate_type for labour {labour.task_name}")
    if not isinstance(labour.hours_status, ValueStatus):
        raise InvalidHoursError(f"Invalid hours_status for labour {labour.task_name}")


def validate_overhead(overhead: OverheadInput) -> None:
    amount = parse_decimal(overhead.amount, f"overhead.{overhead.name}.amount")

    validate_non_negative(amount, f"overhead.{overhead.name}.amount", InvalidOverheadError)
    validate_reasonable(amount, MAX_REASONABLE_VALUE, f"overhead.{overhead.name}.amount")

    if not overhead.name or not overhead.name.strip():
        raise InvalidOverheadError("Overhead name cannot be empty")

    if not isinstance(overhead.value_status, ValueStatus):
        raise InvalidOverheadError(f"Invalid value_status for overhead {overhead.name}")


def validate_packaging(packaging: PackagingInput) -> None:
    if not packaging.name or not packaging.name.strip():
        raise InvalidPackagingError("Packaging item requires a valid name")

    cost = parse_decimal(packaging.cost_per_unit, f"packaging.{packaging.name}.cost_per_unit")
    validate_non_negative(cost, f"packaging.{packaging.name}.cost_per_unit", InvalidPackagingError)
    validate_reasonable(cost, MAX_REASONABLE_VALUE, f"packaging.{packaging.name}.cost_per_unit")


def validate_scenario(scenario: MarkupScenarioInput) -> None:
    if not scenario.name or not scenario.name.strip():
        raise MissingInputsError("Scenario requires a valid identifier name (e.g. 'low', 'base', 'high')")
    pct = parse_decimal(scenario.markup_percentage, f"scenario.{scenario.name}.markup_percentage")
    validate_percentage(pct, f"scenario.{scenario.name}.markup_percentage")


def validate_margin(margin_mode: MarginMode, margin_value: Decimal) -> None:
    value = parse_decimal(margin_value, "margin_value")

    if not isinstance(margin_mode, MarginMode):
        raise InvalidMarginError(f"Invalid margin_mode: {margin_mode}")

    if margin_mode == MarginMode.PERCENTAGE_MARKUP:
        validate_percentage(value, "margin_value (percentage markup)", Decimal("1000"))
    elif margin_mode in (MarginMode.FIXED_AMOUNT, MarginMode.FIXED_INR):
        validate_non_negative(value, "margin_value (fixed amount)", InvalidMarginError)
        validate_reasonable(value, MAX_REASONABLE_VALUE, "margin_value (fixed amount)")


def validate_comparable(comp: ComparableInput) -> None:
    price = parse_decimal(comp.listed_price, f"comparable.{comp.id}.listed_price")

    validate_non_negative(price, f"comparable.{comp.id}.listed_price", InvalidCostError)
    validate_reasonable(price, MAX_REASONABLE_VALUE, f"comparable.{comp.id}.listed_price")

    validate_date(comp.capture_date, f"comparable.{comp.id}.capture_date")
    if comp.verification_date:
        validate_date(comp.verification_date, f"comparable.{comp.id}.verification_date")

    validate_comparable_status(comp.status)

    if not comp.id or not comp.id.strip():
        raise InvalidComparableStatusError("Comparable ID cannot be empty")
    if not comp.product_title or not comp.product_title.strip():
        raise InvalidComparableStatusError("Comparable product_title cannot be empty")
    if not comp.category or not comp.category.strip():
        raise InvalidComparableStatusError("Comparable category cannot be empty")
    if not comp.craft_type or not comp.craft_type.strip():
        raise InvalidComparableStatusError("Comparable craft_type cannot be empty")
    if not comp.material or not comp.material.strip():
        raise InvalidComparableStatusError("Comparable material cannot be empty")
    if not comp.source_name or not comp.source_name.strip():
        raise InvalidComparableStatusError("Comparable source_name cannot be empty")
    if not comp.source_reference or not comp.source_reference.strip():
        raise InvalidComparableStatusError("Comparable source_reference cannot be empty")


def validate_pricing_input(input_data: PricingInput) -> None:
    """Validate all components of the pricing input."""
    if not input_data.materials and not input_data.labour:
        raise MissingInputsError("At least one material or labour input is required")

    validate_currency(input_data.currency)
    validate_locale(input_data.locale)
    validate_date(input_data.calculation_date, "calculation_date")

    validate_margin(input_data.margin_mode, input_data.margin_value)

    validate_percentage(input_data.comparable_influence, "comparable_influence", Decimal("100"))
    validate_percentage(input_data.max_adjustment, "max_adjustment", Decimal("100"))
    validate_percentage(input_data.low_buffer, "low_buffer", Decimal("100"))
    validate_percentage(input_data.high_buffer, "high_buffer", Decimal("100"))

    for material in input_data.materials:
        validate_material(material)

    for labour in input_data.labour:
        validate_labour(labour)

    for overhead in input_data.overhead:
        validate_overhead(overhead)

    for p in input_data.packaging:
        validate_packaging(p)

    for comp in input_data.comparables:
        validate_comparable(comp)

    for s in input_data.scenarios:
        validate_scenario(s)

    # Validate scenarios ordering if standard low/base/high are provided
    scenario_map = {s.name.lower(): s.markup_percentage for s in input_data.scenarios}
    if "low" in scenario_map and "base" in scenario_map:
        if scenario_map["low"] > scenario_map["base"]:
            raise InvalidScenarioOrderError(
                f"Contradictory scenario percentages: 'low' markup ({scenario_map['low']}%) "
                f"cannot exceed 'base' markup ({scenario_map['base']}%)"
            )
    if "base" in scenario_map and "high" in scenario_map:
        if scenario_map["base"] > scenario_map["high"]:
            raise InvalidScenarioOrderError(
                f"Contradictory scenario percentages: 'base' markup ({scenario_map['base']}%) "
                f"cannot exceed 'high' markup ({scenario_map['high']}%)"
            )

    if input_data.artisan_final_price is not None:
        price = parse_decimal(input_data.artisan_final_price, "artisan_final_price")
        validate_non_negative(price, "artisan_final_price", InvalidCostError)
        validate_reasonable(price, MAX_REASONABLE_VALUE, "artisan_final_price")

    if input_data.artisan_selection_type is not None:
        if not isinstance(input_data.artisan_selection_type, SelectionType):
            raise InvalidMarginError(f"Invalid artisan_selection_type: {input_data.artisan_selection_type}")
