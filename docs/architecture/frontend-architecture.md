# KarigarSaathi Frontend Architecture

## 1. Directory Structure

The application code is cleanly organized under `frontend/app/src`:

```text
frontend/app/src/
├── app/
│   ├── providers/    # Language, Auth, ProductDraft, Sync, AudioHelp providers
│   └── router/       # Centralized React Router configuration
├── assets/           # Static images, craft icons, SVG graphics
├── components/
│   ├── ui/           # Reusable atomic design components (Button, Input, Card, Modal, Toggle, etc.)
│   └── layout/       # Shared header, navigation, and footer blocks
├── features/         # Domain feature slices (auth, dashboard, passport, pricing, enquiries, coordinator)
├── i18n/             # Multi-lingual locale catalogs (en, hi, or, bn, te)
├── layouts/          # Application shell wrappers (Onboarding, ArtisanApp, ProductCreation, PublicPassport, Coordinator)
├── repositories/     # Data repositories managing drafts and product catalogs
├── services/
│   ├── api/          # Mockable service contracts (auth, pricing, passport, export, enquiry)
│   ├── media/        # Photo processing and upload simulator
│   ├── permissions/  # Camera and microphone permission handlers
│   └── storage/      # Local storage engine and offline sync manager
├── styles/
│   ├── base/         # Tailwind directives, animations, and global reset
│   └── tokens/       # Design token constants derived from Phase 5
├── test/             # Unit and integration test suites
├── types/            # Domain entities and TypeScript type definitions
└── utils/            # Helper formatting and calculation functions
```

## 2. Separation of Concerns & Anti-Pattern Bans

- **No Prototype Wrappers**: The application contains no global 12-step navigation bars, phase labels, or test toggles in normal user layouts.
- **Service Isolation**: Features interact solely with typed domain services and repositories (`src/services/*`), allowing seamless transition to live Firebase/backend APIs in future phases.
- **Resilience First**: All draft modifications and enquiry replies are automatically persisted to local storage to guarantee zero data loss during connectivity dropouts.
