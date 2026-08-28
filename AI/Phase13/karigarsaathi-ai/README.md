# KarigarSaathi AI Image Studio

## Overview

KarigarSaathi AI Image Studio is a Python microservice that enhances product photographs for Indian artisans without altering the craft's authentic colour, pattern, texture, edges, proportions, or identity.

### What it does

- Removes backgrounds from product photographs
- Applies conservative lighting correction
- Centers products on catalogue canvases
- Produces standard catalogue image sizes (512×512, 768×768, 1024×1024)
- Validates image quality and safety
- Preserves original images immutably
- Returns preview, original, and enhanced image references

### Target Users

Marginalized Indian artisans who:
- Photograph textiles, embroidery, handloom fabrics
- Capture pottery, terracotta, jewellery, wooden crafts
- Document bamboo products, paintings, items with tassels and intricate edges
- Work with products photographed in poor lighting or cluttered surroundings

### Core Principles

1. **Original-image protection**: Original photograph is never edited, replaced, or deleted
2. **Colour fidelity**: Mean Delta E colour difference must remain ≤ 3.0 (≤ 2.0 for colour-critical products)
3. **Edge preservation**: Edge-preservation ratio must be ≥ 0.90
4. **Luminance preservation**: Luminance SSIM must be ≥ 0.92
5. **No generative editing**: No hallucinated or generated product parts
6. **Safety first**: Warning thresholds trigger fallback to original image

### Architecture

The service is built with **provider-neutral interfaces** so that components can be swapped without API changes:

- **Storage**: LocalFileStorageAdapter → Firebase Cloud Storage (future)
- **Segmentation**: RembgBackgroundRemovalAdapter with IS-Net model → Custom model (future)
- **Authentication**: DevelopmentAuthenticationVerifier → FirebaseAuthenticationVerifier (future)
- **Quota**: InMemoryQuotaService → Redis-backed (future)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd karigarsaathi-ai

# Install dependencies
pip install -r requirements.txt

# Copy environment config
cp .env.example .env
# Edit .env with your configuration

# Run the service
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Docker

```bash
# Build the image
docker build -t karigarsaathi-ai .

# Run the container
docker run -p 8000:8000 -e APP_ENV=development karigarsaathi-ai

# Or use docker-compose
docker compose up
```

### Environment Variables

See `.env.example` for all available variables. Key variables:

| Variable | Default | Description |
|---|---|---|
| `APP_ENV` | `development` | Environment: development or production |
| `APP_DEBUG` | `True` | Debug mode |
| `DEVELOPMENT_BEARER_TOKEN` | `your-dev-token-here` | Dev auth token |
| `ORIGINALS_DIR` | `storage/originals` | Path for original images |
| `ENHANCED_DIR` | `storage/enhanced` | Path for enhanced images |
| `PREVIEWS_DIR` | `storage/previews` | Path for preview images |
| `MAX_UPLOAD_SIZE` | `10485760` | Max upload size (10 MB) |
| `MIN_DIMENSION` | `256` | Min image dimension (pixels) |
| `MAX_DIMENSION` | `6000` | Max image dimension (pixels) |
| `DEFAULT_JOBS_PER_ARTISAN_PER_DAY` | `20` | Daily quota per artisan |
| `MAX_PROCESSING_TIME_SECONDS` | `60` | Max processing time |
| `CORS_ORIGINS` | `localhost:3000` | Allowed CORS origins |

### API Contract

#### GET /health

Returns service status, version and model readiness.

**Response:**
```json
{
  "status": "healthy",
  "service": "KarigarSaathi AI Image Studio",
  "version": "0.1.0",
  "model_ready": true
}
```

#### POST /v1/enhancements

Accepts multipart/form-data:

| Field | Required | Type | Description |
|---|---|---|---|
| `image` | Yes | bytes | JPG, JPEG, PNG or WebP |
| `consent_granted` | Yes | boolean | Must be `true` |
| `request_id` | Yes | string | UUID idempotency key |
| `product_id` | Yes | string | Product identifier |
| `artisan_id` | Yes | string | Artisan identifier |
| `operations` | No | list[string] | Enhancement operations |
| `output_size` | No | integer | 512, 768, or 1024 |
| `background` | No | string | `white` or `transparent` |

**Default operations:** background_removal, lighting_correction, centring, standard_resize

**Response:** Job result with references and status

#### GET /v1/enhancements/{job_id}

Returns current job result.

#### GET /v1/enhancements/{job_id}/original

Returns original image after authentication and ownership validation.

#### GET /v1/enhancements/{job_id}/preview

Returns preview image after authentication and ownership validation.

#### GET /v1/enhancements/{job_id}/enhanced

Returns enhanced image after authentication and ownership validation.

### Job States

| State | Meaning |
|---|---|
| `queued` | Job submitted, waiting to process |
| `processing` | Image enhancement in progress |
| `succeeded` | Enhancement completed successfully |
| `succeeded_with_warnings` | Completed with reviewable warnings |
| `retryable_failure` | Transient failure, can be retried |
| `permanent_failure` | Unrecoverable error |
| `timed_out` | Exceeded maximum processing time |
| `rejected` | Image rejected (e.g., no consent) |

### API Response Model

