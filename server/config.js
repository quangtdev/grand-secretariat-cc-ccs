// Central runtime configuration. Every value can be overridden with an env var.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { isOnPath, readCcsProfiles } from './agent-launcher-detection.js';

const home = os.homedir();

export const HOST = '127.0.0.1'; // never bind wider: this app spawns shells with permissions skipped
export const PORT = Number(process.env.GRAND_SECRETARIAT_PORT || 4777);

// Folder scanned for repositories offered in the summon form: ~/workspaces when it exists, else the home folder.
const defaultRoot = fs.existsSync(path.join(home, 'workspaces')) ? path.join(home, 'workspaces') : home;
export const WORKSPACE_ROOT = path.resolve(process.env.GRAND_SECRETARIAT_ROOT || defaultRoot);

// Plain folders (not git repositories) also offered as working folders in the summon form,
// relative to WORKSPACE_ROOT (absolute paths allowed). Missing ones are left out.
export const WORKING_FOLDERS = (process.env.GRAND_SECRETARIAT_FOLDERS ?? '')
  .split(',').map((s) => s.trim()).filter(Boolean)
  .map((f) => path.resolve(WORKSPACE_ROOT, f));

// Binary that starts an agent: `ccs` (account switcher) when installed, otherwise plain `claude`.
// GRAND_SECRETARIAT_CCS_BIN is the older name of the same setting.
export const LAUNCHER_BIN = process.env.GRAND_SECRETARIAT_LAUNCHER || process.env.GRAND_SECRETARIAT_CCS_BIN
  || (isOnPath('ccs') ? 'ccs' : 'claude');

// Account profiles offered in the summon form (first one is the default); the chosen one is passed
// to the launcher as its first argument. Empty for plain `claude`: no profile is asked for or passed.
// Unset, they are read from ccs's own config when the launcher is ccs.
const configuredProfiles = process.env.GRAND_SECRETARIAT_PROFILES;
export const PROFILES = configuredProfiles !== undefined
  ? configuredProfiles.split(',').map((s) => s.trim()).filter(Boolean)
  : (path.basename(LAUNCHER_BIN) === 'ccs' ? readCcsProfiles() : []);

// Extra flags given to every agent.
export const AGENT_FLAGS = (process.env.GRAND_SECRETARIAT_FLAGS ?? '--dangerously-skip-permissions')
  .split(' ').filter(Boolean);

// Where session metadata and the generated hooks file live between restarts.
export const STATE_DIR = process.env.GRAND_SECRETARIAT_STATE_DIR || path.join(home, '.local', 'state', 'grand-secretariat');

// Raw terminal output kept per agent so a newly opened panel can replay the screen.
export const SCROLLBACK_BYTES = 400_000;

export const TOKEN_COOKIE = 'grand_secretariat_token';
export const TOKEN_HEADER = 'x-grand-secretariat-token';

// Optional extra local name for the UI (e.g. `grand-secretariat.localhost`, set by
// scripts/install-app.sh; .localhost names resolve to 127.0.0.1 on their own). Only names listed here pass the Host/Origin checks.
export const LOCAL_HOSTNAME = (process.env.GRAND_SECRETARIAT_HOSTNAME || '').trim().toLowerCase();

// Optional access from the user's other devices through `tailscale serve` (scripts/tailscale-serve.sh).
// The server still binds 127.0.0.1: tailscaled proxies to it and names the caller in a header.
// Both must be set: the origin serve answers for (`https://<machine>.<tailnet>.ts.net:<port>`, or
// `http://` when the tailnet has no HTTPS certificates) and the one Tailscale login allowed in.
// See server/tailnet-serve-access-guard.js.
export const TAILNET_LOGIN = (process.env.GRAND_SECRETARIAT_TAILNET_LOGIN || '').trim().toLowerCase();
function parseTailnetOrigin(raw) {
  if (!raw || !TAILNET_LOGIN) return null;
  try {
    const url = new URL(raw.trim().toLowerCase());
    return ['http:', 'https:'].includes(url.protocol) ? url : null;
  } catch { return null; } // unreadable: tailnet access stays off
}
const tailnetUrl = parseTailnetOrigin(process.env.GRAND_SECRETARIAT_TAILNET_ORIGIN);
export const TAILNET_ORIGIN = tailnetUrl ? tailnetUrl.origin : '';
export const TAILNET_HOST = tailnetUrl ? tailnetUrl.host : ''; // the Host header of a served request
export const TAILNET_IS_HTTPS = tailnetUrl?.protocol === 'https:';

const hostNames = ['127.0.0.1', 'localhost', ...(LOCAL_HOSTNAME ? [LOCAL_HOSTNAME] : [])];
export const ALLOWED_HOSTS = new Set([...hostNames.map((name) => `${name}:${PORT}`), ...(TAILNET_HOST ? [TAILNET_HOST] : [])]);
export const ALLOWED_ORIGINS = new Set([...hostNames.map((name) => `http://${name}:${PORT}`), ...(TAILNET_ORIGIN ? [TAILNET_ORIGIN] : [])]);

// Context window size used for the ink level. 0 = automatic (200k, latched to 1M once more than 200k was seen).
export const CONTEXT_LIMIT = Math.max(0, Math.floor(Number(process.env.GRAND_SECRETARIAT_CONTEXT_LIMIT) || 0));

// Days of the court annals (one file per local day) kept on disk.
export const ANNALS_DAYS = Math.max(1, Math.floor(Number(process.env.GRAND_SECRETARIAT_ANNALS_DAYS) || 30));
