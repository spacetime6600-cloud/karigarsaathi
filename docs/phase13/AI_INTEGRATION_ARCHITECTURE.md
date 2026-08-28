# Phase 13 — AI Integration Architecture

## 1. Executive Summary & Philosophy
Phase 13 integrates the Python FastAPI-based **KarigarSaathi AI Image Studio** (`AI/Phase13/karigarsaathi-ai`) with the production KarigarSaathi React frontend and Firebase backend.

The integration adheres strictly to the **Conservative Presentation Enhancement Principle**:
- **Zero Generative Alteration**: The AI model (`rembg` with IS-Net general-use ONNX model) performs deterministic image segmentation (background removal), conservative luminance normalization, centering, and standard canvas resizing ($512\times512$, $768\times768$, $1024\times1024$).
- **Immutability of Artisan Originals**: Raw uploaded photographs are preserved unchanged in Cloud Storage under `users/{artisanUid}/products/{productId}/originals/`.
- **Artisan Authority & Consent**: AI enhancement is never automatic. It requires explicit artisan consent and an interactive side-by-side review where the artisan explicitly approves or declines the enhanced variant.
- **Deterministic Non-AI Fallback**: When `VITE_AI_ENABLED=false` or when offline, the entire KarigarSaathi workflow functions seamlessly with 100% feature availability and zero degradation in 10-point listing readiness scores.

```
+-----------------------------------------------------------------------------------+
|                            KarigarSaathi React Frontend                            |
+-----------------------------------------------------------------------------------+
       |                                       |                               |
       | 1. Capture & Local Validation         | 4. Explicit Consent & Request | 7. Artisan Review
       v                                       v                               v
+-------------------------------+   +-----------------------------+   +-------------------+
|  Original Photo (Uploaded)   |   |   aiEnhancementService.ts   |   | ImageComparison   |
|  - Validated <= 10MB          |   |  - Firebase Bearer Token    |   | Viewer (Modal)    |
|  - Saved to Firebase Storage  |   |  - Timeout & Cancellation   |   | - Side-by-Side    |
|  - Stored in ProductDraft     |   +-----------------------------+   | - Delta E & SSIM  |
+-------------------------------+                  |                  +-------------------+
                                                   | 5. Multipart POST          |
                                                   v                            | 8. Approve/Reject
+-----------------------------------------------------------------------+       v
|                FastAPI AI Image Studio (Port 8000)                    | +-------------------+
|  - Verifies Bearer Token & artisan_id match                           | | ProductDraft      |
|  - SHA-256 Checksum on Input Bytes                                    | | - selectedVariant |
|  - Rembg IS-Net Background Removal                                    | |   'enhanced' or   |
|  - Lighting Correction & Canvas Centering                             | |   'original'      |
|  - Guardrails: Delta E <= 3.0, SSIM >= 0.92, Edge Preservation >= 90% | | - Immutable Orig  |
+-----------------------------------------------------------------------+ +-------------------+
```

---

## 2. Component Structure & Data Flow

### 2.1 Frontend Service Layer (`src/services/ai/aiEnhancementService.ts`)
- Implements typed interfaces for:
  - `checkHealth()`: Non-blocking health status query on `GET /health`.
  - `enhanceImage()`: Constructs `FormData` with image Blob, consent, request UUID, output size, and background preference.
  - `cancelEnhancement()`: Cancels in-flight requests via `AbortController`.
  - `urlToBlob()`: Safely converts local data URLs/blob URLs to memory Blobs for submission.

### 2.2 UI Presentation & Review Modals
- **`AIEnhancementModal.tsx`**: Multi-state workflow dialog:
  1. `CONSENT`: Presents craft integrity rationale and requires explicit checkbox check before sending network requests.
  2. `PROCESSING`: Accessible loading spinner with ARIA live announcer status updates.
  3. `REVIEW`: Integrates `ImageComparisonViewer` for visual inspection.
  4. `ERROR`: Structured error notification with retry capabilities and non-AI continuation.
- **`ImageComparisonViewer.tsx`**:
  - Interactive split slider with keyboard controls (Arrow Left/Right).
  - Quick toggle buttons: "Original Only", "Split Comparison", "Enhanced Only".
  - Fidelity badge displays: Mean $\Delta E$, Luminance SSIM, and Edge Preservation ratio.

### 2.3 Domain Data Model (`src/types/index.ts` & `src/domain/products/index.ts`)
- Extended `ProductImageRecord` and `PhotographItem` with:
  - `enhancementStatus`: `'none' | 'queued' | 'processing' | 'succeeded' | 'succeeded_with_warnings' | 'failed' | 'rejected'`
  - `approvalStatus`: `'none' | 'pending_review' | 'approved' | 'rejected'`
  - `selectedVariant`: `'original' | 'enhanced'`
  - `metrics`: `{ mean_delta_e, luminance_ssim, edge_preservation_ratio }`
  - `rawOriginalUrl`: Preserved URL pointing to the raw original upload.
- Sanitized before every Firestore persistence write using `removeUndefinedDeep`.