# Phase 15 — Verified Market Comparables & Provenance Policy

## 1. Provenance Requirements
Market comparables are strictly optional supporting evidence. To prevent artificial inflation or undercutting of authentic artisan crafts, a comparable listing is included in the adjustment calculation **ONLY** if it satisfies all 7 eligibility criteria:

1. **Artisan Selection**: `selected == true`.
2. **Verified Status**: `status == "verified"`.
3. **Verification Date**: Valid timestamp recorded by human verifier.
4. **Verified By**: Verifier identity string present.
5. **Verification Note**: Transparent note describing why this item is comparable.
6. **Evidence Reference**: URI or reference link to the actual invoice / listing / catalogue.
7. **Freshness Window**: Captured within the last **180 days** (`capture_date` to `calculation_date`).

---

## 2. Floor Protection & Adjustment Cap

```
+-------------------------------------------------------------+
| Raw Gap = Comparable Median - Cost-Based Base Price        |
| Uncapped Adjustment = Raw Gap × 20% (Default Influence)    |
| Cap = ±10% of Cost-Based Base Price                         |
| Final Adjustment = Clamp(Uncapped, -Cap, +Cap)             |
| Suggested Base = MAX(Cost Floor, Cost-Based + Adjustment)   |
+-------------------------------------------------------------+
```

- **Cost Floor Primacy**: Under no circumstances will a comparable adjustment reduce the suggested price below the production cost floor.
- **Zero Hallucination Rule**: If no verified comparables are selected or eligible, market adjustment is strictly `₹0.00`, and the explanation truthfully declares: *"No verified market comparison available."*
