# Evaluation Data Documentation - KarigarSaathi AI Image Studio Phase 13

## Purpose

This folder contains the evaluation dataset used to verify Phase 13 completion gates.
The dataset documents before/after reviews of enhanced product photographs by human
reviewers (artisans or domain experts).

## Dataset Categories

| Category | Description | Expected Challenges |
|---|---|---|
| **Textile** | Fabrics, embroidery, handloom products | Tassels, threads, intricate patterns, varying textures |
| **Reflective** | Jewellery, metalwork, shiny surfaces | Specular highlights, glare, colour accuracy |
| **Intricate_Edges** | Items with fine details, holes, tassels | Fine edges, internal holes, transparent elements |
| **Poor_Lighting** | Low-quality source images | Shadows, colour casts, noise, limited dynamic range |
| **Cluttered_Background** | Products in messy environments | Object segmentation, background removal difficulty |

## CSV Manifest Format

The manifest CSV (`manifest.example.csv`) contains the following columns:

| Column | Description | Example |
|---|---|---|
| `sample_id` | Unique identifier | `e2e-001-textile` |
| `category` | Evaluation category | `Textile` |
| `file_path` | Path relative to `evaluation/` | `samples/textile-001.jpg` |
| `consent_granted` | Consent status (`true`/`false`) | `true` |
| `artisan_id` | Artisan identifier | `artisan-001` |
| `product_type` | Product category | `Textile` |
| `before_manual_review` | Initial reviewer decision | `helped` |
| `after_manual_review` | Final reviewer decision | `helped` |
| `rejection_reason` | If rejected, why | `colour shift too severe` |
| `processing_status` | Pipeline status | `succeeded` |
| `processing_time_ms` | Duration in ms | `1250` |
| `metrics_json` | Quality metrics JSON | `{"mean_delta_e":1.2,...}` |
| `warnings_json` | Warning strings JSON | `["color shift within limits"]` |
| `original_checksum_sha256` | SHA-256 of original | `a1b2c3d4...` |
| `enhanced_checksum_sha256` | SHA-256 of enhanced | `z9y8x7w6...` or `null` |

## Consent and Provenance

**All samples MUST have documented consent.**

- `consent_granted=true`: Artisan permitted image processing
- `consent_granted=false`: Processing rejected - these samples are excluded
- `consent_granted=pending`: Awaiting artisan decision - excluded from rate calculations

No copyrighted or private photographs should be included in the repository.
All images must be either:
1. Original photographs taken by the artisan with consent, or
2. Synthetic samples generated for testing purposes

## Evaluation Report

The `evaluate_dataset.py` script generates a comprehensive report containing:

### Completion Gate Calculations

```
help_rate = helped samples / reviewable samples
harm_rate = harmed samples / reviewable samples
technical_failure_rate = failed samples / total samples
```

### Phase 13 Pass Conditions

Phase 13 passes only when ALL of the following are true:

1. **help_rate > harm_rate** - More samples helped than harmed
2. **No original image lost or modified** - All original checksums verified
3. **All harmful outputs can fall back to the original** - Unsafe results fall back
4. **Every enhanced image requires user approval** - No automatic publication
5. **Failures and timeouts return safe responses** - Error states are handled

### Generated Artifact

The evaluation script writes:
- `evaluation/report.csv` - Detailed per-sample review data
- `evaluation/evaluation_report.json` - Summary statistics and pass/fail
- Console output with help_rate, harm_rate, technical_failure_rate

### Adding New Samples

1. Place product photographs in `evaluation/samples/` folder
2. Create consent file: `<filename>.consent.txt` with content `true` or `false`
3. Add a row to `manifest.example.csv` with appropriate category and metadata
4. Re-run `python scripts/evaluate_dataset.py` to update the report

### Reviewer Guidelines

**Decision: helped** - Enhancement improved photograph usability without altering
product identity, colour, or key features.

**Decision: neutral** - Enhancement was acceptable but had minor warnings; reviewer
would need to approve before use.

**Decision: harmed** - Enhancement altered product colour, pattern, texture, or
edges in unacceptable ways. Original should be retained.

**Rejection reasons may include:**
- Mean Delta E > threshold (colour change detected)
- Edge preservation ratio < 0.90 (details lost)
- Highlight clipping > 1% (specular highlights lost)
- Shadow clipping > 2% (detail lost in shadows)
- Foreground ratio below 5% or above 98% (segmentation issue)
- Insufficient consent
- Original image modified during processing