# KarigarSaathi (कारीगर साथी)

> **Empowering traditional Indian artisans through AI-assisted craft digitization, multilingual voice storytelling, certified fair-trade pricing, and tamper-proof digital Craft Passports with instant QR buyer linkage.**

---

## 1. Project Overview

KarigarSaathi is a production-grade web application engineered to bridge the digital divide for traditional craftspeople, weavers, and artisanal clusters across India.

### Core Capabilities
- **8-Step Guided Craft Digitization**: Structured, voice-enabled product intake (`photos` → `details` → `review` → `price` → `public-fields` → `approve` → `passport` → `share`).
- **Multilingual Voice & Story Studio**: Dual-input voice narration and structured fact extraction with real-time translation across Hindi, Bengali, Odia, Telugu, and English.
- **Fair-Trade Pricing Engine**: Cost-of-production calculation factoring raw materials, labor hours, living wage standards, and transparent artisan margins.
- **Digital Craft Passport**: Public, shareable, verifiable digital certificate with generated high-resolution QR codes linking buyers directly to verified maker provenance.
- **Artisan & Coordinator Workspaces**: Dual-role dashboards for independent craftspeople and regional cluster coordinators.
- **Multichannel Export Hub**: Formatted buyer sharing via WhatsApp, printable PDF spec sheets, and marketplace export JSON for Indiahandmade and GeM ODOP.

---

## 2. Codebase & Directory Structure

```text
.
├── frontend/
│   └── app/                  # Canonical React 18 + TypeScript + Vite frontend application
│       ├── public/           # Static assets, icons, manifest
│       ├── src/
│       │   ├── app/          # Core providers (Auth, Language, Sync, ProductDraft, AudioHelp)
│       │   ├── assets/       # Visual media, background videos, category images
│       │   ├── components/   # Modular UI primitives (Button, Card, Modal, Badges, Navigation)
│       │   ├── features/     # Feature-sliced modules (landing, auth, marketplace, passport, wizard)
│       │   ├── hooks/        # Custom React hooks (audio, sync, media, permissions)
│       │   ├── i18n/         # Vernacular localization dictionaries (en, hi, bn, or, te)
│       │   ├── layouts/      # App layout shells (Artisan, Coordinator, Passport, Public)
│       │   ├── repositories/ # Abstracted data access layers (Firebase + Offline Storage fallback)
│       │   ├── routes/       # Central typed routes, AuthGuard, and safe redirect handlers
│       │   ├── services/     # Domain services (AI mocks, QR, export, WhatsApp, permissions)
│       │   ├── styles/       # Tailwind CSS design tokens & Phase 5 Stitch styling
│       │   └── test/         # Comprehensive Vitest unit & integration test suites
│       ├── package.json      # Frontend dependencies & scripts
│       └── vite.config.ts    # Vite bundler configuration (Port 3000)
├── AI/                       # AI microservices & background processing pipelines
│   ├── Phase13/              # AI Image Studio (Background removal, enhancement metrics)
│   ├── phase14/              # Voice & transcription processing pipeline
│   └── phase15/              # Fact extraction & translation service specifications
├── firebase/                 # Firebase Emulator and security configurations
│   ├── firestore.rules       # Granular Firestore security rules
│   └── storage.rules         # Cloud Storage security rules
├── design-reference/         # Phase 5 Stitch design specifications and asset audits
├── docs/                     # Architectural decisions, testing logs, and a11y specifications
├── .env.example              # Root environment variable template
├── .firebaserc               # Firebase project configuration
├── firebase.json             # Firebase emulator & hosting configuration
├── AGENTS.md                 # Agent operating guidelines & canonical rules
├── PROJECT_CONTEXT.md        # Permanent architectural & design constraints
└── README.md                 # Project documentation
```

---

## 3. Prerequisites & Runtimes

- **Node.js**: `v18.x` or `v20.x` LTS
- **Package Manager**: `npm` (`v9.x`+)
- **Python** *(Optional, for AI microservices)*: `v3.10`+
- **Git**: `v2.x`+

---

## 4. Local Quickstart

### A. Frontend Application

1. **Navigate to the canonical frontend root**:
   ```bash
   cd frontend/app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   *(By default, the application runs with full mock fallbacks and local storage persistence without requiring live API keys).*

4. **Start development server**:
   ```bash
   npm run dev
   ```
   The application will be accessible at: `http://localhost:3000`

---

## 5. Testing & Quality Gates

Run the test and build verification checks inside `frontend/app`:

```bash
# Run unit & integration test suites (342 tests)
npx vitest run

# Run TypeScript type check and production bundle build
npm run build
```

---

## 6. Environment Variables Reference

| Variable Name | Description | Default / Example |
| :--- | :--- | :--- |
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key | `demo-api-key` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | `demo-karigarsaathi.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | `demo-karigarsaathi` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | `demo-karigarsaathi.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID | `1234567890` |
| `VITE_FIREBASE_APP_ID` | Firebase App ID | `1:1234567890:web:abcdef` |
| `VITE_USE_FIREBASE_EMULATOR` | Connect to local emulator suite | `false` |
| `VITE_AI_STUDIO_API_URL` | AI Image & Voice Microservice URL | `http://localhost:8000` |

---

## 7. Vercel Deployment Configuration

When deploying this project to **Vercel**, use the following configuration settings:

| Setting | Value |
| :--- | :--- |
| **Framework Preset** | `Vite` |
| **Root Directory** | `frontend/app` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |
| **Node.js Version** | `18.x` or `20.x` |

---

## 8. License

Copyright © 2026 KarigarSaathi. Empowering verified Indian artisans with immutable digital craft provenance.
