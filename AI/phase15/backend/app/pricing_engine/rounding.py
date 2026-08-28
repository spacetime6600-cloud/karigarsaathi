"""Decimal-safe rounding policy for Phase 15 Explainable Fair Pricing."""
from decimal import Decimal, ROUND_HALF_UP
from .models import RoundingResult


def round_half_up(value: Decimal) -> RoundingResult:
    rounded = value.quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    difference = rounded - value
    return RoundingResult(
        unrounded=value,
        rounded=rounded,
        difference=difference,
        rule="ROUND_HALF_UP"
    )


def round_half_up_value(val: Decimal, places: int = 0) -> Decimal:
    """Round a Decimal value using ROUND_HALF_UP policy.
    
    Standard Indian handicraft retail prices round to nearest ₹1 integer by default,
    or 2 decimal places for itemized line calculations.
    """
    if places == 0:
        return val.quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    exponent = Decimal("10") ** (-places)
    return val.quantize(exponent, rounding=ROUND_HALF_UP)


def to_decimal_str(val: Decimal | None) -> str | None:
    """Convert a Decimal to an exact string representation."""
    if val is None:
        return None
    return str(val)
