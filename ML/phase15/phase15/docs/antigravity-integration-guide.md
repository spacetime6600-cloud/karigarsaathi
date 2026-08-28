# Antigravity Integration Guide

## Package Import

```python
from pricing_model import (
    calculate_price,
    classify_confidence,
    apply_artisan_decision,
    PricingInput,
    PricingResult,
    MaterialInput,
    LabourInput,
    OverheadInput,
    ComparableInput,
    ConfidenceResult,
    MarginMode,
    ComparableStatus,
    ValueStatus,
    RateType,
    SelectionType,
    serialize_pricing_result,
    FORMULA_VERSION,
    CURRENCY,
)
```

## `calculate_price()` Signature

```python
def calculate_price(request: PricingInput) -> PricingResult:
    ...
```

- **Pure function**: No side effects, no network calls, no global state
- **Deterministic**: Identical input → identical output
- **Explicit date**: Requires `calculation_date` in request
- **Decimal precision**: All monetary values use Python `Decimal`
- **Validation**: Raises documented `PricingValidationError` subclasses

## Complete Input Schema

See `pricing-model-contract.md` for full schema. Key points:

### Required Fields
- `materials` (tuple) OR `labour` (tuple) — at least one required
- `margin_mode`: `MarginMode.PERCENTAGE_MARKUP` or `MarginMode.FIXED_INR`
- `margin_value`: `Decimal` (percentage 0-1000, or fixed INR ≥0)
- `calculation_date`: `date` object (not string)

### Optional Fields (with defaults)
- `overhead`: empty tuple allowed
- `comparables`: empty tuple allowed
- `comparable_influence`: `Decimal("20")`
- `max_adjustment`: `Decimal("10")`
- `low_buffer`: `Decimal("5")`
- `high_buffer`: `Decimal("10")`
- `currency`: `"INR"` (only supported value)
- `locale`: `"en"` (or `"hi"`, `"or"`, `"bn"`)
- `artisan_final_price`: preserved from previous calculation
- `artisan_selection_type`: `SelectionType`
- `artisan_override_reason`: `str`

## Complete Output Schema

See `pricing-model-contract.md` for full `PricingResult` schema.

### Key Output Fields for Display
| Field | Description | Display |
|-------|-------------|---------|
| `suggested_range.suggested_low_rounded` | Low end (₹) | **Primary** |
| `suggested_range.suggested_base_rounded` | Base price (₹) | **Primary** |
| `suggested_range.suggested_high_rounded` | High end (₹) | **Primary** |
| `production_cost` | Cost floor (₹) | Reference |
| `cost_based_base_price` | Before comparable adjustment | Reference |
| `comparable_adjustment.final_adjustment` | Applied adjustment (₹) | Reference |
| `confidence_level` | HIGH/MEDIUM/LOW | **Required** |
| `confidence_reasons` | Why this confidence | **Required** |
| `warnings` | Non-fatal issues | **Required** |
| `artisan_final_price` | Artisan's chosen price | **If set** |

## Validation Error Schema

All errors inherit from `PricingValidationError` (subclass of `ValueError`).

```python
try:
    result = calculate_price(request)
except PricingValidationError as e:
    # e.args[0] contains human-readable message
    # type(e) indicates specific error class
    handle_error(e)
```

Specific error types:
- `InvalidQuantityError`, `InvalidCostError`, `InvalidHoursError`, `InvalidRateError`
- `InvalidOverheadError`, `InvalidMarginError`, `InvalidPercentageError`
- `UnsupportedCurrencyError`, `UnsupportedLocaleError`
- `MissingInputsError`, `InvalidDateError`, `InvalidComparableStatusError`
- `InvalidDecimalError`, `UnreasonableValueError`

## Example Request

```python
from decimal import Decimal
from datetime import date
from pricing_model import (
    calculate_price, PricingInput, MaterialInput, LabourInput,
    OverheadInput, MarginMode, ValueStatus, RateType
)

request = PricingInput(
    materials=(
        MaterialInput(
            name="Teak Wood",
            quantity=Decimal("10"),
            unit="kg",
            cost_per_unit=Decimal("500"),
            value_status=ValueStatus.EXACT
        ),
    ),
    labour=(
        LabourInput(
            task_name="Carving",
            hours=Decimal("8"),
            hourly_rate=Decimal("300"),
            rate_source="Artisan guild rate card 2024",
            rate_type=RateType.PRESET,
            hours_status=ValueStatus.EXACT
        ),
    ),
    overhead=(
        OverheadInput(
            name="Workshop Rent",
            amount=Decimal("2000"),
            explanation="Monthly allocation",
            value_status=ValueStatus.EXACT
        ),
    ),
    margin_mode=MarginMode.PERCENTAGE_MARKUP,
    margin_value=Decimal("25"),
    calculation_date=date(2025, 1, 15),
)

result = calculate_price(request)
```

