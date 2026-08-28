# Phase 15 — Tests and Verification Strategy

## 1. Test Coverage Overview

| Test Module | Focus Area | Quality Gate |
|---|---|---|
| `test_synthetic_fixture.py` | Exact arithmetic on user-specified fixture (₹200 + ₹200 + ₹50 = ₹450 $\to$ ₹495 / ₹540 / ₹585) | Exact Decimal match |
| `test_pricing_engine.py` | Batch material conversion, fixed margin mode, below-cost warning, determinism | 100% Deterministic |
| `test_validation_and_errors.py` | Negative inputs, invalid currency, malformed percentages, contradictory scenarios | Immediate 422/Error |
| `test_comparables_and_guards.py` | Zero comparables handling, rejection of unverified/stale comparables, floor protection | Floor $\le$ Price |
| `test_api_endpoints.py` | FastAPI HTTP request/response serialization on `/health`, `/estimate`, `/validate` | Clean 200 OK |
| `test_feedback_security.py` | Server-derived JWT authentication and isolated SQLite persistence | Isolated persistence |
| `smoke_test_api.py` | Live HTTP smoke test against the running service on port 8002 | 6/6 Live Gates Passed |

---

## 2. Running Automated Tests

```bash
cd AI/phase15
.\.venv\Scripts\pytest.exe -v
```

---

## 3. Running Live HTTP Smoke Test

```bash
cd AI/phase15
.\.venv\Scripts\python.exe smoke_test_api.py
```
