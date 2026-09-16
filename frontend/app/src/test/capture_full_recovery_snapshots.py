import asyncio
import os
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\KIIT\.gemini\antigravity\brain\e639edbe-3e43-46ee-9da7-3cc34cc56ca5"

async def capture_snapshots():
    base_url = "http://127.0.0.1:3000"
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await context.new_page()

        # 1. Sign In as Artisan
        await page.goto(f"{base_url}/login", wait_until="domcontentloaded")
        await page.wait_for_selector('input[type="email"]', timeout=8000)
        await page.fill('input[type="email"]', "artisan_a@karigarsaathi.local")
        await page.fill('input[type="password"]', "KarigarPass123!")
        await page.click('button[type="submit"]')
        await page.wait_for_url(f"{base_url}/artisan/dashboard", timeout=8000)
        await page.wait_for_timeout(1000)
        await page.screenshot(path=os.path.join(ARTIFACT_DIR, "recovery_artisan_dashboard_live.png"))

        # 2. Inventory Management Page
        await page.goto(f"{base_url}/artisan/inventory", wait_until="domcontentloaded")
        await page.wait_for_timeout(1000)
        await page.screenshot(path=os.path.join(ARTIFACT_DIR, "recovery_artisan_inventory_live.png"))

        # 3. Product Details - Voice Studio Open
        await page.goto(f"{base_url}/artisan/products/new/details", wait_until="domcontentloaded")
        voice_btn = page.locator("button:has-text('Open AI Voice Studio'), button:has-text('वॉयस स्टूडियो')").first
        if await voice_btn.is_visible():
            await voice_btn.click()
            await page.wait_for_selector("text='AI Voice & Multilingual Catalogue Studio'", timeout=5000)
            await page.wait_for_timeout(600)
            await page.screenshot(path=os.path.join(ARTIFACT_DIR, "recovery_voice_studio_full.png"))

        # 4. Sign in as Coordinator
        coord_ctx = await browser.new_context(viewport={"width": 1280, "height": 800})
        coord_page = await coord_ctx.new_page()
        await coord_page.goto(f"{base_url}/coordinator/login", wait_until="domcontentloaded")
        await coord_page.wait_for_selector('input[type="email"]', timeout=8000)
        await coord_page.fill('input[type="email"]', "coordinator_east@karigarsaathi.local")
        await coord_page.fill('input[type="password"]', "KarigarPass123!")
        await coord_page.click('button[type="submit"]')
        await coord_page.wait_for_url(f"{base_url}/coordinator", timeout=8000)
        await coord_page.wait_for_timeout(1000)
        await coord_page.screenshot(path=os.path.join(ARTIFACT_DIR, "recovery_coordinator_live.png"))

        await coord_ctx.close()
        await context.close()
        await browser.close()
        print("ALL RECOVERY SNAPSHOTS CAPTURED")

if __name__ == "__main__":
    asyncio.run(capture_snapshots())
