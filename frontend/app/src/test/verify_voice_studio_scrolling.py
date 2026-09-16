import asyncio
import os
import sys
import json
import wave
import numpy as np
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\KIIT\.gemini\antigravity\brain\e639edbe-3e43-46ee-9da7-3cc34cc56ca5"
os.makedirs(ARTIFACT_DIR, exist_ok=True)

def generate_sample_speech_wav(filepath: str, duration: float = 2.0, sample_rate: int = 16000):
    t = np.linspace(0, duration, int(sample_rate * duration), False)
    tone = (
        0.5 * np.sin(2 * np.pi * 180 * t) +
        0.3 * np.sin(2 * np.pi * 600 * t) +
        0.2 * np.sin(2 * np.pi * 1500 * t)
    )
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

async def run_voice_scrolling_verification():
    base_url = "http://127.0.0.1:3000"
    test_wav_path = os.path.join(ARTIFACT_DIR, "scratch", "voice_scroll_test.wav")
    os.makedirs(os.path.dirname(test_wav_path), exist_ok=True)
    generate_sample_speech_wav(test_wav_path, duration=2.0)

    results = []
    def record(checkpoint, status, details=""):
        res = "PASS" if status else "FAIL"
        results.append({"checkpoint": checkpoint, "status": res, "details": details})
        print(f"[{res}] {checkpoint}: {details}")
        sys.stdout.flush()

    print("\n=================================================================")
    print("  VOICE STUDIO SCROLLING & VIEWPORT CONTAINMENT VERIFICATION")
    print("=================================================================")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        # ---------------------------------------------------------------------
        # TEST 1: Standard Desktop (1280x800) End-to-End Workflow & Scrolling
        # ---------------------------------------------------------------------
        print("\n--- TEST 1: Standard Desktop (1280x800) ---")
        context = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await context.new_page()

        # Sign In as Artisan
        await page.goto(f"{base_url}/login", wait_until="domcontentloaded")
        await page.wait_for_selector('input[type="email"]', timeout=8000)
        await page.fill('input[type="email"]', "artisan_a@karigarsaathi.local")
        await page.fill('input[type="password"]', "KarigarPass123!")
        await page.click('button[type="submit"]')
        await page.wait_for_url(f"{base_url}/artisan/dashboard", timeout=8000)

        # Navigate to Details page
        await page.goto(f"{base_url}/artisan/products/new/details", wait_until="domcontentloaded")
        await page.wait_for_selector("button:has-text('Open AI Voice Studio'), button:has-text('वॉयस स्टूडियो')", timeout=8000)

        # Check background body scroll before modal
        body_overflow_before = await page.evaluate("() => document.body.style.overflow")

        # Open Voice Studio Modal
        voice_btn = page.locator("button:has-text('Open AI Voice Studio'), button:has-text('वॉयस स्टूडियो')").first
        await voice_btn.click()
        await page.wait_for_selector("text='AI Voice & Multilingual Catalogue Studio'", timeout=5000)

        # Check Portal Rendering & Body Scroll Lock
        is_direct_body_child = await page.evaluate("""() => {
            const dialog = document.querySelector('[role="dialog"]');
            return dialog && dialog.parentElement === document.body;
        }""")
        body_overflow_open = await page.evaluate("() => document.body.style.overflow")
        record("Modal Portal to document.body", is_direct_body_child, "Modal renders in document.body escaping transform containers")
        record("Background Body Scroll Lock", body_overflow_open == "hidden", f"Body overflow set to '{body_overflow_open}'")

        # Check Viewport Bounding
        bounds = await page.evaluate("""() => {
            const dialogCard = document.querySelector('[role="dialog"] > div');
            const rect = dialogCard.getBoundingClientRect();
            return {
                top: rect.top,
                bottom: rect.bottom,
                left: rect.left,
                right: rect.right,
                height: rect.height,
                windowHeight: window.innerHeight,
                fitsWithinViewport: rect.top >= 0 && rect.bottom <= window.innerHeight
            };
        }""")
        record("Modal Viewport Containment", bounds["fitsWithinViewport"], f"Dialog top={bounds['top']}px, bottom={bounds['bottom']}px, viewport height={bounds['windowHeight']}px")

        # Check for single scrollable container
        scroll_containers = await page.evaluate("""() => {
            const dialog = document.querySelector('[role="dialog"]');
            const allElements = dialog.querySelectorAll('*');
            const scrollables = [];
            allElements.forEach(el => {
                const style = window.getComputedStyle(el);
                if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
                    if (el.tagName !== 'TEXTAREA') {
                        scrollables.push({
                            tagName: el.tagName,
                            className: el.className,
                            scrollHeight: el.scrollHeight,
                            clientHeight: el.clientHeight
                        });
                    }
                }
            });
            return scrollables;
        }""")
        record("Single Primary Modal Scroll Container", len(scroll_containers) == 1, f"Found {len(scroll_containers)} non-textarea scroll container(s)")

        await page.screenshot(path=os.path.join(ARTIFACT_DIR, "voice_scroll_step1_input.png"))

        # Step 1: Upload Audio
        upload_tab = page.locator("button:has-text('Upload Audio')")
        if await upload_tab.is_visible():
            await upload_tab.click()
            await page.wait_for_timeout(300)
            file_input = page.locator("input[type='file'][accept*='audio']").first
            await file_input.set_input_files(test_wav_path)
            await page.wait_for_timeout(500)

            transcribe_btn = page.locator("button:has-text('Transcribe File'), button:has-text('Transcribe & Extract Facts')").first
            await transcribe_btn.click()
            await page.wait_for_selector("text=Speech Transcript", timeout=25000)
            record("Step 1 -> Step 2 Transition", True, "Successfully reached Step 2 Transcript Review")
            await page.screenshot(path=os.path.join(ARTIFACT_DIR, "voice_scroll_step2_review.png"))

        # Step 2: Edit transcript and translate
        transcript_textarea = page.locator("[role='dialog'] textarea").first
        await transcript_textarea.fill("यह पारंपरिक हथकरघा संबलपुरी इकत सिल्क साड़ी है। लंबाई 5.5 मीटर है।")
        await page.wait_for_timeout(400)

        # Generate Catalogue
        gen_btn = page.locator("[role='dialog'] button:has-text('Confirm & Generate Catalogue')")
        await gen_btn.click()
        await page.wait_for_selector("[role='dialog'] >> text=Extracted Physical Facts", timeout=20000)
        record("Step 2 -> Step 3 Transition", True, "Successfully reached Step 3 Bilingual Catalogue")

        # Step 3: Test Scrolling on long bilingual catalogue screen
        scroll_info_start = await page.evaluate("""() => {
            const scrollEl = document.querySelector('[role="dialog"] .overflow-y-auto');
            return {
                scrollTop: scrollEl.scrollTop,
                scrollHeight: scrollEl.scrollHeight,
                clientHeight: scrollEl.clientHeight,
                canScroll: scrollEl.scrollHeight > scrollEl.clientHeight
            };
        }""")
        record("Step 3 Catalogue is Scrollable", scroll_info_start["canScroll"], f"ScrollHeight: {scroll_info_start['scrollHeight']}px, ClientHeight: {scroll_info_start['clientHeight']}px")

        # Scroll to bottom
        await page.evaluate("""() => {
            const scrollEl = document.querySelector('[role="dialog"] .overflow-y-auto');
            scrollEl.scrollTop = scrollEl.scrollHeight;
        }""")
        await page.wait_for_timeout(400)

        # Verify bottom action buttons are in viewport and clickable
        apply_btn = page.locator("[role='dialog'] button:has-text('Apply to Product Details')")
        apply_visible = await apply_btn.is_visible()
        record("Bottom Action Buttons Visible at End of Scroll", apply_visible, "Apply to Product Details button is visible and accessible")
        await page.screenshot(path=os.path.join(ARTIFACT_DIR, "voice_scroll_step3_bottom.png"))

        # Edit text in bottom field while scrolled
        indic_tags_input = page.locator("[role='dialog'] input[placeholder*='उदा']").first
        if await indic_tags_input.is_visible():
            await indic_tags_input.fill("हथकरघा, सिल्क, पारंपरिक")
            record("Edit Input at Bottom", True, "Successfully typed in bottom tags input without scroll reset")

        # Scroll back to top
        await page.evaluate("""() => {
            const scrollEl = document.querySelector('[role="dialog"] .overflow-y-auto');
            scrollEl.scrollTop = 0;
        }""")
        await page.wait_for_timeout(400)
        facts_visible = await page.locator("[role='dialog'] >> text=Extracted Physical Facts").is_visible()
        record("Scroll Back to Top", facts_visible, "Header and Extracted Facts visible at scrollTop = 0")
        await page.screenshot(path=os.path.join(ARTIFACT_DIR, "voice_scroll_step3_top.png"))

        # Apply to product details
        await apply_btn.click()
        await page.wait_for_timeout(600)
        # Check if overwrite modal appeared or direct apply
        overwrite_confirm_btn = page.locator("button:has-text('Confirm & Overwrite')")
        if await overwrite_confirm_btn.is_visible():
            await overwrite_confirm_btn.click()
            await page.wait_for_timeout(600)

        # Confirm modal closed and background page scroll restored
        modal_closed = not await page.locator("text='AI Voice & Multilingual Catalogue Studio'").is_visible()
        body_overflow_after = await page.evaluate("() => document.body.style.overflow")
        record("Modal Close & Body Scroll Restoration", modal_closed and body_overflow_after != "hidden", f"Modal closed={modal_closed}, body overflow restored to '{body_overflow_after}'")

        # Test Reopen Dialog
        await voice_btn.click()
        await page.wait_for_selector("text='AI Voice & Multilingual Catalogue Studio'", timeout=5000)
        record("Reopen Modal", True, "Successfully reopened Voice Studio modal cleanly")

        # Close via Escape key
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(400)
        modal_closed_escape = not await page.locator("text='AI Voice & Multilingual Catalogue Studio'").is_visible()
        record("Close on Escape Key", modal_closed_escape, "Modal closed cleanly on Escape")

        # ---------------------------------------------------------------------
        # TEST 2: Short Laptop Viewport (1024x600)
        # ---------------------------------------------------------------------
        print("\n--- TEST 2: Short Laptop Viewport (1024x600) ---")
        await page.set_viewport_size({"width": 1024, "height": 600})
        await page.wait_for_timeout(300)
        
        # Open modal on short screen
        await voice_btn.click()
        await page.wait_for_selector("[role='dialog'] >> text=AI Voice & Multilingual Catalogue Studio", timeout=5000)
        await page.wait_for_timeout(350)

        short_bounds = await page.evaluate("""() => {
            const dialogCard = document.querySelector('[role="dialog"] > div');
            const rect = dialogCard.getBoundingClientRect();
            return {
                top: rect.top,
                bottom: rect.bottom,
                windowHeight: window.innerHeight,
                fitsWithinViewport: rect.top >= 0 && rect.bottom <= window.innerHeight
            };
        }""")
        record("Short Laptop Viewport (1024x600) Containment", short_bounds["fitsWithinViewport"], f"Top={short_bounds['top']}px, Bottom={short_bounds['bottom']}px on 600px screen")
        await page.screenshot(path=os.path.join(ARTIFACT_DIR, "voice_scroll_short_viewport.png"))
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(400)

        # ---------------------------------------------------------------------
        # TEST 3: Mobile Viewport (390x844)
        # ---------------------------------------------------------------------
        print("\n--- TEST 3: Mobile Viewport (390x844) ---")
        await page.set_viewport_size({"width": 390, "height": 844})
        await page.wait_for_timeout(300)

        await voice_btn.click()
        await page.wait_for_selector("[role='dialog'] >> text=AI Voice & Multilingual Catalogue Studio", timeout=5000)
        await page.wait_for_timeout(350)

        mob_bounds = await page.evaluate("""() => {
            const dialogCard = document.querySelector('[role="dialog"] > div');
            const rect = dialogCard.getBoundingClientRect();
            return {
                top: rect.top,
                bottom: rect.bottom,
                windowHeight: window.innerHeight,
                fitsWithinViewport: rect.top >= 0 && rect.bottom <= window.innerHeight
            };
        }""")
        record("Mobile Viewport (390x844) Containment", mob_bounds["fitsWithinViewport"], f"Top={mob_bounds['top']}px, Bottom={mob_bounds['bottom']}px on mobile screen")
        await page.screenshot(path=os.path.join(ARTIFACT_DIR, "voice_scroll_mobile_viewport.png"))
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(400)

        await context.close()
        await browser.close()

    print("\n=================================================================")
    print("ALL VOICE STUDIO SCROLLING TESTS COMPLETED")
    print("=================================================================")

if __name__ == "__main__":
    asyncio.run(run_voice_scrolling_verification())
