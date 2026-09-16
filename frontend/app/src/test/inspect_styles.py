import asyncio
from playwright.async_api import async_playwright

async def inspect_styles():
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

        info = await page.evaluate("""() => {
            const header = document.querySelector('header');
            const btn = header.querySelector('button');
            const svg = btn.querySelector('svg');
            const col = header.querySelector('div.flex-col');
            const a = col.querySelector('a');
            const span = col.querySelector('span');

            const getMetrics = (el) => {
                const rect = el.getBoundingClientRect();
                const style = window.getComputedStyle(el);
                return {
                    tag: el.tagName,
                    class: el.className,
                    rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
                    style: {
                        fontSize: style.fontSize,
                        lineHeight: style.lineHeight,
                        minHeight: style.minHeight,
                        height: style.height,
                        marginTop: style.marginTop,
                        marginBottom: style.marginBottom,
                        paddingTop: style.paddingTop,
                        paddingBottom: style.paddingBottom,
                        display: style.display
                    }
                };
            };

            return {
                header: getMetrics(header),
                btn: getMetrics(btn),
                svg: getMetrics(svg),
                col: getMetrics(col),
                a: getMetrics(a),
                span: getMetrics(span)
            };
        }""")

        import pprint
        pprint.pprint(info)
        await browser.close()

if __name__ == "__main__":
    asyncio.run(inspect_styles())
