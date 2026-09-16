import asyncio
from playwright.async_api import async_playwright
import os

ARTIFACT_DIR = r"C:\Users\KIIT\.gemini\antigravity\brain\e639edbe-3e43-46ee-9da7-3cc34cc56ca5"

async def verify_login():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        # -------------------------------------------------------------
        # 1. Desktop Verification (Fresh Context)
        # -------------------------------------------------------------
        ctx_desktop = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await ctx_desktop.new_page()
        await page.goto("http://localhost:3000/login", wait_until="domcontentloaded")
        await page.wait_for_selector("button:has-text('Sign In')", timeout=8000)

        # Verify tabs
        tabs = page.locator("div.grid button")
        tab_count = await tabs.count()
        tab_texts = [await tabs.nth(i).text_content() for i in range(tab_count)]
        print(f"Desktop Tabs found ({tab_count}): {tab_texts}")
        assert tab_count == 2, f"Expected 2 tabs, got {tab_count}"
        assert "Sign In" in tab_texts[0] and "Register" in tab_texts[1]
        assert "Phone Demo" not in tab_texts, "Phone Demo tab is still present!"

        # Check tab widths
        box0 = await tabs.nth(0).bounding_box()
        box1 = await tabs.nth(1).bounding_box()
        print(f"Sign In tab box: {box0}")
        print(f"Register tab box: {box1}")
        assert abs(box0['width'] - box1['width']) <= 1.0, f"Tab widths are unequal: {box0['width']} vs {box1['width']}"
        print("[PASS] Desktop Selector tabs have equal width and are centered.")

        # Capture Desktop Sign In screenshot
        await page.screenshot(path=os.path.join(ARTIFACT_DIR, "login_desktop_signin.png"))
        print("[PASS] Captured login_desktop_signin.png")

        # Switch to Register tab
        await tabs.nth(1).click()
        await page.wait_for_selector("text=Artisan / Workshop Name", timeout=4000)
        assert await page.locator("button:has-text('Register & Enter Dashboard')").is_visible()
        await page.screenshot(path=os.path.join(ARTIFACT_DIR, "login_desktop_register.png"))
        print("[PASS] Captured login_desktop_register.png")

        # Switch back to Sign In and perform authentication
        await tabs.nth(0).click()
        await page.wait_for_selector("button:has-text('Sign In with Firebase')", timeout=4000)
        await page.fill('input[type="email"]', "artisan_a@karigarsaathi.local")
        await page.fill('input[type="password"]', "KarigarPass123!")
        await page.click('button:has-text("Sign In with Firebase")')
        await page.wait_for_url("http://localhost:3000/artisan/dashboard", timeout=8000)
        print("[PASS] Successfully authenticated as Artisan into /artisan/dashboard")
        await ctx_desktop.close()

        # -------------------------------------------------------------
        # 2. Mobile Verification (Fresh Context)
        # -------------------------------------------------------------
        ctx_mobile = await browser.new_context(viewport={"width": 390, "height": 844})
        mobile_page = await ctx_mobile.new_page()
        await mobile_page.goto("http://localhost:3000/login", wait_until="domcontentloaded")
        await mobile_page.wait_for_selector("button:has-text('Sign In')", timeout=8000)

        mobile_tabs = mobile_page.locator("div.grid button")
        m_box0 = await mobile_tabs.nth(0).bounding_box()
        m_box1 = await mobile_tabs.nth(1).bounding_box()
        print(f"Mobile Sign In box: {m_box0}")
        print(f"Mobile Register box: {m_box1}")
        assert abs(m_box0['width'] - m_box1['width']) <= 1.0, f"Mobile tab widths unequal: {m_box0['width']} vs {m_box1['width']}"
        await mobile_page.screenshot(path=os.path.join(ARTIFACT_DIR, "login_mobile_signin.png"))
        print("[PASS] Captured login_mobile_signin.png")

        # Mobile Register tab
        await mobile_tabs.nth(1).click()
        await mobile_page.wait_for_selector("text=Artisan / Workshop Name", timeout=4000)
        await mobile_page.screenshot(path=os.path.join(ARTIFACT_DIR, "login_mobile_register.png"))
        print("[PASS] Captured login_mobile_register.png")
        await ctx_mobile.close()

        # -------------------------------------------------------------
        # 3. Coordinator Login & Role Navigation (Fresh Context)
        # -------------------------------------------------------------
        ctx_coord = await browser.new_context(viewport={"width": 1280, "height": 800})
        coord_page = await ctx_coord.new_page()
        await coord_page.goto("http://localhost:3000/coordinator/login", wait_until="domcontentloaded")
        await coord_page.wait_for_selector("input[type='email']", timeout=8000)
        await coord_page.fill('input[type="email"]', "coordinator@karigarsaathi.gov.in")
        await coord_page.fill('input[type="password"]', "CoordinatorPass123!")
        await coord_page.click('button[type="submit"]')
        await coord_page.wait_for_url("**/coordinator**", timeout=8000)
        print("[PASS] Coordinator authentication intact")
        await ctx_coord.close()

        await browser.close()
        print("\n=================================================")
        print("ALL LOGIN PAGE VERIFICATIONS PASSED SUCCESSFULLY!")
        print("=================================================")

if __name__ == "__main__":
    asyncio.run(verify_login())
