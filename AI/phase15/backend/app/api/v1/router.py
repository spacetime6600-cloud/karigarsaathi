"""FastAPI Router for Phase 15 Explainable Fair Price Assistant."""
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...config import settings
from ...db.database import get_db
from ...db.models import PricingFeedbackRecord
from ...pricing_engine import (
    ComparableInput,
    LabourInput,
    MarkupScenarioInput,
    MaterialInput,
    OverheadInput,
    PackagingInput,
    PricingInput,
    calculate_price,
    validate_pricing_input,
)
from ...pricing_engine.exceptions import PricingModelError
from ...security import get_current_artisan_uid
from .schemas import (
    EstimateRequestSchema,
    EstimateResponseSchema,
    FeedbackRequestSchema,
    FeedbackResponseSchema,
    ValidationResponseSchema,
)

router = APIRouter(prefix="/api/v1/pricing", tags=["Fair Pricing Engine"])


def _to_domain_input(req: EstimateRequestSchema) -> PricingInput:
    """Map Pydantic request schema to pure Decimal domain input."""
    materials = tuple(
        MaterialInput(
            name=m.name,
            quantity=m.quantity,
            unit=m.unit,
            cost_per_unit=m.cost_per_unit,
            source_note=m.source_note,
            value_status=m.value_status,
            is_batch=m.is_batch,
            batch_quantity=m.batch_quantity,
        )
        for m in req.materials
    )

    labour = tuple(
        LabourInput(
            task_name=l.task_name,
            hours=l.hours,
            hourly_rate=l.hourly_rate,
            rate_source=l.rate_source,
            rate_type=l.rate_type,
            hours_status=l.hours_status,
            note=l.note,
        )
        for l in req.labour
    )

    overhead = tuple(
        OverheadInput(
            name=o.name,
            amount=o.amount,
            explanation=o.explanation,
            value_status=o.value_status,
        )
        for o in req.overhead
    )

    packaging = tuple(
        PackagingInput(
            name=p.name,
            cost_per_unit=p.cost_per_unit,
            explanation=p.explanation,
            value_status=p.value_status,
        )
        for p in req.packaging
    )

    scenarios = tuple(
        MarkupScenarioInput(
            name=s.name,
            markup_percentage=s.markup_percentage,
            label=s.label,
        )
        for s in req.scenarios
    )

    comparables = tuple(
        ComparableInput(
            id=c.id,
            product_title=c.product_title,
            category=c.category,
            craft_type=c.craft_type,
            material=c.material,
            listed_price=c.listed_price,
            source_name=c.source_name,
            source_reference=c.source_reference,
            capture_date=c.capture_date,
            status=c.status,
            verification_date=c.verification_date,
            verified_by=c.verified_by,
            verification_note=c.verification_note,
            geographic_context=c.geographic_context,
            similarity_note=c.similarity_note,
            evidence_reference=c.evidence_reference,
            selected=c.selected,
            dimensions=c.dimensions,
            is_completed_sale=c.is_completed_sale,
            shipping_included=c.shipping_included,
            tax_included=c.tax_included,
        )
        for c in req.comparables
    )

    return PricingInput(
        materials=materials,
        labour=labour,
        overhead=overhead,
        packaging=packaging,
        margin_mode=req.margin_mode,
        margin_value=req.margin_value,
        scenarios=scenarios,
        comparables=comparables,
        comparable_influence=req.comparable_influence,
        max_adjustment=req.max_adjustment,
        low_buffer=req.low_buffer,
        high_buffer=req.high_buffer,
        currency=req.currency,
        locale=req.locale,
        artisan_final_price=req.artisan_final_price,
        artisan_selection_type=req.artisan_selection_type,
        artisan_override_reason=req.artisan_override_reason,
    )


