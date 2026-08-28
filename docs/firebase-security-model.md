# Firebase Security Model & Data Boundary Specification

This document defines the data boundaries, ownership models, access control matrices, and least-privilege security rules for KarigarSaathi Phase 8.

---

## 1. Core Security Completion Gate

> **Absolute Invariant**:
> Artisan A must **never** be able to read, list, modify, delete, or download Artisan B’s private profile, products, drafts, or original product photographs.

---

## 2. Access Control Matrix

| Entity | Collection / Path | Unauthenticated | Owner (Artisan A) | Peer Artisan (Artisan B) | Buyer / Public |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **User Account** | `/users/{uid}` | ❌ Denied | ✅ Get, Create, Update | ❌ Denied | ❌ Denied |
| **Users Collection** | `/users` (list) | ❌ Denied | ❌ Denied | ❌ Denied | ❌ Denied |
| **Artisan Profile** | `/artisanProfiles/{uid}` | ❌ Denied | ✅ Get, Create, Update | ❌ Denied | ❌ Denied |
| **Profiles Collection** | `/artisanProfiles` (list) | ❌ Denied | ❌ Denied | ❌ Denied | ❌ Denied |
| **Product Record / Draft** | `/products/{productId}` | ❌ Denied | ✅ Get, Create, Update, Delete | ❌ Denied | ❌ Denied |
| **Product List (Scoped)** | `/products?where(ownerId==uid)` | ❌ Denied | ✅ List (Limit $\le 100$) | ❌ Denied | ❌ Denied |
| **Broad Product Query** | `/products` (unfiltered) | ❌ Denied | ❌ Denied | ❌ Denied | ❌ Denied |
| **Original Photograph** | `users/{uid}/products/{productId}/originals/{fileId}` | ❌ Denied | ✅ Get, Create, Update, Delete | ❌ Denied | ❌ Denied |
| **Storage Directory** | `users/{uid}/products/...` (list) | ❌ Denied | ❌ Denied | ❌ Denied | ❌ Denied |

---

## 3. Firestore Security Rules Specification

- **Rules Version**: `rules_version = '2';`
- **Default Action**: `match /{document=**} { allow read, write: if false; }`
- **Role Elevation Defense**: Client registration in Phase 8 accepts strictly role `'artisan'`. Attempts to self-assign `'coordinator'` or `'administrator'` are unconditionally rejected at the Firestore rule level.
- **Immutable Fields**:
  - `users/{uid}`: `uid`, `role`, `email`, `createdAt` cannot be modified.
  - `artisanProfiles/{uid}`: `ownerId`, `createdAt` cannot be modified.
  - `products/{productId}`: `id`, `ownerId`, `createdAt` cannot be modified.
- **Field Constraints & Types**:
  - `title`: String, length $1–160$
  - `description`: String, length $0–5000$
  - `category`: String, length $1–100$
  - `craftType`: String, length $\le 120$
  - `state`: String, length $\le 100$
  - `price`: Numeric, range $0 \le \text{price} \le 10,000,000$
  - `stockQuantity`: Integer, range $0 \le \text{stock} \le 1,000,000$
  - `status`: Enum `draft | published | archived`
  - `photoPaths`: List, length $\le 10$

---

## 4. Cloud Storage Rules Specification

- **Path Schema**: `users/{uid}/products/{productId}/originals/{fileId}`
- **Default Action**: `match /{allPaths=**} { allow read, write: if false; }`
- **File Size**: $0 < \text{size} \le 10\text{ MiB}$ ($10 \times 1024 \times 1024$ bytes)
- **MIME Whitelist**: `image/jpeg`, `image/png`, `image/webp`
- **Disallowed Formats**: SVG, GIF, PDF, HTML, executable binaries, missing content types.
- **Metadata Requirement**:
  - `customMetadata.ownerId == uid`
  - `customMetadata.productId == productId`

---

## 5. Security Warning

> [!WARNING]
> **Firebase Admin SDK Warning**:
> Firebase Admin SDK bypasses Firestore and Storage Security Rules. Future backend microservices (e.g., Python FastAPI, Cloud Functions, Cloud Run) must independently authenticate caller tokens, enforce granular authorizations, and utilize least-privilege IAM service account roles.
