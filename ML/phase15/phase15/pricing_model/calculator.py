from dataclasses import replace
from datetime import date
from decimal import Decimal
from statistics import median

from pricing_model.constants import (
    CURRENCY,
    DEFAULT_FRESHNESS_DAYS,
    FORMULA_VERSION,
)
from pricing_model.enums import ComparableStatus
from pricing_model.models import (
    ComparableAdjustmentDetail,
    ComparableEligibility,
    ComparableInput,
    ConfidenceLevel,
    LabourCalculation,
    LabourInput,
    MarginMode,
    MaterialCalculation,
    MaterialInput,
    OverheadCalculation,
    OverheadInput,
    PricingInput,
    PricingResult,
    SelectionType,
    SuggestedRange,
)
from pricing_model.rounding import round_half_up_value
from pricing_model.validation import validate_pricing_input


def calculate_price(request: PricingInput) -> PricingResult:
    validate_pricing_input(request)

    assumptions: list[str] = []
    warnings: list[str] = []

    material_calcs, total_material_cost = _calculate_materials(request.materials, assumptions)
    labour_calcs, total_labour_cost = _calculate_labour(request.labour, assumptions)
    overhead_calcs, total_overhead = _calculate_overhead(request.overhead, assumptions)

    production_cost = total_material_cost + total_labour_cost + total_overhead

    margin_amount = _calculate_margin(
        request.margin_mode,
        request.margin_value,
        production_cost,
        assumptions
    )

    cost_based_base_price = production_cost + margin_amount

    comparable_detail = _calculate_comparable_adjustment(
        request,
        cost_based_base_price,
        production_cost,
        warnings,
        assumptions
    )

    suggested_base_price = max(production_cost, cost_based_base_price + comparable_detail.final_adjustment)

    suggested_range = _calculate_suggested_range(
        suggested_base_price,
        production_cost,
        request.low_buffer,
        request.high_buffer
    )

    confidence_level, confidence_reasons = _classify_confidence_internal(request, comparable_detail.eligible_comparables)

    artisan_final_price = request.artisan_final_price
    artisan_selection_type = request.artisan_selection_type
    artisan_override_reason = request.artisan_override_reason

    if artisan_final_price is not None:
        warnings.append(
            "Artisan final price preserved from previous calculation; "
            "suggested range may have changed."
        )

    return PricingResult(
        formula_version=FORMULA_VERSION,
        currency=CURRENCY,
        locale=request.locale,
        calculation_date=request.calculation_date,
        materials=material_calcs,
        total_material_cost=total_material_cost,
        labour=labour_calcs,
        total_labour_cost=total_labour_cost,
        overhead=overhead_calcs,
        total_overhead=total_overhead,
        production_cost=production_cost,
        margin_mode=request.margin_mode,
        margin_input=request.margin_value,
        margin_amount=margin_amount,
        cost_based_base_price=cost_based_base_price,
        comparable_adjustment=comparable_detail,
        suggested_base_price=suggested_base_price,
        suggested_range=suggested_range,
        assumptions=tuple(assumptions),
        warnings=tuple(warnings),
        confidence_level=confidence_level,
        confidence_reasons=tuple(confidence_reasons),
        artisan_final_price=artisan_final_price,
        artisan_selection_type=artisan_selection_type,
        artisan_override_reason=artisan_override_reason,
    )


def _calculate_materials(
    materials: tuple[MaterialInput, ...],
    assumptions: list[str]
) -> tuple[tuple[MaterialCalculation, ...], Decimal]:
    calcs: list[MaterialCalculation] = []
    total = Decimal("0")

    for m in materials:
        line_total = m.quantity * m.cost_per_unit
        calcs.append(MaterialCalculation(
            name=m.name,
            quantity=m.quantity,
            unit=m.unit,
            cost_per_unit=m.cost_per_unit,
            line_total=line_total,
            source_note=m.source_note,
            value_status=m.value_status
        ))
        total += line_total

        if m.value_status == "estimated":
            assumptions.append(f"Material '{m.name}' quantity or cost is estimated")

    return tuple(calcs), total


def _calculate_labour(
    labour: tuple[LabourInput, ...],
    assumptions: list[str]
) -> tuple[tuple[LabourCalculation, ...], Decimal]:
    calcs: list[LabourCalculation] = []
    total = Decimal("0")

    for task in labour:
        line_total = task.hours * task.hourly_rate
        calcs.append(LabourCalculation(
            task_name=task.task_name,
            hours=task.hours,
            hourly_rate=task.hourly_rate,
            line_total=line_total,
            rate_source=task.rate_source,
            rate_type=task.rate_type,
            hours_status=task.hours_status,
            note=task.note
        ))
        total += line_total

        if task.hours_status == "estimated":
            assumptions.append(f"Labour task '{task.task_name}' hours are estimated")

    return tuple(calcs), total


