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
  console.log('Launching Edge for homepage verification screenshots...');
  const edgeProc = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + path.resolve('.temp_edge_profile_home_verify'),
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
      await delay(500);
      const params = { format: 'png' };
      if (clip) params.clip = { ...clip, scale: 1 };
      const { data } = await sendCDP(ws, 'Page.captureScreenshot', params);
      fs.writeFileSync(path.join(SCREENSHOT_DIR, filename), Buffer.from(data, 'base64'));
      console.log(`Saved: ${filename}`);
    };

    // 1. Desktop 1440px Hero (Video Playing)
    await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/' });
    await delay(2500);
    await capture('home_01_desktop_1440_hero.png', 1440, 900);

    // 2. Desktop 1440px Workflow Section with Relocated Craft Panorama
    await capture('home_02_desktop_1440_workflow_panorama.png', 1440, 900, {
      x: 0,
      y: 650,
      width: 1440,
      height: 800
    });

    // 3. Tablet 1024px Hero
    await capture('home_03_tablet_1024_hero.png', 1024, 768);

    // 4. Tablet 768px Hero
    await capture('home_04_tablet_768_hero.png', 768, 1024);

    // 5. Mobile 390px Hero
    await capture('home_05_mobile_390_hero.png', 390, 844);

    // 6. Mobile 320px Hero
    await capture('home_06_mobile_320_hero.png', 320, 600);

    // 7. Reduced Motion Fallback
    await sendCDP(ws, 'Emulation.setEmulatedMedia', {
      media: 'screen',
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
    });
    await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/' });
    await delay(1500);
    await capture('home_07_reduced_motion_poster.png', 1440, 900);

    // Reset emulated media
    await sendCDP(ws, 'Emulation.setEmulatedMedia', { media: 'screen', features: [] });

    // 8. Track 3 video loop cycles
    console.log('Testing video playback and looping...');
    const loopStatus = await sendCDP(ws, 'Runtime.evaluate', {
      expression: `
        new Promise((resolve) => {
          const video = document.querySelector('video');
          if (!video) return resolve({ found: false });
          let loopCount = 0;
          video.addEventListener('ended', () => loopCount++);
          video.addEventListener('timeupdate', () => {
            if (video.currentTime > 0.5 && video.loop) {
              // video loops continuously
            }
          });
          setTimeout(() => {
            resolve({
              found: true,
              paused: video.paused,
              currentTime: video.currentTime,
              duration: video.duration,
              loop: video.loop,
              muted: video.muted,
              autoplay: video.autoplay,
              opacity: window.getComputedStyle(video).opacity,
              hasPosterUnderneath: !!document.querySelector('.hero-media__poster')
            });
          }, 3000);
        })
      `,
      awaitPromise: true
    });
    console.log('Video Loop Diagnostics:', loopStatus.result.value);

    ws.close();
  } finally {
    edgeProc.kill();
  }
}

main().catch(console.error);