@router.post("/estimate", response_model=EstimateResponseSchema)
async def estimate_price(req: EstimateRequestSchema) -> EstimateResponseSchema:
    """Calculate transparent, deterministic fair price estimate with complete cost breakdown."""
    try:
        domain_input = _to_domain_input(req)
        res = calculate_price(domain_input)
    except PricingModelError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": type(e).__name__, "message": str(e)},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "CalculationError", "message": str(e)},
        )

    # Format response dictionary cleanly
    return EstimateResponseSchema(
        formula_version=res.formula_version,
        currency=res.currency,
        locale=res.locale,
        calculation_date=res.calculation_date.isoformat(),
        cost_floor=float(res.cost_floor),
        total_material_cost=float(res.total_material_cost),
        total_labour_cost=float(res.total_labour_cost),
        total_overhead=float(res.total_overhead),
        total_packaging=float(res.total_packaging),
        margin_mode=res.margin_mode.value,
        margin_input=float(res.margin_input),
        profit_amount=float(res.profit_amount),
        cost_based_base_price=float(res.cost_based_base_price),
        suggested_base_price=float(res.suggested_base_price),
        suggested_range={
            "suggested_low_rounded": float(res.suggested_range.suggested_low_rounded),
            "suggested_base_rounded": float(res.suggested_range.suggested_base_rounded),
            "suggested_high_rounded": float(res.suggested_range.suggested_high_rounded),
            "suggested_low_unrounded": float(res.suggested_range.suggested_low_unrounded),
            "suggested_base_unrounded": float(res.suggested_range.suggested_base_unrounded),
            "suggested_high_unrounded": float(res.suggested_range.suggested_high_unrounded),
            "low_buffer_percent": float(res.suggested_range.low_buffer),
            "high_buffer_percent": float(res.suggested_range.high_buffer),
        },
        scenarios=[
            {
                "name": s.name,
                "label": s.label,
                "markup_percentage": float(s.markup_percentage),
                "cost_floor": float(s.cost_floor),
                "profit_amount": float(s.profit_amount),
                "market_adjustment": float(s.market_adjustment),
                "resulting_price_unrounded": float(s.resulting_price_unrounded),
                "resulting_price_rounded": float(s.resulting_price_rounded),
                "rounding_difference": float(s.rounding_difference),
            }
            for s in res.scenarios
        ],
        materials=[
            {
                "name": m.name,
                "unit_quantity": float(m.unit_quantity),
                "unit": m.unit,
                "cost_per_unit": float(m.cost_per_unit),
                "line_total": float(m.line_total),
                "is_batch": m.is_batch,
                "batch_quantity": float(m.batch_quantity) if m.batch_quantity else None,
                "raw_quantity": float(m.raw_quantity),
                "source_note": m.source_note,
                "value_status": m.value_status.value,
            }
            for m in res.materials
        ],
        labour=[
            {
                "task_name": l.task_name,
                "hours": float(l.hours),
                "hourly_rate": float(l.hourly_rate),
                "line_total": float(l.line_total),
                "rate_source": l.rate_source,
                "rate_type": l.rate_type.value,
                "hours_status": l.hours_status.value,
                "note": l.note,
            }
            for l in res.labour
        ],
        overhead=[
            {
                "name": o.name,
                "amount": float(o.amount),
                "explanation": o.explanation,
                "value_status": o.value_status.value,
            }
            for o in res.overhead
        ],
        packaging=[
            {
                "name": p.name,
                "cost_per_unit": float(p.cost_per_unit),
                "explanation": p.explanation,
                "value_status": p.value_status.value,
            }
            for p in res.packaging
        ],
        comparable_adjustment={
            "eligible_count": len(res.comparable_adjustment.eligible_comparables),
            "comparable_median": float(res.comparable_adjustment.comparable_median),
            "raw_gap": float(res.comparable_adjustment.raw_gap),
            "influence_percentage": float(res.comparable_adjustment.influence_percentage),
            "uncapped_adjustment": float(res.comparable_adjustment.uncapped_adjustment),
            "adjustment_cap": float(res.comparable_adjustment.adjustment_cap),
            "cap_applied": res.comparable_adjustment.cap_applied,
            "final_adjustment": float(res.comparable_adjustment.final_adjustment),
            "production_cost_floor": float(res.comparable_adjustment.production_cost_floor),
        },
        confidence_level=res.confidence_level.value,
        confidence_reasons=list(res.confidence_reasons),
        assumptions=list(res.assumptions),
        warnings=list(res.warnings),
        missing_inputs=list(res.missing_inputs),
        explanation_text=res.explanation_text,
        artisan_final_price=float(res.artisan_final_price) if res.artisan_final_price is not None else None,
        artisan_selection_type=res.artisan_selection_type.value if res.artisan_selection_type else None,
        artisan_override_reason=res.artisan_override_reason,
        is_below_cost=res.is_below_cost,
        shortfall_amount=float(res.shortfall_amount),
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@router.post("/validate", response_model=ValidationResponseSchema)
async def validate_inputs(req: EstimateRequestSchema) -> ValidationResponseSchema:
    """Validate pricing inputs without executing full calculation."""
    errors = []
    warnings = []
    missing = []

    try:
        domain_input = _to_domain_input(req)
        validate_pricing_input(domain_input)
    except PricingModelError as e:
        errors.append(str(e))
    except Exception as e:
        errors.append(f"Unexpected validation error: {str(e)}")

    if not req.materials:
        missing.append("Material line items are empty")
    if not req.labour:
        missing.append("Labour tasks are empty")
    for l in req.labour:
        if not l.rate_source or not l.rate_source.strip():
            warnings.append(f"Labour task '{l.task_name}' has no wage rate source")

    return ValidationResponseSchema(
        valid=len(errors) == 0,
        errors=errors,
        warnings=warnings,
        missing_inputs=missing,
    )


@router.post("/feedback", response_model=FeedbackResponseSchema)
async def submit_pricing_feedback(
    fb: FeedbackRequestSchema,
    owner_uid: str = Depends(get_current_artisan_uid),
    db: AsyncSession = Depends(get_db),
) -> FeedbackResponseSchema:
    """Record artisan pricing decisions and overrides for quality analysis."""
    feedback_id = f"fb_{uuid.uuid4().hex[:16]}"
    is_below = fb.artisan_selected_price < fb.cost_floor

    record = PricingFeedbackRecord(
        id=feedback_id,
        owner_uid=owner_uid,
        suggested_price=fb.suggested_price,
        artisan_selected_price=fb.artisan_selected_price,
        decision=fb.decision,
        cost_floor=fb.cost_floor,
        formula_version=settings.formula_version,
        is_below_cost=is_below,
        reason=fb.reason,
        calculation_summary=fb.calculation_summary,
    )

    db.add(record)
    await db.commit()

    return FeedbackResponseSchema(
        feedback_id=feedback_id,
        status="recorded",
        owner_uid=owner_uid,
        created_at=datetime.now(timezone.utc).isoformat(),
        message="Artisan price decision recorded successfully in isolated storage.",
    )
