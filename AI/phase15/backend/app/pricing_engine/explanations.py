"""Explainability generator for Phase 15 Explainable Fair Pricing."""
from decimal import Decimal
from typing import Sequence

from .enums import MarginMode
from .models import (
    ComparableAdjustmentDetail,
    LabourCalculation,
    MaterialCalculation,
    OverheadCalculation,
    PackagingCalculation,
    ScenarioEstimate,
)


def generate_explanation_text(
    materials: Sequence[MaterialCalculation],
    total_material_cost: Decimal,
    labour: Sequence[LabourCalculation],
    total_labour_cost: Decimal,
    overhead: Sequence[OverheadCalculation],
    total_overhead: Decimal,
    packaging: Sequence[PackagingCalculation],
    total_packaging: Decimal,
    cost_floor: Decimal,
    margin_mode: MarginMode,
    margin_input: Decimal,
    profit_amount: Decimal,
    cost_based_base_price: Decimal,
    comparable_adj: ComparableAdjustmentDetail,
    suggested_base_price: Decimal,
    scenarios: Sequence[ScenarioEstimate],
    missing_inputs: Sequence[str],
    warnings: Sequence[str],
    artisan_final_price: Decimal | None,
    locale: str = "en",
) -> str:
    """Generate clear, fact-grounded natural explanation of the calculation."""
    sections = []

    # 1. Cost Floor Breakdown
    cost_lines = [
        "### 1. Cost of Creation Breakdown",
        f"- **Materials**: ₹{total_material_cost:,.2f} across {len(materials)} line items.",
    ]
    for m in materials:
        if m.is_batch and m.batch_quantity:
            cost_lines.append(f"  • {m.name}: {m.raw_quantity} {m.unit} for batch of {m.batch_quantity} (unit qty: {m.unit_quantity:.4f}) @ ₹{m.cost_per_unit}/unit = ₹{m.line_total:,.2f}")
        else:
            cost_lines.append(f"  • {m.name}: {m.unit_quantity} {m.unit} @ ₹{m.cost_per_unit}/{m.unit} = ₹{m.line_total:,.2f}")

    cost_lines.append(f"- **Labour**: ₹{total_labour_cost:,.2f} based on artisan-selected hours and rates.")
    for l in labour:
        cost_lines.append(f"  • {l.task_name}: {l.hours} hrs @ ₹{l.hourly_rate}/hr (Source: {l.rate_source}) = ₹{l.line_total:,.2f}")

    if overhead:
        cost_lines.append(f"- **Allocated Overhead**: ₹{total_overhead:,.2f}.")
        for o in overhead:
            exp = f" ({o.explanation})" if o.explanation else ""
            cost_lines.append(f"  • {o.name}: ₹{o.amount:,.2f}{exp}")
    else:
        cost_lines.append("- **Allocated Overhead**: ₹0.00 (No overhead items added).")

    if packaging:
        cost_lines.append(f"- **Packaging & Logistics**: ₹{total_packaging:,.2f}.")
        for p in packaging:
            exp = f" ({p.explanation})" if p.explanation else ""
            cost_lines.append(f"  • {p.name}: ₹{p.cost_per_unit:,.2f}{exp}")
    else:
        cost_lines.append("- **Packaging & Logistics**: ₹0.00 (No packaging costs entered).")

    cost_lines.append(f"\n**Total Production Cost Floor**: **₹{cost_floor:,.2f}** (Minimum required to cover creation costs)")
    sections.append("\n".join(cost_lines))

    # 2. Artisan Profit Markup
    if margin_mode == MarginMode.PERCENTAGE_MARKUP:
        margin_desc = f"Applied **{margin_input}% Profit Markup** on the cost floor (₹{cost_floor:,.2f} × {margin_input}% = ₹{profit_amount:,.2f})."
    else:
        margin_desc = f"Applied a fixed artisan profit amount of **₹{margin_input:,.2f}**."

    margin_sec = [
        "### 2. Artisan Profit & Base Valuation",
        margin_desc,
        f"- **Cost-Based Base Estimate**: **₹{cost_based_base_price:,.2f}**",
        "*(Note: Profit markup is calculated directly on creation costs, distinct from net profit margin).* ",
    ]
    sections.append("\n".join(margin_sec))

    # 3. Explicit Scenarios
    if scenarios:
        sc_lines = ["### 3. Transparent Markup Scenarios"]
        for s in scenarios:
            sc_lines.append(f"- **{s.label}** ({s.markup_percentage}% markup): ₹{s.cost_floor:,.2f} floor + ₹{s.profit_amount:,.2f} profit = **₹{s.resulting_price_rounded:,.0f}**")
        sections.append("\n".join(sc_lines))

    # 4. Market Comparables Evidence
    comp_lines = ["### 4. Market Evidence & Alignment"]
    if comparable_adj.eligible_comparables:
        n_comp = len(comparable_adj.eligible_comparables)
        comp_lines.append(f"- Evaluated **{n_comp} verified comparable artisan listings**.")
        comp_lines.append(f"- Comparable median price: ₹{comparable_adj.comparable_median:,.2f}.")
        comp_lines.append(f"- Market adjustment: ₹{comparable_adj.final_adjustment:,.2f} (influence: {comparable_adj.influence_percentage}%).")
        comp_lines.append(f"- Final suggested base price: **₹{suggested_base_price:,.2f}**.")
    else:
        comp_lines.append("- **No verified market comparison available.** Price calculation is strictly cost-plus-markup grounded on your authentic inputs.")
    sections.append("\n".join(comp_lines))

    # 5. Warnings & Missing Inputs
    if missing_inputs or warnings:
        warn_lines = ["### 5. Input Notes & Transparency"]
        for m in missing_inputs:
            warn_lines.append(f"- ℹ️ *Missing Cost Item*: {m}")
        for w in warnings:
            warn_lines.append(f"- ⚠️ *Note*: {w}")
        sections.append("\n".join(warn_lines))

    # 6. Artisan Control & Below-Cost Notice
    if artisan_final_price is not None:
        ctrl_lines = ["### 6. Artisan Final Selected Price"]
        if artisan_final_price < cost_floor:
            shortfall = cost_floor - artisan_final_price
            ctrl_lines.append(
                f"- ⚠️ **Below Cost Floor Warning**: Selected price **₹{artisan_final_price:,.2f}** is "
                f"**₹{shortfall:,.2f} below** the creation cost floor of ₹{cost_floor:,.2f}. "
                "This means creation costs will not be fully recovered without external subsidy."
            )
        else:
            profit_earned = artisan_final_price - cost_floor
            ctrl_lines.append(
                f"- Selected selling price: **₹{artisan_final_price:,.2f}** "
                f"(generates ₹{profit_earned:,.2f} profit above the cost floor)."
            )
        sections.append("\n".join(ctrl_lines))

    return "\n\n".join(sections)
