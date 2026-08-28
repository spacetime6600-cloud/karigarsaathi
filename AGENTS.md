# Agent Operating Guidelines for KarigarSaathi

All AI agents and automated workflows operating on this codebase must strictly adhere to the following rules:

---

## 1. Context & Reference Compliance

1. **Read Project Context First**: Always read [PROJECT_CONTEXT.md](file:///c:/Users/KIIT/Desktop/Synapse1/PROJECT_CONTEXT.md) before designing, modifying, or executing tasks.
2. **Preserve Stitch Source Files**: Keep all files in `design-reference/phase5-stitch/` completely immutable. Never rename, edit, format, or delete any source HTML, PNG, or markdown files inside the design reference.
3. **Strict Ban on Phase 4 / Monotone**: Never reference, copy, or incorporate assets or styling from Phase 4 grayscale files or `structural_monotone`.

---

## 2. Codebase Organization & Canonical Root

1. **Single Canonical Location**: Work strictly inside the opened repository. Keep all active frontend application code inside `frontend/app`.
2. **No Competing Projects**: Do not create parallel, nested, or competing frontend roots (e.g. `frontend/client`, `frontend/frontend`, etc.).
3. **Preserve User Code**: Always respect and preserve existing modifications made by the user.

---

## 3. Code Architecture & Component Standards

1. **Reusable Feature Components**: Build modular, accessible, feature-oriented React components in TypeScript under `frontend/app/src/features/*` and `frontend/app/src/components/*`.
2. **No Development Controls in Navigation**: Never leak prototype tools, screen switchers, or test controls into normal user-facing navigation or production layouts.
3. **Clean Separation of Concerns**: Maintain clean boundaries between UI presentation, domain logic, state, and service layers.

---

## 4. Verification & Quality Gates

1. **Mandatory Check Execution**: When formatting, type-checking (`tsc`), linting (`eslint`), testing (`vitest` / `playwright`), and build tools are configured, run all checks before declaring a task complete.
2. **No Unverified Claims**: Never claim success without running and confirming the relevant validation checks.
