# Firebase Local Development & Setup Guide

This guide covers local environment prerequisites, configuration templates, Firebase Local Emulator Suite startup, data seeding, and test execution.

---

## 1. Prerequisites

- **Node.js**: v18.0.0+ (Tested with v22.19.0)
- **Java JRE / JDK**: Java 11+ (Tested with Java SE 22.0.1)
- **Package Manager**: npm v10+

---

## 2. Environment Configuration

Copy `.env.example` to `.env.local` inside `frontend/app/`:

```bash
# In frontend/app/
cp .env.example .env.local
```

### Key Configuration Variables

```ini
# Firebase Project (Fake ID for local emulators)
VITE_FIREBASE_PROJECT_ID=demo-karigarsaathi
VITE_FIREBASE_API_KEY=AIzaSyDemoFakeApiKeyForLocalEmulator123
VITE_FIREBASE_AUTH_DOMAIN=demo-karigarsaathi.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=demo-karigarsaathi.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890abcdef

# Emulator & Mode Switches
VITE_USE_FIREBASE_EMULATORS=true
VITE_REPOSITORY_MODE=firebase
```

---

## 3. Running Firebase Local Emulators

Start the local emulators (Auth, Firestore, Storage, Emulator UI):

```bash
npm run firebase:emulators
```

### Local Emulator Endpoints

- **Auth Emulator**: `http://127.0.0.1:9099`
- **Firestore Emulator**: `http://127.0.0.1:8085`
- **Storage Emulator**: `http://127.0.0.1:9199`
- **Emulator UI**: `http://127.0.0.1:4000`

---

## 4. Seeding Demo Accounts & Records

With the emulators running, execute the seed script to create Artisan A, Artisan B, private profiles, product drafts, and sample photographs:

```bash
npm run firebase:seed
```

### Pre-Seeded Non-Production Credentials

| Account | Email | Password | Role | UID |
| :--- | :--- | :--- | :--- | :--- |
| **Artisan A** | `artisan_a@karigarsaathi.local` | `KarigarPass123!` | `artisan` | `artisan_a_123` / generated |
| **Artisan B** | `artisan_b@karigarsaathi.local` | `KarigarPass123!` | `artisan` | `artisan_b_456` / generated |

---

## 5. Running Security-Rule Tests

Run all 56 security-rule assertions (35 Firestore + 21 Storage) inside the isolated emulator runner:

```bash
npm run firebase:verify
```

---

## 6. Switching Repository Providers

To switch the application between Firebase mode and offline Mock mode:

```ini
# In frontend/app/.env.local
VITE_REPOSITORY_MODE=firebase   # Uses FirebaseAuth, Firestore, Cloud Storage
# or
VITE_REPOSITORY_MODE=mock       # Uses localStorage mock repositories
```
