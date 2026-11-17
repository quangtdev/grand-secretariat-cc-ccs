// Bridges a browser xterm to an agent's PTY over WebSocket at /ws/term/<id>.
// Server -> client: raw terminal output as text frames.
// Client -> server: JSON {t:'i', d:<input>} or {t:'r', c:<cols>, r:<rows>}.
import { WebSocketServer } from 'ws';
import { hasAccessToken, isTrustedRequest } from './http-api-routes.js';

export function attachTerminalBridge(httpServer, store, token, { destroyUnknownUpgrades }) {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (req, socket, head) => {
    const match = /^\/ws\/term\/([\w-]+)$/.exec(req.url || '');
    if (!match) {
      // In dev Vite's HMR socket handles its own upgrades; in production nothing else does.
      if (destroyUnknownUpgrades) socket.destroy();
      return;
    }
    // Browsers always send Origin on WebSocket upgrades; require ours, plus the access token.
    if (!isTrustedRequest(req) || !req.headers.origin || !hasAccessToken(req, token)) {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => connect(ws, match[1]));
  });

  function connect(ws, id) {
    const terminal = store.attach(id, (data) => {
      if (data === null) ws.close(4000, 'Agent exited');
      else if (ws.readyState === ws.OPEN) ws.send(data);
    });
    if (!terminal) {
      ws.close(4004, 'Unknown agent');
      return;
    }
    if (terminal.replay) ws.send(terminal.replay);

    ws.on('message', (raw) => {
      let msg;
      try { msg = JSON.parse(raw.toString()); } catch { return; }
      if (msg.t === 'i' && typeof msg.d === 'string') {
        terminal.write(msg.d);
      } else if (msg.t === 'r' && Number.isInteger(msg.c) && Number.isInteger(msg.r)) {
        terminal.resize(Math.min(Math.max(msg.c, 20), 400), Math.min(Math.max(msg.r, 5), 200));
      }
    });
    ws.on('close', terminal.detach);
    ws.on('error', terminal.detach);
  }
}
