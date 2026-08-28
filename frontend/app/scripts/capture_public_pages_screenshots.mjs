import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9222;
const SCREENSHOT_DIR = path.resolve('screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendCDP(ws, method, params = {}) {
  const id = Math.floor(Math.random() * 1000000);
  return new Promise((resolve, reject) => {
    const handler = (event) => {
      const data = JSON.parse(event.data);
      if (data.id === id) {
        ws.removeEventListener('message', handler);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function main() {
  console.log('Launching Edge for 12 Editorial Marketplace verification screenshots with accurate viewport scroll...');
  const edgeProc = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + path.resolve('.temp_edge_profile_marketplace_editorial'),
    'http://localhost:3000/marketplace'
  ]);

  await delay(2500);

  try {
    const res = await fetch(`http://127.0.0.1:${PORT}/json`);
    const targets = await res.json();
    const pageTarget = targets.find((t) => t.type === 'page');
    if (!pageTarget) throw new Error('No page target found');

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((resolve) => {
      ws.onopen = resolve;
    });

    console.log('Connected to CDP WebSocket');
    await sendCDP(ws, 'Page.enable');
    await sendCDP(ws, 'DOM.enable');

    const capture = async (filename, width = 1440, height = 900) => {
      await sendCDP(ws, 'Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: width < 600,
      });
      await delay(400);
      const { data } = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(SCREENSHOT_DIR, filename), Buffer.from(data, 'base64'));
      console.log(`Saved: ${filename}`);
    };

    const scrollToSelector = async (selector, offset = 80) => {
      await sendCDP(ws, 'Runtime.evaluate', {
        expression: `
          (() => {
            const el = document.querySelector('${selector}');
            if (el) {
              const y = el.getBoundingClientRect().top + window.pageYOffset - ${offset};
              window.scrollTo({ top: Math.max(0, y), behavior: 'instant' });
            }
          })()
        `
      });
      await delay(500);
    };

    // 1. Desktop Marketplace (Top & Hero)
    await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/marketplace' });
    await delay(1800);
    await capture('01_marketplace_full_desktop.png', 1440, 900);

    // 2. Marketplace Hero
    await capture('02_marketplace_hero.png', 1440, 900);

    // 3. Category Row ("Explore by craft")
    await scrollToSelector('section[aria-label="Explore by craft"]', 90);
    await capture('03_marketplace_category_row.png', 1440, 900);

    // 4. Featured Craftsmanship Spotlight
    await scrollToSelector('section[aria-label="Featured Craftsmanship"]', 90);
    await capture('04_marketplace_featured_craftsmanship.png', 1440, 900);

    // 5. Minimal Product Grid
    await scrollToSelector('section[aria-label="Selected handmade pieces"]', 90);
    await capture('05_marketplace_product_grid.png', 1440, 900);

    // 6. Product-Card Hover State
    await sendCDP(ws, 'Runtime.evaluate', {
      expression: `
        const firstCard = document.querySelector('section[aria-label="Selected handmade pieces"] .group');
        if (firstCard) {
          firstCard.classList.add('shadow-md');
          const title = firstCard.querySelector('h3');
          if (title) title.style.color = '#A13F1C';
          const img = firstCard.querySelector('img');
          if (img) img.style.transform = 'scale(1.02)';
        }
      `
    });
    await delay(300);
    await capture('06_marketplace_product_card_hover.png', 1440, 900);

    // 7. Craft Story Section ("The story behind each piece")
    await scrollToSelector('section[aria-label="Craft Story"]', 90);
    await capture('07_marketplace_craft_story.png', 1440, 900);

    // 8. Review Preview ("What buyers are saying")
    await scrollToSelector('section[aria-label="What buyers are saying"]', 90);
    await capture('08_marketplace_reviews_preview.png', 1440, 900);

    // 9. Tablet Marketplace (1024x800)
    await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/marketplace' });
    await delay(1200);
    await capture('09_marketplace_tablet.png', 1024, 800);

    // 10. Mobile Marketplace (390x844)
    await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/marketplace' });
    await delay(1200);
    await capture('10_marketplace_mobile.png', 390, 844);

    // 11. Mobile Filters Drawer (390x844)
    await sendCDP(ws, 'Runtime.evaluate', {
      expression: `
        const btn = document.querySelector('button[aria-label="Open filter drawer"]');
        if (btn) btn.click();
      `
    });
    await delay(500);
    await capture('11_marketplace_mobile_filters.png', 390, 844);

    // 12. Empty Search Results State
    await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/marketplace' });
    await delay(1000);
    await sendCDP(ws, 'Runtime.evaluate', {
      expression: `
        const input = document.querySelector('input[aria-label="Search products, crafts, artisans or regions"]');
        if (input) {
          input.value = 'NonExistentXYZCraft999';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      `
    });
    await delay(500);
    await scrollToSelector('section[aria-label="Selected handmade pieces"]', 90);
    await capture('12_marketplace_empty_state.png', 1440, 900);

    ws.close();
  } finally {
    edgeProc.kill();
  }
}

main().catch(console.error);
