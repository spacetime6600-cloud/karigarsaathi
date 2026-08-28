"""Deterministic Core Pricing Engine for Phase 15 Explainable Fair Pricing."""
from dataclasses import replace
from datetime import date
from decimal import Decimal
from statistics import median
from typing import Sequence

from .constants import (
    CURRENCY,
    DEFAULT_FRESHNESS_DAYS,
    FORMULA_VERSION,
)
from .enums import (
    ComparableStatus,
    ConfidenceLevel,
    MarginMode,
    SelectionType,
)
from .explanations import generate_explanation_text
from .models import (
    ComparableAdjustmentDetail,
    ComparableEligibility,
    ComparableInput,
    LabourCalculation,
    LabourInput,
    MarkupScenarioInput,
    MaterialCalculation,
    MaterialInput,
    OverheadCalculation,
    OverheadInput,
    PackagingCalculation,
    PackagingInput,
    PricingInput,
    PricingResult,
    ScenarioEstimate,
    SuggestedRange,
)
from .rounding import round_half_up_value
from .validation import validate_pricing_input


def calculate_price(request: PricingInput) -> PricingResult:
    """Execute pure, deterministic, decimal-safe fair price calculation."""
    validate_pricing_input(request)

    assumptions: list[str] = []
    warnings: list[str] = []
    missing_inputs: list[str] = []

    # 1. Materials Calculation
    material_calcs, total_material_cost = _calculate_materials(request.materials, assumptions, missing_inputs)

    # 2. Labour Calculation
    labour_calcs, total_labour_cost = _calculate_labour(request.labour, assumptions, missing_inputs)

    # 3. Overhead Calculation
    overhead_calcs, total_overhead = _calculate_overhead(request.overhead, assumptions, missing_inputs)

    # 4. Packaging Calculation
    packaging_calcs, total_packaging = _calculate_packaging(request.packaging, assumptions, missing_inputs)

    # 5. Production Cost Floor
    cost_floor = total_material_cost + total_labour_cost + total_overhead + total_packaging

    # 6. Artisan Margin / Profit
    profit_amount = _calculate_margin(
        request.margin_mode,
        request.margin_value,
        cost_floor,
        assumptions
    )
    cost_based_base_price = cost_floor + profit_amount

    # 7. Scenarios Calculation
    scenario_estimates = _calculate_scenarios(
        cost_floor,
        request.scenarios,
        request.margin_mode,
        request.margin_value
    )

    # 8. Verified Comparables Adjustment
    comparable_detail = _calculate_comparable_adjustment(
        request,
        cost_based_base_price,
        cost_floor,
        warnings,
        assumptions
    )

    # Floor protection: suggested base price never drops below production cost floor
    suggested_base_price = max(cost_floor, cost_based_base_price + comparable_detail.final_adjustment)

    # 9. Suggested Range (Buffers)
    suggested_range = _calculate_suggested_range(
        suggested_base_price,
        cost_floor,
        request.low_buffer,
        request.high_buffer
    )

    # 10. Confidence Classification (Fact-based)
    confidence_level, confidence_reasons = _classify_confidence_internal(
        request,
        comparable_detail.eligible_comparables
    )

    # 11. Artisan Final Price & Shortfall
    artisan_final_price = request.artisan_final_price
    is_below_cost = False
    shortfall_amount = Decimal("0")

    if artisan_final_price is not None:
        if artisan_final_price < cost_floor:
            is_below_cost = True
            shortfall_amount = cost_floor - artisan_final_price
            warnings.append(
                f"Selected final price (₹{artisan_final_price}) is ₹{shortfall_amount:,.2f} below the cost floor (₹{cost_floor:,.2f})."
            )
        warnings.append(
            "Artisan final price preserved from previous selection; suggested range may have changed."
        )

    # 12. Explanation Text
    explanation_text = generate_explanation_text(
        materials=material_calcs,
        total_material_cost=total_material_cost,
        labour=labour_calcs,
        total_labour_cost=total_labour_cost,
        overhead=overhead_calcs,
        total_overhead=total_overhead,
        packaging=packaging_calcs,
        total_packaging=total_packaging,
        cost_floor=cost_floor,
        margin_mode=request.margin_mode,
        margin_input=request.margin_value,
        profit_amount=profit_amount,
        cost_based_base_price=cost_based_base_price,
        comparable_adj=comparable_detail,
        suggested_base_price=suggested_base_price,
        scenarios=scenario_estimates,
        missing_inputs=missing_inputs,
        warnings=warnings,
        artisan_final_price=artisan_final_price,
        locale=request.locale,
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
        packaging=packaging_calcs,
        total_packaging=total_packaging,
        cost_floor=cost_floor,
        margin_mode=request.margin_mode,
        margin_input=request.margin_value,
        profit_amount=profit_amount,
        cost_based_base_price=cost_based_base_price,
        comparable_adjustment=comparable_detail,
        suggested_base_price=suggested_base_price,
        suggested_range=suggested_range,
        scenarios=scenario_estimates,
        assumptions=tuple(assumptions),
        warnings=tuple(warnings),
        missing_inputs=tuple(missing_inputs),
        confidence_level=confidence_level,
        confidence_reasons=tuple(confidence_reasons),
        explanation_text=explanation_text,
        artisan_final_price=artisan_final_price,
        artisan_selection_type=request.artisan_selection_type,
        artisan_override_reason=request.artisan_override_reason,
        is_below_cost=is_below_cost,
        shortfall_amount=shortfall_amount,
    )


