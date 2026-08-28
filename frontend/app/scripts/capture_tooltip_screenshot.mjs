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
  console.log('Capturing refined map hover tooltip...');
  const edgeProc = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + path.resolve('.temp_edge_profile_4'),
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
    await delay(400);

    await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/' });
    await delay(1500);

    // Scroll to map
    await sendCDP(ws, 'Runtime.evaluate', {
      expression: `document.getElementById('craft-map')?.scrollIntoView({ behavior: 'instant', block: 'center' });`
    });
    await delay(600);

    // Hover on Uttar Pradesh (UP)
    await sendCDP(ws, 'Runtime.evaluate', {
      expression: `
        const up = document.querySelector('[data-state-code="UP"]');
        if (up) {
          up.focus();
          up.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        }
      `
    });
    await delay(600);

    const { data } = await sendCDP(ws, 'Page.captureScreenshot', {
      format: 'png',
      clip: { x: 300, y: 150, width: 840, height: 620, scale: 1 }
    });
    fs.writeFileSync(path.join(SCREENSHOT_DIR, '09_refined_hover_tooltip_up.png'), Buffer.from(data, 'base64'));
    console.log('Saved: 09_refined_hover_tooltip_up.png');

    ws.close();
  } finally {
    edgeProc.kill();
  }
}

main().catch(console.error);
