# Phase 11 — Buyer Enquiry and Coordinator Flow

## 1. Architectural Overview & Security Model

Phase 11 introduces two core capabilities to KarigarSaathi:
1. **Public-Facing Structured Buyer Enquiries**: Enables prospective craft buyers, retail partners, and boutique curators to contact artisans directly through public Craft Passports without leaking artisan private contact details or opening arbitrary Firestore collections to malicious writes.
2. **Cluster Coordinator Assistance Workspace**: Enables assigned field coordinators to assist artisans with digitization, catalogue readiness, enquiry follow-ups, and export formatting using **privacy-safe projections** that guarantee strict tenant isolation.

```
       +-------------------------------------------------------------+
       |                  Public Buyer / Curator                     |
       +-------------------------------------------------------------+
                                      |
                      1. Submits Enquiry with Slug
                                      v
       +-------------------------------------------------------------+
       |             Enquiry Submission Service (Trusted)            |
       |  - Validates form timing (>= 2s) & honeypot (website_hp)    |
       |  - Enforces rate limits (5/15min) & duplicate suppression   |
       |  - Authoritatively resolves artisanId & productId from      |
       |    publicCraftPassports/{publicSlug}                        |
       |  - Checks Craft Passport status != 'revoked'                |
       +-------------------------------------------------------------+
                         /                         \
       2. Creates Enquiry                           3. State Machine Update
                       v                                       v
+-------------------------------+             +-------------------------------+
|     /buyerEnquiries/{id}      |             |     /products/{productId}     |
| - Scoped to artisanId         |             | - Transitions:                |
| - Readable only by artisan    |             |   ready/shared ->             |
| - Reply thread support        |             |   enquiry_received            |
+-------------------------------+             | - Appends statusHistory entry |
                                              +-------------------------------+
                                                               ^
       +-------------------------------------------------------+
       |          Assigned Cluster Coordinator                 |
       |  - Must have active /coordinatorAssignments doc       |
       |  - Reads privacy-safe aggregate projections ONLY      |
       |  - NO private phone, address, or unassigned data      |
       +-------------------------------------------------------+
```

---

## 2. Server-Authoritative Destination Routing

### Security Threat Model & Mitigation
- **Vulnerability**: If browser clients specify `artisanId` or `ownerId` directly when submitting enquiries, an attacker can flood unrelated artisans or hijack routing.
- **Enforced Mitigation**:
  - The client only provides `publicSlug` and buyer enquiry fields (`buyerName`, `buyerContact`, `message`, `quantityRequested`, `consentToBeContacted`).
  - `EnquirySubmissionService` looks up `publicCraftPassports/{publicSlug}` to resolve the authoritative `ownerId` and `productId`.
  - Client-supplied `artisanId` is strictly ignored and discarded.
  - Revoked or missing Craft Passports immediately reject enquiry submissions with `REVOKED_PASSPORT` or `NOT_FOUND`.

---

## 3. Abuse Protections & Spam Controls

To protect rural artisans from spam, automated bots, and message flooding:

1. **Honeypot Trap**: Invisible field `website_hp` hidden via CSS. Any submission with a non-empty honeypot is silently rejected with `BOT_DETECTED`.
2. **Form Timing Threshold**: Submissions completed in under 2 seconds (`formDurationMs < 2000`) are blocked as automated script activity.
3. **Duplicate Suppression**: A 10-minute sliding window checks the hash of `(source, slug, message, quantity)`. Identical submissions within this window return `DUPLICATE`.
4. **Rate Limiting**:
   - Max 5 enquiries per 15 minutes per source IP/hash.
   - Max 20 enquiries per day per Craft Passport slug.
5. **Explicit Contact Consent**: Buyers must check the explicit consent checkbox (`consentToBeContacted: true`) to agree to artisan communications.

---

## 4. Product Lifecycle State Machine

The product lifecycle state machine is centralized in `src/domain/lifecycle/index.ts` with complete audit trail history:

```
+---------+  10/10 Readiness   +---------+  Passport Share   +----------+
|  draft  | -----------------> |  ready  | ----------------> |  shared  |
+---------+                    +---------+                   +----------+
                                    |                             |
                                    | Buyer Enquiry Received      | Buyer Enquiry Received
                                    v                             v
                              +---------------------------------------+
                              |           enquiry_received            |
                              +---------------------------------------+
                                    |                             |
                                    | Export Generated            | Publish Channel
                                    v                             v
                              +------------+                +-------------+
                              |  exported  |                |  published  |
                              +------------+                +-------------+
                                    \                             /
                                     \                           /
                                      v                         v
                                   +-------------------------------+
                                   |           archived            |
                                   +-------------------------------+
```

