# Phase 13 — Security, Tenant Isolation & Privacy

## 1. Threat Model & Safeguards

| Threat Vector | Potential Impact | Enforced Safeguard & Architectural Control |
|:---|:---|:---|
| **Cross-Tenant Enhancement Hijacking** | Malicious user submits photos targeting another artisan's draft | `POST /v1/enhancements` strictly requires `artisan_id === auth.currentUser.uid`. Token verification checks UID match and rejects with `OWNERSHIP_MISMATCH` (HTTP 403). |
| **Unconsented AI Processing** | Artisan photo processed without knowledge | `consent_granted: "true"` is mandatory. Request fails immediately with `CONSENT_REQUIRED` (HTTP 400) if omitted. |
| **Secret & Credential Leakage** | API keys or server filesystem paths exposed | Zero secret keys sent to frontend. Bearer tokens use short-lived Firebase Auth ID tokens. Error messages sanitized. |
| **Denial of Service / Flooding** | Attacker spams microservice with large files | Maximum file size hard-capped at 10MB ($10,485,760$ bytes). Request rate limited with daily quotas (25/artisan/day). |
| **Corrupt / Malicious Payloads** | Decompression bombs or malicious MIME types | Strict validation of file signatures (magic bytes) for `image/jpeg`, `image/png`, and `image/webp`. Dimension range checked ($256\text{px} \le \text{dim} \le 6000\text{px}$). |
| **Public Storage Exposure** | Public users reading unapproved artisan raw drafts | Cloud Storage security rules scope original images under `users/{ownerUid}/...`, restricting read/write to the authentic owner. |

---

## 2. Token Authentication Flow

```
+------------------+         1. getIdToken()        +------------------------+
|  Frontend Client | -----------------------------> | Firebase Authentication |
+------------------+ <----------------------------- +------------------------+
         |                     2. ID Token (JWT)
         |
         | 3. POST /v1/enhancements
         |    Header: "Authorization: Bearer <ID_TOKEN>"
         |    FormData: { artisan_id: "user_abc", ... }
         v
+----------------------------------------------------+
|        FastAPI AI Microservice (Server)            |
|  1. Parses Authorization header                    |
|  2. Verifies signature against Firebase Public Keys|
|  3. Asserts token.uid === request.artisan_id       |
|     (If mismatch -> Rejects with 403 FORBIDDEN)    |
|  4. Processes segmentation within isolated session |
+----------------------------------------------------+
```

---

## 3. Storage Privacy & Firestore Invariants

- **Storage Isolation**:
  - Raw originals: `users/{artisanUid}/products/{productId}/originals/`
  - Enhanced images: `users/{artisanUid}/products/{productId}/enhanced/`
- **Firestore Cleanliness**:
  - Base64 blobs and binary buffers are strictly prohibited in Firestore.
  - All writes pass through `removeUndefinedDeep` to prevent Firestore serialization exceptions.