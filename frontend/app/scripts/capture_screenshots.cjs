const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function capture() {
  const browser = await chromium.launch();
  const dir = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // 1. Desktop Hero (1440x900)
  let page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(dir, '01_desktop_hero.png'), clip: { x: 0, y: 0, width: 1440, height: 800 } });

  // 2. Initial Centred India Map
  const mapElement = await page.$('#craft-map');
  if (mapElement) {
    await mapElement.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const box = await mapElement.boundingBox();
    if (box) {
      await page.screenshot({ path: path.join(dir, '06_initial_centred_map.png'), clip: { x: 0, y: box.y - 100, width: 1440, height: box.height + 150 } });
    }
  }

  // 7. State Hover with Small Glass Card (Hover Odisha)
  const odPath = await page.$('[data-state-code="OD"]');
  if (odPath) {
    const box = await odPath.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(dir, '07_state_hover_glass_card.png') });
    }
  }

  // 8. Clicked State with Expanded Details (Click Rajasthan)
  const rjPath = await page.$('[data-state-code="RJ"]');
  if (rjPath) {
    await rjPath.click();
    await page.waitForTimeout(500);
    const mapBox = await page.$('#craft-map');
    const box = await mapBox.boundingBox();
    if (box) {
      await page.screenshot({ path: path.join(dir, '08_clicked_state_expanded_details.png'), clip: { x: 0, y: box.y - 50, width: 1440, height: box.height + 100 } });
    }
  }

  // 3. Login Page
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(dir, '03_login_page.png') });

  // 4. Add Product Step (Step 1 Photos)
  await page.goto('http://localhost:3000/artisan/new-product/photos', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(dir, '04_add_product_step.png') });

  // 5. Dashboard
  await page.goto('http://localhost:3000/artisan/dashboard', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(dir, '05_dashboard.png') });

  // 2. Mobile Hero (390x844)
  await page.close();
  page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(dir, '02_mobile_hero.png'), clip: { x: 0, y: 0, width: 390, height: 750 } });

  // 9. Mobile Map and Details
  const mobileMap = await page.$('#craft-map');
  if (mobileMap) {
    await mobileMap.scrollIntoViewIfNeeded();
    const select = await page.$('select');
    if (select) {
      await select.selectOption('AS');
      await page.waitForTimeout(400);
    }
    const box = await mobileMap.boundingBox();
    if (box) {
      await page.screenshot({ path: path.join(dir, '09_mobile_map_and_details.png'), clip: { x: 0, y: box.y - 30, width: 390, height: box.height + 60 } });
    }
  }

  await browser.close();
  console.log('All 9 visual screenshots captured successfully in screenshots/ directory!');
}

capture().catch(console.error);
