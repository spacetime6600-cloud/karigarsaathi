# Phase 15 Pricing Model Contract

## Overview

This document defines the authoritative contract for the Phase 15 deterministic fair-pricing calculation model. The model is a standalone, framework-independent Python package that implements pricing rules for artisan products.

## Formula Version

- **Version**: `fair-price-rules-v1`
- **Currency**: `INR`

## Public API

### `calculate_price(request: PricingInput) -> PricingResult`

Main entry point for price calculation. Pure function with no side effects.

### `classify_confidence(request: PricingInput, eligible_selected_comparables: list[ComparableInput]) -> ConfidenceResult`

Standalone confidence classification function.

### `apply_artisan_decision(result: PricingResult, final_price: Decimal, selection_type: SelectionType, override_reason: Optional[str] = None) -> PricingResult`

Helper to apply artisan's final price decision while preserving it across recalculations.

## Input Schema (`PricingInput`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `materials` | `tuple[MaterialInput, ...]` | Yes* | Material line items |
| `labour` | `tuple[LabourInput, ...]` | Yes* | Labour tasks |
| `overhead` | `tuple[OverheadInput, ...]` | No | Overhead items (empty allowed) |
| `margin_mode` | `MarginMode` | Yes | `percentage_markup` or `fixed_inr` |
| `margin_value` | `Decimal` | Yes | Percentage (0-1000) or fixed INR amount |
| `comparables` | `tuple[ComparableInput, ...]` | No | Verified comparable products |
| `comparable_influence` | `Decimal` | No | Default: 20 (percentage) |
| `max_adjustment` | `Decimal` | No | Default: 10 (percentage cap) |
| `low_buffer` | `Decimal` | No | Default: 5 (percentage) |
| `high_buffer` | `Decimal` | No | Default: 10 (percentage) |
| `calculation_date` | `date` | Yes | Explicit date for determinism |
| `currency` | `str` | No | Must be `INR` |
| `locale` | `str` | No | One of: `en`, `hi`, `or`, `bn` |
| `artisan_final_price` | `Decimal` | No | Preserved artisan-selected price |
| `artisan_selection_type` | `SelectionType` | No | `low`, `base`, `high`, `custom` |
| `artisan_override_reason` | `str` | No | Reason for custom price |

*At least one material or labour input is required.

### `MaterialInput`

| Field | Type | Required |
|-------|------|----------|
| `name` | `str` | Yes |
| `quantity` | `Decimal` | Yes |
| `unit` | `str` | Yes |
| `cost_per_unit` | `Decimal` | Yes |
| `source_note` | `str` | No |
| `value_status` | `ValueStatus` | No (default: `exact`) |

### `LabourInput`

| Field | Type | Required |
|-------|------|----------|
| `task_name` | `str` | Yes |
| `hours` | `Decimal` | Yes |
| `hourly_rate` | `Decimal` | Yes |
| `rate_source` | `str` | Yes |
| `rate_type` | `RateType` | No (default: `preset`) |
| `hours_status` | `ValueStatus` | No (default: `exact`) |
| `note` | `str` | No |

### `OverheadInput`

| Field | Type | Required |
|-------|------|----------|
| `name` | `str` | Yes |
| `amount` | `Decimal` | Yes |
| `explanation` | `str` | No |
| `value_status` | `ValueStatus` | No (default: `exact`) |

### `ComparableInput`

| Field | Type | Required |
|-------|------|----------|
| `id` | `str` | Yes |
| `product_title` | `str` | Yes |
| `category` | `str` | Yes |
| `craft_type` | `str` | Yes |
| `material` | `str` | Yes |
| `dimensions` | `str` | No |
| `listed_price` | `Decimal` | Yes |
| `source_name` | `str` | Yes |
| `source_reference` | `str` | Yes |
| `capture_date` | `date` | Yes |
| `status` | `ComparableStatus` | Yes |
| `verification_date` | `date` | No |
| `verified_by` | `str` | No |
| `verification_note` | `str` | No |
| `geographic_context` | `str` | No |
| `similarity_note` | `str` | No |
| `evidence_reference` | `str` | No |
| `selected` | `bool` | No (default: `false`) |

## Output Schema (`PricingResult`)

