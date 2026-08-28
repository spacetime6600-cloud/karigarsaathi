# Security & Privacy Controls

## 1. Zero Audio Binary Storage in Primary Database

- Audio recordings are **never stored as base64 or binary data inside Firestore or SQLite databases**.
- Audio files are held temporarily in dedicated server storage (`private/uploads/`) with unguessable UUID filenames.

## 2. Artisan Consent & Retention Choices

1. **Explicit Consent**:
   - Each session requires explicit artisan consent recorded in `consent_records`.
   - Clear disclosure explaining how voice audio is transcribed locally without external model leak.
2. **Configurable Retention**:
   - `30_days` (default): Audio retained temporarily to allow editing or re-transcribing.
   - `immediate_delete`: Audio deleted immediately following catalogue draft generation.
3. **Manual Deletion Control**:
   - The artisan can click "Delete Audio From Server" at any time (`DELETE /api/v1/catalogue-sessions/{id}/source-data`).
   - This physically removes the file from the filesystem and removes the raw transcript.

## 3. Microservice Authentication

- Protected endpoints require a valid Bearer token (`Authorization: Bearer <token>`).
- In production, tokens are verified against Firebase Authentication ID tokens.
- In local development, bearer tokens and development mock tokens are validated without external identity dependencies.
