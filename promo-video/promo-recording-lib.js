// Shared helpers for recording the promo: browser launch, fake hook events, in-page audio tap,
// caption overlay, CDP screencast capture, ffmpeg.
const puppeteer = require('puppeteer-core');
const { createHmac } = require('crypto');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = __dirname;
const PORT = 4791;
const BASE = `http://127.0.0.1:${PORT}`;
const FFMPEG = require('ffmpeg-static');
const chromeRoot = path.join(os.homedir(), '.cache/puppeteer/chrome');
const CHROME = path.join(chromeRoot, fs.readdirSync(chromeRoot)[0], 'chrome-linux64', 'chrome');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const accessToken = () => fs.readFileSync(path.join(ROOT, 'state', 'access-token'), 'utf8').trim();
const repoPath = (name) => path.join(ROOT, 'repos', name);

async function launch() {
  return puppeteer.launch({
    executablePath: CHROME, headless: true,
    args: ['--no-sandbox', '--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=gl-egl',
      '--autoplay-policy=no-user-gesture-required', '--hide-scrollbars', '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
      '--force-device-scale-factor=2', '--window-size=540,1047'], // 87px of window chrome: the page itself is 540x960 CSS px, 1080x1920 real
    defaultViewport: null,
  });
}

/** Runs in the page before the app: taps every AudioContext's output and adds the caption overlay. */
function pageSetup() {
  const taps = new WeakMap();
  const connect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (dest, ...rest) {
    if (dest instanceof AudioDestinationNode) {
      let tap = taps.get(dest.context);
      if (!tap) { tap = dest.context.createMediaStreamDestination(); taps.set(dest.context, tap); window.__promoTap = tap; }
      connect.call(this, tap);
    }
    return connect.call(this, dest, ...rest);
  };
  let recorder; let chunks = []; let startedAt = 0;
  window.__promo = {
    hasAudio: () => Boolean(window.__promoTap),
    startAudio: () => new Promise((resolve) => {
      chunks = [];
      recorder = new MediaRecorder(window.__promoTap.stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 192000 });
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstart = () => { startedAt = Date.now() / 1000; resolve(startedAt); };
      recorder.start();
    }),
    stopAudio: () => new Promise((resolve) => {
      recorder.onstop = async () => {
        const buf = new Uint8Array(await new Blob(chunks).arrayBuffer());
        let bin = ''; for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
        resolve({ startedAt, base64: btoa(bin) });
      };
      recorder.stop();
    }),
    caption: (html, where = 'top') => {
      let el = document.getElementById('promo-caption');
      if (!el) {
        el = document.createElement('div'); el.id = 'promo-caption';
        document.body.appendChild(el);
        const style = document.createElement('style');
        style.textContent = `
          #promo-caption { position: fixed; left: 28px; right: 28px; z-index: 99999; pointer-events: none; text-align: center;
            font: 600 30px/1.22 "Be Vietnam Pro", system-ui, sans-serif; color: #fff8e7; letter-spacing: -0.01em;
            text-shadow: 0 2px 0 #3d0d08, 0 0 14px rgba(40,8,4,.85), 0 0 3px #3d0d08;
            opacity: 0; transform: translateY(10px) scale(.97); transition: opacity .28s ease, transform .28s cubic-bezier(.2,.8,.2,1); }
          #promo-caption.on { opacity: 1; transform: none; }
          #promo-caption b { color: #f4c542; font-weight: 600; }
          #promo-caption small { display: block; font-size: 21px; font-weight: 500; margin-top: 8px; opacity: .95; }
          #promo-caption[data-where="top"] { top: 96px; }
          #promo-caption[data-where="mid"] { top: 330px; }`;
        document.head.appendChild(style);
      }
      if (!html) { el.classList.remove('on'); return; }
      el.dataset.where = where; el.innerHTML = html;
      el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
    },
  };
}

async function openCourt(browser, world) {
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 200)));
  await page.evaluateOnNewDocument(pageSetup);
  await page.goto(`${BASE}/?world=${world}`, { waitUntil: 'networkidle2' });
  await sleep(1500);
  const size = await page.evaluate(() => `${innerWidth}x${innerHeight}@${devicePixelRatio}`);
  if (size !== '540x960@2') throw new Error(`unexpected page size ${size}`);
  return page;
}