### Transition Validation Rules:
- `draft` $\to$ `ready`: Requires all 10 listing-readiness checks to pass (title $\ge 5$, category, technique, state, price $> 0$, stock $> 0$, photos $\ge 1$, cover photo, materials, description).
- `ready` / `shared` $\to$ `enquiry_received`: Triggered automatically upon successful buyer enquiry submission with audit context recording actor `buyer` and `triggeringEnquiryId`.
- `archived`: Read-only terminal state for buyer and external systems; can only be transitioned back to `draft` via explicit artisan restore action.

---

## 5. Coordinator Security & Privacy-Safe Projections

### Assignment-Gated Access:
- A user with role `coordinator` cannot browse or read arbitrary artisan profiles.
- Access requires an active document in `/coordinatorAssignments/{assignmentId}` with matching `coordinatorUid` and `artisanUid`.
- Revoked or inactive assignments immediately block all data access.

### Privacy Preservation:
- Firestore does not support field-level read rules.
- `CoordinatorService` maps data into a sanitized `CoordinatorArtisanProjection`:
  - Returns only aggregate statistics: `totalProducts`, `readyProducts`, `sharedProducts`, `newEnquiryCount`, `lastActivityAt`.
  - Exposes `exportProblems` only when `permissions.assistExports: true`.
  - **NEVER** exposes private phone numbers, home/workshop addresses, personal notes, authentication details, or raw unassigned artisan profiles.

---

## 6. Firestore Security Rules Summary

Updated in `firestore.rules`:
1. `/buyerEnquiries/{enquiryId}`:
   - `create`: Direct client write completely disabled (`allow create: if false;`). Handled exclusively by trusted server / Admin SDK.
   - `get`, `list`: Allowed ONLY for authenticated artisans where `resource.data.artisanId == request.auth.uid`.
   - `update`: Allowed ONLY for authenticated artisans where `resource.data.artisanId == request.auth.uid` for approved status and workflow fields.
   - `delete`: Denied (`allow delete: if false;`).
   - Public listing of enquiries is blocked.
2. `/coordinatorAssignments/{assignmentId}`:
   - Read allowed only for the assigned coordinator or the artisan (`coordinatorUid == request.auth.uid || artisanUid == request.auth.uid`).
   - Client mutations blocked (`allow create, update, delete: if false;`).
3. `/coordinatorProjections/{artisanUid}`:
   - Read allowed for authenticated coordinators with active assignments.
   - Client mutations blocked (`allow create, update, delete: if false;`).
4. `/_enquiryRateLimits/{id}` & `/_enquiryIdempotency/{id}`:
   - Client read/write blocked (`allow read, write: if false;`).

---

## 7. Automated Test & Verification Summary

| Test Suite | File / Scope | Tests Passed |
|:---|:---|:---:|
| **Trusted Enquiry Server Handler** | `src/test/unit/trustedEnquirySubmission.test.ts` | 10 / 10 |
| **Product Lifecycle State Machine** | `src/test/unit/productLifecycle.test.ts` | 8 / 8 |
| **Buyer Enquiry Flow & Server Routing** | `src/test/unit/buyerEnquiryFlow.test.ts` | 4 / 4 |
| **Enquiry Validation & Abuse Controls** | `src/test/unit/enquiryValidation.test.ts` | 6 / 6 |
| **Coordinator Authorization & Isolation** | `src/test/unit/coordinatorSecurity.test.ts` | 5 / 5 |
| **Buyer Enquiries UI & Threads** | `src/test/enquiries.test.tsx` | 5 / 5 |
| **Firestore Security Rules Suite** | `src/test/rules/firestore.rules.test.ts` | 54 / 54 |
| **Storage Security Rules Suite** | `src/test/rules/storage.rules.test.ts` | 26 / 26 |
| **Persistence Smoke Suite** | `src/test/rules/persistenceSmoke.test.ts` | 1 / 1 |
| **Total Rules Test Suite (`npm run test:rules`)** | 3 Test Files | **81 / 81** |
| **Full Vitest Test Suite (`npm run test`)** | 35 Test Files | **249 / 249** |
| **TypeScript Typecheck (`npm run typecheck`)** | `tsc --noEmit` | **0 errors** |
| **ESLint Static Analysis (`npm run lint`)** | `--max-warnings 0` | **0 errors, 0 warnings** |
| **Vite Production Build (`npm run build`)** | `tsc -b && vite build` | **0 errors (13.23s)** |
| **Phase 10 Live Emulator E2E** | `scripts/phase10-e2e-verification.mjs` | **7 / 7 Passed** |
| **Phase 11 Live Emulator E2E** | `scripts/phase11-e2e-verification.mjs` | **8 / 8 Passed** |
