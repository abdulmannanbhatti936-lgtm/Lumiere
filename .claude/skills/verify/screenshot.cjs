// Headless-Chrome screenshot helper for verifying UI changes in this repo.
// No npm deps (Playwright/Puppeteer are NOT installed) — drives system Chrome
// directly over the DevTools Protocol using Node's built-in fetch + WebSocket.
//
// Usage:
//   node .claude/skills/verify/screenshot.js <url> <outPngPath> [waitMs] [clipY] [clipHeight] [hoverX] [hoverPageY]
//
// Examples:
//   node .claude/skills/verify/screenshot.js http://localhost:5173/ shot.png
//   node .claude/skills/verify/screenshot.js http://localhost:5173/ shot.png 2500 1250 700       # crop a region
//   node .claude/skills/verify/screenshot.js http://localhost:5173/ shot.png 2500 1250 700 220 1550  # + hover to trigger :hover state
//
// Omit clipY/clipHeight to capture the full scrollable page.
//
// For anything beyond a single hover — clicking a tab/button that's local
// React state (not a URL), typing into a form, logging in and then loading
// an authenticated page — pass a JSON array of steps via the ACTIONS env
// var. Step types:
//   {type:'click', x, y, waitAfter?}          click at PAGE coordinates
//   {type:'type', x, y, text, waitAfter?}     click to focus, then type
//   {type:'navigate', url, waitAfter?}        full navigation, same tab
//                                              (cookies/localStorage persist)
// Steps run in order, after the initial scroll-through, before the final
// hover/capture. Examples:
//   ACTIONS='[{"type":"click","x":300,"y":640,"waitAfter":500}]' \
//     node .claude/skills/verify/screenshot.cjs http://localhost:5173/hotel/1 shot.png 2500 500 900
//
//   ACTIONS='[{"type":"type","x":719,"y":534,"text":"user@lumierestays.com"},
//             {"type":"type","x":719,"y":613,"text":"User123!"},
//             {"type":"click","x":719,"y":669,"waitAfter":1200},
//             {"type":"navigate","url":"http://localhost:5173/booking/1/1","waitAfter":1500}]' \
//     node .claude/skills/verify/screenshot.cjs http://localhost:5173/login shot.png 1500
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
];
const CHROME = CHROME_CANDIDATES.find((p) => fs.existsSync(p));
if (!CHROME) throw new Error('No Chrome/Edge executable found in the usual install paths.');

const PORT = 9222;
const PROFILE = path.join(process.env.TEMP, 'chrome-profile-cdp');
const URL = process.argv[2] || 'http://localhost:5173/';
const OUT = process.argv[3] || path.join(process.env.TEMP, 'lumiere-verify', 'shot.png');
const WAIT_MS = Number(process.argv[4] || 3000);
const WIDTH = 1440;
const HEIGHT = 1000; // viewport height used while the page is loaded/scrolled — see NOTE below

fs.rmSync(PROFILE, { recursive: true, force: true });
fs.mkdirSync(PROFILE, { recursive: true });
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const child = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--hide-scrollbars',
  `--user-data-dir=${PROFILE}`,
  `--window-size=${WIDTH},${HEIGHT}`,
  `--remote-debugging-port=${PORT}`,
  'about:blank',
], { stdio: 'ignore' });

let killed = false;
function cleanup(code) {
  if (!killed) { killed = true; try { child.kill(); } catch {} }
  process.exit(code);
}
process.on('SIGINT', () => cleanup(1));
const hardTimeout = setTimeout(() => { console.error('HARD TIMEOUT — killing chrome'); cleanup(1); }, 25000);

async function waitForEndpoint() {
  for (let i = 0; i < 40; i++) {
    try { const res = await fetch(`http://localhost:${PORT}/json/version`); if (res.ok) return; } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('CDP endpoint never came up');
}

let msgId = 1;
function send(ws, method, params = {}) {
  const id = msgId++;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => {
    const handler = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id === id) {
        ws.removeEventListener('message', handler);
        if (msg.error) reject(new Error(JSON.stringify(msg.error))); else resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
  });
}

