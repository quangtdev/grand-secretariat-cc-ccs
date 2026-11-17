# Deployment Guide

Last updated: 2026-11-14. Grand Secretariat is a localhost-only tool. It is not hosted, and it must not be exposed on a network; the one exception is [your own devices over Tailscale](#access-from-your-other-devices-tailscale). "Deployment" here means running it on your own machine, in dev or production mode.

## Contents
- [Prerequisites](#prerequisites)
- [Install](#install)
- [Run in development](#run-in-development)
- [Run in production](#run-in-production)
- [Environment variables](#environment-variables)
- [State folder](#state-folder)
- [Stop, restart, reset](#stop-restart-reset)
- [Smoke test after a change](#smoke-test-after-a-change)
- [Troubleshooting](#troubleshooting)

## Prerequisites

| Requirement | Why | Check |
|---|---|---|
| Node.js 22 or newer | ESM, `node:` built-ins (README) | `node -v` |
| npm | Installs dependencies | `npm -v` |
| Claude Code (`claude`) on `PATH` | Starts each agent. The `ccs` account switcher is used instead when installed (`GRAND_SECRETARIAT_LAUNCHER` can name another binary) | `command -v claude` |
| `curl` | Agent hooks report status with it | `command -v curl` |
| Git repositories under the workspace root (optional) | The summon form lists folders containing `.git`; any other folder can be chosen with **Browse** | `ls ~/workspaces` |
| C/C++ build tools (only if needed) | `node-pty` is a native module. If `npm install` cannot fetch or build it, install a compiler toolchain and retry. This is a general `node-gyp` requirement; it was not tested here | `npm install` output |

The working environment has Node v24.19.0 installed. That was not used to run the app for this guide.

## Install

```bash
cd /path/to/grand-secretariat
npm install
```

## Run in development

```bash
npm run dev
# Grand Secretariat court is open at http://127.0.0.1:4777
```

- `npm run dev` runs `node server/index.js`. It does not run the Vite CLI.
- Vite runs in middleware mode inside the same server. The UI has hot reload.
- There is no `vite.config` file, so Vite uses its defaults with the project root.
- **Check `NODE_ENV` first.** If the shell has `NODE_ENV=production`, `npm run dev` serves the built `dist/` instead of the source. The page then stays stale after every edit until `npm run build`, and `npm ci` skips devDependencies (Vite is one), so the build fails. For development, run `NODE_ENV=development npm run dev`, or unset the variable.
- Open `http://127.0.0.1:4777` or `http://localhost:4777`. Other hosts are rejected (see [security](./system-architecture.md#security-model)).

## Run in production

```bash
npm run build      # vite build: writes the UI to dist/
npm start          # NODE_ENV=production node server/index.js; serves dist/ with sirv
```

- Run `npm run build` again after any change to `index.html`, `src/` or CSS. `npm start` serves whatever is in `dist/`.
- The server does not check that `dist/` exists before starting. What happens when it is missing was not tested.
- In production, WebSocket upgrade requests to unknown paths are destroyed. In dev they are left to Vite's HMR socket.
- To run in the background, install it as a desktop app (next section).

### Install as a desktop app (Ubuntu, systemd user service)

```bash
npm run install-app   # npm ci, build, systemd user service (starts at login), app-menu launcher
npm run update        # after a change: npm ci if package-lock changed, build, restart service
bash scripts/install-app.sh --uninstall
```

- The app listens on port `4780` (dev stays on `4777`) and is reachable at `http://grand-secretariat.localhost:4780`. Names ending in `.localhost` resolve to this machine on their own, so `/etc/hosts` is not edited and no sudo is needed (`--uninstall` still removes the line older versions added). Port and name are written to `~/.config/grand-secretariat/env` only if not already set there, so edit that file to change them, then re-run `install-app`.
- Dev and the installed app share the state folder by default; to run both at once, start dev with its own `GRAND_SECRETARIAT_STATE_DIR`.
- Run `install-app` from a login shell where `node`, `claude` (or `ccs`) and `curl` are on `PATH`: the unit pins that `PATH` and the absolute `node` path, since systemd does not read `.zshrc`/nvm. Re-run it after switching Node versions (also `npm rebuild node-pty`).
- Files: `~/.config/systemd/user/grand-secretariat.service`, `~/.local/share/applications/grand-secretariat.desktop`, icon under `~/.local/share/icons/`. Env overrides go in `~/.config/grand-secretariat/env`.
- The launcher (`scripts/open-app.sh`) starts the service if needed and opens the court as an app window in Edge/Chrome/Chromium/Brave, else the default browser. The window runs in its own browser profile (`~/.local/share/grand-secretariat/browser-profile`) with window class `grand-secretariat`, so the dock shows it as a separate app and never groups normal browser windows under its icon.
- `KillMode=mixed`: on stop/restart the server gets `SIGTERM` first and saves agent state, then agents are killed. Restarting cuts any turn in progress; agents reopen with `--resume`.
- Logs: `journalctl --user -u grand-secretariat -f`.

#### Update and restart from the UI

When the server runs as the service, the foot of the rail shows **Pull & update**, **Update** and **Restart** (hidden under `npm run dev`; detection: systemd's `INVOCATION_ID`).

- Each asks for an inline confirmation that counts working scribes: a restart stops every agent; they reopen with `--resume`, a turn in progress is cut. This includes the session you may be talking to.
- **Restart** queues `systemctl --user --no-block restart grand-secretariat`.
- **Update** / **Pull & update** run `scripts/update-app.sh [--pull]` as transient unit `grand-secretariat-update` (`systemd-run`), outside the service, so the restart it ends with does not kill it. One run at a time (409 otherwise).
- The page polls `GET /api/app`; a new `bootId` means the server restarted, so it reloads onto the new build. If the update fails (pull conflict, build error) the service is not restarted and the page shows that run's log (`journalctl --user -u grand-secretariat-update`).
- API: `GET /api/app`, `POST /api/app/{restart|update|pull}` (JSON body, same token and Host/Origin checks as the rest; fixed commands, no client input reaches argv).
- `GRAND_SECRETARIAT_SERVICE` (default `grand-secretariat`) names the unit to restart; only for testing against a throwaway unit.

### Access from your other devices (Tailscale)

`scripts/tailscale-serve.sh` opens the installed app to devices signed in to Tailscale as you. It needs Tailscale with MagicDNS, and your user as Tailscale operator (`sudo tailscale set --operator=$USER`, once).

- It reads this machine's MagicDNS name and your login from `tailscale status --json`, writes `GRAND_SECRETARIAT_TAILNET_ORIGIN` and `GRAND_SECRETARIAT_TAILNET_LOGIN` to `~/.config/grand-secretariat/env`, restarts the service (running agents stop and reopen with `--resume`), then runs `tailscale serve --bg --https=<port> http://127.0.0.1:<port>` (`--http` when the tailnet issues no HTTPS certificates). Unchanged settings do not restart the service. The serve setting is kept by tailscaled across reboots.
- Open the address the script prints, `https://<machine>.<tailnet>.ts.net:<port>` (or `http://`). The short machine name and the 100.x address get 404 from tailscaled.
- The server stays on `127.0.0.1`. A request that came through the proxy passes only under that Host and with `Tailscale-User-Login` equal to the configured login (`server/tailnet-serve-access-guard.js`); other tailnet users, shared devices and tagged nodes get 403.
- With HTTPS the token cookie is `Secure`. Without certificates (enable them in the Tailscale admin console: DNS, HTTPS Certificates, then re-run the script) it is plain HTTP inside the tunnel: open the address only while Tailscale is connected, because off the tailnet a hostile network could answer for the name and plant a cached page. The page is then not a secure context either, so clipboard access may be limited.
- `scripts/tailscale-serve.sh --off` removes the serve setting and both variables, and restarts the service.
- Never run `tailscale funnel` on this port (public internet), and never put a raw TCP forward in front of it (`tailscale serve --tcp`, `socat`, SSH `-R`): those carry no caller identity, so the server would treat the caller as local.

## Environment variables

All values are read in `server/config.js`. None is required.

| Variable | Default | Meaning |
|---|---|---|
| `GRAND_SECRETARIAT_PORT` | `4777` | Port on `127.0.0.1`. Host and Origin allowlists follow this value. The installed app sets `4780` |
| `GRAND_SECRETARIAT_HOSTNAME` | (none) | Extra local name accepted in Host/Origin (besides `127.0.0.1`, `localhost`). The installed app sets `grand-secretariat.localhost` |
| `GRAND_SECRETARIAT_TAILNET_ORIGIN` | (none) | The address `tailscale serve` answers for, `https://<machine>.<tailnet>.ts.net:<port>` (or `http://`), accepted in `Host`/`Origin`. Set by `scripts/tailscale-serve.sh`; ignored unless the login below is set too |
| `GRAND_SECRETARIAT_TAILNET_LOGIN` | (none) | The one Tailscale login let in through `tailscale serve` (e.g. `you@example.com`) |
| `GRAND_SECRETARIAT_ROOT` | `~/workspaces` if it exists, else `~` | Folder scanned for git repositories, up to 4 levels deep |
| `GRAND_SECRETARIAT_FOLDERS` | (none) | Comma-separated plain folders (relative to the root, or absolute) also offered as working folders |
| `GRAND_SECRETARIAT_PROFILES` | accounts in `~/.ccs/config.yaml` with ccs, none with `claude` | Comma-separated profiles offered in the summon form; the chosen one is passed as the launcher's first argument. The first is the default. Empty: the form has no Profile field |
| `GRAND_SECRETARIAT_FLAGS` | `--dangerously-skip-permissions` | Space-separated flags added to every agent. Set to an empty string to add none |
| `GRAND_SECRETARIAT_LAUNCHER` | `ccs` if on `PATH`, else `claude` | Binary that starts an agent (`GRAND_SECRETARIAT_CCS_BIN` is the older name, still read) |
| `GRAND_SECRETARIAT_STATE_DIR` | `~/.local/state/grand-secretariat` | Where the state file, token, annals and hooks file are kept |
| `GRAND_SECRETARIAT_CONTEXT_LIMIT` | `0` (automatic) | Context window size used for the ink level (`~62% ink`). `0` means 200 000 tokens, switching to 1 000 000 once a transcript shows more than 200 000. A number sets the size for every scribe |
| `GRAND_SECRETARIAT_ANNALS_DAYS` | `30` | Days of annals kept on disk (one file per day). Older files are deleted at start and then once a day. A value that is not a number, or is zero, means 30; a negative value means 1 |
| `NODE_ENV` | unset | `production` selects `sirv` in `server/index.js`. `npm start` sets it |

Example:

```bash
GRAND_SECRETARIAT_ROOT=~/code GRAND_SECRETARIAT_PROFILES=WORK,HOME npm run dev
```

The server does not read a `.env` file.

## State folder

Default: `~/.local/state/grand-secretariat` (created with mode 0700).

| File | Purpose | Mode |
|---|---|---|
| `access-token` | 32-byte token for the API and terminal sockets. Kept across restarts | 0600 |
| `sessions.json` | Agents to reopen on the next start (no `exited` entries) | 0600 |
| `history.json` | Dismissed agents that can be recalled (last 50) | 0600 |
| `sessions.json.bad` | A damaged `sessions.json`, set aside for manual recovery | 0600 |
| `agent-hooks-settings.json` | Hook settings passed to every agent. Rewritten at each start | 0600 |
| `annals/YYYY-MM-DD.jsonl` | One file per local day: the court's annals (orders, files, commits, throne waits, tokens). Holds the first 200 characters of each order. Kept for `GRAND_SECRETARIAT_ANNALS_DAYS` days. Folder 0700, files 0600 | 0600 |

Treat `access-token` as a secret. Do not paste it into issues or chat. The browser receives it as an HttpOnly cookie, so you normally never need to read it.

## Stop, restart, reset

| Action | Command or step | Result |
|---|---|---|
| Stop | `Ctrl+C` in the terminal (`SIGINT`) or `SIGTERM` | Every agent process is killed. Agents stay in `sessions.json` |
| Restart | Start the server again | Each saved agent is reopened: `--resume` if it had a conversation, otherwise a fresh session. Agents whose repository folder is gone are dropped |
| Forget all agents | Stop the server, delete `sessions.json`, start | No agents are reopened. Claude Code's own conversation storage is outside this app and is not changed |
| Rotate the token | Stop the server, delete `access-token`, start | A new token is generated. Open browser tabs get a new cookie on their next page load |
| Clear the annals | Stop the server, delete the `annals/` folder, start | The chronicle is gone; agents and history are not changed |
| Full reset of the app's state | Stop the server, delete the state folder, start | Equivalent to the rows above together, annals included |

## Smoke test after a change

Run `npm test` first: it covers the pure helpers (hook-driven annals and ink parsing, day summaries, wording). Nothing tests the server, the browser or the court itself, so after a change also check these by hand:

1. `npm run dev` prints the open message. The page loads and the rail shows the tally and roster (or the empty-roster text).
2. Click "Summon a scribe". The repository list fills. Choose a repository and profile, enter a ticket, and summon. The figure walks in and the dock opens its terminal.
2a. While it is summoned, two porters carry its desk out to its place, and the scribe walks in after them. The desk is not in the yard before a scribe is summoned.
3. Type a short prompt in the terminal. The figure changes to "Working" with a toast showing the current step. The dock's activity strip shows the order and the step (order › step). The rail row shows the same step on its second line.
4. Wait for the reply. When the turn ends, the figure walks to the throne holding a jade tablet ("Reporting back"). Before the first order it sits at its desk ("Awaiting orders").
5. Dismiss the agent: press Dismiss once, then "End this session?" a second time. The figure walks out, and two porters carry its desk away.
6. King strolls and returns: with no agent asking for a ruling, wait 8 to 15 s after the page loads. The king in yellow rises, walks the hall gallery, to the rockery, the lotus pond or on down the east side to look over the river, and walks back to the throne to sit. Egrets circle overhead and land on the roofs now and then.
7. Typed order: with an agent open in the dock, type at least three characters without Enter. Each key gives a soft whisper (Sounds on). Press Enter. The king points at the scribe, a golden scroll flies from his hand to its figure, the figure bows, and a whispered phrase ends with a seal sound. A two-character entry followed by Enter sends no edict.
8. Birds settle while a petition waits: make an agent ask for a ruling (a question or a permission prompt). The king hurries back to the throne and sits, and the egrets land on the roofs and stay. When the petition is answered they take off one after another.
9. Stop and start the server. Agents that were open are reopened.
10. Dock tabs and shortcuts: with two or more agents, a tab per agent appears at the top of the dock, waiting ones first. `Alt+↓` and `Alt+↑` open the next and previous scribe. `Alt+W` opens the one that has waited longest. `` Alt+` `` closes the dock and a second press reopens the last scribe. With focus in the terminal these keys switch scribes, and typing letters still goes to the terminal. In the summon form they are ignored.
11. Petition text: make an agent ask a question (an `AskUserQuestion` prompt, or a plan waiting for approval). The question appears on its toast, on its rail row (second line) and on the dock's activity strip, which turns glaze. Answer it: the question clears and the agent goes back to working.
12. Rail foot: the Sounds, Music, Power saver and World icon buttons are one row at the foot of the rail, with App beside them in the installed app. The rail is 19 rem wide.
13. Cost readout: in the browser console, run `window.court.cost()`. It returns `tier`, `fps`, `frameMs` (main-thread milliseconds per drawn frame), `calls` and `triangles`. With nothing moving, `tier` reads `ambient` and `fps` about 20; while the king walks, `moving` and about 30; with focus in the dock and the pointer away for 4 s, `still` and 0 (`petition` and about 12 if an agent is asking). `fps × frameMs / 10` approximates the tab's CPU percent spent on the scene.
14. Reduced motion (DevTools rendering setting, or the OS option): opening a scribe is a cut, not a glide. Desks appear in place with no porters. The banners and the sampan hold still.
15. Reload with agents open: their desks are in place, with no porters walking.
16. Worlds: click the globe button in the rail foot and choose **Huế court (pixel 2D)**. The page reloads into the isometric pixel court; the agents are still there, in their places. Make an agent ask a question and check its petition still shows, with its chip above the kneeling sprite. Choose **Huế court** to return. `?world=hue-court` in the URL shows the 3D court for one visit, without changing the saved choice.
17. Power saver: press the leaf button. `window.court.cost().fps` falls by about half, the shadows go, and the birds, koi and smoke stop. A petition still calls, and the king stays on his throne. Press it again to return; the change takes effect at once.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| "Could not read your repositories … Check that the server is running" | Server not running, or it stopped | Start the server, then reopen the summon form |
| "No git repositories found under your workspace folder" | `GRAND_SECRETARIAT_ROOT` points elsewhere | Set the variable and restart |
| "The server refused this page. Reload it." | The feed returned 403: wrong host or missing token | Use `http://127.0.0.1:<port>` or `localhost`, then reload |
| Summon fails with "Unknown profile" | Profile not in `GRAND_SECRETARIAT_PROFILES` | Add it and restart |
| Agent shows "Failed to start" | Process exited within 15 s: bad profile, launcher (`claude` / `ccs`) not found, or a refused resume | Open the agent (click its chip), read the output, then Dismiss |
| Status never leaves "Arriving" or "Working" | Hooks cannot reach the server: `curl` is missing, or the agent was started before the port changed | Check `command -v curl`; restart the agent |
| Panel says "Connection to the server dropped" | Server stopped or restarted | Close the panel and reopen it. Terminals do not reconnect on their own |
| Panel says "This scribe has left the court" | The agent ended | Nothing to fix. Summon a new one if needed |
| Figures stop updating but the page is open | Feed dropped | The browser reconnects by itself. Reload if the rail stays stale |
| No whisper, seal or chirp sound | Browser audio starts only after a click on the page, or Sounds is off | Click the page once; check that **Sounds** is on at the foot of the rail |
| The king never leaves the throne | An agent is asking for a ruling, you typed in the dock in the last 10 s, or reduced motion is on | Answer the petition and wait 15 s. Reduced motion stops his strolls by design |
| Dev page shows old code, or `vite` is missing during install or build | `NODE_ENV=production` in the shell: `npm run dev` serves `dist/`, and `npm ci` skips devDependencies | `NODE_ENV=development npm run dev`; or unset the variable, then `npm ci` and `npm run build` |
| Order sent but no edict flies | Fewer than three characters were typed before Enter, or the scribe has no figure yet | Type a longer order; wait for the figure to arrive, then send again |

For server errors, read the console output of the terminal running the server. Its messages carry a scope in brackets: `[api]`, `[store]`, `[server]`.
