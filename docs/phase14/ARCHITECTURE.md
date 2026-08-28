# Phase 14 Architecture — Voice & Multilingual Auto-Catalogue

## 1. System Overview

The KarigarSaathi Voice and Multilingual Auto-Catalogue system enables Indian artisans to digitize their craft products by speaking in their native dialect or typing natural language descriptions. The system transcribes the speech using Faster Whisper, allows the artisan to review and edit the transcript, extracts structured physical specifications without hallucination, generates bilingual titles, descriptions, and tags (in English and Hindi, Odia, or Bengali), and requires explicit approval before anything is persisted into the product draft.

```
+-------------------------------------------------------------------------+
|                        BROWSER CLIENT (React 18)                         |
|                                                                         |
|  [VoiceCatalogueStudioModal] <---> [VoiceRecorder / MediaRecorder]      |
|           |                                                             |
|           v                                                             |
|  [voiceCatalogueService.ts] (Typed Adapter, Bearer Auth, AbortController)|
+------------------------------------+------------------------------------+
                                     |  HTTP POST / GET (Port 8001)
                                     v
+-------------------------------------------------------------------------+
|               FASTAPI MICROSERVICE (:8001 / Python 3.11)                |
|                                                                         |
|  [API Router: /api/v1/catalogue-sessions, /transcribe, /generate]       |
|       |                                 |                               |
|       v                                 v                               |
|  [FasterWhisperSpeechAdapter]    [CatalogueAdapter / FactGrounding]     |
|   - PyAV / Faster-Whisper Base    - Strict Permitted Facts (No Fakes)  |
|   - Timestamps & Confidence       - English + Hindi/Odia/Bengali Copy  |
|       |                                 |                               |
|       v                                 v                               |
|  [SQLite Async Engine & Session Lifecycle State Machine]                |
|   (created -> uploaded -> transcribing -> awaiting_review -> approved)  |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                  FIRESTORE & LOCAL STORAGE RECOVERY                     |
|                                                                         |
|  [ProductDraftProvider] -> [Draft & Verified Facts Persistence]         |
+-------------------------------------------------------------------------+
```

---

## 2. Key Architecture Guarantees

1. **Explicit Artisan Approval Gate**:
   AI suggestions remain isolated in review state until the artisan explicitly clicks "Apply to Draft".
2. **Zero Factual Hallucination**:
   Missing fields remain `unknown` and produce clarification prompts. The model never invents GI tags, prices, or materials.
3. **Fidelity & Privacy**:
   Raw audio is kept in secure private storage with immediate deletion controls (`DELETE /source-data`).
4. **Offline Resilience**:
   When offline or AI is disabled, manual product details entry works 100% without interruption.
