# Phase 13 — AI Image Studio API Contract

## 1. Base Configuration & Service Endpoints

- **Protocol**: HTTP/1.1 or HTTP/2
- **Default Base URL**: `http://localhost:8000` (Configurable via `VITE_AI_SERVICE_URL`)
- **Authentication**: `Authorization: Bearer <token>`
- **Content Types**: `multipart/form-data` (POST), `application/json` (GET)

---

## 2. Endpoints

### 2.1 Health Check
- **Route**: `GET /health`
- **Authentication**: Optional / Public
- **Response Format**:
```json
{
  "status": "healthy",
  "service": "KarigarSaathi AI Image Studio",
  "version": "0.1.0",
  "model_ready": true
}
```

### 2.2 Submit Image Enhancement
- **Route**: `POST /v1/enhancements`
- **Authentication**: Required (`Authorization: Bearer <token>`)
- **Form Fields (multipart/form-data)**:
  - `image` *(File, required)*: Binary image bytes (`image/jpeg`, `image/png`, `image/webp`). Max 10MB ($10,485,760$ bytes).
  - `consent_granted` *(string/bool, required)*: `"true"` (Must be explicitly true).
  - `request_id` *(string, required)*: Unique client UUID / request identifier.
  - `product_id` *(string, required)*: Draft/Product identifier.
  - `artisan_id` *(string, required)*: Artisan user UID matching the authenticated bearer token.
  - `operations` *(list/repeated, optional)*: Operations to apply:
    - `"background_removal"`
    - `"lighting_correction"`
    - `"centring"`
    - `"standard_resize"`
  - `output_size` *(integer, optional)*: `512` | `768` | `1024` (Default: `512`).
  - `background` *(string, optional)*: `"white"` | `"transparent"` (Default: `"white"`).

#### Success Response (`200 OK` / `JobResult`):
```json
{
  "job_id": "job_01h8x9p72q...",
  "request_id": "req_1787862...",
  "artisan_id": "artisan_uid_123",
  "product_id": "prod_silk_001",
  "status": "succeeded",
  "original_image_reference": "/v1/enhancements/job_01h8x9p72q.../original",
  "enhanced_image_reference": "/v1/enhancements/job_01h8x9p72q.../enhanced",
  "preview_image_reference": "/v1/enhancements/job_01h8x9p72q.../preview",
  "operations_requested": ["background_removal", "lighting_correction", "centring", "standard_resize"],
  "operations_applied": ["background_removal", "lighting_correction", "centring", "standard_resize"],
  "warnings": [],
  "metrics": {
    "mean_delta_e": 1.25,
    "luminance_ssim": 0.96,
    "edge_preservation_ratio": 0.94
  },
  "processing_duration_ms": 1320,
  "retryable": false,
  "failure_code": null,
  "adapter_version": "isnet-general-use/rembg-2.0.6",
  "created_at": "2026-08-28T01:50:00Z",
  "completed_at": "2026-08-28T01:50:01Z"
}
```

---

## 3. Error Codes & Mapping

| HTTP Code | Error Code | Description | Client Action / Fallback |
|:---|:---|:---|:---|
| **400** | `CONSENT_REQUIRED` | Consent checkbox was not checked | Modal displays required consent notice |
| **400** | `INVALID_IMAGE_TYPE` | Non-image or unsupported MIME format | Notify user to select valid JPEG/PNG/WebP |
| **400** | `IMAGE_TOO_LARGE` | Image file size exceeds 10MB | Advise user to upload a photo under 10MB |
| **400** | `INVALID_IMAGE_DIMENSIONS` | Image smaller than 256px or larger than 6000px | Prompt user to upload a standard photo |
| **401** | `AUTHENTICATION_REQUIRED` | Missing or expired Bearer token | Refresh Firebase Auth token or prompt sign in |
| **403** | `OWNERSHIP_MISMATCH` | `artisan_id` does not match token UID | Prevent cross-tenant enhancement request |
| **408** | `PROCESSING_TIMED_OUT` | Microservice timed out after 60s | Allow user to retry or continue with original |
| **422** | `SEGMENTATION_FAILED` | Foreground craft object could not be isolated | Advise clearer photo with contrasting backdrop |
| **429** | `QUOTA_EXCEEDED` | Daily artisan enhancement quota reached (25/day) | Inform artisan to use authentic original photo |
| **500** | `INTERNAL_PROCESSING_ERROR` | Server-side image processing exception | Display safe retryable error modal |