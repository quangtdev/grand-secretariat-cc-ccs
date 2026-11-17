// JSON API: list/summon/dismiss/recall agents, repositories, hook intake, and the SSE feed.
import { timingSafeEqual } from 'node:crypto';
import { ALLOWED_HOSTS, ALLOWED_ORIGINS, PROFILES, TOKEN_COOKIE, TOKEN_HEADER } from './config.js';
import { hookTokenFor } from './claude-hooks-settings.js';
import { isAllowedTailnetCaller } from './tailnet-serve-access-guard.js';
import { handleHookEvent } from './hook-event-intake.js';
import { annalsResponse } from './court-annals-reader.js';
import { listRepositories } from './repository-scanner.js';
import { listFolder, resolveFolder } from './folder-browser.js';
import path from 'node:path';
import { maintenanceInfo, startMaintenance } from './app-maintenance.js';

const MAX_BODY = 1_000_000;

function send(res, code, body) {
  res.writeHead(code, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) { reject(new Error('Body too large')); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString() || '{}')); } catch (err) { reject(err); }
    });
    req.on('error', reject);
  });
}

/**
 * Blocks other websites from driving this server through the user's browser:
 * the Host must be ours (DNS rebinding) and any Origin must be ours (CSRF).
 * A request that came through `tailscale serve` must also be from the allowed Tailscale login.
 */
export function isTrustedRequest(req) {
  if (!ALLOWED_HOSTS.has(req.headers.host)) return false;
  if (!isAllowedTailnetCaller(req)) return false;
  const origin = req.headers.origin;
  if (origin && !ALLOWED_ORIGINS.has(origin)) return false;
  // A GET from another site carries no Origin. Browsers label it (on localhost and HTTPS):
  // refuse it unless it is the user following a link to the page.
  const site = req.headers['sec-fetch-site'];
  return !site || site === 'same-origin' || site === 'none' || req.headers['sec-fetch-mode'] === 'navigate';
}

