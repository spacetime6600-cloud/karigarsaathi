from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal

from pricing_model.enums import (
    ComparableStatus,
    ConfidenceLevel,
    MarginMode,
    RateType,
    SelectionType,
    ValueStatus,
)

# Re-export enums for public API
__all__ = [
    "MarginMode",
    "ComparableStatus",
    "ValueStatus",
    "RateType",
    "ConfidenceLevel",
    "SelectionType",
]


@dataclass(frozen=True)
class MaterialInput:
    name: str
    quantity: Decimal
    unit: str
    cost_per_unit: Decimal
    source_note: str | None = None
    value_status: ValueStatus = ValueStatus.EXACT


@dataclass(frozen=True)
class LabourInput:
    task_name: str
    hours: Decimal
    hourly_rate: Decimal
    rate_source: str
    rate_type: RateType = RateType.PRESET
    hours_status: ValueStatus = ValueStatus.EXACT
    note: str | None = None


@dataclass(frozen=True)
class OverheadInput:
    name: str
    amount: Decimal
    explanation: str | None = None
    value_status: ValueStatus = ValueStatus.EXACT


@dataclass(frozen=True)
class ComparableInput:
    id: str
    product_title: str
    category: str
    craft_type: str
    material: str
    listed_price: Decimal
    source_name: str
    source_reference: str
    capture_date: date
    status: ComparableStatus
    verification_date: date | None = None
    verified_by: str | None = None
    verification_note: str | None = None
    geographic_context: str | None = None
    similarity_note: str | None = None
    evidence_reference: str | None = None
    selected: bool = False
    dimensions: str | None = None


@dataclass(frozen=True)
class PricingInput:
    materials: tuple[MaterialInput, ...]
    labour: tuple[LabourInput, ...]
    overhead: tuple[OverheadInput, ...]
    margin_mode: MarginMode
    margin_value: Decimal
    comparables: tuple[ComparableInput, ...] = field(default_factory=tuple)
    comparable_influence: Decimal = Decimal("20")
    max_adjustment: Decimal = Decimal("10")
    low_buffer: Decimal = Decimal("5")
    high_buffer: Decimal = Decimal("10")
    calculation_date: date = field(default_factory=date.today)
    currency: str = "INR"
    locale: str = "en"
    artisan_final_price: Decimal | None = None
    artisan_selection_type: SelectionType | None = None
    artisan_override_reason: str | None = None


@dataclass(frozen=True)
class MaterialCalculation:
    name: str
    quantity: Decimal
    unit: str
    cost_per_unit: Decimal
    line_total: Decimal
    source_note: str | None
    value_status: ValueStatus


@dataclass(frozen=True)
class LabourCalculation:
    task_name: str
    hours: Decimal
    hourly_rate: Decimal
    line_total: Decimal
    rate_source: str
    rate_type: RateType
    hours_status: ValueStatus
    note: str | None


@dataclass(frozen=True)
class OverheadCalculation:
    name: str
    amount: Decimal
    explanation: str | None
    value_status: ValueStatus


@dataclass(frozen=True)
class ComparableEligibility:
    comparable: ComparableInput
    eligible: bool
    exclusion_reason: str | None = None


@dataclass(frozen=True)
class ComparableAdjustmentDetail:
    eligible_comparables: tuple[ComparableInput, ...]
    comparable_median: Decimal
    raw_gap: Decimal
    influence_percentage: Decimal
    uncapped_adjustment: Decimal
    adjustment_cap: Decimal
    cap_applied: bool
    final_adjustment: Decimal
    production_cost_floor: Decimal


@dataclass(frozen=True)
class SuggestedRange:
    suggested_low_unrounded: Decimal
    suggested_base_unrounded: Decimal
    suggested_high_unrounded: Decimal
    suggested_low_rounded: Decimal
    suggested_base_rounded: Decimal
    suggested_high_rounded: Decimal
    low_buffer: Decimal
    high_buffer: Decimal
    rounding_differences: tuple[Decimal, Decimal, Decimal]


@dataclass(frozen=True)
class RoundingResult:
    unrounded: Decimal
    rounded: Decimal
    difference: Decimal
    rule: str = "ROUND_HALF_UP"


@dataclass(frozen=True)
class PricingResult:
    formula_version: str
    currency: str
    locale: str
    calculation_date: date
    materials: tuple[MaterialCalculation, ...]
    total_material_cost: Decimal
    labour: tuple[LabourCalculation, ...]
    total_labour_cost: Decimal
    overhead: tuple[OverheadCalculation, ...]
    total_overhead: Decimal
    production_cost: Decimal
    margin_mode: MarginMode
    margin_input: Decimal
    margin_amount: Decimal
    cost_based_base_price: Decimal
    comparable_adjustment: ComparableAdjustmentDetail
    suggested_base_price: Decimal
    suggested_range: SuggestedRange
    assumptions: tuple[str, ...]
    warnings: tuple[str, ...]
    confidence_level: ConfidenceLevel
    confidence_reasons: tuple[str, ...]
    artisan_final_price: Decimal | None = None
    artisan_selection_type: SelectionType | None = None
    artisan_override_reason: str | None = None


@dataclass(frozen=True)
class ConfidenceResult:
    level: ConfidenceLevel
    meaning: str
    reasons: tuple[str, ...]


@dataclass(frozen=True)
class ArtisanDecisionResult:
    suggested_low: Decimal
    suggested_base: Decimal
    suggested_high: Decimal
    artisan_final_price: Decimal
    selection_type: SelectionType
    override_reason: str | None
    warning: str | None = None