def _calculate_materials(
    materials: Sequence[MaterialInput],
    assumptions: list[str],
    missing_inputs: list[str]
) -> tuple[tuple[MaterialCalculation, ...], Decimal]:
    calcs: list[MaterialCalculation] = []
    total = Decimal("0")

    if not materials:
        missing_inputs.append("No material line items provided; material cost is ₹0.00")

    for m in materials:
        if m.is_batch and m.batch_quantity and m.batch_quantity > 0:
            unit_qty = m.quantity / m.batch_quantity
            line_total = unit_qty * m.cost_per_unit
            assumptions.append(
                f"Material '{m.name}': converted batch quantity ({m.quantity} / batch of {m.batch_quantity} = {unit_qty:.4f} per unit)"
            )
        else:
            unit_qty = m.quantity
            line_total = unit_qty * m.cost_per_unit

        calcs.append(MaterialCalculation(
            name=m.name,
            unit_quantity=unit_qty,
            unit=m.unit,
            cost_per_unit=m.cost_per_unit,
            line_total=line_total,
            is_batch=m.is_batch,
            batch_quantity=m.batch_quantity,
            raw_quantity=m.quantity,
            source_note=m.source_note,
            value_status=m.value_status
        ))
        total += line_total

        if m.value_status.value == "estimated":
            assumptions.append(f"Material '{m.name}' quantity or cost is estimated")
        if line_total == 0:
            assumptions.append(f"Material '{m.name}' cost entered as ₹0.00")

    return tuple(calcs), total


def _calculate_labour(
    labour: Sequence[LabourInput],
    assumptions: list[str],
    missing_inputs: list[str]
) -> tuple[tuple[LabourCalculation, ...], Decimal]:
    calcs: list[LabourCalculation] = []
    total = Decimal("0")

    if not labour:
        missing_inputs.append("No labour tasks provided; labour cost is ₹0.00")

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

        if task.hours_status.value == "estimated":
            assumptions.append(f"Labour task '{task.task_name}' hours are estimated")
        if not task.rate_source.strip():
            assumptions.append(f"Labour task '{task.task_name}' has no rate source specified")
        if task.hours == 0:
            assumptions.append(f"Labour task '{task.task_name}' hours entered as 0")
        if task.hourly_rate == 0:
            assumptions.append(f"Labour task '{task.task_name}' hourly wage rate entered as ₹0/hr")

    return tuple(calcs), total


