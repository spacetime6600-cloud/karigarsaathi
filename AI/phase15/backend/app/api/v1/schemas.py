"""Pydantic schemas for Phase 15 Fair Price Assistant API."""
from datetime import date, datetime
from decimal import Decimal
from typing import Any, List, Optional
from pydantic import BaseModel, Field

from ...pricing_engine.enums import (
    ComparableStatus,
    ConfidenceLevel,
    MarginMode,
    RateType,
    SelectionType,
    ValueStatus,
)


class MaterialItemSchema(BaseModel):
    name: str = Field(..., description="Name of the raw material (e.g. Mulberry Silk Yarn, Brass Ingot)")
    quantity: Decimal = Field(..., ge=0, description="Quantity consumed")
    unit: str = Field("unit", description="Unit of measurement (e.g. meters, kg, grams, count)")
    cost_per_unit: Decimal = Field(..., ge=0, description="Cost per unit in INR")
    source_note: Optional[str] = Field(None, description="Where the cost was sourced from")
    value_status: ValueStatus = Field(ValueStatus.EXACT, description="Exact or estimated")
    is_batch: bool = Field(False, description="Whether quantity is for a batch rather than single unit")
    batch_quantity: Optional[Decimal] = Field(None, ge=0, description="Total units produced from this batch")


class LabourTaskSchema(BaseModel):
    task_name: str = Field(..., description="Description of the craft labour step (e.g. Hand-spinning, Loom Weaving)")
    hours: Decimal = Field(..., ge=0, description="Hours required per unit")
    hourly_rate: Decimal = Field(..., ge=0, description="Artisan hourly wage rate in INR/hour")
    rate_source: str = Field(..., description="Documented basis for rate (e.g. State Minimum Wage 2026, Guild Card, Artisan Chosen)")
    rate_type: RateType = Field(RateType.PRESET, description="Preset guild rate or custom artisan rate")
    hours_status: ValueStatus = Field(ValueStatus.EXACT, description="Exact or estimated hours")
    note: Optional[str] = Field(None, description="Optional task details")


class OverheadItemSchema(BaseModel):
    name: str = Field(..., description="Overhead component (e.g. Loom Maintenance, Workshop Electricity, Tool Sharpening)")
    amount: Decimal = Field(..., ge=0, description="Allocated overhead in INR per unit")
    explanation: Optional[str] = Field(None, description="Allocation rationale")
    value_status: ValueStatus = Field(ValueStatus.EXACT, description="Exact or estimated")


class PackagingItemSchema(BaseModel):
    name: str = Field(..., description="Packaging item (e.g. Eco-friendly Cotton Bag, Corrugated Box, Bubble Wrap)")
    cost_per_unit: Decimal = Field(..., ge=0, description="Packaging cost per unit in INR")
    explanation: Optional[str] = Field(None, description="Optional packaging details")
    value_status: ValueStatus = Field(ValueStatus.EXACT, description="Exact or estimated")


class MarkupScenarioSchema(BaseModel):
    name: str = Field(..., description="Scenario identifier (e.g. 'low', 'base', 'high')")
    markup_percentage: Decimal = Field(..., ge=0, description="Profit markup percentage (e.g. 10.0 for 10%)")
    label: Optional[str] = Field(None, description="Human-friendly label (e.g. 'Low Markup (10%)')")


