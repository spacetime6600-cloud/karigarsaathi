# KarigarSaathi Frontend Application

Responsive web frontend for **KarigarSaathi** (कारीगर साथी), an AI-assisted product digitization and market linkage platform for Indian artisans.

---

## 1. Quick Start

```bash
# Navigate to frontend application root
cd frontend/app

# Install dependencies
npm install

# Start local development server (port 3000)
npm run dev

# Run TypeScript type check
npm run typecheck

# Run ESLint quality checks
npm run lint

# Run Vitest test suite
npm run test

# Build production bundle
npm run build

# Preview production build
npm run preview
```

---

## 2. Application Routes

| Path | Layout Shell | Description |
| :--- | :--- | :--- |
| `/language` | `OnboardingShell` | Multilingual language selection (English, Hindi, Odia, Bengali, Telugu) |
| `/sign-in` | `OnboardingShell` | Phone number & OTP authentication with artisan / coordinator role selection |
| `/artisan/dashboard` | `ArtisanAppShell` | Workshop overview, metrics, catalog, and recent buyer enquiries |
| `/artisan/products/new/photos` | `ProductCreationShell` | Step 1: Multi-photo capture and cover selection |
| `/artisan/products/new/details` | `ProductCreationShell` | Step 2: Vernacular voice recording & manual details entry |
| `/artisan/products/new/review` | `ProductCreationShell` | Step 3: Fact review (Phase 5 Variant 2: confirmed vs. needs-review) |
| `/artisan/products/new/price` | `ProductCreationShell` | Step 4: Cost calculator & 3-tier fair pricing recommendations |
| `/artisan/products/new/public-fields` | `ProductCreationShell` | Step 5: Public vs private attribute visibility toggles |
| `/artisan/products/new/approve` | `ProductCreationShell` | Step 6: Final public card verification & explicit authorization |
| `/artisan/products/new/passport` | `ProductCreationShell` | Step 7: Verified QR Craft Passport generation & print tags |
| `/artisan/products/new/share` | `ProductCreationShell` | Step 8: Multi-channel export (WhatsApp card, PDF tags, link, story) |
| `/artisan/enquiries/:enquiryId` | `ArtisanAppShell` | Buyer conversation thread, quote response, and order confirmation |
| `/passport/:passportId` | `PublicPassportShell` | Buyer-facing public craft provenance showcase |
| `/coordinator` | `CoordinatorShell` | Regional coordinator assistance queue and cluster management |
| `/dev/states` | Standalone | Deterministic sandbox to trigger all 11 Phase 5 recovery states |

---

## 3. Technology Stack & Design System

- **Framework**: React 18 with TypeScript (Strict Mode)
- **Tooling**: Vite
- **Styling**: Tailwind CSS with custom design tokens derived strictly from Phase 5 Stitch
- **Icons**: Lucide React (clean 2px rounded line icons matching Stitch specifications)
- **Testing**: Vitest + React Testing Library + JSDOM
- **i18n**: Vernacular multi-language support (English, Hindi, Odia, Bengali, Telugu)
- **Accessibility**: WCAG 2.1 AA compliant, minimum 48px touch targets, 2px Marigold focus indicators
- **Offline Resilience**: Local storage caching with zero duplicate sync queue