## Example Result (Key Fields)

```json
{
  "formula_version": "fair-price-rules-v1",
  "currency": "INR",
  "production_cost": "12300",
  "margin_amount": "3075",
  "cost_based_base_price": "15375",
  "suggested_base_price": "13837.5",
  "suggested_range": {
    "suggested_low_rounded": "13146",
    "suggested_base_rounded": "13838",
    "suggested_high_rounded": "15221"
  },
  "confidence_level": "HIGH",
  "confidence_reasons": [
    "All cost inputs are exact",
    "All labour rates have sources",
    "All overhead items have explanations",
    "Margin mode explicitly selected",
    "3 fresh verified comparables selected"
  ],
  "warnings": [
    "Comparable adjustment capped at ±10% of cost-based base price"
  ]
}
```

## Decimal Serialization Rules

- **Input**: Pass `Decimal` objects directly (not strings)
- **Output**: `Decimal` objects in result
- **JSON**: Use `serialize_pricing_result(result)` → returns JSON string with Decimals as strings
- **Parsing**: `Decimal("123.45")` from strings

```python
from pricing_model import serialize_pricing_result
json_output = serialize_pricing_result(result)
# Returns string with Decimals as strings
```

## Formula Version

- Current: `fair-price-rules-v1`
- Access via: `pricing_model.FORMULA_VERSION`
- Included in every `PricingResult.formula_version`
- **Breaking changes** will increment version

## Values Antigravity Should Display

### Mandatory (every calculation)
1. Suggested low/base/high (rounded rupees)
2. Confidence level + reasons
3. Warnings (if any)
4. Formula version

### Recommended (transparency)
5. Production cost
6. Cost-based base price
7. Comparable adjustment (if any)
8. Assumptions list

### Artisan Price (if set)
9. Artisan final price + selection type + reason

## Inputs the UI Must Collect

### Materials (at least one OR labour)
- Name, quantity, unit, cost/unit, source note, exact/estimated

### Labour (at least one OR materials)
- Task name, hours, hourly rate, rate source, preset/custom, exact/estimated, note

### Overhead (optional)
- Name, amount, explanation, exact/estimated

### Margin (required)
- Mode: percentage markup OR fixed INR
- Value: percentage (0-1000) or INR amount

### Comparables (optional, multiple)
- All fields in `ComparableInput` schema
- **Critical**: `selected`, `status=verified`, verification fields, evidence reference

### Settings (optional, with defaults)
- Comparable influence %, max adjustment %, low/high buffers
- Calculation date (mandatory for determinism)
- Locale (en/hi/or/bn)

## ⚠️ Frontend Preview Calculations Are NOT Authoritative

**The UI may show live previews, but ONLY the backend `calculate_price()` result is authoritative.**

- Preview calculations in React/TypeScript will drift
- Always call the Python model for final prices
- Display "Calculating..." until authoritative result returns
- Cache results by input hash for performance

## Wrapping in Future Backend

```python
# FastAPI example
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pricing_model import calculate_price, PricingInput, serialize_pricing_result
from pricing_model.exceptions import PricingValidationError

app = FastAPI()

class PriceRequest(BaseModel):
    # Map your API schema to PricingInput fields
    ...

@app.post("/api/v1/price/calculate")
async def calculate_price_endpoint(req: PriceRequest):
    try:
        # Convert req → PricingInput
        pricing_input = convert_to_pricing_input(req)
        result = calculate_price(pricing_input)
        return json.loads(serialize_pricing_result(result))
    except PricingValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
```

## What Is NOT Included

This package does **NOT** contain:
- ❌ FastAPI routes or any web framework
- ❌ React/TypeScript components
- ❌ Database models (SQLAlchemy, Django ORM, etc.)
- ❌ Authentication/authorization
- ❌ Firebase integration
- ❌ Repository/persistence layer
- ❌ Background jobs/queues
- ❌ Caching layer
- ❌ Deployment configuration
- ❌ Machine learning models
- ❌ Any UI, forms, pages, dashboards
- ❌ Tailwind CSS, HTML, CSS
- ❌ Vite, Webpack, or any bundler config

## Testing the Integration

```bash
cd phase15
pip install -e .
pytest tests/ -v
python examples/run_example.py
```

All tests must pass before deployment.

## Support

For integration questions, refer to:
- `docs/pricing-model-contract.md` — Full API contract
- `docs/pricing-methodology.md` — Formula details
- `examples/run_example.py` — Working examples