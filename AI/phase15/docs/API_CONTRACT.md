# Phase 15 Explainable Fair-Price Assistant — API Contract

## Base URL
`http://127.0.0.1:8002`

---

## 1. System Health Check
`GET /health`

### Response `200 OK`
```json
{
  "status": "ok",
  "service": "karigarSaathi-phase15",
  "service_name": "Explainable Fair-Price Assistant",
  "port": 8002,
  "formula_version": "fair-price-rules-v1",
  "currency": "INR",
  "supported_locales": ["en", "hi", "or", "bn", "te"],
  "pricing_rules_ready": true
}
```

---

## 2. Estimate Price
`POST /api/v1/pricing/estimate`

### Request Body
```json
{
  "materials": [
    {
      "name": "Mulberry Raw Silk",
      "quantity": 1,
      "unit": "piece",
      "cost_per_unit": 200,
      "value_status": "exact"
    }
  ],
  "labour": [
    {
      "task_name": "Handloom Weaving",
      "hours": 2,
      "hourly_rate": 100,
      "rate_source": "State Handloom Guild Card 2026",
      "rate_type": "preset",
      "hours_status": "exact"
    }
  ],
  "overhead": [
    {
      "name": "Loom lighting & upkeep",
      "amount": 50,
      "explanation": "Allocated electricity and reed upkeep"
    }
  ],
  "packaging": [
    {
      "name": "Standard Wrapping",
      "cost_per_unit": 0,
      "explanation": "Basic wrapper included"
    }
  ],
  "margin_mode": "percentage_markup",
  "margin_value": 20,
  "scenarios": [
    { "name": "low", "markup_percentage": 10, "label": "Low Markup (10%)" },
    { "name": "base", "markup_percentage": 20, "label": "Base Fair Trade (20%)" },
    { "name": "high", "markup_percentage": 30, "label": "High Markup (30%)" }
  ],
  "comparables": [],
  "currency": "INR",
  "locale": "en"
}
```

### Response `200 OK`
```json
{
  "formula_version": "fair-price-rules-v1",
  "currency": "INR",
  "locale": "en",
  "calculation_date": "2026-08-28",
  "cost_floor": 450.0,
  "total_material_cost": 200.0,
  "total_labour_cost": 200.0,
  "total_overhead": 50.0,
  "total_packaging": 0.0,
  "margin_mode": "percentage_markup",
  "margin_input": 20.0,
  "profit_amount": 90.0,
  "cost_based_base_price": 540.0,
  "suggested_base_price": 540.0,
  "suggested_range": {
    "suggested_low_rounded": 450.0,
    "suggested_base_rounded": 540.0,
    "suggested_high_rounded": 594.0
  },
  "scenarios": [
    {
      "name": "low",
      "label": "Low Markup (10%)",
      "markup_percentage": 10.0,
      "cost_floor": 450.0,
      "profit_amount": 45.0,
      "resulting_price_rounded": 495.0
    },
    {
      "name": "base",
      "label": "Base Fair Trade (20%)",
      "markup_percentage": 20.0,
      "cost_floor": 450.0,
      "profit_amount": 90.0,
      "resulting_price_rounded": 540.0
    },
    {
      "name": "high",
      "label": "High Markup (30%)",
      "markup_percentage": 30.0,
      "cost_floor": 450.0,
      "profit_amount": 135.0,
      "resulting_price_rounded": 585.0
    }
  ],
  "explanation_text": "### 1. Cost of Creation Breakdown...",
  "confidence_level": "HIGH",
  "is_below_cost": false,
  "shortfall_amount": 0.0,
  "timestamp": "2026-08-28T06:10:00Z"
}
```

---

## 3. Validate Inputs
`POST /api/v1/pricing/validate`

Returns `{ "valid": true, "errors": [], "warnings": [], "missing_inputs": [] }`.

---

## 4. Capture Feedback
`POST /api/v1/pricing/feedback`

Header: `Authorization: Bearer <JWT_TOKEN>`

### Request Body
```json
{
  "suggested_price": 540.0,
  "artisan_selected_price": 550.0,
  "decision": "edited",
  "cost_floor": 450.0,
  "reason": "Rounded up to clean 550 for retail exhibition"
}
```

### Response `200 OK`
```json
{
  "feedback_id": "fb_7b3a98c11e2f49aa",
  "status": "recorded",
  "owner_uid": "artisan_12345",
  "created_at": "2026-08-28T06:10:00Z",
  "message": "Artisan price decision recorded successfully in isolated storage."
}
```
