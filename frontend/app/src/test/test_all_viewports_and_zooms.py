import asyncio
from playwright.async_api import async_playwright
import os

ARTIFACT_DIR = r"C:\Users\KIIT\.gemini\antigravity\brain\e639edbe-3e43-46ee-9da7-3cc34cc56ca5"

async def test_all_viewports_and_zooms():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1280, "height": 800})
        
        # Login
        await page.goto("http://localhost:3000/login", wait_until="domcontentloaded")
        await page.wait_for_selector('input[type="email"]', timeout=8000)
        await page.fill('input[type="email"]', "artisan_a@karigarsaathi.local")
        await page.fill('input[type="password"]', "KarigarPass123!")
        await page.click('button[type="submit"]')
        await page.wait_for_url("http://localhost:3000/artisan/dashboard", timeout=8000)

        await page.goto("http://localhost:3000/artisan/products/new/photos", wait_until="domcontentloaded")
        await page.wait_for_selector("header", timeout=8000)

        viewports = [
            ("desktop_1920", {"width": 1920, "height": 1080}),
            ("desktop_1280", {"width": 1280, "height": 800}),
            ("laptop_1024", {"width": 1024, "height": 768}),
            ("tablet_768", {"width": 768, "height": 1024}),
            ("mobile_390", {"width": 390, "height": 844}),
            ("mobile_320", {"width": 320, "height": 568}),
        ]

        print("=== VIEWPORT MATRIX VALIDATION ===")
        for name, vp in viewports:
            await page.set_viewport_size(vp)
            await page.wait_for_timeout(200)
            
            header = page.locator("header").first
            arrow_box = await page.locator("header button svg").first.bounding_box()
            title_box = await page.locator("header a:has-text('KarigarSaathi')").first.bounding_box()
            sub_box = await page.locator("header span:has-text('Add New Product Listing')").first.bounding_box()
            header_box = await header.bounding_box()
            
            title_top_gap = title_box['y'] - header_box['y']
            arrow_center_y = arrow_box['y'] + arrow_box['height']/2
            title_center_y = title_box['y'] + title_box['height']/2
            diff_y = title_center_y - arrow_center_y

            # Check that title is NOT touching top edge (> 4px) and spacing is consistent
            is_valid = title_top_gap >= 4 and sub_box['y'] > title_box['y']
            status = "PASS" if is_valid else "FAIL"

            print(f"[{status}] {name:15}: Header H={header_box['height']}px | Title Top Gap={title_top_gap:.1f}px | Diff to Arrow={diff_y:.1f}px")

        print("\n=== BROWSER ZOOM VALIDATION ===")
        await page.set_viewport_size({"width": 1280, "height": 800})
        for zoom in [1.25, 1.5, 2.0]:
            await page.evaluate(f"document.body.style.zoom = '{zoom}'")
            await page.wait_for_timeout(200)
            
            header = page.locator("header").first
            arrow_box = await page.locator("header button svg").first.bounding_box()
            title_box = await page.locator("header a:has-text('KarigarSaathi')").first.bounding_box()
            sub_box = await page.locator("header span:has-text('Add New Product Listing')").first.bounding_box()
            header_box = await header.bounding_box()
            
            title_top_gap = title_box['y'] - header_box['y']
            is_valid = title_top_gap >= 3 and sub_box['y'] > title_box['y']
            status = "PASS" if is_valid else "FAIL"

            print(f"[{status}] Zoom {int(zoom*100)}%: Title Top Gap={title_top_gap:.1f}px | Subtitle Y={sub_box['y']:.1f}px")

        await page.evaluate("document.body.style.zoom = '1.0'")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_all_viewports_and_zooms())
