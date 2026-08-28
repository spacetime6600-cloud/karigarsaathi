"""Domain models and dataclasses for Phase 15 Pricing Engine."""
from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal
from typing import Optional

from .enums import (
    ComparableStatus,
    ConfidenceLevel,
    MarginMode,
    RateType,
    SelectionType,
    ValueStatus,
)

__all__ = [
    "MarginMode",
    "ComparableStatus",
    "ValueStatus",
    "RateType",
    "ConfidenceLevel",
    "SelectionType",
    "MaterialInput",
    "LabourInput",
    "OverheadInput",
    "PackagingInput",
    "ComparableInput",
    "MarkupScenarioInput",
    "PricingInput",
    "MaterialCalculation",
    "LabourCalculation",
    "OverheadCalculation",
    "PackagingCalculation",
    "ScenarioEstimate",
    "ComparableEligibility",
    "ComparableAdjustmentDetail",
    "SuggestedRange",
    "RoundingResult",
    "PricingResult",
    "ConfidenceResult",
    "ArtisanDecisionResult",
]


@dataclass(frozen=True)
class MaterialInput:
    name: str
    quantity: Decimal
    unit: str
    cost_per_unit: Decimal
    source_note: Optional[str] = None
    value_status: ValueStatus = ValueStatus.EXACT
    is_batch: bool = False
    batch_quantity: Optional[Decimal] = None


@dataclass(frozen=True)
class LabourInput:
    task_name: str
    hours: Decimal
    hourly_rate: Decimal
    rate_source: str
    rate_type: RateType = RateType.PRESET
    hours_status: ValueStatus = ValueStatus.EXACT
    note: Optional[str] = None


@dataclass(frozen=True)
class OverheadInput:
    name: str
    amount: Decimal
    explanation: Optional[str] = None
    value_status: ValueStatus = ValueStatus.EXACT


@dataclass(frozen=True)
class PackagingInput:
    name: str
    cost_per_unit: Decimal
    explanation: Optional[str] = None
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
    verification_date: Optional[date] = None
    verified_by: Optional[str] = None
    verification_note: Optional[str] = None
    geographic_context: Optional[str] = None
    similarity_note: Optional[str] = None
    evidence_reference: Optional[str] = None
    selected: bool = False
    dimensions: Optional[str] = None
    is_completed_sale: bool = False
    shipping_included: Optional[bool] = None
    tax_included: Optional[bool] = None


@dataclass(frozen=True)
class MarkupScenarioInput:
    name: str  # "low", "base", "high"
    markup_percentage: Decimal  # e.g. 10.0, 20.0, 30.0
    label: Optional[str] = None  # e.g. "Low (10%)", "Fair Trade Base (20%)"


@dataclass(frozen=True)
class PricingInput:
    materials: tuple[MaterialInput, ...]
    labour: tuple[LabourInput, ...]
    overhead: tuple[OverheadInput, ...]
    packaging: tuple[PackagingInput, ...] = field(default_factory=tuple)
    margin_mode: MarginMode = MarginMode.PERCENTAGE_MARKUP
    margin_value: Decimal = Decimal("20")  # Default base markup %
    scenarios: tuple[MarkupScenarioInput, ...] = field(default_factory=tuple)
    comparables: tuple[ComparableInput, ...] = field(default_factory=tuple)
    comparable_influence: Decimal = Decimal("20")
    max_adjustment: Decimal = Decimal("10")
    low_buffer: Decimal = Decimal("5")
    high_buffer: Decimal = Decimal("10")
    calculation_date: date = field(default_factory=date.today)
    currency: str = "INR"
    locale: str = "en"
    artisan_final_price: Optional[Decimal] = None
    artisan_selection_type: Optional[SelectionType] = None
    artisan_override_reason: Optional[str] = None
    batch_quantity: Optional[Decimal] = None


# --- Output Calculations ---

@dataclass(frozen=True)
class MaterialCalculation:
    name: str
    unit_quantity: Decimal
    unit: str
    cost_per_unit: Decimal
    line_total: Decimal
    is_batch: bool
    batch_quantity: Optional[Decimal]
    raw_quantity: Decimal
    source_note: Optional[str]
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
    note: Optional[str]


@dataclass(frozen=True)
class OverheadCalculation:
    name: str
    amount: Decimal
    explanation: Optional[str]
    value_status: ValueStatus


@dataclass(frozen=True)
class PackagingCalculation:
    name: str
    cost_per_unit: Decimal
    explanation: Optional[str]
    value_status: ValueStatus


@dataclass(frozen=True)
class ScenarioEstimate:
    name: str
    label: str
    markup_percentage: Decimal
    cost_floor: Decimal
    profit_amount: Decimal
    market_adjustment: Decimal
    resulting_price_unrounded: Decimal
    resulting_price_rounded: Decimal
    rounding_difference: Decimal


@dataclass(frozen=True)
class ComparableEligibility:
    comparable: ComparableInput
    eligible: bool
    exclusion_reason: Optional[str] = None


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
    packaging: tuple[PackagingCalculation, ...]
    total_packaging: Decimal
    cost_floor: Decimal  # Production cost floor (Materials + Labour + Overhead + Packaging)
    margin_mode: MarginMode
    margin_input: Decimal
    profit_amount: Decimal
    cost_based_base_price: Decimal
    comparable_adjustment: ComparableAdjustmentDetail
    suggested_base_price: Decimal
    suggested_range: SuggestedRange
    scenarios: tuple[ScenarioEstimate, ...]
    assumptions: tuple[str, ...]
    warnings: tuple[str, ...]
    missing_inputs: tuple[str, ...]
    confidence_level: ConfidenceLevel
    confidence_reasons: tuple[str, ...]
    explanation_text: str
    artisan_final_price: Optional[Decimal] = None
    artisan_selection_type: Optional[SelectionType] = None
    artisan_override_reason: Optional[str] = None
    is_below_cost: bool = False
    shortfall_amount: Decimal = Decimal("0")

    @property
    def production_cost(self) -> Decimal:
        """Alias for cost_floor for backwards compatibility."""
        return self.cost_floor

    @property
    def margin_amount(self) -> Decimal:
        """Alias for profit_amount for backwards compatibility."""
        return self.profit_amount


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
    override_reason: Optional[str]
    warning: Optional[str] = None