| Field | Type | Description |
|-------|------|-------------|
| `formula_version` | `str` | Always `fair-price-rules-v1` |
| `currency` | `str` | Always `INR` |
| `locale` | `str` | Input locale |
| `calculation_date` | `date` | Input calculation date |
| `materials` | `tuple[MaterialCalculation, ...]` | Per-material calculations |
| `total_material_cost` | `Decimal` | Sum of material line totals |
| `labour` | `tuple[LabourCalculation, ...]` | Per-task calculations |
| `total_labour_cost` | `Decimal` | Sum of labour line totals |
| `overhead` | `tuple[OverheadCalculation, ...]` | Per-overhead items |
| `total_overhead` | `Decimal` | Sum of overhead amounts |
| `production_cost` | `Decimal` | Materials + Labour + Overhead |
| `margin_mode` | `MarginMode` | Input margin mode |
| `margin_input` | `Decimal` | Input margin value |
| `margin_amount` | `Decimal` | Calculated margin in INR |
| `cost_based_base_price` | `Decimal` | Production cost + Margin |
| `comparable_adjustment` | `ComparableAdjustmentDetail` | Comparable adjustment breakdown |
| `suggested_base_price` | `Decimal` | Max(production_cost, cost_based_base_price + adjustment) |
| `suggested_range` | `SuggestedRange` | Low/Base/High with rounding |
| `assumptions` | `tuple[str, ...]` | All assumptions made |
| `warnings` | `tuple[str, ...]` | Non-fatal issues |
| `confidence_level` | `ConfidenceLevel` | HIGH/MEDIUM/LOW |
| `confidence_reasons` | `tuple[str, ...]` | Reasons for confidence level |
| `artisan_final_price` | `Decimal` | Preserved artisan price |
| `artisan_selection_type` | `SelectionType` | How artisan price was set |
| `artisan_override_reason` | `str` | Reason for custom price |

### `ComparableAdjustmentDetail`

| Field | Type | Description |
|-------|------|-------------|
| `eligible_comparables` | `tuple[ComparableInput, ...]` | Selected verified comparables |
| `comparable_median` | `Decimal` | Median of eligible prices |
| `raw_gap` | `Decimal` | Median - cost_based_base_price |
| `influence_percentage` | `Decimal` | Input influence % |
| `uncapped_adjustment` | `Decimal` | Raw gap × influence ÷ 100 |
| `adjustment_cap` | `Decimal` | Cost-based base × max_adjustment ÷ 100 |
| `cap_applied` | `bool` | Whether cap was applied |
| `final_adjustment` | `Decimal` | Capped adjustment |
| `production_cost_floor` | `Decimal` | Production cost |

### `SuggestedRange`

| Field | Type | Description |
|-------|------|-------------|
| `suggested_low_unrounded` | `Decimal` | Before rounding |
| `suggested_base_unrounded` | `Decimal` | Before rounding |
| `suggested_high_unrounded` | `Decimal` | Before rounding |
| `suggested_low_rounded` | `Decimal` | ROUND_HALF_UP to nearest rupee |
| `suggested_base_rounded` | `Decimal` | ROUND_HALF_UP to nearest rupee |
| `suggested_high_rounded` | `Decimal` | ROUND_HALF_UP to nearest rupee |
| `low_buffer` | `Decimal` | Input low buffer % |
| `high_buffer` | `Decimal` | Input high buffer % |
| `rounding_differences` | `tuple[Decimal, Decimal, Decimal]` | Rounded - unrounded |

## Validation Errors

All validation errors inherit from `PricingValidationError`:

- `InvalidQuantityError` - Negative or unreasonable quantity
- `InvalidCostError` - Negative or unreasonable cost
- `InvalidHoursError` - Negative or unreasonable hours
- `InvalidRateError` - Negative or unreasonable rate, missing source
- `InvalidOverheadError` - Negative or unreasonable overhead
- `InvalidMarginError` - Invalid margin mode or negative fixed margin
- `InvalidPercentageError` - Percentage outside valid range
- `UnsupportedCurrencyError` - Currency not INR
- `UnsupportedLocaleError` - Locale not in {en, hi, or, bn}
- `MissingInputsError` - No materials and no labour
- `InvalidDateError` - Invalid date format
- `InvalidComparableStatusError` - Invalid comparable status
- `InvalidDecimalError` - Cannot parse decimal string
- `UnreasonableValueError` - Value exceeds maximum reasonable limits

## Decimal Serialization

All `Decimal` values are serialized as strings in JSON to preserve precision.
Use `pricing_model.serialization.to_json()` for proper serialization.

## Rounding Rule

- **Rule**: `ROUND_HALF_UP` to nearest rupee
- **Applied to**: Final display prices only (low, base, high)
- **Internal calculations**: Full `Decimal` precision preserved
- **Rounding differences**: Reported in `SuggestedRange.rounding_differences`

## Artisan Final Price Behavior

1. Artisan selects final price (low/base/high/custom) via UI
2. `apply_artisan_decision()` stores this separately from suggestions
3. Recalculating suggestions preserves existing `artisan_final_price`
4. Warning emitted if suggestions change while artisan price preserved
4. Antigravity UI must display both suggested range and artisan price

## Determinism Guarantees

- Identical inputs → identical outputs
- Explicit `calculation_date` (no system clock dependency)
- No external services, network calls, or global state
- Pure functions throughout