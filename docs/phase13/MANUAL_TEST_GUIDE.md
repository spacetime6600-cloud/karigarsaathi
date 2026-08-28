# Phase 13 — Manual Test & Verification Guide

## 1. Prerequisites & Environment Setup

1. Start Firebase Local Emulators:
   ```bash
   npm run emulators
   ```
2. Start the AI Image Studio Microservice (optional for live AI processing; mock/fallback available):
   ```bash
   cd AI/Phase13/karigarsaathi-ai
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```
3. Start the Frontend Development Server:
   ```bash
   npm run dev
   ```

---

## 2. Step-by-Step Test Scenarios

### Scenario 1: Upload Craft Photograph & Trigger AI Enhancement
1. Navigate to `/artisan/products/new/photos`.
2. Click **Upload From Device** and select a craft photo (e.g. saree or pottery).
3. Confirm the raw original photo preview appears with a gold "Cover Photo" badge.
4. Click **Enhance with AI** button on the cover photo.
5. Verify the **Consent & Rationale** modal opens.
6. Verify the **Enhance with AI** button is disabled until the consent checkbox is checked.

### Scenario 2: Processing & Side-by-Side Comparison
1. Check the consent checkbox and click **Enhance with AI**.
2. Observe the animated loading spinner with accessible status announcements.
3. Upon completion, verify the **Comparison Review** opens with:
   - Left side: Original raw artisan photo.
   - Right side: Enhanced photo on clean white background.
   - Fidelity Guardrail badges (Delta E, SSIM, Edge Preservation).
4. Drag the vertical comparison slider left and right to inspect edge quality.
5. Click **Original Only**, **Split Comparison**, and **Enhanced Only** to test discrete view modes.
6. Press the Left/Right arrow keys to test keyboard accessibility.

### Scenario 3: Approve Enhanced Image
1. Click **Approve Enhanced Image**.
2. Verify the modal closes.
3. Verify the cover photo updates to display the enhanced version with an **AI Enhanced (Approved)** badge.
4. Verify the thumbnail gallery displays the sparkles icon.

### Scenario 4: Decline & Retain Original Photograph
1. Click **Enhance with AI** on another thumbnail.
2. Complete enhancement and reach the comparison view.
3. Click **Decline & Use Original**.
4. Verify the modal closes and the thumbnail displays the original photo without change.

### Scenario 5: Offline & Non-AI Safety
1. Disconnect internet or set browser to Offline in DevTools Network tab.
2. Click **Enhance with AI**.
3. Verify the modal displays the offline warning: *"Device is offline. AI processing requires an internet connection."*
4. Verify you can continue editing facts, prices, and saving drafts with 100% functionality.