def _calculate_overhead(
    overhead: tuple[OverheadInput, ...],
    assumptions: list[str]
) -> tuple[tuple[OverheadCalculation, ...], Decimal]:
    calcs: list[OverheadCalculation] = []
    total = Decimal("0")

    for o in overhead:
        calcs.append(OverheadCalculation(
            name=o.name,
            amount=o.amount,
            explanation=o.explanation,
            value_status=o.value_status
        ))
        total += o.amount

        if o.value_status == "estimated":
            assumptions.append(f"Overhead '{o.name}' amount is estimated")
        elif o.explanation is None:
            assumptions.append(f"Overhead '{o.name}' has no explanation")

    return tuple(calcs), total


def _calculate_margin(
    margin_mode: MarginMode,
    margin_value: Decimal,
    production_cost: Decimal,
    assumptions: list[str]
) -> Decimal:
    if margin_mode.value == "percentage_markup":
        margin_amount = production_cost * margin_value / Decimal("100")
        assumptions.append(
            f"Artisan margin: {margin_value}% markup on production cost "
            f"(not net profit margin)"
        )
    else:
        margin_amount = margin_value
        assumptions.append(f"Artisan margin: fixed INR {margin_value}")

    return margin_amount


def _calculate_comparable_adjustment(
    request: PricingInput,
    cost_based_base_price: Decimal,
    production_cost: Decimal,
    warnings: list[str],
    assumptions: list[str]
) -> ComparableAdjustmentDetail:
    eligible = []
    excluded = []

    for comp in request.comparables:
        eligibility = _check_comparable_eligibility(comp, request.calculation_date)
        if eligibility.eligible:
            eligible.append(comp)
        else:
            excluded.append(eligibility)
            warnings.append(f"Comparable '{comp.id}' excluded: {eligibility.exclusion_reason}")

    if not eligible:
        assumptions.append("No eligible verified comparables selected; comparable adjustment = ₹0")
        return ComparableAdjustmentDetail(
            eligible_comparables=(),
            comparable_median=Decimal("0"),
            raw_gap=Decimal("0"),
            influence_percentage=request.comparable_influence,
            uncapped_adjustment=Decimal("0"),
            adjustment_cap=Decimal("0"),
            cap_applied=False,
            final_adjustment=Decimal("0"),
            production_cost_floor=production_cost
        )

    prices = [c.listed_price for c in eligible]
    comparable_median = Decimal(str(median(prices)))
    raw_gap = comparable_median - cost_based_base_price
    uncapped_adjustment = raw_gap * request.comparable_influence / Decimal("100")
    adjustment_cap = cost_based_base_price * request.max_adjustment / Decimal("100")

    if uncapped_adjustment > adjustment_cap:
        final_adjustment = adjustment_cap
        cap_applied = True
    elif uncapped_adjustment < -adjustment_cap:
        final_adjustment = -adjustment_cap
        cap_applied = True
    else:
        final_adjustment = uncapped_adjustment
        cap_applied = False

    if cap_applied:
        warnings.append(
            f"Comparable adjustment capped at ±{request.max_adjustment}% "
            f"of cost-based base price"
        )

    assumptions.append(
        f"Comparable median: ₹{comparable_median}; "
        f"raw gap: ₹{raw_gap}; "
        f"influence: {request.comparable_influence}%; "
        f"uncapped adjustment: ₹{uncapped_adjustment}; "
        f"cap: ±₹{adjustment_cap}; "
        f"final adjustment: ₹{final_adjustment}"
    )

    return ComparableAdjustmentDetail(
        eligible_comparables=tuple(eligible),
        comparable_median=comparable_median,
        raw_gap=raw_gap,
        influence_percentage=request.comparable_influence,
        uncapped_adjustment=uncapped_adjustment,
        adjustment_cap=adjustment_cap,
        cap_applied=cap_applied,
        final_adjustment=final_adjustment,
        production_cost_floor=production_cost
    )