async function main() {
  await waitForEndpoint();

  const createRes = await fetch(`http://localhost:${PORT}/json/new?about:blank`, { method: 'PUT' });
  const target = await createRes.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });

  await send(ws, 'Page.enable');
  // NOTE: keep this viewport height realistic (~1000px). Do NOT set it to the
  // full page height to "capture everything at once" — this app's hero section
  // uses `min-h-screen` (100vh), so an inflated viewport just inflates the hero
  // and pushes every other section outside the capture. Full-page capture is
  // handled below via captureBeyondViewport + the real scrollHeight instead.
  await send(ws, 'Emulation.setDeviceMetricsOverride', { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false });

  const loadFired = new Promise((resolve) => {
    const handler = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.method === 'Page.loadEventFired') { ws.removeEventListener('message', handler); resolve(); }
    };
    ws.addEventListener('message', handler);
  });
  await send(ws, 'Page.navigate', { url: URL });
  await loadFired;

  // Real wall-clock wait for React Query fetches + framer-motion to settle.
  // Do NOT use Chrome's --virtual-time-budget for this app: Vite's dev-server
  // HMR keeps a persistent WebSocket open, and virtual-time mode hangs waiting
  // on it. A plain setTimeout is slower but actually returns.
  await new Promise((r) => setTimeout(r, WAIT_MS));

  const { result: scrollHeightResult } = await send(ws, 'Runtime.evaluate', { expression: 'document.documentElement.scrollHeight' });
  const fullHeight = Math.ceil(scrollHeightResult.value);

  // Scroll the full length first so whileInView/IntersectionObserver-driven
  // reveal animations actually fire before capture (they gate on real scroll).
  for (let y = 0; y < fullHeight; y += HEIGHT) {
    await send(ws, 'Runtime.evaluate', { expression: `window.scrollTo(0, ${y})` });
    await new Promise((r) => setTimeout(r, 400));
  }

  // Input.dispatchMouseEvent coordinates are viewport-relative, so scroll the
  // target into view first and translate the page Y into a viewport-relative one.
  async function moveTo(pageX, pageY) {
    const scrollTarget = Math.max(0, pageY - HEIGHT / 2);
    await send(ws, 'Runtime.evaluate', { expression: `window.scrollTo(0, ${scrollTarget})` });
    await new Promise((r) => setTimeout(r, 400));
    const viewportY = pageY - scrollTarget;
    await send(ws, 'Input.dispatchMouseEvent', { type: 'mouseMoved', x: 10, y: 10 }); // neutral point first so mouseenter actually fires
    await new Promise((r) => setTimeout(r, 100));
    await send(ws, 'Input.dispatchMouseEvent', { type: 'mouseMoved', x: pageX, y: viewportY });
    return viewportY;
  }

  if (process.env.ACTIONS) {
    const actions = JSON.parse(process.env.ACTIONS);
    for (const step of actions) {
      if (step.type === 'navigate') {
        const nextLoad = new Promise((resolve) => {
          const handler = (ev) => {
            const msg = JSON.parse(ev.data);
            if (msg.method === 'Page.loadEventFired') { ws.removeEventListener('message', handler); resolve(); }
          };
          ws.addEventListener('message', handler);
        });
        await send(ws, 'Page.navigate', { url: step.url });
        await nextLoad;
        await new Promise((r) => setTimeout(r, step.waitAfter ?? 1500));
        continue;
      }
      const viewportY = await moveTo(step.x, step.y);
      if (step.type === 'click' || step.type === 'type') {
        await send(ws, 'Input.dispatchMouseEvent', { type: 'mousePressed', x: step.x, y: viewportY, button: 'left', clickCount: 1 });
        await send(ws, 'Input.dispatchMouseEvent', { type: 'mouseReleased', x: step.x, y: viewportY, button: 'left', clickCount: 1 });
      }
      if (step.type === 'type') {
        // clicking focuses the field; insertText types into whatever's focused
        await send(ws, 'Input.insertText', { text: step.text });
      }
      await new Promise((r) => setTimeout(r, step.waitAfter ?? 500));
    }
  }

  const hoverX = process.argv[7] ? Number(process.argv[7]) : null;
  const hoverPageY = process.argv[8] ? Number(process.argv[8]) : null;
  if (hoverX !== null && hoverPageY !== null) {
    await moveTo(hoverX, hoverPageY);
    await new Promise((r) => setTimeout(r, 900));
  } else if (!process.env.ACTIONS) {
    await send(ws, 'Runtime.evaluate', { expression: 'window.scrollTo(0, 0)' });
    await new Promise((r) => setTimeout(r, 500));
  }

  const clipY = process.argv[5] ? Number(process.argv[5]) : 0;
  const clipH = process.argv[6] ? Number(process.argv[6]) : fullHeight;
  // captureBeyondViewport + an explicit clip uses page (not viewport) coords,
  // so this works regardless of current scroll position.
  const { data } = await send(ws, 'Page.captureScreenshot', {
    format: 'png', captureBeyondViewport: true,
    clip: { x: 0, y: clipY, width: WIDTH, height: clipH, scale: 1 },
  });

  fs.writeFileSync(OUT, Buffer.from(data, 'base64'));
  console.error(`Wrote ${OUT}`);
  ws.close();
  clearTimeout(hardTimeout);
  cleanup(0);
}

main().catch((err) => { console.error('ERROR', err); clearTimeout(hardTimeout); cleanup(1); });
