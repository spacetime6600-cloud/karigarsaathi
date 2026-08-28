# Phase 15 — Startup and Operations Guide

## 1. Prerequisites
- Python 3.11+
- Virtual environment in `AI/phase15/.venv`

---

## 2. Startup Command

To launch the Explainable Fair-Price Assistant on port **8002**:

### Via PowerShell Script
```powershell
cd c:\Users\KIIT\Desktop\Synapse1\AI\phase15
.\start-fair-price-service.ps1
```

### Via Direct Uvicorn CLI
```powershell
cd c:\Users\KIIT\Desktop\Synapse1\AI\phase15
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --host 0.0.0.0 --port 8002 --reload
```

---

## 3. Verifying Service Health
```bash
curl http://127.0.0.1:8002/health
```

Expected output:
```json
{
  "status": "ok",
  "service": "karigarSaathi-phase15",
  "port": 8002,
  "formula_version": "fair-price-rules-v1",
  "pricing_rules_ready": true
}
```
