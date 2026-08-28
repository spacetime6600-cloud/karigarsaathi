# Phase 15 Pricing Model

Standalone, deterministic fair-pricing calculation engine for artisan products.

## Overview

This package implements the Phase 15 pricing rules as a pure Python library with:
- Zero external dependencies (stdlib only)
- Full `Decimal` precision for monetary calculations
- Deterministic results for identical inputs
- Complete explainability and audit trail
- No framework, database, or network dependencies

## Formula

```
Total material cost
+ Total labour cost
+ Total overhead
= Production cost

Production cost
+ Artisan margin
= Cost-based base price

Cost-based base price
+ Optional verified-comparable adjustment
= Suggested base price

Suggested base price
± visible buffers
= Suggested low/base/high range
```

**Version**: `fair-price-rules-v1`
**Currency**: `INR`

## Installation

```bash
pip install -e .
```

## Quick Start

```python
from decimal import Decimal
from datetime import date
from pricing_model import (
    calculate_price,
    PricingInput,
    MaterialInput,
    LabourInput,
    OverheadInput,
    MarginMode,
    ValueStatus,
    RateType,
)

request = PricingInput(
    materials=(
        MaterialInput(
            name="Teak Wood",
            quantity=Decimal("10"),
            unit="kg",
            cost_per_unit=Decimal("500"),
            value_status=ValueStatus.EXACT,
        ),
    ),
    labour=(
        LabourInput(
            task_name="Carving",
            hours=Decimal("8"),
            hourly_rate=Decimal("300"),
            rate_source="Artisan guild rate card 2024",
            rate_type=RateType.PRESET,
            hours_status=ValueStatus.EXACT,
        ),
    ),
    overhead=(
        OverheadInput(
            name="Workshop Rent",
            amount=Decimal("2000"),
            explanation="Monthly allocation",
            value_status=ValueStatus.EXACT,
        ),
    ),
    margin_mode=MarginMode.PERCENTAGE_MARKUP,
    margin_value=Decimal("25"),
    calculation_date=date(2025, 1, 15),
)

result = calculate_price(request)
print(f"Suggested: ₹{result.suggested_range.suggested_low_rounded} - "
      f"₹{result.suggested_range.suggested_base_rounded} - "
      f"₹{result.suggested_range.suggested_high_rounded}")
print(f"Confidence: {result.confidence_level.value}")
```

## Running Tests

```bash
# Install dev dependencies
pip install -e ".[dev]"

# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=pricing_model --cov-report=term-missing

# Type checking
mypy pricing_model

# Linting
ruff check pricing_model tests examples
```

## Running Examples

```bash
python examples/run_example.py
```

## Project Structure

```
phase15/
├── pricing_model/           # Core package
│   ├── __init__.py         # Public exports
│   ├── calculator.py       # Main calculation logic
│   ├── confidence.py       # Confidence classification
│   ├── constants.py        # Formula constants
│   ├── enums.py            # Enumerations
│   ├── exceptions.py       # Validation exceptions
│   ├── models.py           # Dataclass models
│   ├── rounding.py         # Decimal rounding
│   ├── serialization.py    # JSON serialization
│   └── validation.py       # Input validation
├── tests/
│   └── pricing_model/      # Test suites
├── examples/               # Example requests & runner
│   ├── request_without_comparables.json
│   ├── request_with_comparables.json
│   ├── expected_result.json
│   └── run_example.py
├── docs/
│   ├── pricing-model-contract.md      # API contract
│   ├── pricing-methodology.md         # Formula details
│   └── antigravity-integration-guide.md
├── requirements.txt
├── pyproject.toml
└── README.md
```

## Key Features

- **Pure functions**: No side effects, no global state
- **Deterministic**: Explicit `calculation_date` ensures reproducibility
- **Explainable**: Every rupee traceable to input or rule
- **Validated**: Comprehensive input validation with clear errors
- **Serializable**: JSON-safe output with Decimal-as-string encoding
- **Extensible**: Clean separation of concerns

## Antigravity Integration

See `docs/antigravity-integration-guide.md` for:
- Import instructions
- Complete input/output schemas
- Example request/response
- Backend wrapping guidance
- What is NOT included (no UI, no DB, no auth)

## License

MIT