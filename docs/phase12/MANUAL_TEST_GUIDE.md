# Phase 12 — Physical Device & Field Manual Test Guide

## 1. Purpose & Scope

This guide outlines step-by-step procedures for field teams and QA engineers testing KarigarSaathi on physical mobile handsets (particularly low-cost Android smartphones in rural cluster workshops).

---

## 2. Field Test Scenarios & Step-by-Step Instructions

### Test 1: Airplane Mode Offline Creation & Background Upload
1. Open Chrome / Edge on an Android mobile device.
2. Sign in as an artisan (`artisan_001`).
3. Turn on **Airplane Mode** (disable Wi-Fi and mobile data).
4. Tap **New Product** (`/artisan/products/new/photos`).
5. Select a photo from the device camera gallery.
6. Verify the photo processes on Canvas and displays a preview immediately.
7. Observe top sync status shows: `PENDING (OFFLINE)`.
8. Complete Steps 2 through 7 (Details, Review, Price, Public Fields, Approve, Passport).
9. Verify the Craft Passport and scannable QR code are generated offline.
10. Turn off **Airplane Mode** (re-enable Wi-Fi / cellular data).
11. Observe the top sync status transitions from `PENDING` $\to$ `SYNCING` $\to$ `SAVED`.
12. Verify the photo is visible in Firebase Storage console under `users/{uid}/products/{productId}/`.

### Test 2: Low-Memory Eviction & Draft Recovery
1. Start creating a product draft. Enter title: `"Assam Muga Silk Shawl"`.
2. Add materials: `"Muga Silk, Natural Dyes"`.
3. Switch to another memory-intensive application (e.g. YouTube or Camera) to trigger background tab eviction, or force-close the browser.
4. Re-open the browser and navigate back to `http://localhost:5173/artisan/products/new/details`.
5. Verify the prompt or banner appears indicating restored draft data with zero lost inputs.

### Test 3: Camera Permission Denial Fallback
1. Open `/artisan/products/new/photos`.
2. Tap **Take Photo**.
3. When the browser prompts for Camera permission, select **Block / Don't Allow**.
4. Verify the application does not crash or show an unhandled exception.
5. Verify an informative modal explains that camera access was denied and provides a direct button: **Select from Device Gallery**.
6. Select a photo via the file gallery to confirm complete functionality without camera permissions.

### Test 4: Screen Reader & Keyboard Walkthrough (TalkBack / VoiceOver)
1. Turn on Android TalkBack (Settings $\to$ Accessibility $\to$ TalkBack) or iOS VoiceOver.
2. Navigate the artisan dashboard.
3. Verify that the **Skip to main content** link is announced first.
4. Verify all buttons have distinct, descriptive accessible names (e.g. "Save draft progress", "Close dialog", "Sync Status: SAVED").
5. Trigger a sync state change and verify the polite live region announces the update without interrupting active focus.

### Test 5: Multilingual Indic Script Display & 200% Zoom
1. Go to Language Selection (`/language`).
2. Switch language to **Hindi (हिन्दी)**, **Odia (ଓଡ଼ିଆ)**, **Bengali (বাংলা)**, or **Telugu (తెలుగు)**.
3. Navigate through the 8-step product creation sequence.
4. In browser settings, set **Text Zoom to 200%**.
5. Verify:
   - No text overlaps or truncates illegibly.
   - Steppers stack vertically on narrow screens without overflowing horizontally.
   - Input touch targets remain $\ge 44\text{px}$.