function sameToken(given, token) {
  const a = Buffer.from(String(given || ''));
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Host/Origin only stop browsers. The token stops other local users and processes:
 * the UI gets it as an HttpOnly cookie, agents send it as a header from their hooks.
 */
export function hasAccessToken(req, token) {
  const cookie = new RegExp(`(?:^|;\\s*)${TOKEN_COOKIE}=([^;]+)`).exec(req.headers.cookie || '');
  return sameToken(cookie?.[1], token) || sameToken(req.headers[TOKEN_HEADER], token);
}

/** A scribe's name: trimmed, short, and with leading dashes stripped so it can never be read as a CLI option. */
const cleanTicket = (raw) => String(raw || '').trim().replace(/^-+\s*/, '').slice(0, 60);

async function summon(store, body) {
  const repos = await listRepositories();
  // A listed repository, or any existing folder chosen with the form's folder browser.
  let repo = repos.find((r) => r.path === body.repo);
  if (!repo) {
    const folder = await resolveFolder(body.repo);
    if (!folder) return { error: 'Pick a working folder that exists.' };
    repo = { path: folder, name: path.basename(folder) || folder };
  }
  // No profiles configured (plain `claude`): none is passed to the launcher.
  const profile = PROFILES.length ? body.profile : '';
  if (PROFILES.length && !PROFILES.includes(profile)) return { error: 'Unknown profile.' };
  const ticket = cleanTicket(body.ticket) || repo.name;
  const prompt = String(body.prompt || '').trim().slice(0, 8000);
  const mode = ['continue', 'resume'].includes(body.mode) ? body.mode : 'new';
  return { id: store.create({ repo: repo.path, profile, ticket, prompt, mode }) };
}

/** Returns a request handler; it answers true when it handled the request. */
/** `observers` = { ink, annals }: passed through to the hook intake. */
export function createApiHandler(store, token, observers = {}) {
  const feeds = new Set(); // open SSE responses
  const broadcast = () => {
    const frame = `data: ${JSON.stringify(store.list())}\n\n`;
    for (const res of feeds) res.write(frame);
  };
  store.on('change', broadcast);

  return async function handle(req, res) {
    let url;
    try {
      url = new URL(req.url, 'http://localhost');
    } catch { // e.g. a request for "//": answer it instead of crashing
      send(res, 400, { error: 'Bad request' });
      return true;
    }
    if (!url.pathname.startsWith('/api/')) return false;
    // An agent's hook token is good only for its own hook endpoint; everything else needs the access token.
    const hookId = /^\/api\/hook\/([\w-]+)$/.exec(url.pathname)?.[1];
    const authorised = hasAccessToken(req, token)
      || (hookId && req.method === 'POST' && sameToken(req.headers[TOKEN_HEADER], hookTokenFor(token, hookId)));
    if (!isTrustedRequest(req) || !authorised) { send(res, 403, { error: 'Forbidden' }); return true; }
    const route = `${req.method} ${url.pathname}`;

    try {
      if (route === 'GET /api/events') {
        res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' });
        res.write(`data: ${JSON.stringify(store.list())}\n\n`);
        feeds.add(res);
        req.on('close', () => feeds.delete(res));
      } else if (route === 'GET /api/app') {
        send(res, 200, await maintenanceInfo());
      } else if (req.method === 'POST' && /^\/api\/app\/(restart|update|pull)$/.test(url.pathname)) {
        // JSON-only like the other writes: a plain HTML form from another site cannot send it.
        if (!/^application\/json/.test(req.headers['content-type'] || '')) return send(res, 415, { error: 'JSON only' }), true;
        const result = await startMaintenance(url.pathname.split('/')[3]);
        send(res, result.ok ? 202 : result.code, result);
      } else if (route === 'GET /api/annals') {
        const answer = await annalsResponse(url.searchParams.get('day'));
        send(res, answer.code, answer.body);
      } else if (route === 'GET /api/options') {
        send(res, 200, { repos: await listRepositories(), profiles: PROFILES });
      } else if (route === 'GET /api/folders') {
        const folder = await listFolder(url.searchParams.get('path'));
        send(res, folder ? 200 : 404, folder || { error: 'That folder does not exist or cannot be read.' });
      } else if (route === 'POST /api/sessions') {
        if (!/^application\/json/.test(req.headers['content-type'] || '')) return send(res, 415, { error: 'JSON only' }), true;
        const result = await summon(store, await readJson(req));
        send(res, result.error ? 400 : 201, result);
      } else if (req.method === 'PATCH' && url.pathname.startsWith('/api/sessions/')) {
        // Rename a scribe (its chip, roster row and the --name it resumes with).
        if (!/^application\/json/.test(req.headers['content-type'] || '')) return send(res, 415, { error: 'JSON only' }), true;
        const ticket = cleanTicket((await readJson(req))?.ticket);
        if (!ticket) return send(res, 400, { error: 'Give the scribe a name.' }), true;
        const ok = store.rename(url.pathname.split('/')[3], ticket);
        send(res, ok ? 200 : 404, { ok });
      } else if (req.method === 'DELETE' && url.pathname.startsWith('/api/sessions/')) {
        const ok = store.remove(url.pathname.split('/')[3]);
        send(res, ok ? 200 : 404, { ok });
      } else if (route === 'GET /api/history') {
        send(res, 200, store.history.list());
      } else if (req.method === 'POST' && /^\/api\/history\/[\w-]+\/recall$/.test(url.pathname)) {
        // Recall a dismissed scribe: it resumes its conversation under the same name.
        if (!/^application\/json/.test(req.headers['content-type'] || '')) return send(res, 415, { error: 'JSON only' }), true;
        const result = store.recall(url.pathname.split('/')[3]);
        send(res, result.error ? result.code : 201, result.error ? { error: result.error } : result);
      } else if (req.method === 'DELETE' && url.pathname.startsWith('/api/history/')) {
        const ok = store.history.remove(url.pathname.split('/')[3]);
        send(res, ok ? 200 : 404, { ok });
      } else if (req.method === 'POST' && url.pathname.startsWith('/api/hook/')) {
        handleHookEvent(store, url.pathname.split('/')[3], (await readJson(req)) || {}, observers);
        send(res, 200, { ok: true });
      } else {
        send(res, 404, { error: 'Not found' });
      }
    } catch (err) {
      console.error(`[api] ${route} failed:`, err.message);
      if (!res.headersSent) send(res, 400, { error: 'Bad request' });
    }
    return true;
  };
}
