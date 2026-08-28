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
  console.log('Launching Edge for Marketplace Hero verification screenshots...');
  const edgeProc = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + path.resolve('.temp_edge_profile_mkt_hero'),
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
      console.log(`Saved: ${filename} (${width}x${height})`);
    };

    await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/marketplace' });
    await delay(1800);

    // 1. 1920x1080 (Large Desktop)
    await capture('01_marketplace_hero_1920.png', 1920, 1080);

    // 2. 1440x900 (Standard Desktop)
    await capture('02_marketplace_hero_1440.png', 1440, 900);

    // 3. 1280x800 (Laptop)
    await capture('03_marketplace_hero_1280.png', 1280, 800);

    // 4. 1024x768 (Short Laptop / Tablet Landscape)
    await capture('04_marketplace_hero_1024x768.png', 1024, 768);

    // 5. 768x1024 (Tablet Portrait)
    await capture('05_marketplace_hero_768.png', 768, 1024);

    // 6. 430x932 (iPhone 14/15 Pro Max)
    await capture('06_marketplace_hero_430.png', 430, 932);

    // 7. 390x844 (iPhone 12/13/14)
    await capture('07_marketplace_hero_390.png', 390, 844);

    // 8. 360x780 (Android Standard)
    await capture('08_marketplace_hero_360.png', 360, 780);

    // 9. 320x568 (Mobile Compact)
    await capture('09_marketplace_hero_320.png', 320, 568);

    // 10. 1366x768 (Short Desktop)
    await capture('10_marketplace_hero_1366x768.png', 1366, 768);

    // 11. Reduced Motion Mode
    await sendCDP(ws, 'Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
    });
    await capture('11_marketplace_hero_reduced_motion.png', 1440, 900);

    ws.close();
  } finally {
    edgeProc.kill();
  }
}

main().catch(console.error);