def _check_comparable_eligibility(
    comp: ComparableInput,
    calculation_date: date
) -> ComparableEligibility:
    if not comp.selected:
        return ComparableEligibility(
            comparable=comp,
            eligible=False,
            exclusion_reason="Not selected"
        )

    if comp.status != ComparableStatus.VERIFIED:
        return ComparableEligibility(
            comparable=comp,
            eligible=False,
            exclusion_reason=f"Status is {comp.status.value}, not verified"
        )

    if comp.verification_date is None:
        return ComparableEligibility(
            comparable=comp,
            eligible=False,
            exclusion_reason="Missing verification date"
        )

    if comp.verified_by is None or not comp.verified_by.strip():
        return ComparableEligibility(
            comparable=comp,
            eligible=False,
            exclusion_reason="Missing verified-by identifier"
        )

    if comp.verification_note is None or not comp.verification_note.strip():
        return ComparableEligibility(
            comparable=comp,
            eligible=False,
            exclusion_reason="Missing verification note"
        )

    if comp.evidence_reference is None or not comp.evidence_reference.strip():
        return ComparableEligibility(
            comparable=comp,
            eligible=False,
            exclusion_reason="Missing evidence reference"
        )

    days_diff = (calculation_date - comp.capture_date).days
    if days_diff > DEFAULT_FRESHNESS_DAYS:
        return ComparableEligibility(
            comparable=comp,
            eligible=False,
            exclusion_reason=f"Stale: captured {days_diff} days ago (max {DEFAULT_FRESHNESS_DAYS})"
        )

    return ComparableEligibility(comparable=comp, eligible=True)


def _calculate_suggested_range(
    suggested_base: Decimal,
    production_cost: Decimal,
    low_buffer: Decimal,
    high_buffer: Decimal
) -> SuggestedRange:
    low_unrounded = max(production_cost, suggested_base * (Decimal("1") - low_buffer / Decimal("100")))
    high_unrounded = suggested_base * (Decimal("1") + high_buffer / Decimal("100"))

    low_rounded = round_half_up_value(low_unrounded)
    base_rounded = round_half_up_value(suggested_base)
    high_rounded = round_half_up_value(high_unrounded)

    return SuggestedRange(
        suggested_low_unrounded=low_unrounded,
        suggested_base_unrounded=suggested_base,
        suggested_high_unrounded=high_unrounded,
        suggested_low_rounded=low_rounded,
        suggested_base_rounded=base_rounded,
        suggested_high_rounded=high_rounded,
        low_buffer=low_buffer,
        high_buffer=high_buffer,
        rounding_differences=(
            low_rounded - low_unrounded,
            base_rounded - suggested_base,
            high_rounded - high_unrounded
        )
    )


def _classify_confidence_internal(
    request: PricingInput,
    eligible_comparables: tuple[ComparableInput, ...]
) -> tuple[ConfidenceLevel, tuple[str, ...]]:
    reasons = []

    all_exact_materials = all(m.value_status.value == "exact" for m in request.materials)
    all_exact_labour = all(task.hours_status.value == "exact" for task in request.labour)
    all_labour_rates = all(task.rate_source.strip() for task in request.labour)
    all_overhead_explained = all(o.explanation and o.explanation.strip() for o in request.overhead)
    margin_explicit = request.margin_mode is not None
    enough_comparables = len(eligible_comparables) >= 3

    if all_exact_materials and all_exact_labour and all_labour_rates and all_overhead_explained and margin_explicit and enough_comparables:
        reasons.append("All cost inputs are exact")
        reasons.append("All labour rates have sources")
        reasons.append("All overhead items have explanations")
        reasons.append("Margin mode explicitly selected")
        reasons.append(f"{len(eligible_comparables)} fresh verified comparables selected")
        return ConfidenceLevel.HIGH, tuple(reasons)

    has_estimates = any(m.value_status.value == "estimated" for m in request.materials) or \
                    any(task.hours_status.value == "estimated" for task in request.labour) or \
                    any(o.value_status.value == "estimated" for o in request.overhead)
    missing_rate_source = any(not task.rate_source.strip() for task in request.labour)
    few_comparables = len(eligible_comparables) > 0 and len(eligible_comparables) <= 2
    missing_overhead_explanation = not all_overhead_explained

    issue_count = 0
    if has_estimates:
        reasons.append("Some inputs are estimated")
        issue_count += 1
    if missing_rate_source:
        reasons.append("Missing labour rate source")
        issue_count += 1
    if few_comparables:
        reasons.append(f"Only {len(eligible_comparables)} eligible comparables")
        issue_count += 1
    if missing_overhead_explanation:
        reasons.append("Some overhead items lack explanations")
        issue_count += 1

    if issue_count >= 2:
        reasons.append("Multiple input quality issues compound uncertainty")
        return ConfidenceLevel.LOW, tuple(reasons)

    if issue_count == 1:
        return ConfidenceLevel.MEDIUM, tuple(reasons)

    reasons.append("Required cost inputs complete but confidence criteria not fully met")
    return ConfidenceLevel.MEDIUM, tuple(reasons)


def apply_artisan_decision(
    result: PricingResult,
    final_price: Decimal,
    selection_type: SelectionType,
    override_reason: str | None = None
) -> PricingResult:
    return replace(
        result,
        artisan_final_price=final_price,
        artisan_selection_type=selection_type,
        artisan_override_reason=override_reason
    )