```json
{
  "job_id": "string",
  "request_id": "string",
  "artisan_id": "string",
  "product_id": "string",
  "status": "succeeded",
  "original_image_reference": "/v1/enhancements/job-id/original",
  "enhanced_image_reference": "/v1/enhancements/job-id/enhanced",
  "preview_image_reference": "/v1/enhancements/job-id/preview",
  "operations_requested": ["background_removal", "lighting_correction"],
  "operations_applied": ["background_removal"],
  "warnings": [],
  "metrics": {
    "mean_delta_e": 1.2,
    "luminance_ssim": 0.96,
    "edge_preservation_ratio": 0.95
  },
  "processing_duration_ms": 2450,
  "retryable": false,
  "failure_code": null,
  "adapter_version": "isnet-general-use",
  "created_at": "2024-01-15T10:30:00Z",
  "completed_at": "2024-01-15T10:30:02Z"
}
```

### Error Model

Consistent error responses containing:

```json
{
  "error_code": "CONSENT_REQUIRED",
  "message": "Consent must be granted before processing",
  "retryable": false,
  "request_id": "uuid-string",
  "details": {}
}
```

Error codes: CONSENT_REQUIRED, AUTHENTICATION_REQUIRED, OWNERSHIP_MISMATCH,
INVALID_IMAGE_TYPE, IMAGE_TOO_LARGE, INVALID_IMAGE_DIMENSIONS, CORRUPT_IMAGE,
QUOTA_EXCEEDED, DUPLICATE_REQUEST_CONFLICT, SEGMENTATION_FAILED,
QUALITY_CHECK_FAILED, PROCESSING_TIMED_OUT, INTERNAL_PROCESSING_ERROR

### Security Controls

- **Development mode**: Only works when `APP_ENV=development`
- **Bearer token**: Controlled by `DEVELOPMENT_BEARER_TOKEN` env var
- **Never in production**: Development auth rejected when `APP_ENV=production`
- **Ownership validation**: Authenticated user_id must match artisan_id
- **No secret exposure**: Health endpoint never exposes internal paths
- **File validation**: MIME signature validation, not just extension
- **Size limits**: Max 10 MB upload, 6000×6000 dimensions
- **Original preservation**: SHA-256 checksum verification

### Testing

```bash
# Run unit tests
pytest tests/unit/

# Run integration tests (if available)
pytest tests/integration/

# Evaluate dataset
python scripts/evaluate_dataset.py

# Create sample manifest
python scripts/create_sample_manifest.py
```

### Docker Commands

```bash
docker build -t karigarsaathi-ai .
docker run -p 8000:8000 -e APP_ENV=development karigarsaathi-ai
docker exec <container> python scripts/evaluate_dataset.py
```

### Evaluation Workflow

Phase 13 passes when:

1. helped samples > harmed samples
2. No original image was lost or modified
3. All harmful outputs can fall back to the original
4. Every enhanced image requires user approval
5. Failures and timeouts return safe responses

Evaluation report contains:
- sample_id, category, processing status, processing time
- metrics, warnings
- artisan/reviewer decision: helped, neutral or harmed
- rejection reason

### Antigravity Integration (Future)

The service is designed for integration with the KarigarSaathi website being
developed in Antigravity:

1. **POST /v1/enhancements** → Website uploads product photos
2. **GET /v1/enhancements/{job_id}/** → Website polls for completion
3. **Authentication**: FirebaseAuthenticationVerifier replaces DevelopmentAuthenticationVerifier
4. **Storage**: Firebase Cloud Storage replaces LocalFileStorageAdapter
5. **Quota**: Redis-backed quota replaces in-memory tracking

The API contract (endpoints, response models, error codes) remains stable
during these replacements due to the provider-neutral interface design.

### Production Deployment Checklist

- [ ] Set `APP_ENV=production`
- [ ] Generate strong `DEVELOPMENT_BEARER_TOKEN` (remove or change default)
- [ ] Configure Firebase Admin SDK for `FirebaseAuthenticationVerifier`
- [ ] Set up Firebase Cloud Storage buckets
- [ ] Configure Redis for quota tracking (replace InMemoryQuotaService)
- [ ] Set up monitoring and logging
- [ ] Configure HTTPS/SSL termination
- [ ] Set appropriate CORS origins for production website
- [ ] Test with real artisan photographs
- [ ] Verify original-image checksum preservation
- [ ] Validate safety thresholds with product category experts
- [ ] Run full evaluation dataset
- [ ] Document any known limitations

### Security Limitations - Development Mode

⚠️ **Development mode has the following limitations:**

- Only functional when `APP_ENV=development`
- Authentication uses a single hardcoded bearer token
- No real user identification or session management
- Quota tracking is in-memory (not persistent across restarts)
- Intended for local development and testing only
- **Must not be deployed to production without**
  - `APP_ENV=production`
  - Firebase authentication integration
  - Proper secret management
- Production deployment without these changes exposes the service to
  unauthorized access and bypasses ownership validation

### Model Download Behaviour

- The `rembg` library downloads the IS-Net general-use model
  (`isnet-general-use`) on first use if not present
- Model is stored in `~/.cache/rembg/` (OS cache directory)
- This model is **not** included in the Docker image or repository
- The adapter is designed to be replaceable - swap the model by
  changing the `model_name` parameter without API changes
- No training is performed from scratch for this prototype