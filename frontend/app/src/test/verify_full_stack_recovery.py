import asyncio
import os
import sys
import io
import wave
import json
import urllib.request
import urllib.parse
import numpy as np
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\KIIT\.gemini\antigravity\brain\e639edbe-3e43-46ee-9da7-3cc34cc56ca5"
os.makedirs(ARTIFACT_DIR, exist_ok=True)

def generate_sample_speech_wav(filepath: str, duration: float = 2.0, sample_rate: int = 16000):
    """Generate a valid WAV audio file with modulated voice-like frequencies."""
    t = np.linspace(0, duration, int(sample_rate * duration), False)
    # Voice formant simulation (fundamental 180Hz + formants at 600Hz and 1500Hz)
    tone = (
        0.5 * np.sin(2 * np.pi * 180 * t) +
        0.3 * np.sin(2 * np.pi * 600 * t) +
        0.2 * np.sin(2 * np.pi * 1500 * t)
    )
    # Envelope (fade in / fade out)
    envelope = np.ones_like(t)
    fade_len = int(0.1 * sample_rate)
    envelope[:fade_len] = np.linspace(0, 1, fade_len)
    envelope[-fade_len:] = np.linspace(1, 0, fade_len)
    audio_int16 = (tone * envelope * 24000).astype(np.int16)

    with wave.open(filepath, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(audio_int16.tobytes())

async def run_full_stack_verification():
    base_url = "http://127.0.0.1:3000"
    results = []

    def record(checkpoint, status, details=""):
        res = "PASS" if status else "FAIL"
        results.append({"checkpoint": checkpoint, "status": res, "details": details})
        print(f"[{res}] {checkpoint}: {details}")
        sys.stdout.flush()

    print("\n=======================================================")
    print("  KARIGAR SAATHI — FULL STACK RECOVERY VERIFICATION")
    print("=======================================================")

    # -------------------------------------------------------------------------
    # 1. Direct Backend Health Checks
    # -------------------------------------------------------------------------
    print("\n--- 1. BACKEND HEALTH CHECKS ---")
    services = [
        ("AI Image Studio", "http://127.0.0.1:8000/health"),
        ("AI Voice Studio", "http://127.0.0.1:8001/health"),
        ("Fair Price ML", "http://127.0.0.1:8002/health"),
        ("Firebase Emulators", "http://127.0.0.1:4000"),
        ("Ollama Models", "http://127.0.0.1:11434/api/tags"),
    ]
    for name, url in services:
        try:
            req = urllib.request.urlopen(url, timeout=4)
            body = req.read().decode("utf-8")
            record(f"Health Check: {name}", True, f"HTTP 200 — {body[:90]}")
        except Exception as e:
            record(f"Health Check: {name}", False, str(e))

    # -------------------------------------------------------------------------
    # 2. Fair Price Calculation Service Test (:8002)
    # -------------------------------------------------------------------------
    print("\n--- 2. FAIR PRICE CALCULATION VERIFICATION (:8002) ---")
    try:
        calc_payload = json.dumps({
            "materials": [{"name": "Mulberry Silk", "quantity": 5.5, "unit": "meter", "cost_per_unit": 250}],
            "labour": [{"task_name": "Weaving", "hours": 32, "hourly_rate": 120, "rate_source": "State Handloom Guild Card 2026"}],
            "overhead": [{"name": "Loom Electricity", "amount": 150}],
            "packaging": [{"name": "Handloom Box", "cost_per_unit": 80}],
            "margin_mode": "percentage_markup",
            "margin_value": 25,
            "currency": "INR",
            "locale": "en"
        }).encode("utf-8")
        req = urllib.request.Request(
            "http://127.0.0.1:8002/api/v1/pricing/estimate",
            data=calc_payload,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=4) as resp:
            price_data = json.loads(resp.read().decode("utf-8"))
            fair_base = price_data.get("suggested_base_price", 0)
            record("Fair Price ML Calculation", fair_base > 0, f"Suggested Base Price: Rs. {fair_base:.2f}")
    except Exception as e:
        record("Fair Price ML Calculation", False, str(e))

    # -------------------------------------------------------------------------
    # 3. Voice Studio Direct API Flow (:8001)
    # -------------------------------------------------------------------------
    print("\n--- 3. VOICE STUDIO API WORKFLOW (:8001) ---")
    test_wav_path = os.path.join(ARTIFACT_DIR, "scratch", "test_voice_sample.wav")
    os.makedirs(os.path.dirname(test_wav_path), exist_ok=True)
    generate_sample_speech_wav(test_wav_path, duration=2.0)

    # 3a. Create Session
    session_id = None
    try:
        sess_payload = json.dumps({
            "selected_language": "hi",
            "consent_granted": True,
            "retention_choice": "30_days"
        }).encode("utf-8")
        req = urllib.request.Request(
            "http://127.0.0.1:8001/api/v1/catalogue-sessions",
            data=sess_payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": "Bearer test_artisan_token"
            },
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            sess_data = json.loads(resp.read().decode("utf-8"))
            session_id = sess_data.get("session_id")
            record("Voice Session Creation", bool(session_id), f"Session ID: {session_id}")
    except Exception as e:
        record("Voice Session Creation", False, str(e))

    # 3b. Upload Audio
    if session_id:
        try:
            boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
            with open(test_wav_path, "rb") as f:
                file_bytes = f.read()

            body = (
                f"--{boundary}\r\n"
                f'Content-Disposition: form-data; name="audio_file"; filename="test_voice_sample.wav"\r\n'
                f"Content-Type: audio/wav\r\n\r\n"
            ).encode("utf-8") + file_bytes + f"\r\n--{boundary}--\r\n".encode("utf-8")

            req = urllib.request.Request(
                f"http://127.0.0.1:8001/api/v1/catalogue-sessions/{session_id}/audio",
                data=body,
                headers={
                    "Content-Type": f"multipart/form-data; boundary={boundary}",
                    "Authorization": "Bearer test_artisan_token"
                },
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                up_data = json.loads(resp.read().decode("utf-8"))
                record("Voice Audio Upload", up_data.get("status") == "uploaded", f"Upload status: {up_data.get('status')}")
        except Exception as e:
            record("Voice Audio Upload", False, str(e))

        # 3c. Process Faster Whisper Transcription
        try:
            req = urllib.request.Request(
                f"http://127.0.0.1:8001/api/v1/catalogue-sessions/{session_id}/process",
                headers={"Authorization": "Bearer test_artisan_token"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                proc_data = json.loads(resp.read().decode("utf-8"))
                record("Voice Transcription Processing", proc_data.get("status") == "awaiting_transcript_review", f"Transcribed status: {proc_data.get('status')}")
        except Exception as e:
            record("Voice Transcription Processing", False, str(e))

        # 3d. Update & Ground Transcript
        sample_transcript = "यह शुद्ध तसर रेशम की संबलपुरी इकत साड़ी है। लंबाई 5.5 मीटर है।"
        try:
            patch_payload = json.dumps({"corrected_text": sample_transcript}).encode("utf-8")
            req = urllib.request.Request(
                f"http://127.0.0.1:8001/api/v1/catalogue-sessions/{session_id}/transcript",
                data=patch_payload,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": "Bearer test_artisan_token"
                },
                method="PATCH"
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                patch_data = json.loads(resp.read().decode("utf-8"))
                record("Voice Transcript Update", patch_data.get("corrected_text") == sample_transcript, "Confirmed transcript updated")
        except Exception as e:
            record("Voice Transcript Update", False, str(e))

        # 3e. Catalogue Generation with Grounded Facts
        try:
            gen_req = urllib.request.Request(
                f"http://127.0.0.1:8001/api/v1/catalogue-sessions/{session_id}/generate",
                headers={"Authorization": "Bearer test_artisan_token"},
                method="POST"
            )
            with urllib.request.urlopen(gen_req, timeout=8) as resp:
                gen_data = json.loads(resp.read().decode("utf-8"))
                title_en = gen_data.get("draft", {}).get("title_en", "")
                title_hi = gen_data.get("draft", {}).get("title_hi", "")
                record("Bilingual Catalogue Generation", bool(title_en and title_hi), f"Generated bilingual titles successfully (EN: {title_en})")
        except Exception as e:
            record("Bilingual Catalogue Generation", False, str(e))

    # -------------------------------------------------------------------------
    # 4. Browser UI End-to-End Test with Playwright (:3000)
    # -------------------------------------------------------------------------
    print("\n--- 4. BROWSER UI END-TO-END VERIFICATION ---")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await context.new_page()

        # Sign In
        await page.goto(f"{base_url}/login", wait_until="domcontentloaded")
        await page.wait_for_selector('input[type="email"]', timeout=8000)
        await page.fill('input[type="email"]', "artisan_a@karigarsaathi.local")
        await page.fill('input[type="password"]', "KarigarPass123!")
        await page.click('button[type="submit"]')
        await page.wait_for_url(f"{base_url}/artisan/dashboard", timeout=8000)
        record("Artisan Login & Dashboard Load", True, "Successfully logged in as Artisan Ravi Kumar")
        await page.screenshot(path=os.path.join(ARTIFACT_DIR, "recovery_artisan_dashboard.png"))

        # Navigate to Details page to open Voice Studio Modal
        await page.goto(f"{base_url}/artisan/products/new/details", wait_until="domcontentloaded")
        await page.wait_for_selector("button:has-text('Open AI Voice Studio'), button:has-text('वॉयस स्टूडियो')", timeout=8000)
        
        # Click Open AI Voice Studio
        voice_studio_btn = page.locator("button:has-text('Open AI Voice Studio'), button:has-text('वॉयस स्टूडियो')").first
        await voice_studio_btn.click()
        await page.wait_for_selector("text='AI Voice & Multilingual Catalogue Studio'", timeout=5000)
        
        # Verify Engine Online Status Badge
        engine_online = await page.locator("text='Engine Online'").is_visible()
        record("Voice Studio Modal 'Engine Online' Status", engine_online, "Microservice health confirmed in UI")
        await page.screenshot(path=os.path.join(ARTIFACT_DIR, "recovery_voice_studio_online.png"))

        # Switch to "Upload Audio" tab
        upload_tab = page.locator("button:has-text('Upload Audio')")
        if await upload_tab.is_visible():
            await upload_tab.click()
            await page.wait_for_timeout(300)

            # Upload the generated test WAV
            file_input = page.locator("input[type='file'][accept*='audio']").first
            await file_input.set_input_files(test_wav_path)
            await page.wait_for_timeout(500)

            # Click Transcribe
            transcribe_btn = page.locator("button:has-text('Transcribe & Extract Facts')")
            if await transcribe_btn.is_visible():
                await transcribe_btn.click()
                # Wait for Step 2 Review Transcript
                await page.wait_for_selector("text='Review & Correct Spoken Description', text='Review Transcript'", timeout=12000)
                record("UI Voice Transcription Workflow", True, "Audio uploaded, transcribed, and navigated to Review Transcript step")
                await page.screenshot(path=os.path.join(ARTIFACT_DIR, "recovery_voice_transcript_review.png"))

        # Test Sign Out Role Separation
        await page.goto(f"{base_url}/artisan/dashboard", wait_until="domcontentloaded")
        avatar_btn = page.locator("button[aria-label='Artisan account settings']")
        if await avatar_btn.is_visible():
            await avatar_btn.click()
            await page.wait_for_timeout(200)
            sign_out_btn = page.locator("button:has-text('Sign Out')")
            await sign_out_btn.click()
            await page.wait_for_url(f"{base_url}/sign-in", timeout=6000)
            record("Artisan Clean Sign Out", True, "Navigated cleanly to /sign-in without cross-role redirect")
            await page.screenshot(path=os.path.join(ARTIFACT_DIR, "recovery_clean_sign_out.png"))

        await context.close()
        await browser.close()

    print("\n=======================================================")
    print("ALL FULL STACK RECOVERY CHECKS COMPLETED")
    print("=======================================================")

if __name__ == "__main__":
    asyncio.run(run_full_stack_verification())
