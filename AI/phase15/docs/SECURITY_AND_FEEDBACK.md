# Phase 15 — Security, Auth Derivation, and Feedback Privacy

## 1. Server-Derived Identity
- Authentication is enforced via standard `Authorization: Bearer <JWT>` headers.
- The user/artisan UID is decoded and validated server-side from the signed token. The API **never** trusts client-submitted ownership query parameters or JSON body fields for private data access.

---

## 2. Isolated Feedback Storage
- Feedback records (artisan price selections, overrides, and rationales) are persisted strictly inside an isolated Phase 15 SQLite database at `AI/phase15/backend/data/pricing_feedback.db`.
- **No live product documents** in the main Firestore / IndexedDB databases are modified or overwritten during estimation or feedback capture.
- **Model Training Policy**: Feedback entries are stored solely for auditability, quality assurance, and artisan preference analysis. No automated model training or price retraining runs on feedback without explicit consent and curation.