/** One fake hook event from agent `id`, as the agent CLI's hook would POST it. */
async function hook(id, event) {
  const res = await fetch(`${BASE}/api/hook/${id}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-grand-secretariat-token': createHmac('sha256', accessToken()).update(String(id)).digest('hex') },
    body: JSON.stringify({ session_id: id, ...event }),
  });
  if (!res.ok) console.log('[hook failed]', res.status, event.hook_event_name);
}
const api = (method, url, body) => fetch(`${BASE}${url}`, {
  method, headers: { 'content-type': 'application/json', 'x-grand-secretariat-token': accessToken() }, body: body ? JSON.stringify(body) : undefined,
}).then((r) => r.json().catch(() => ({})));

const summon = async (name, ticket = name) => (await api('POST', '/api/sessions', { repo: repoPath(name), ticket })).id;
const dismissAll = async () => {
  let saved = [];
  try { saved = JSON.parse(fs.readFileSync(path.join(ROOT, 'state', 'sessions.json'), 'utf8')); } catch { /* none yet */ }
  for (const s of saved) await api('DELETE', `/api/sessions/${s.id}`);
  await sleep(800);
  const hist = await api('GET', '/api/history');
  for (const h of (Array.isArray(hist) ? hist : hist.entries || hist.history || [])) await api('DELETE', `/api/history/${h.id}`);
};

const start = (id) => hook(id, { hook_event_name: 'SessionStart', source: 'startup' });
const order = (id, prompt) => hook(id, { hook_event_name: 'UserPromptSubmit', prompt });
const tool = (id, tool_name, tool_input = {}, extra = {}) => hook(id, { hook_event_name: 'PreToolUse', tool_name, tool_input, ...extra });
const ask = (id, question) => tool(id, 'AskUserQuestion', { questions: [{ question, header: 'Decide', options: [{ label: 'Yes' }, { label: 'No' }] }] });
const stop = (id) => hook(id, { hook_event_name: 'Stop' });

/** Screencast frames (jpeg + wall-clock time) and the page's audio, until stop() is called. */
async function startCapture(page, dir) {
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const cdp = await page.createCDPSession();
  const frames = [];
  cdp.on('Page.screencastFrame', (f) => {
    const file = path.join(dir, `f${String(frames.length).padStart(6, '0')}.jpg`);
    frames.push({ file, t: f.metadata.timestamp });
    fs.writeFileSync(file, Buffer.from(f.data, 'base64'));
    cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
  });
  const audio = await page.evaluate(() => window.__promo.hasAudio());
  if (audio) await page.evaluate(() => window.__promo.startAudio());
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 93, maxWidth: 1080, maxHeight: 1920, everyNthFrame: 1 });
  return {
    frames,
    /** @param {number} audioTailMs  keep recording sound this long after the picture ends */
    async stop(audioTailMs = 0) {
      await cdp.send('Page.stopScreencast');
      const endT = Date.now() / 1000;
      let audioFile = null; let audioOffset = 0;
      if (audio) {
        if (audioTailMs) await sleep(audioTailMs);
        const rec = await page.evaluate(() => window.__promo.stopAudio());
        audioFile = 'audio.webm';
        fs.writeFileSync(path.join(dir, audioFile), Buffer.from(rec.base64, 'base64'));
        audioOffset = frames[0].t - rec.startedAt; // seconds of sound before the first frame
      }
      const meta = { frames: frames.map((f) => ({ file: path.basename(f.file), t: f.t })), endT, audioFile, audioOffset };
      fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta));
      const span = frames.at(-1).t - frames[0].t;
      console.log(`[capture] ${path.basename(dir)}: ${frames.length} frames in ${span.toFixed(1)}s (${(frames.length / span).toFixed(1)} fps), audio=${Boolean(audio)}`);
      return meta;
    },
  };
}

const ffmpeg = (args) => execFileSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: ['ignore', 'inherit', 'inherit'] });

module.exports = { ROOT, BASE, FFMPEG, sleep, launch, openCourt, hook, api, summon, dismissAll, start, order, tool, ask, stop, startCapture, ffmpeg, repoPath };
