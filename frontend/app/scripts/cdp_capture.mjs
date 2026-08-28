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
  console.log('Launching Edge with remote debugging...');
  const edgeProc = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + path.resolve('.temp_edge_profile_2'),
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

    // 1. Hero fading naturally into the workflow section (desktop 1440)
    await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/' });
    await delay(1200);
    await capture('01_hero_fading_into_workflow.png', 1440, 950);

    // 2. Workflow section with no hard hero edge
    await sendCDP(ws, 'Runtime.evaluate', {
      expression: `document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'instant', block: 'start' });`
    });
    await delay(500);
    await capture('02_workflow_section_no_hard_edge.png', 1440, 900);

    // 3. Initial India map without any outer card (Floating naturally)
    await sendCDP(ws, 'Runtime.evaluate', {
      expression: `document.getElementById('craft-map')?.scrollIntoView({ behavior: 'instant', block: 'center' });`
    });
    await delay(600);
    await capture('03_initial_india_map_no_outer_card.png', 1440, 900);

    // 4. State hover with only the small glass tooltip (Hover Odisha)
    await sendCDP(ws, 'Runtime.evaluate', {
      expression: `
        const el = document.querySelector('[data-state-code="OD"]');
        if (el) {
          el.focus();
          el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        }
      `
    });
    await delay(400);
    await capture('04_state_hover_small_glass_tooltip.png', 1440, 900);

    // 5. Selected state with map and details (Click Rajasthan)
    await sendCDP(ws, 'Runtime.evaluate', {
      expression: `
        const rj = document.querySelector('[data-state-code="RJ"]');
        if (rj) rj.click();
      `
    });
    await delay(600);
    await capture('05_selected_state_map_and_details.png', 1440, 900);

    // 6. Map section fading into the sections above and below
    await sendCDP(ws, 'Runtime.evaluate', {
      expression: `document.getElementById('craft-map')?.scrollIntoView({ behavior: 'instant', block: 'start' });`
    });
    await delay(500);
    await capture('06_map_section_cross_fade.png', 1440, 900);

    // 7. Mobile hero transition (390x844)
    await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/' });
    await delay(1200);
    await capture('07_mobile_hero_transition.png', 390, 844);

    // 8. Mobile map (390x844)
    await sendCDP(ws, 'Runtime.evaluate', {
      expression: `document.getElementById('craft-map')?.scrollIntoView({ behavior: 'instant', block: 'start' });`
    });
    await delay(500);
    await capture('08_mobile_map.png', 390, 844);

    ws.close();
  } finally {
    edgeProc.kill();
  }
}

main().catch(console.error);
