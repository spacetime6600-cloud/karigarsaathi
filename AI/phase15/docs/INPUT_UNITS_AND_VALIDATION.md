# Phase 15 — Input Units and Strict Validation

## 1. Explicit Units
- **Currency**: `INR` (₹, Indian Rupee) exclusively.
- **Material Quantity**: Explicit physical units (e.g. `meters`, `kg`, `grams`, `pieces`).
- **Labour**: Decimal hours per sellable unit (e.g. `2.5` hours).
- **Wage Rate**: INR per hour (e.g. `₹150/hr`).
- **Overhead & Packaging**: INR per sellable unit.
- **Batch Quantity**: Strictly positive integer/decimal count of units produced per batch.

---

## 2. Validation Rules & Bounds

| Field | Requirement / Sanity Bound | Failure Response |
|---|---|---|
| `currency` | Must be `"INR"` | `UnsupportedCurrencyError` (422) |
| `locale` | Must be in `("en", "hi", "or", "bn", "te")` | `UnsupportedLocaleError` (422) |
| `quantity` | Non-negative, $\le 100,000$ | `InvalidQuantityError` (422) |
| `cost_per_unit` | Non-negative, $\le ₹10,000,000$ | `InvalidCostError` (422) |
| `batch_quantity` | Strictly positive ($> 0$) if `is_batch=True` | `InvalidBatchQuantityError` (422) |
| `hours` | Non-negative, $\le 1,000$ hours | `InvalidHoursError` (422) |
| `hourly_rate` | Non-negative, $\le ₹50,000$/hr | `InvalidRateError` (422) |
| `markup_percentage` | Non-negative, $\le 1000\%$ | `InvalidPercentageError` (422) |
| `scenarios` | $\text{Low} \le \text{Base} \le \text{High}$ | `InvalidScenarioOrderError` (422) |

---

## 3. Zero vs Missing Inputs
- **Explicit Zero**: If an artisan enters `0` for packaging or labour, it remains `₹0.00` and is explicitly listed in `assumptions` and `explanations` rather than silently assumed.
- **Missing / Unknown**: If a line item list is empty, it is logged in `missing_inputs` and flagged in the confidence breakdown.
