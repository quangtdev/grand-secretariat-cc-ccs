// Entry point: one local HTTP server for the API, the terminal sockets and the web UI.
// Dev (`npm run dev`) mounts Vite as middleware; production serves the built `dist/`.
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import { CONTEXT_LIMIT, HOST, PORT, STATE_DIR, TAILNET_HOST, TAILNET_IS_HTTPS, TAILNET_LOGIN, TAILNET_ORIGIN, TOKEN_COOKIE } from './config.js';
import { AgentSessionStore } from './agent-session-store.js';
import { writeHooksSettingsFile } from './claude-hooks-settings.js';
import { createApiHandler, isTrustedRequest } from './http-api-routes.js';
import { CourtAnnalsLog } from './court-annals-log.js';
import { TranscriptUsageReader } from './transcript-usage-reader.js';
import { attachTerminalBridge } from './terminal-websocket-bridge.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isProduction = process.env.NODE_ENV === 'production';

/** Access token kept across restarts so an open browser tab keeps working. */
function loadAccessToken() {
  const file = path.join(STATE_DIR, 'access-token');
  fs.mkdirSync(STATE_DIR, { recursive: true, mode: 0o700 });
  try {
    const saved = fs.readFileSync(file, 'utf8').trim();
    if (saved.length >= 32) return saved;
  } catch { /* first run */ }
  const token = randomBytes(32).toString('hex');
  fs.writeFileSync(file, token, { mode: 0o600 });
  return token;
}

const token = loadAccessToken();
const store = new AgentSessionStore(writeHooksSettingsFile(), token);
const annals = new CourtAnnalsLog();
const ink = new TranscriptUsageReader(store, {
  contextLimit: CONTEXT_LIMIT,
  onTokens: (id, delta) => { const scribe = store.sessions.get(id); if (scribe) annals.append('tokens', scribe, delta); },
});
// A scribe that left the court: its annals line, and its transcript state goes.
store.on('left', (scribe) => { annals.append('left', scribe); ink.forget(scribe.id); });
annals.startPruning();
const handleApi = createApiHandler(store, token, { ink, annals });
const server = http.createServer();

let serveUi;
if (isProduction) {
  const { default: sirv } = await import('sirv');
  serveUi = sirv(path.join(root, 'dist'), { single: true });
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({ root, server: { middlewareMode: true, hmr: { server } }, appType: 'spa' });
  serveUi = vite.middlewares;
}

server.on('request', async (req, res) => {
  try {
    if (await handleApi(req, res)) return;
    // The UI hands out the access token, so it is served only to our own Hosts
    // (and, through `tailscale serve`, only to the allowed Tailscale login).
    if (!isTrustedRequest(req)) { res.statusCode = 403; res.end('Forbidden'); return; }
    // Every UI response hands the browser the access token; scripts cannot read it.
    // Over the tailnet's HTTPS the cookie is Secure, so it never travels in clear text if the name is spoofed.
    const secure = TAILNET_IS_HTTPS && req.headers.host === TAILNET_HOST ? '; Secure' : '';
    res.setHeader('Set-Cookie', `${TOKEN_COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/${secure}`);
    serveUi(req, res, () => { res.statusCode = 404; res.end('Not found'); });
  } catch (err) { // no request may take the server (and every agent) down
    console.error('[server] request failed:', err.message);
    if (!res.headersSent) res.statusCode = 500;
    res.end();
  }
});
attachTerminalBridge(server, store, token, { destroyUnknownUpgrades: isProduction });

server.listen(PORT, HOST, () => {
  store.restore();
  console.log(`Grand Secretariat court is open at http://${HOST}:${PORT}`);
  if (TAILNET_HOST) console.log(`Also answering ${TAILNET_ORIGIN} for ${TAILNET_LOGIN} (needs \`tailscale serve\`, see scripts/tailscale-serve.sh)`);
});

// Agents die with the server; they stay in the state file and resume on the next start.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    store.shutdown();
    server.close();
    // Let the last annals lines reach the disk, but never hang the shutdown on them.
    await Promise.race([annals.flush(), new Promise((resolve) => setTimeout(resolve, 1000))]);
    process.exit(0);
  });
}