def _calculate_overhead(
    overhead: Sequence[OverheadInput],
    assumptions: list[str],
    missing_inputs: list[str]
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

        if o.value_status.value == "estimated":
            assumptions.append(f"Overhead '{o.name}' amount is estimated")
        if not o.explanation or not o.explanation.strip():
            assumptions.append(f"Overhead '{o.name}' has no explanation provided")

    return tuple(calcs), total


def _calculate_packaging(
    packaging: Sequence[PackagingInput],
    assumptions: list[str],
    missing_inputs: list[str]
) -> tuple[tuple[PackagingCalculation, ...], Decimal]:
    calcs: list[PackagingCalculation] = []
    total = Decimal("0")

    for p in packaging:
        calcs.append(PackagingCalculation(
            name=p.name,
            cost_per_unit=p.cost_per_unit,
            explanation=p.explanation,
            value_status=p.value_status
        ))
        total += p.cost_per_unit

        if p.value_status.value == "estimated":
            assumptions.append(f"Packaging '{p.name}' cost is estimated")

    return tuple(calcs), total


def _calculate_margin(
    margin_mode: MarginMode,
    margin_value: Decimal,
    cost_floor: Decimal,
    assumptions: list[str]
) -> Decimal:
    if margin_mode == MarginMode.PERCENTAGE_MARKUP:
        margin_amount = cost_floor * margin_value / Decimal("100")
        assumptions.append(
            f"Artisan profit markup: {margin_value}% on cost floor of ₹{cost_floor:,.2f} = ₹{margin_amount:,.2f} "
            "(profit markup on creation cost, distinct from net profit margin)"
        )
    else:
        margin_amount = margin_value
        assumptions.append(f"Artisan profit: fixed amount of ₹{margin_value:,.2f}")

    return margin_amount


def _calculate_scenarios(
    cost_floor: Decimal,
    scenarios: Sequence[MarkupScenarioInput],
    default_mode: MarginMode,
    default_margin_value: Decimal,
) -> tuple[ScenarioEstimate, ...]:
    estimates: list[ScenarioEstimate] = []

    if not scenarios:
        # Default single base scenario
        profit = cost_floor * default_margin_value / Decimal("100") if default_mode == MarginMode.PERCENTAGE_MARKUP else default_margin_value
        unrounded = cost_floor + profit
        rounded = round_half_up_value(unrounded)
        return (
            ScenarioEstimate(
                name="base",
                label="Base Estimate",
                markup_percentage=default_margin_value,
                cost_floor=cost_floor,
                profit_amount=profit,
                market_adjustment=Decimal("0"),
                resulting_price_unrounded=unrounded,
                resulting_price_rounded=rounded,
                rounding_difference=rounded - unrounded,
            ),
        )

    for sc in scenarios:
        sc_profit = cost_floor * sc.markup_percentage / Decimal("100")
        sc_unrounded = cost_floor + sc_profit
        sc_rounded = round_half_up_value(sc_unrounded)
        label = sc.label or f"{sc.name.capitalize()} ({sc.markup_percentage}%)"

        estimates.append(ScenarioEstimate(
            name=sc.name,
            label=label,
            markup_percentage=sc.markup_percentage,
            cost_floor=cost_floor,
            profit_amount=sc_profit,
            market_adjustment=Decimal("0"),
            resulting_price_unrounded=sc_unrounded,
            resulting_price_rounded=sc_rounded,
            rounding_difference=sc_rounded - sc_unrounded,
        ))

    return tuple(estimates)


def _calculate_comparable_adjustment(
    request: PricingInput,
    cost_based_base_price: Decimal,
    cost_floor: Decimal,
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
            warnings.append(f"Comparable '{comp.id}' ({comp.product_title}) excluded: {eligibility.exclusion_reason}")

    if not eligible:
        assumptions.append("No verified eligible market comparables available; market adjustment = ₹0.00")
        return ComparableAdjustmentDetail(
            eligible_comparables=(),
            comparable_median=Decimal("0"),
            raw_gap=Decimal("0"),
            influence_percentage=request.comparable_influence,
            uncapped_adjustment=Decimal("0"),
            adjustment_cap=Decimal("0"),
            cap_applied=False,
            final_adjustment=Decimal("0"),
            production_cost_floor=cost_floor
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
            f"Comparable adjustment capped at ±{request.max_adjustment}% of cost-based price (±₹{adjustment_cap:,.2f})"
        )

    assumptions.append(
        f"Verified comparable median: ₹{comparable_median:,.2f}; "
        f"raw gap: ₹{raw_gap:,.2f}; "
        f"influence: {request.comparable_influence}%; "
        f"adjustment: ₹{final_adjustment:,.2f}"
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
        production_cost_floor=cost_floor
    )


def _check_comparable_eligibility(
    comp: ComparableInput,
    calculation_date: date
) -> ComparableEligibility:
    if not comp.selected:
        return ComparableEligibility(
            comparable=comp,
            eligible=False,
            exclusion_reason="Not selected by artisan"
        )

    if comp.status != ComparableStatus.VERIFIED:
        return ComparableEligibility(
            comparable=comp,
            eligible=False,
            exclusion_reason=f"Status is '{comp.status.value}', not verified by platform"
        )

    if comp.verification_date is None:
        return ComparableEligibility(
            comparable=comp,
            eligible=False,
            exclusion_reason="Missing verification date"
        )

    if not comp.verified_by or not comp.verified_by.strip():
        return ComparableEligibility(
            comparable=comp,
            eligible=False,
            exclusion_reason="Missing verified-by identifier"
        )

    if not comp.verification_note or not comp.verification_note.strip():
        return ComparableEligibility(
            comparable=comp,
            eligible=False,
            exclusion_reason="Missing verification note"
        )

    if not comp.evidence_reference or not comp.evidence_reference.strip():
        return ComparableEligibility(
            comparable=comp,
            eligible=False,
            exclusion_reason="Missing evidence reference / provenance"
        )

    days_diff = (calculation_date - comp.capture_date).days
    if days_diff > DEFAULT_FRESHNESS_DAYS:
        return ComparableEligibility(
            comparable=comp,
            eligible=False,
            exclusion_reason=f"Stale: captured {days_diff} days ago (max {DEFAULT_FRESHNESS_DAYS} days)"
        )

    return ComparableEligibility(comparable=comp, eligible=True)


def _calculate_suggested_range(
    suggested_base: Decimal,
    cost_floor: Decimal,
    low_buffer: Decimal,
    high_buffer: Decimal
) -> SuggestedRange:
    low_unrounded = max(cost_floor, suggested_base * (Decimal("1") - low_buffer / Decimal("100")))
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

    all_exact_materials = bool(request.materials) and all(m.value_status.value == "exact" for m in request.materials)
    all_exact_labour = bool(request.labour) and all(task.hours_status.value == "exact" for task in request.labour)
    all_labour_rates = bool(request.labour) and all(task.rate_source.strip() for task in request.labour)
    all_overhead_explained = all(o.explanation and o.explanation.strip() for o in request.overhead)
    margin_explicit = request.margin_mode is not None
    enough_comparables = len(eligible_comparables) >= 3

    if all_exact_materials and all_exact_labour and all_labour_rates and all_overhead_explained and margin_explicit and enough_comparables:
        reasons.append("All cost inputs are exact")
        reasons.append("All labour rates have documented sources")
        reasons.append("All overhead items have clear explanations")
        reasons.append("Profit markup mode is explicitly selected")
        reasons.append(f"{len(eligible_comparables)} fresh, verified comparables selected")
        return ConfidenceLevel.HIGH, tuple(reasons)

    has_estimates = any(m.value_status.value == "estimated" for m in request.materials) or \
                    any(task.hours_status.value == "estimated" for task in request.labour) or \
                    any(o.value_status.value == "estimated" for o in request.overhead)
    missing_rate_source = any(not task.rate_source.strip() for task in request.labour)
    missing_costs = not request.materials or not request.labour

    issue_count = 0
    if has_estimates:
        reasons.append("Some material, labour, or overhead costs are estimated")
        issue_count += 1
    if missing_rate_source:
        reasons.append("One or more labour tasks lack documented wage rate sources")
        issue_count += 1
    if missing_costs:
        reasons.append("Primary cost components (materials or labour) are missing or zero")
        issue_count += 1
    if len(eligible_comparables) == 0:
        reasons.append("No verified market comparison data used (rules-only baseline)")

    if issue_count >= 2:
        reasons.append("Multiple input quality or completeness gaps require artisan review")
        return ConfidenceLevel.LOW, tuple(reasons)

    if issue_count == 1:
        return ConfidenceLevel.MEDIUM, tuple(reasons)

    reasons.append("Required cost inputs complete with standard rule-based valuation")
    return ConfidenceLevel.MEDIUM, tuple(reasons)


def apply_artisan_decision(
    result: PricingResult,
    final_price: Decimal,
    selection_type: SelectionType,
    override_reason: str | None = None
) -> PricingResult:
    """Apply an artisan's explicit price choice and re-evaluate below-cost status."""
    is_below_cost = final_price < result.cost_floor
    shortfall = result.cost_floor - final_price if is_below_cost else Decimal("0")

    return replace(
        result,
        artisan_final_price=final_price,
        artisan_selection_type=selection_type,
        artisan_override_reason=override_reason,
        is_below_cost=is_below_cost,
        shortfall_amount=shortfall,
    )
