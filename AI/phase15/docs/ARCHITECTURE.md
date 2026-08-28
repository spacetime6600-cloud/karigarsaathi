# Phase 15 Explainable Fair-Price Assistant — Architecture

## 1. System Overview
The **Explainable Fair-Price Assistant** is a standalone, deterministic microservice running on port `8002`. It calculates transparent, cost-grounded handicraft pricing in Indian Rupees (INR) for Indian rural artisans.

## 2. Core Architecture Principles
1. **Rules-First & Calculation-Transparent**: All monetary figures are calculated using explicit Python `Decimal` arithmetic. Zero LLM calculations or statistical hallucinations are used.
2. **Cost Floor Primacy**: The production cost floor ($\text{Materials} + \text{Labour} + \text{Overheads} + \text{Packaging}$) is mathematically protected. Market adjustments can never drag a suggested price below this floor.
3. **Artisan Ownership**: The artisan retains absolute control over the final selling price. If an artisan selects a price below the cost floor, the system issues a clear shortfall notice and requests acknowledgement without altering the input.
4. **Isolated Storage**: Feedback records and decisions are persisted in isolated SQLite database (`backend/data/pricing_feedback.db`) without modifying live product databases.

## 3. Component Architecture

```
                 +---------------------------------------------+
                 |          FastAPI REST API Layer            |
                 |      (POST /estimate, POST /validate)       |
                 +---------------------------------------------+
                                       |
                                       v
                 +---------------------------------------------+
                 |       Pure Deterministic Pricing Engine     |
                 |  +---------------------------------------+  |
                 |  | 1. Materials & Batch Normalizer      |  |
                 |  | 2. Labour Hours & Guild Wage Valuer   |  |
                 |  | 3. Overhead & Packaging Allocator    |  |
                 |  | 4. Cost Floor Aggregator             |  |
                 |  | 5. Profit Markup (%) Calculator      |  |
                 |  | 6. Scenario Evaluator (Low/Base/High)|  |
                 |  | 7. Provenance-Grounded Comparables   |  |
                 |  | 8. Rule-Based Explainability Engine  |  |
                 |  +---------------------------------------+  |
                 +---------------------------------------------+
                                       |
                   +-------------------+-------------------+
                   |                                       |
                   v                                       v
     +---------------------------+           +---------------------------+
     |   Typed API Response      |           | Isolated Feedback Storage |
     |  (Breakdown, Scenarios)   |           | (SQLite pricing_feedback) |
     +---------------------------+           +---------------------------+
```