class ComparableItemSchema(BaseModel):
    id: str = Field(..., description="Unique reference ID")
    product_title: str = Field(..., description="Product title of comparable")
    category: str = Field(..., description="Product category")
    craft_type: str = Field(..., description="Craft technique")
    material: str = Field(..., description="Primary material")
    listed_price: Decimal = Field(..., ge=0, description="Price in INR")
    source_name: str = Field(..., description="Platform / store name")
    source_reference: str = Field(..., description="URL or catalog reference")
    capture_date: date = Field(..., description="Date listing was recorded")
    status: ComparableStatus = Field(ComparableStatus.UNVERIFIED, description="Verification status")
    verification_date: Optional[date] = Field(None, description="Date verified by reviewer")
    verified_by: Optional[str] = Field(None, description="Verifier ID")
    verification_note: Optional[str] = Field(None, description="Verification details")
    geographic_context: Optional[str] = Field(None, description="Region/State of origin")
    similarity_note: Optional[str] = Field(None, description="Similarity notes")
    evidence_reference: Optional[str] = Field(None, description="Provenance evidence link")
    selected: bool = Field(False, description="Whether selected by artisan for comparison")
    dimensions: Optional[str] = Field(None, description="Product dimensions")
    is_completed_sale: bool = Field(False, description="True if historical sale price, False if active listing")
    shipping_included: Optional[bool] = Field(None, description="Whether shipping is included")
    tax_included: Optional[bool] = Field(None, description="Whether taxes are included")


class EstimateRequestSchema(BaseModel):
    materials: List[MaterialItemSchema] = Field(default_factory=list)
    labour: List[LabourTaskSchema] = Field(default_factory=list)
    overhead: List[OverheadItemSchema] = Field(default_factory=list)
    packaging: List[PackagingItemSchema] = Field(default_factory=list)
    margin_mode: MarginMode = Field(MarginMode.PERCENTAGE_MARKUP)
    margin_value: Decimal = Field(Decimal("20"), description="Default markup % or fixed INR amount")
    scenarios: List[MarkupScenarioSchema] = Field(default_factory=list)
    comparables: List[ComparableItemSchema] = Field(default_factory=list)
    comparable_influence: Decimal = Field(Decimal("20"), ge=0, le=100)
    max_adjustment: Decimal = Field(Decimal("10"), ge=0, le=100)
    low_buffer: Decimal = Field(Decimal("5"), ge=0, le=100)
    high_buffer: Decimal = Field(Decimal("10"), ge=0, le=100)
    currency: str = Field("INR")
    locale: str = Field("en")
    artisan_final_price: Optional[Decimal] = Field(None, ge=0)
    artisan_selection_type: Optional[SelectionType] = None
    artisan_override_reason: Optional[str] = None


class ValidationResponseSchema(BaseModel):
    valid: bool
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    missing_inputs: List[str] = Field(default_factory=list)


class EstimateResponseSchema(BaseModel):
    formula_version: str
    currency: str
    locale: str
    calculation_date: str
    cost_floor: float
    total_material_cost: float
    total_labour_cost: float
    total_overhead: float
    total_packaging: float
    margin_mode: str
    margin_input: float
    profit_amount: float
    cost_based_base_price: float
    suggested_base_price: float
    suggested_range: dict
    scenarios: List[dict]
    materials: List[dict]
    labour: List[dict]
    overhead: List[dict]
    packaging: List[dict]
    comparable_adjustment: dict
    confidence_level: str
    confidence_reasons: List[str]
    assumptions: List[str]
    warnings: List[str]
    missing_inputs: List[str]
    explanation_text: str
    artisan_final_price: Optional[float] = None
    artisan_selection_type: Optional[str] = None
    artisan_override_reason: Optional[str] = None
    is_below_cost: bool = False
    shortfall_amount: float = 0.0
    timestamp: str


class FeedbackRequestSchema(BaseModel):
    suggested_price: float = Field(..., description="System calculated suggested base price")
    artisan_selected_price: float = Field(..., description="Artisan selected final selling price")
    decision: str = Field(..., description="'accepted' | 'rejected' | 'edited'")
    cost_floor: float = Field(..., description="Calculated production cost floor")
    reason: Optional[str] = Field(None, description="Artisan rationale for selection")
    calculation_summary: Optional[str] = Field(None, description="Serialized calculation context")


class FeedbackResponseSchema(BaseModel):
    feedback_id: str
    status: str
    owner_uid: str
    created_at: str
    message: str
