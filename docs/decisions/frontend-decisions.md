# Frontend Architectural Decisions

## Decision 1: Phase 5 Variant Selection for Review Facts
- **Context**: Two desktop variants existed in Phase 5: `06_review_facts_desktop_phase_5_1` and `06_review_facts_desktop_phase_5_2`.
- **Decision**: Selected **Variant 2**.
- **Rationale**: Variant 2 introduces explicit separation between Confirmed Facts and Needs Review items, confidence indicators, and inline correction mechanisms with clear error assistance.

## Decision 2: Reconstruction of Step 6 (Preview & Approve)
- **Context**: Sequence numbering in Part 1 skipped from `08_choose_public_fields` to `10_qr_craft_passport_created`.
- **Decision**: Reconstructed a dedicated "Preview & Approve Public Information" screen exclusively using Phase 5 tokens and Public Passport patterns.
- **Rationale**: Artisans require explicit transparency over what data becomes publicly visible versus what remains private before minting an immutable digital passport.

## Decision 3: Isolation of Prototype & Development Controls
- **Context**: Previous mock prototypes included 12-step navigation bars across all screens.
- **Decision**: Stripped all prototype chrome from standard routes and created a dedicated `/dev/states` sandbox.
- **Rationale**: The production application must feel like an authentic, intuitive business tool for artisans.
