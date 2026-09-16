import asyncio
from playwright.async_api import async_playwright
import os

ARTIFACT_DIR = r"C:\Users\KIIT\.gemini\antigravity\brain\e639edbe-3e43-46ee-9da7-3cc34cc56ca5"

async def test_header_variations():
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

        # Check different viewport sizes: Desktop (1280), Tablet (768), Mobile (390)
        for name, vp in [("desktop", {"width": 1280, "height": 800}),
                         ("tablet", {"width": 768, "height": 1024}),
                         ("mobile", {"width": 390, "height": 844})]:
            await page.set_viewport_size(vp)
            await page.wait_for_timeout(300)
            header = page.locator("header").first
            await header.screenshot(path=os.path.join(ARTIFACT_DIR, f"header_{name}.png"))
            
            arrow_box = await page.locator("header button svg").first.bounding_box()
            title_box = await page.locator("header a:has-text('KarigarSaathi')").first.bounding_box()
            sub_box = await page.locator("header span:has-text('Add New Product Listing')").first.bounding_box()
            header_box = await header.bounding_box()
            
            print(f"--- {name.upper()} ---")
            print(f"Header: {header_box}")
            print(f"Arrow: {arrow_box}")
            print(f"Title: {title_box}")
            print(f"Subtitle: {sub_box}")
            print(f"Title Top: {title_box['y'] - header_box['y']:.2f}px")
            print(f"Arrow Center Y: {arrow_box['y'] + arrow_box['height']/2:.2f}px")
            print(f"Title Center Y: {title_box['y'] + title_box['height']/2:.2f}px")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_header_variations())
