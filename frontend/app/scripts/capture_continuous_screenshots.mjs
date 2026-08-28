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
  console.log('Launching Edge for continuous canvas screenshots...');
  const edgeProc = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + path.resolve('.temp_edge_profile_3'),
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

    await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/' });
    await delay(1500);

    // 1. Complete desktop landing page (Full page)
    const { root } = await sendCDP(ws, 'DOM.getDocument');
    const { nodeIds } = await sendCDP(ws, 'DOM.querySelectorAll', { nodeId: root.nodeId, selector: 'body' });
    const { model } = await sendCDP(ws, 'DOM.getBoxModel', { nodeId: nodeIds[0] });
    const fullHeight = model.height;

    await capture('01_complete_desktop_landing_page.png', 1440, Math.min(fullHeight, 5200), {
      x: 0,
      y: 0,
      width: 1440,
      height: Math.min(fullHeight, 5200)
    });

    // 2. Hero-to-workflow transition close-up (Desktop)
    await capture('02_hero_to_workflow_transition_closeup.png', 1440, 900, {
      x: 0,
      y: 500,
      width: 1440,
      height: 700
    });

    // 3. Workflow-to-features transition close-up (Desktop)
    await capture('03_workflow_to_features_transition_closeup.png', 1440, 900, {
      x: 0,
      y: 1100,
      width: 1440,
      height: 700
    });

    // 4. Features-to-map transition close-up (Desktop)
    await capture('04_features_to_map_transition_closeup.png', 1440, 900, {
      x: 0,
      y: 1800,
      width: 1440,
      height: 700
    });

    // 5. Complete map section (Desktop)
    await capture('05_complete_map_section.png', 1440, 900, {
      x: 0,
      y: 2250,
      width: 1440,
      height: 950
    });

    // 6. Map-to-next-section transition close-up (Desktop)
    await capture('06_map_to_next_section_transition_closeup.png', 1440, 900, {
      x: 0,
      y: 2950,
      width: 1440,
      height: 750
    });

    // 7. Mobile complete page (390 width)
    await capture('07_mobile_complete_page.png', 390, 844);

    // 8. Mobile transition close-ups (390 width)
    await capture('08_mobile_transition_closeup.png', 390, 844, {
      x: 0,
      y: 450,
      width: 390,
      height: 650
    });

    ws.close();
  } finally {
    edgeProc.kill();
  }
}

main().catch(console.error);
