# Phase 15 Pricing Methodology

## Authoritative Formula

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

**Formula Version**: `fair-price-rules-v1`
**Currency**: `INR`

---

## Materials Calculation

Each material line item:
```
Line total = quantity × cost per unit
```

Total material cost = sum of all material line totals.

**Value Status**:
- `exact`: Measured/quoted precisely
- `estimated`: Approximate, flagged in assumptions

---

## Labour Calculation

Each labour task:
```
Line total = hours × hourly rate
```

Total labour cost = sum of all labour line totals.

**Rate Source**: Required for every task (e.g., "Artisan guild rate card 2024", "Market survey").

**Rate Type**:
- `preset`: From standard rate card
- `custom`: Negotiated or special rate

**Hours Status**:
- `exact`: Tracked/measured
- `estimated`: Approximate, flagged in assumptions

---

## Overhead Calculation

Each overhead item:
```
Total overhead = sum of overhead amounts
```

Zero overhead is valid. Each item should have an explanation. Estimated overhead is flagged.

---

## Artisan Margin

Two modes supported:

### Percentage Markup
```
Margin amount = production cost × markup percentage ÷ 100
```
**Important**: This is a markup on cost, NOT a net profit margin percentage.

### Fixed INR
```
Margin amount = fixed INR amount
```

Cost-based base price = production cost + margin amount.

---

## Verified Comparables Adjustment

### Eligibility Criteria (ALL must be met)
1. Explicitly `selected: true`
2. `status == "verified"`
3. Has `verification_date`
4. Has `verified_by` identifier
5. Has `verification_note`
6. Has `evidence_reference`
7. Within freshness period (default 180 days from `capture_date`)
8. Relevant to product (category/craft/material match)

### Adjustment Calculation
```
Comparable median = median(eligible comparable prices)
Raw gap = comparable median - cost-based base price
Uncapped adjustment = raw gap × comparable influence ÷ 100
Adjustment cap = cost-based base price × maximum adjustment ÷ 100
Comparable adjustment = clamp(uncapped adjustment, -adjustment cap, +adjustment cap)
```

**Defaults**:
- Comparable influence: 20%
- Maximum adjustment: 10%

### Floor Protection
```
Suggested base = max(production cost, cost-based base price + comparable adjustment)
```
Result never falls below production cost.

---

## Suggested Range

```
Suggested low = max(production cost, suggested base × (1 - low buffer ÷ 100))
Suggested high = suggested base × (1 + high buffer ÷ 100)
```

**Defaults**:
- Low buffer: 5%
- High buffer: 10%

**Rounding**: Final displayed prices rounded to nearest rupee using `ROUND_HALF_UP`.
Unrounded values and rounding differences are preserved in output.

---

## Confidence Classification

Confidence represents **input quality and completeness only**, NOT predictive accuracy.

### HIGH
All of:
- All material values exact
- All labour hours exact
- All labour rates have sources
- All overhead items have explanations
- Margin mode explicitly selected
- ≥3 fresh, relevant, verified selected comparables

### MEDIUM
Required cost inputs complete BUT:
- Some inputs estimated, OR
- 0-2 eligible comparables selected

### LOW
- Important costs are weak estimates
- Labour rate source missing
- Comparable evidence stale/weak
- Important assumptions materially affect result

**Output Format**:
```json
{
  "level": "MEDIUM",
  "meaning": "Input-quality confidence, not guaranteed market accuracy.",
  "reasons": ["reason1", "reason2"]
}
```

---

## Explainability Requirements

Every rupee in the result must be traceable to:
1. An explicit input value, OR
2. A deterministic rule with visible parameters

The `PricingResult` includes:
- Every line-item calculation
- All intermediate totals
- Comparable adjustment breakdown (median, gap, influence, cap, final)
- Production-cost floor application
- Buffer calculations
- Rounding differences
- All assumptions
- All warnings
- Confidence level with reasons
- Formula version

---

## Artisan Final Price Workflow

1. Model produces suggested low/base/high range
2. Artisan selects: low, base, high, or custom amount
3. Selection stored via `apply_artisan_decision()`
4. Future recalculations preserve artisan price
5. Warning shown if suggestions shift while artisan price held

---

## Decimal Precision

- All monetary calculations use Python `Decimal`
- No floating-point arithmetic
- Serialization as strings to preserve precision
- Internal precision: full Decimal precision
- Display rounding: `ROUND_HALF_UP` to nearest ₹1

---

## Supported Locales

- `en` - English
- `hi` - Hindi
- `or` - Odia
- `bn` - Bengali

---

## Defaults Summary

| Parameter | Default |
|-----------|---------|
| Comparable influence | 20% |
| Maximum adjustment | 10% |
| Freshness period | 180 days |
| Low buffer | 5% |
| High buffer | 10% |
| Currency | INR |
| Formula version | fair-price-rules-v1 |