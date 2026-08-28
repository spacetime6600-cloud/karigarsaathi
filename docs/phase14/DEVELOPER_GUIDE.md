# Phase 14 Developer & Operator Guide

## 1. Quick Start

### Starting the Microservice (Port 8001)

Run the PowerShell launcher:
```powershell
.\AI\phase14\start-voice-catalogue-service.ps1
```

Or manually:
```powershell
cd AI\phase14\phase14
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --host 0.0.0.0 --port 8001
```

### Running the Frontend (Port 3001)

```bash
cd frontend/app
npm run dev
```

---

## 2. Environment Variables

### Frontend (`frontend/app/.env` or runtime environment)
- `VITE_VOICE_CATALOGUE_SERVICE_URL=http://localhost:8001`: Voice microservice endpoint.
- `VITE_VOICE_CATALOGUE_ENABLED=true`: Feature flag for Phase 14 voice studio.
- `VITE_AI_DEV_BEARER_TOKEN=mock_firebase_artisan_token`: Bearer token for local dev.

### Backend (`AI/phase14/phase14/.env`)
- `APP_PORT=8001`: Port for uvicorn.
- `DATABASE_URL=sqlite+aiosqlite:///./data/voice_catalogue.db`: SQLite async database.
- `WHISPER_MODEL=base`: Faster Whisper model size (`tiny`, `base`, `small`, `medium`, `large-v3`).
- `WHISPER_DEVICE=cpu`: Compute device (`cpu` or `cuda`).
- `WHISPER_COMPUTE_TYPE=int8`: Quantization mode for fast CPU inference.
- `PRIVATE_UPLOAD_DIR=./private/uploads`: Directory for temporary audio storage.

---

## 3. Running Verification Tests

### 1. Python Backend Tests
```bash
cd AI/phase14/phase14
.\.venv\Scripts\pytest.exe -v tests/test_live_inference.py
```

### 2. Frontend Vitest Tests
```bash
cd frontend/app
npx vitest run
```

### 3. TypeScript Type-Checking
```bash
cd frontend/app
npx tsc --noEmit
```

### 4. End-to-End Live Verification Script
```bash
cd frontend/app
node scripts/phase14-e2e-verification.mjs
```
