from datetime import date

from pricing_model.constants import DEFAULT_FRESHNESS_DAYS
from pricing_model.enums import ComparableStatus
from pricing_model.models import ComparableInput, ConfidenceLevel, ConfidenceResult, PricingInput


def classify_confidence(
    request: PricingInput,
    eligible_selected_comparables: list[ComparableInput]
) -> ConfidenceResult:
    reasons = []

    all_exact_materials = all(m.value_status.value == "exact" for m in request.materials)
    all_exact_labour = all(task.hours_status.value == "exact" for task in request.labour)
    all_labour_rates = all(task.rate_source.strip() for task in request.labour)
    all_overhead_explained = all(o.explanation and o.explanation.strip() for o in request.overhead)
    margin_explicit = request.margin_mode is not None
    enough_comparables = len(eligible_selected_comparables) >= 3

    if all_exact_materials and all_exact_labour and all_labour_rates and all_overhead_explained and margin_explicit and enough_comparables:
        reasons.append("All cost inputs are exact")
        reasons.append("All labour rates have sources")
        reasons.append("All overhead items have explanations")
        reasons.append("Margin mode explicitly selected")
        reasons.append(f"{len(eligible_selected_comparables)} fresh verified comparables selected")
        return ConfidenceResult(
            level=ConfidenceLevel.HIGH,
            meaning="Input-quality confidence, not guaranteed market accuracy.",
            reasons=tuple(reasons)
        )

    has_estimates = any(m.value_status.value == "estimated" for m in request.materials) or \
                    any(task.hours_status.value == "estimated" for task in request.labour) or \
                    any(o.value_status.value == "estimated" for o in request.overhead)
    missing_rate_source = any(not task.rate_source.strip() for task in request.labour)
    few_comparables = len(eligible_selected_comparables) > 0 and len(eligible_selected_comparables) <= 2
    missing_overhead_explanation = not all_overhead_explained

    issue_count = 0
    if has_estimates:
        reasons.append("Some inputs are estimated")
        issue_count += 1
    if missing_rate_source:
        reasons.append("Missing labour rate source")
        issue_count += 1
    if few_comparables:
        reasons.append(f"Only {len(eligible_selected_comparables)} eligible comparables")
        issue_count += 1
    if missing_overhead_explanation:
        reasons.append("Some overhead items lack explanations")
        issue_count += 1

    # LOW: multiple quality issues compound
    if issue_count >= 2:
        reasons.append("Multiple input quality issues compound uncertainty")
        return ConfidenceResult(
            level=ConfidenceLevel.LOW,
            meaning="Input-quality confidence, not guaranteed market accuracy.",
            reasons=tuple(reasons)
        )

    # MEDIUM: single quality issue with complete required inputs
    if issue_count == 1:
        return ConfidenceResult(
            level=ConfidenceLevel.MEDIUM,
            meaning="Input-quality confidence, not guaranteed market accuracy.",
            reasons=tuple(reasons)
        )

    # No issues but not HIGH (e.g., no comparables selected but no other issues)
    reasons.append("Required cost inputs complete but confidence criteria not fully met")
    return ConfidenceResult(
        level=ConfidenceLevel.MEDIUM,
        meaning="Input-quality confidence, not guaranteed market accuracy.",
        reasons=tuple(reasons)
    )


def get_eligible_comparables(
    comparables: list[ComparableInput],
    calculation_date: date
) -> list[ComparableInput]:
    eligible = []
    for comp in comparables:
        if not comp.selected:
            continue
        if comp.status != ComparableStatus.VERIFIED:
            continue
        if comp.verification_date is None:
            continue
        if not comp.verified_by or not comp.verified_by.strip():
            continue
        if not comp.verification_note or not comp.verification_note.strip():
            continue
        if not comp.evidence_reference or not comp.evidence_reference.strip():
            continue

        days_diff = (calculation_date - comp.capture_date).days
        if days_diff > DEFAULT_FRESHNESS_DAYS:
            continue

        eligible.append(comp)

    return eligible
