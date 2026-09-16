import asyncio
from playwright.async_api import async_playwright

async def inspect():
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

        # Go to product new photos
        await page.goto("http://localhost:3000/artisan/products/new/photos", wait_until="domcontentloaded")
        await page.wait_for_selector("header", timeout=8000)

        header = page.locator("header").first
        await header.screenshot(path=r"C:\Users\KIIT\.gemini\antigravity\brain\e639edbe-3e43-46ee-9da7-3cc34cc56ca5\header_current.png")

        arrow_box = await page.locator("header button svg").first.bounding_box()
        title_box = await page.locator("header a:has-text('KarigarSaathi')").first.bounding_box()
        sub_box = await page.locator("header span:has-text('Add New Product Listing')").first.bounding_box()
        header_box = await header.bounding_box()

        print(f"Header: {header_box}")
        print(f"Arrow: {arrow_box}")
        print(f"Title: {title_box}")
        print(f"Subtitle: {sub_box}")

        arrow_center_y = arrow_box['y'] + arrow_box['height'] / 2
        title_center_y = title_box['y'] + title_box['height'] / 2
        print(f"Arrow center Y: {arrow_center_y:.2f}px")
        print(f"Title center Y: {title_center_y:.2f}px")
        print(f"Diff (Title center - Arrow center): {title_center_y - arrow_center_y:.2f}px")
        print(f"Title top distance from Header top: {title_box['y'] - header_box['y']:.2f}px")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(inspect())
