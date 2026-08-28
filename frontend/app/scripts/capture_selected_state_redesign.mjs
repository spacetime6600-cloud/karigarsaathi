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
  console.log('Launching Edge for Selected-State Redesign verification screenshots...');
  const edgeProc = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + path.resolve('.temp_edge_profile_state_details'),
    'http://localhost:3000/#craft-map'
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
      await delay(350);
      const { data } = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(SCREENSHOT_DIR, filename), Buffer.from(data, 'base64'));
      console.log(`Saved: ${filename}`);
    };

    const scrollToMap = async () => {
      await sendCDP(ws, 'Runtime.evaluate', {
        expression: `
          (() => {
            const el = document.querySelector('#craft-map');
            if (el) {
              const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
              window.scrollTo({ top: Math.max(0, y), behavior: 'instant' });
            }
          })()
        `
      });
      await delay(500);
    };

    // 1. Initial Centred Map
    await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/' });
    await delay(1800);
    await scrollToMap();
    await capture('01_initial_centered_map.png', 1440, 900);

    // 2. Bihar Selected on Desktop
    await sendCDP(ws, 'Runtime.evaluate', {
      expression: `
        (() => {
          const path = document.querySelector('[data-state-code="BR"]');
          if (path) path.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        })()
      `
    });
    await delay(600);
    await scrollToMap();
    await capture('02_bihar_selected_desktop.png', 1440, 900);

    // 3. Main Bihar Cultural Hero Image
    await capture('03_bihar_cultural_hero_image.png', 1440, 900);

    // 4. Three Image-Led Bihar Craft Rows
    await capture('04_bihar_three_craft_rows.png', 1440, 900);

    // 5. State-to-State Crossfade (Bihar -> Rajasthan)
    await sendCDP(ws, 'Runtime.evaluate', {
      expression: `
        (() => {
          const path = document.querySelector('[data-state-code="RJ"]');
          if (path) path.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        })()
      `
    });
    await delay(500);
    await capture('06_state_to_state_crossfade.png', 1440, 900);

    // 6. Simplified Back to India Action (Hover state on button)
    await sendCDP(ws, 'Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.querySelector('button[aria-label="Back to India map"]');
          if (btn) {
            btn.style.color = '#A13F1C';
            btn.style.textDecoration = 'underline';
          }
        })()
      `
    });
    await delay(300);
    await capture('07_back_to_india_action.png', 1440, 900);

    // 7. Click Back to India (returns to centered map)
    await sendCDP(ws, 'Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.querySelector('button[aria-label="Back to India map"]');
          if (btn) btn.click();
        })()
      `
    });
    await delay(500);

    // 8. Bihar Selected on Mobile (390x844)
    await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/' });
    await delay(1200);
    await sendCDP(ws, 'Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await delay(400);
    await scrollToMap();
    await sendCDP(ws, 'Runtime.evaluate', {
      expression: `
        (() => {
          const path = document.querySelector('[data-state-code="BR"]');
          if (path) path.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        })()
      `
    });
    await delay(600);
    await capture('08_bihar_selected_mobile.png', 390, 844);

    // 9. Reduced Motion Mode
    await sendCDP(ws, 'Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
    });
    await capture('09_reduced_motion_version.png', 1440, 900);

    ws.close();
  } finally {
    edgeProc.kill();
  }
}

main().catch(console.error);
