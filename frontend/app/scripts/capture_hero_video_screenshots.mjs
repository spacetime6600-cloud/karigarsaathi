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
  console.log('Launching Edge for hero video verification screenshots...');
  const edgeProc = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + path.resolve('.temp_edge_profile_video'),
    'http://localhost:3000/'
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

    const capture = async (filename, width = 1440, height = 900, clip = null) => {
      await sendCDP(ws, 'Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: width < 600,
      });
      await delay(400);
      const params = { format: 'png' };
      if (clip) params.clip = { ...clip, scale: 1 };
      const { data } = await sendCDP(ws, 'Page.captureScreenshot', params);
      fs.writeFileSync(path.join(SCREENSHOT_DIR, filename), Buffer.from(data, 'base64'));
      console.log(`Saved: ${filename}`);
    };

    // 1. Desktop hero while video is playing (1440x900)
    await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/' });
    await delay(2000);
    await capture('01_desktop_hero_video_playing.png', 1440, 900);

    // 2. Desktop hero before video loads, showing poster (Simulate video hidden)
    await sendCDP(ws, 'Runtime.evaluate', {
      expression: `
        const video = document.querySelector('video');
        if (video) video.style.opacity = '0';
      `
    });
    await delay(300);
    await capture('02_desktop_hero_poster_fallback.png', 1440, 900);

    // 3. Hero-to-next-section transition close-up (Desktop)
    await sendCDP(ws, 'Runtime.evaluate', {
      expression: `
        const video = document.querySelector('video');
        if (video) video.style.opacity = '0.9';
      `
    });
    await delay(300);
    await capture('03_hero_to_next_section_transition.png', 1440, 900, {
      x: 0,
      y: 450,
      width: 1440,
      height: 650
    });

    // 4. Tablet hero (1024x768)
    await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/' });
    await delay(1500);
    await capture('04_tablet_hero.png', 1024, 768);

    // 5. Mobile hero (390x844)
    await capture('05_mobile_hero.png', 390, 844);

    // 6. Reduced-motion poster fallback (Simulate prefers-reduced-motion)
    await sendCDP(ws, 'Emulation.setEmulatedMedia', {
      media: 'screen',
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
    });
    await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/' });
    await delay(1500);
    await capture('06_reduced_motion_poster_fallback.png', 1440, 900);

    // Reset emulated media
    await sendCDP(ws, 'Emulation.setEmulatedMedia', { media: 'screen', features: [] });

    // 7. Video-error fallback
    await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/' });
    await delay(1000);
    await sendCDP(ws, 'Runtime.evaluate', {
      expression: `
        const video = document.querySelector('video');
        if (video) {
          video.dispatchEvent(new Event('error'));
          video.style.display = 'none';
        }
      `
    });
    await delay(300);
    await capture('07_video_error_fallback.png', 1440, 900);

    ws.close();
  } finally {
    edgeProc.kill();
  }
}

main().catch(console.error);
