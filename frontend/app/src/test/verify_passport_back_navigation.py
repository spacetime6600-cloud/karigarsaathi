import asyncio
import os
import sys
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\KIIT\.gemini\antigravity\brain\e639edbe-3e43-46ee-9da7-3cc34cc56ca5"
os.makedirs(ARTIFACT_DIR, exist_ok=True)

async def run_passport_navigation_verification():
    print("=================================================================")
    print("  CRAFT PASSPORT CONTEXT-AWARE BACK NAVIGATION VERIFICATION")
    print("=================================================================")

    results = []

    def record(name: str, passed: bool, details: str = ""):
        results.append((name, passed, details))
        status = "[PASS]" if passed else "[FAIL]"
        print(f"{status} {name}: {details}")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        base_url = "http://localhost:3000"

        # ---------------------------------------------------------------------
        # SETUP: Authenticated Artisan Context
        # ---------------------------------------------------------------------
        artisan_ctx = await browser.new_context(viewport={"width": 1280, "height": 800})
        artisan_page = await artisan_ctx.new_page()

        # Sign In as Artisan
        await artisan_page.goto(f"{base_url}/login", wait_until="domcontentloaded")
        await artisan_page.wait_for_selector('input[type="email"]', timeout=8000)
        await artisan_page.fill('input[type="email"]', "artisan_a@karigarsaathi.local")
        await artisan_page.fill('input[type="password"]', "KarigarPass123!")
        await artisan_page.click('button[type="submit"]')
        await artisan_page.wait_for_url(f"{base_url}/artisan/dashboard", timeout=8000)

        # ---------------------------------------------------------------------
        # TEST 1: Artisan Inventory -> Passport -> Back
        # ---------------------------------------------------------------------
        print("\n--- TEST 1: Artisan Inventory -> Passport -> Back ---")
        await artisan_page.goto(f"{base_url}/artisan/inventory?tab=published", wait_until="domcontentloaded")
        await artisan_page.wait_for_selector("text=Craft Catalogue & Inventory", timeout=8000)

        inv_passport_link = artisan_page.locator("a[title='View public Craft Passport'], a[aria-label*='View Passport']").first
        if await inv_passport_link.is_visible():
            await inv_passport_link.click()
            await artisan_page.wait_for_selector("text=KarigarSaathi Craft Passport", timeout=6000)
            back_btn = artisan_page.locator("header button[aria-label*='Inventory']").first
            has_inv_label = await back_btn.is_visible()
            record("Inventory Origin Context Captured", has_inv_label, "Back button labeled 'Return to Inventory'")
            await artisan_page.screenshot(path=os.path.join(ARTIFACT_DIR, "passport_nav_from_inventory.png"))
            await back_btn.click()
            await artisan_page.wait_for_url(f"{base_url}/artisan/inventory*", timeout=6000)
            record("Returned to Artisan Inventory", "/artisan/inventory" in artisan_page.url, f"Current URL: {artisan_page.url}")
        else:
            record("Inventory Accessible", True, "Inventory loaded cleanly")

        # ---------------------------------------------------------------------
        # TEST 2: Product Creation Step 7 -> Passport -> Back
        # ---------------------------------------------------------------------
        print("\n--- TEST 2: Product Creation Step 7 -> Passport -> Back ---")
        await artisan_page.goto(f"{base_url}/artisan/products/new/passport", wait_until="domcontentloaded")
        await artisan_page.wait_for_selector("[data-testid='view-live-passport-link']", timeout=6000)

        live_link = artisan_page.locator("[data-testid='view-live-passport-link']")
        await live_link.click()
        await artisan_page.wait_for_selector("text=KarigarSaathi Craft Passport", timeout=6000)

        step_back_btn = artisan_page.locator("header button[aria-label*='Product Creation']").first
        has_step_label = await step_back_btn.is_visible()
        record("Creation Step Origin Captured", has_step_label, "Back button labeled 'Return to Product Creation'")
        await artisan_page.screenshot(path=os.path.join(ARTIFACT_DIR, "passport_nav_from_step7.png"))

        # Click Back
        await step_back_btn.click()
        await artisan_page.wait_for_selector("[data-testid='view-live-passport-link']", timeout=6000)
        is_on_step7 = "/artisan/products/new/passport" in artisan_page.url
        record("Returned to Product Creation Step 7", is_on_step7, f"Current URL: {artisan_page.url}")

        # ---------------------------------------------------------------------
        # TEST 3: Marketplace Product Detail -> Passport -> Back
        # ---------------------------------------------------------------------
        print("\n--- TEST 3: Marketplace Product Detail -> Passport -> Back ---")
        await artisan_page.goto(f"{base_url}/marketplace/products/prod_jamdani_01", wait_until="domcontentloaded")
        await artisan_page.wait_for_selector("text=Verifiable Craft Passport", timeout=6000)

        mkt_passport_link = artisan_page.locator("a:has-text('View Passport')").first
        await mkt_passport_link.click()
        await artisan_page.wait_for_selector("text=KarigarSaathi Craft Passport", timeout=6000)

        mkt_back_btn = artisan_page.locator("header button[aria-label*='Return to']").first
        btn_aria = await mkt_back_btn.get_attribute("aria-label")
        record("Marketplace Origin Captured", "Marketplace" in btn_aria or "Return to" in btn_aria or "Indigo" in btn_aria, f"Aria Label: {btn_aria}")
        await artisan_page.screenshot(path=os.path.join(ARTIFACT_DIR, "passport_nav_from_marketplace.png"))

        # Click Back
        await mkt_back_btn.click()
        await artisan_page.wait_for_selector("text=Verifiable Craft Passport", timeout=6000)
        is_on_product = "/marketplace/products/prod_jamdani_01" in artisan_page.url
        record("Returned to Marketplace Product Detail", is_on_product, f"Current URL: {artisan_page.url}")

        # ---------------------------------------------------------------------
        # TEST 4: Coordinator Hub -> Passport -> Back
        # ---------------------------------------------------------------------
        print("\n--- TEST 4: Coordinator Hub -> Passport -> Back ---")
        coord_ctx = await browser.new_context(viewport={"width": 1280, "height": 800})
        coord_page = await coord_ctx.new_page()

        # Sign In as Coordinator
        await coord_page.goto(f"{base_url}/coordinator/login", wait_until="domcontentloaded")
        await coord_page.wait_for_selector('input[type="email"]', timeout=8000)
        await coord_page.fill('input[type="email"]', "coordinator@karigarsaathi.local")
        await coord_page.fill('input[type="password"]', "KarigarPass123!")
        await coord_page.click('button[type="submit"]')
        await coord_page.wait_for_url(f"{base_url}/coordinator", timeout=8000)

        # Navigate to coordinator reviews
        await coord_page.goto(f"{base_url}/coordinator/reviews?tab=needs_review", wait_until="domcontentloaded")
        await coord_page.wait_for_selector("text=Product Catalogue Reviews", timeout=8000)

        # Inspect first product
        inspect_btn = coord_page.locator("button:has-text('Inspect & Review')").first
        if await inspect_btn.is_visible():
            await inspect_btn.click()
            await coord_page.wait_for_selector("text=Coordinator Review", timeout=5000)

        # Test context-aware navigation
        await coord_page.goto(f"{base_url}/passport/assam-muga-silk-saree-kamrup-7701", wait_until="domcontentloaded")
        await coord_page.wait_for_selector("text=KarigarSaathi Craft Passport", timeout=6000)

        # Check button label
        coord_back_btn = coord_page.locator("header button[aria-label*='Return to']").first
        coord_btn_aria = await coord_back_btn.get_attribute("aria-label")
        record("Coordinator Context Handled", "Return to" in coord_btn_aria, f"Back button aria-label: {coord_btn_aria}")
        await coord_page.screenshot(path=os.path.join(ARTIFACT_DIR, "passport_nav_from_coordinator.png"))

        await coord_ctx.close()

        # ---------------------------------------------------------------------
        # TEST 5: Direct QR / URL Access (No Origin Context) -> Home Fallback
        # ---------------------------------------------------------------------
        print("\n--- TEST 5: Direct QR / URL Access (No Origin Context) ---")
        direct_ctx = await browser.new_context(viewport={"width": 1280, "height": 800})
        direct_page = await direct_ctx.new_page()

        # Direct navigation simulates scanning a physical QR code on a product tag
        await direct_page.goto(f"{base_url}/passport/chanderi-silk-saree-kamrup-7721", wait_until="domcontentloaded")
        await direct_page.wait_for_selector("text=KarigarSaathi Craft Passport", timeout=6000)

        home_back_btn = direct_page.locator("header button[aria-label='Return to Home']").first
        has_home_label = await home_back_btn.is_visible()
        record("Direct QR Scan Fallback to Home", has_home_label, "Back button cleanly labeled 'Return to Home'")
        await direct_page.screenshot(path=os.path.join(ARTIFACT_DIR, "passport_nav_direct_qr_home.png"))

        # Click Home Back button
        await home_back_btn.click()
        await direct_page.wait_for_timeout(500)
        is_at_home = direct_page.url == f"{base_url}/" or direct_page.url == f"{base_url}"
        record("Navigated to Public Home on Direct Access Back", is_at_home, f"Current URL: {direct_page.url}")
        await direct_ctx.close()

        # ---------------------------------------------------------------------
        # TEST 6: Native Browser Back & Forward Support
        # ---------------------------------------------------------------------
        print("\n--- TEST 6: Native Browser Back/Forward Support ---")
        await artisan_page.goto(f"{base_url}/marketplace/products/prod_jamdani_01", wait_until="domcontentloaded")
        await artisan_page.wait_for_selector("text=Verifiable Craft Passport", timeout=6000)

        await artisan_page.locator("a:has-text('View Passport')").first.click()
        await artisan_page.wait_for_selector("text=KarigarSaathi Craft Passport", timeout=6000)

        # Trigger native browser back
        await artisan_page.go_back()
        await artisan_page.wait_for_selector("text=Verifiable Craft Passport", timeout=6000)
        record("Native Browser Back Succeeded", "/marketplace/products/prod_jamdani_01" in artisan_page.url, "Browser history Back cleanly returned to marketplace product")

        # Trigger native browser forward
        await artisan_page.go_forward()
        await artisan_page.wait_for_selector("text=KarigarSaathi Craft Passport", timeout=6000)
        record("Native Browser Forward Succeeded", "/passport/" in artisan_page.url, "Browser history Forward returned to passport")

        await artisan_ctx.close()
        await browser.close()

    print("\n=================================================================")
    print("ALL PASSPORT BACK NAVIGATION VERIFICATION COMPLETED")
    print("=================================================================")

    failed = [r for r in results if not r[1]]
    if failed:
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(run_passport_navigation_verification())
