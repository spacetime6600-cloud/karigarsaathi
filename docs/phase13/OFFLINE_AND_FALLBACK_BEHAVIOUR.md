# Phase 13 — Offline Resilience & Non-AI Fallback Behaviour

## 1. Operating Principle: Safe Non-AI Fallbacks

KarigarSaathi is engineered with an uncompromised **Non-AI Baseline Guarantee**:
1. Rural and low-bandwidth artisans frequently experience intermittent 2G/3G connectivity or complete offline conditions.
2. The core value of KarigarSaathi—craft provenance, inventory management, price calculations, QR Craft Passports, and buyer enquiries—does **not** require AI.
3. When AI is disabled (`VITE_AI_ENABLED=false`) or the device is offline (`navigator.onLine === false`), the system seamlessly operates without blocking any user workflows.

---

## 2. Matrix of Degradation & Fallback Modes

| Scenario / Condition | System Behaviour | UI Presentation | Artisan Capability |
|:---|:---|:---|:---|
| **Online + Microservice Reachable** | Normal AI enhancement pipeline available | "Enhance with AI" buttons active on photo cards | Full before/after comparison, explicit approval |
| **Offline (No Internet)** | AI service requests blocked immediately with `OFFLINE_SERVICE_UNAVAILABLE` | Offline indicator shown in modal; original photo preserved | Photo capture, crop, aspect ratio framing, save draft, offline sync queue |
| **AI Microservice Down (503/Timeout)** | Request times out after 4s (health) / 60s (job); non-blocking error handled | Error alert displayed with "Continue with Original Photo" and "Retry" | 100% core listing creation continues |
| **`VITE_AI_ENABLED=false` (Policy)** | `isAiEnabled()` returns `false`; network calls prevented | Clean standard photography interface; non-AI guidelines | 100% complete catalogue & passport creation |
| **Artisan Rejection of AI Output** | Enhanced variant discarded; original photo active | Thumbnail displays standard original photo badge | Zero distortion of authentic craft |

---

## 3. Data Integrity & Sync Guarantees

- **No Fake Offline Processing**: The application never simulates fake AI transformations offline or creates low-quality local approximations.
- **Persistent Offline Storage**: Original craft photographs are queued in IndexedDB (`storageUploadQueue.ts`) and uploaded with exponential backoff when connectivity returns.
- **Listing Readiness Independence**: The 10-point listing readiness validator evaluates authentic craft data and original photo presence, remaining 100% satisfied with original photographs.