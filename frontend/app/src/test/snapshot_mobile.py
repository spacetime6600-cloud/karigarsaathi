import asyncio
import os
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        c = await b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True)
        page = await c.new_page()
        await page.goto('http://127.0.0.1:3000/marketplace', wait_until='domcontentloaded')
        await page.wait_for_timeout(1000)
        await page.screenshot(path=r'C:\Users\KIIT\.gemini\antigravity\brain\e639edbe-3e43-46ee-9da7-3cc34cc56ca5\motion_mobile_marketplace.png')
        await b.close()
        print('MOBILE SNAPSHOT SAVED')

if __name__ == '__main__':
    asyncio.run(main())
