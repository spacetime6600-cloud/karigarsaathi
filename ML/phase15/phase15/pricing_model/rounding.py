from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal


@dataclass(frozen=True)
class RoundingResult:
    unrounded: Decimal
    rounded: Decimal
    difference: Decimal
    rule: str = "ROUND_HALF_UP"


def round_half_up(value: Decimal) -> RoundingResult:
    rounded = value.quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    difference = rounded - value
    return RoundingResult(
        unrounded=value,
        rounded=rounded,
        difference=difference,
        rule="ROUND_HALF_UP"
    )


def round_half_up_value(value: Decimal) -> Decimal:
    return value.quantize(Decimal("1"), rounding=ROUND_HALF_UP)
