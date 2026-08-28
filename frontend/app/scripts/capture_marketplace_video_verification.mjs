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
  console.log('Launching Edge for Marketplace Atmospheric Video verification...');
  const edgeProc = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + path.resolve('.temp_edge_profile_mkt_video'),
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

    // 1. Initial navigation
    await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/marketplace' });
    await delay(1200);

    // 1. Desktop crop (1440x900)
    await capture('01_marketplace_video_desktop_1440.png', 1440, 900);

    // 2. Large desktop (1920x1080)
    await capture('02_marketplace_video_desktop_1920.png', 1920, 1080);

    // 3. Tablet crop (768x1024)
    await capture('03_marketplace_video_tablet_768.png', 768, 1024);

    // 4. Mobile crop (390x844)
    await capture('04_marketplace_video_mobile_390.png', 390, 844);

    // 5. Compact mobile crop (320x640)
    await capture('05_marketplace_video_mobile_320.png', 320, 640);

    // 6. Video-to-cream bottom transition
    await capture('06_marketplace_video_bottom_transition.png', 1440, 900);

    // 7. Temporal Fade-In State (simulated at start of video)
    await sendCDP(ws, 'Runtime.evaluate', {
      expression: `
        const video = document.querySelector('.marketplace-hero video');
        if (video) { video.currentTime = 0.3; video.pause(); }
      `
    });
    await delay(300);
    await capture('07_marketplace_video_temporal_fadein.png', 1440, 900);

    // 8. Fully visible middle state
    await sendCDP(ws, 'Runtime.evaluate', {
      expression: `
        const video = document.querySelector('.marketplace-hero video');
        if (video) { video.currentTime = 5.0; video.pause(); }
      `
    });
    await delay(300);
    await capture('08_marketplace_video_fully_visible.png', 1440, 900);

    // 9. Temporal Fade-Out State (at 13.0s returning to deep navy atmosphere)
    await sendCDP(ws, 'Runtime.evaluate', {
      expression: `
        const video = document.querySelector('.marketplace-hero video');
        if (video) { video.currentTime = 13.0; video.pause(); }
      `
    });
    await delay(300);
    await capture('09_marketplace_video_temporal_fadeout.png', 1440, 900);

    // 10. Reduced Motion Poster Fallback
    await sendCDP(ws, 'Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
    });
    await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/marketplace' });
    await delay(1200);
    await capture('10_marketplace_video_reduced_motion_poster.png', 1440, 900);

    // 11. Data Saving Poster Fallback
    await sendCDP(ws, 'Emulation.setEmulatedMedia', { features: [] });
    await sendCDP(ws, 'Runtime.evaluate', {
      expression: `
        Object.defineProperty(navigator, 'connection', {
          value: { saveData: true },
          configurable: true
        });
      `
    });
    await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/marketplace' });
    await delay(1200);
    await capture('11_marketplace_video_data_saving_poster.png', 1440, 900);

    ws.close();
  } finally {
    edgeProc.kill();
  }
}

main().catch(console.error);
