// Update / restart the installed app from the UI (only when running as the systemd user service).
// The update runs as its own transient unit (`systemd-run`) so it survives the service restart
// it triggers; the restart is queued with --no-block so systemctl is not killed waiting for it.
import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Unit name set by scripts/install-app.sh; overridable so tests can target a throwaway unit.
const SERVICE = process.env.GRAND_SECRETARIAT_SERVICE || 'grand-secretariat';
const UPDATE_UNIT = `${SERVICE}-update`;
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const UPDATE_SCRIPT = path.join(REPO, 'scripts', 'update-app.sh');

// systemd sets INVOCATION_ID for every unit it starts; absent under `npm run dev`.
const MANAGED = Boolean(process.env.INVOCATION_ID);
// Changes on every server start: the UI reloads when it sees a new one after an update/restart.
const BOOT_ID = randomUUID();

/** Runs a fixed command (no shell, no client input in argv); resolves {ok, out}. */
function run(cmd, args) {
  return new Promise((resolve) => {
    execFile(cmd, args, { timeout: 15_000 }, (err, stdout, stderr) =>
      resolve({ ok: !err, out: `${stdout}${stderr}`.trim() }));
  });
}

/** State of the last update run: running | failed | idle, and its log tail. */
async function updateStatus() {
  const { out } = await run('systemctl', ['--user', 'show', UPDATE_UNIT, '-p', 'ActiveState', '--value']);
  const state = ['active', 'activating'].includes(out) ? 'running' : out === 'failed' ? 'failed' : 'idle';
  if (state === 'idle') return { state, log: '' };
  // Only the last run's output: the unit name is reused, its invocation id is not.
  const { out: invocation } = await run('systemctl', ['--user', 'show', UPDATE_UNIT, '-p', 'InvocationID', '--value']);
  const { out: log } = await run('journalctl', ['--user', `_SYSTEMD_INVOCATION_ID=${invocation}`, '-n', '25', '-o', 'cat', '--no-pager']);
  return { state, log };
}

export async function maintenanceInfo() {
  if (!MANAGED) return { managed: false, bootId: BOOT_ID };
  return { managed: true, bootId: BOOT_ID, update: await updateStatus() };
}

/**
 * @param {'restart' | 'update' | 'pull'} action  pull = git pull, then update
 * @returns {Promise<{ok: boolean, error?: string, code?: number}>}
 */
export async function startMaintenance(action) {
  if (!MANAGED) return { ok: false, code: 409, error: 'Not running as the installed app (npm run install-app).' };
  if (action === 'restart') {
    const r = await run('systemctl', ['--user', '--no-block', 'restart', SERVICE]);
    return r.ok ? { ok: true } : { ok: false, code: 500, error: r.out || 'systemctl failed' };
  }
  if ((await updateStatus()).state === 'running') return { ok: false, code: 409, error: 'An update is already running.' };
  await run('systemctl', ['--user', 'reset-failed', UPDATE_UNIT]); // a failed run keeps the unit name taken
  const args = ['--user', `--unit=${UPDATE_UNIT}`, `--working-directory=${REPO}`,
    // The user manager's PATH has no nvm node/npm; hand over the service's (set by install-app.sh).
    `--setenv=PATH=${process.env.PATH}`, `--setenv=GRAND_SECRETARIAT_SERVICE=${SERVICE}`, 'bash', UPDATE_SCRIPT];
  if (action === 'pull') args.push('--pull');
  const r = await run('systemd-run', args);
  return r.ok ? { ok: true } : { ok: false, code: 500, error: r.out || 'systemd-run failed' };
}
