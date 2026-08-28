# Phase 15 — Frontend Fair Pricing Page Integration Checklist

This document details the exact integration steps required to connect the Phase 15 backend to the KarigarSaathi React frontend in subsequent integration phases.

---

## 1. Environment Variable
Add to `frontend/app/.env`:
```env
VITE_FAIR_PRICE_SERVICE_URL=http://localhost:8002
VITE_FAIR_PRICE_ASSISTANT_ENABLED=true
```

---

## 2. Frontend Client Adapter
Create `frontend/app/src/services/ai/fairPricingService.ts`:
- Methods:
  - `checkHealth()`: queries `GET /health`
  - `calculateFairPrice(draft)`: sends material breakdown, labour tasks, and chosen markup to `POST /api/v1/pricing/estimate`
  - `submitPricingFeedback(feedback)`: records decision to `POST /api/v1/pricing/feedback`

---

## 3. UI Enhancements for `ChoosePricePage.tsx`
1. Connect "Cost of Creation" inputs to trigger live updates from the backend `/api/v1/pricing/estimate`.
2. Display the Low (10%), Base Fair Trade (20%), and High (30%) scenario cards dynamically from the backend response.
3. Show the cost floor breakdown tooltip and natural explanation accordion.
4. Keep the Below-Cost Warning modal active if the artisan types a custom price below the computed cost floor.
