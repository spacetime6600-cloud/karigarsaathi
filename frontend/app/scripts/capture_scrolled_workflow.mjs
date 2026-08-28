import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9222;
const SCREENSHOT_DIR = path.resolve('screenshots');
const ARTIFACT_DIR = 'C:\\Users\\KIIT\\.gemini\\antigravity\\brain\\e639edbe-3e43-46ee-9da7-3cc34cc56ca5';

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
  console.log('Launching Edge for scrolled workflow capture...');
  const edgeProc = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + path.resolve('.temp_edge_profile_scroll'),
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

    await sendCDP(ws, 'Page.enable');
    await sendCDP(ws, 'DOM.enable');

    await sendCDP(ws, 'Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/' });
    await delay(2000);

    // Scroll to how-it-works
    await sendCDP(ws, 'Runtime.evaluate', {
      expression: `document.getElementById('how-it-works').scrollIntoView({ block: 'start' });`
    });
    await delay(600);

    const { data: data1 } = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' });
    const p1 = path.join(SCREENSHOT_DIR, 'home_08_desktop_workflow_scrolled.png');
    const p1_art = path.join(ARTIFACT_DIR, 'home_08_desktop_workflow_scrolled.png');
    fs.writeFileSync(p1, Buffer.from(data1, 'base64'));
    fs.writeFileSync(p1_art, Buffer.from(data1, 'base64'));
    console.log('Saved:', p1);

    // Copy other key screenshots to artifact dir
    const copyList = [
      'home_01_desktop_1440_hero.png',
      'home_03_tablet_1024_hero.png',
      'home_04_tablet_768_hero.png',
      'home_05_mobile_390_hero.png',
      'home_06_mobile_320_hero.png',
      'home_07_reduced_motion_poster.png'
    ];
    for (const f of copyList) {
      const srcPath = path.join(SCREENSHOT_DIR, f);
      const destPath = path.join(ARTIFACT_DIR, f);
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
      }
    }
    console.log('Copied screenshots to artifact directory.');

    ws.close();
  } finally {
    edgeProc.kill();
  }
}

main().catch(console.error);
