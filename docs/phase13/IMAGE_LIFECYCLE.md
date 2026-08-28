# Phase 13 — Product Photograph Lifecycle & Variant Management

## 1. Complete Image Lifecycle State Machine

```
+---------------------+
| 1. Device Capture / |
|    Gallery Picker   |
+---------------------+
           |
           v
+---------------------+   Upload Failed   +---------------------+
| 2. Local Validation | ----------------> | Local Storage Queue |
|    (MIME, <= 10MB)  |                   | (Durable IndexedDB) |
+---------------------+                   +---------------------+
           |
           v
+-------------------------------------------------------+
| 3. Raw Original Stored in Firebase Storage & Draft    |
|    - Path: users/{uid}/products/{id}/originals/       |
|    - rawOriginalUrl permanently pinned                |
|    - selectedVariant: 'original'                      |
|    - approvalStatus: 'none'                           |
+-------------------------------------------------------+
           |
           v
+-------------------------------------------------------+
| 4. User Chooses "Enhance with AI" (Optional Trigger)  |
|    - Requires explicit consent checkbox               |
|    - Submits image Blob to /v1/enhancements           |
|    - Status -> 'processing'                           |
+-------------------------------------------------------+
           |
           +--------------------------------+
           |                                |
           v                                v
+-----------------------+       +-----------------------+
| 5a. Success           |       | 5b. Error / Offline   |
| - Delta E <= 3.0      |       | - Original Preserved  |
| - SSIM >= 0.92        |       | - Safe Non-AI Option  |
| - Status: 'succeeded' |       | - Status: 'failed'    |
+-----------------------+       +-----------------------+
           |                                |
           v                                v
+-------------------------------------------------------+
| 6. Side-by-Side Artisan Comparison Viewer             |
|    - Interactive split slider & toggle buttons        |
|    - Displays color difference & SSIM guardrail badge |
+-------------------------------------------------------+
           |
           +--------------------------------+
           |                                |
           v                                v
+-----------------------+       +-----------------------+
| 7a. Artisan Approves  |       | 7b. Artisan Declines  |
| - selectedVariant:    |       | - selectedVariant:    |
|   'enhanced'          |       |   'original'          |
| - approvalStatus:     |       | - approvalStatus:     |
|   'approved'          |       |   'rejected'          |
| - Catalogue uses      |       | - Catalogue uses      |
|   enhanced variant    |       |   original photo      |
+-----------------------+       +-----------------------+
           |                                |
           +--------------------------------+
           |
           v
+-------------------------------------------------------+
| 8. Product Draft / Listing Persistence (Firestore)    |
|    - removeUndefinedDeep sanitization                 |
|    - Original raw URL preserved forever               |
|    - 10/10 Readiness Gate maintained                  |
+-------------------------------------------------------+
```

---

## 2. Invariants & Guarantees

1. **Original Immutability**:
   - The file at `users/{artisanUid}/products/{productId}/originals/{fileName}` is never overwritten, replaced, or deleted by the AI service.
   - `photo.rawOriginalUrl` always maintains the direct reference to this original image.

2. **Presentation Decoupling**:
   - `photo.url` acts as the active presentation URL.
   - When `approvalStatus === 'approved'` and `selectedVariant === 'enhanced'`, `photo.url` resolves to `enhancedUrl`.
   - When `approvalStatus === 'rejected'` or `selectedVariant === 'original'`, `photo.url` resolves to `rawOriginalUrl`.

3. **No Generative Distortion**:
   - The AI enhancement pipeline only strips background pixels and normalizes lighting levels. It cannot synthesize fabric patterns, introduce new objects, or alter artisan signatures.