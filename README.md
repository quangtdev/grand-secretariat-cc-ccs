# Grand Secretariat

A local web app that shows every running Claude Code agent as a figure in a court of Hue: the 3D court by default, or an isometric pixel-art court.
Replaces "open a terminal, `cd` into the repo, type `claude`".

- Each figure is one agent session running in its own terminal (PTY) held by the server.
- Click a figure, its name chip, or its roster row: the dock opens that agent's live prompt.
- An agent that needs you runs to the throne and kneels with a yellow petition; one that finished its turn stands there with a jade tablet. The tab title shows how many are waiting. A restart of the server keeps them there: each agent resumes its conversation, and one that was before the throne comes back before the throne (with its question) until you give it a new order.
- A petition says what it asks: the agent's question (up to 80 characters) shows on its toast, in its rail row and in the dock's activity strip. With no question known, the status word shows instead.
- Desks exist only while their scribe does. When a scribe is summoned, two porters carry its desk out to its place; when it is dismissed, they carry it away. Scribes already present when the page opens have their desks in place.
- The yard is cheap to draw: the court is redrawn only as often as something moves (60 fps only while the user drags, zooms or the view glides; 30 fps while a figure travels; 20 fps when the user is looking at a court where only background life moves. While the user types in the dock with the pointer off the court, or the window has lost focus, the court holds still and nothing is drawn (12 fps if someone is asking for a ruling, so the petition keeps calling); it wakes when an agent changes state, a figure has to move, or the pointer returns).
- **Worlds.** The globe button in the rail foot opens the world picker: **Huế court** (the 3D court, the default) or **Huế court (pixel 2D)** (the same court in isometric pixel art, drawn as sprites) or **Zoo** (a 3D menagerie: every agent is an upright cartoon animal at its feeding trough, sub-agents are cubs, a head zookeeper watches from a lookout hut) or **Modern office** (a 3D glass-walled head office: every agent is an employee at a desk with a monitor, sub-agents are contractors with laptops, a manager watches from the glass corner office) or **Space station** (a 3D command bridge above a planet: every agent is a crew member at a console, sub-agents are hover drones, a captain sits in the command chair). Choosing one is remembered per browser and reloads the page. Agents keep running on the server; the dock starts closed, and reopening an agent replays its terminal. Keys go straight to the agent's terminal, so nothing typed waits only in the page. `?world=hue-court`, `?world=hue-pixel`, `?world=zoo`, `?world=office` or `?world=space-station` in the URL picks a world for one visit. A world that fails to start is forgotten, and the Huế court opens instead.
- **Moving the view.** In the 3D court, left drag pans, right drag zooms, middle drag turns the view, and the wheel zooms too. In the pixel court, drag pans and right drag or the wheel zooms; it does not turn, because its sprites are drawn for one view.
- **Power saver.** The leaf button in the rail foot makes the court cheaper to keep open: lower frame rates, no shadows, and the background life (birds, koi, smoke, petals, the river, the banners) and the king's walks stay at rest. Agents still walk to their places and a petition still calls. The choice is remembered per browser and takes effect at once.
- The panel button beside the title hides the left rail (the button at the stage's top-left brings it back). Drag the dock's left edge to make the terminal wider or narrower (arrow keys work when it has focus; double-click resets). The window button in the panel header switches the panel between docked on the right and a popup in the middle of the court: the popup grows out of the figure, chip or row you clicked and shrinks away when closed, and the court stays clickable around it. A click outside an agent's popup terminal hides it (dragging the court does not; clicking another scribe switches to it; the summon form and History stay open). Drag the popup by its header to move it (double-click the header to centre it again); drag any edge or corner to resize it (double-click an edge for the default size). All three are remembered in the browser.
- On a phone or tablet, drag a finger up or down in the terminal to scroll it; a flick keeps it gliding for a moment. A full-screen program in the terminal gets the drag as its own wheel scrolling. A sideways drag pans the page when it is zoomed in.
- Click a scribe's name at the top of the dock to rename it (Enter saves, Escape cancels); the new name is kept and used when it resumes.
- The clock button beside "Summon a scribe" opens the **History**: every scribe that left the court (dismissed, or ended on its own) after it had a conversation, newest first. **Recall** brings it back under the same name and repository, resuming its conversation (`--resume`); × forgets the entry. The last 50 are kept in `~/.local/state/grand-secretariat/history.json`.
- The book button beside it opens the **Annals** (called Daily log in the office world, Keeper's diary in the zoo and Mission log in the space station): a chronicle of one day, grouped by scribe, dismissed ones included. Each scribe shows its orders, the files it changed, its commits, the time it waited at the throne and its tokens. When today has no records yet, it opens on the latest earlier day that has them. The arrows move between days. Days older than 30 are deleted (`GRAND_SECRETARIAT_ANNALS_DAYS`).
- Each scribe's **ink** is the context its conversation holds now: `~62% ink` in its rail row and in the dock's strip, read from its own transcript. Tokens only, no cost. Each workplace also carries a gauge of what is left (the inkstone's pool, an ink pot, a level strip, a feed bucket, a fuel cell, by world), draining as the context fills. The tooltip gives the tokens used out of the window. Past 85% only the wording changes; the colour does not. The words are the world's (ink, context, appetite or fuel).
- Click the drum pavilion (or "Summon a scribe") to start an agent: pick repository (or a plain working folder listed in `GRAND_SECRETARIAT_FOLDERS`, or **Browse** to any folder on the machine), account profile (only when the `ccs` account switcher is in use), ticket name, optional first order.
- Every sub-agent an agent sends out (the `Agent` tool) is a soldier: it rises out of a golden seal of light behind its master, stands in ranks behind its master's desk (and keeps its post there while the master goes before the throne), drills with its spear while the master works, and bows and sinks into a jade seal when it reports back. A master whose soldiers are still out is waiting on them, not done: it stays at its desk until the last one reports back and it makes its final report. The master's chip and roster row count its soldiers; pointing at an agent (or opening it) lists them in its toast, one line each: task and current step.
- The king does not sit still: after a few seconds on the throne he rises, walks the hall or goes down the east stair to look at the rockery, the lotus pond and the river, and comes back. A scribe asking for a ruling sends him running back to the throne; a report, or you typing in the dock, brings him back at a walk. Egrets circle overhead and land on the roofs; koi swim in the lotus pond; incense smoke rises from the urns, petals fall from the old trees and dragonflies dart over the pond. While a petition waits, the king sits and the birds settle.
- Typing a prompt in the dock is the king whispering an order: a soft murmur follows your keys, and on Enter a whispered phrase ends with the seal (a knock of the mõ), the king points at the scribe, a golden edict flies to it and it bows.
- The court has sound, all synthesized in the browser (no audio files): the drum beats when you strike the drum pavilion (or press Summon a scribe) and rolls when the scribe is summoned, a gong and bell sound when one kneels with a petition, a wooden knock and bell when one reports back, a low gong when one fails to start, a whisper while you type an order and a seal when you send it, a soft chirp when a bird lands, and soft đàn tranh music with wind plays in the background. The **Sounds** and **Music** icon buttons at the foot of the rail switch each off; the browser starts audio after your first click. The **App** button beside them (installed app only) opens Pull & update, Update and Restart.
- In the same form, **Session** chooses between a new conversation (`claude`), continuing the repository's last one (`claude --continue`), or picking an old one from Claude's list (`claude --resume`).

## Keyboard and the dock

| Keys | Does |
|---|---|
| `Alt+↓` / `Alt+↑` | Open the next / previous scribe (waiting ones first) |
| `Alt+W` | Open the scribe that has waited on you longest |
| `` Alt+` `` | Close the dock, or reopen the last scribe |

The keys work wherever focus is and never reach the terminal. They are ignored while you type in a form field, and while the summon form, History or the Annals is open (switching would discard it). Shortcuts are defined in `src/ui/dock-shortcuts.js`.

The dock, from the top: one tab per scribe (waiting ones first; a petition is yellow, a finished one jade), the scribe's name (click the pencil to rename), its repository and profile, **Dismiss** and close; then one activity line (`order › current step`, soldiers and elapsed time; the question while it asks); then the terminal.

## Run

```bash
npm install
npm run dev        # http://127.0.0.1:4777 (Vite middleware, hot reload)
npm test           # unit tests (node --test): pure helpers only, no server or browser needed

npm run build && npm start   # production: serves dist/

npm run install-app   # Ubuntu: start at login (systemd user service) + app-menu launcher,
                      # http://grand-secretariat.localhost:4780
npm run update        # rebuild and restart after a change (or the Pull & update / Update / Restart buttons in the rail)
```

Requires Node 22+, Claude Code (`claude`) on PATH, and `curl` (used by the status hooks). Nothing else needs setting up: agents start with plain `claude`. If the `ccs` account switcher is installed it is used instead, and its accounts appear as **Profile** choices in the summon form.

## How it works

| Part | File |
|---|---|
| HTTP server, dev/prod UI serving | `server/index.js` |
| Hook events: applied to the store, then to the ink reader and the annals (`handleHookEvent`) | `server/hook-event-intake.js` |
| Ink level: each scribe's transcript read from its last offset (context and tokens) | `server/transcript-usage-reader.js`, `server/transcript-usage-parse.js` |
| Court annals: day log writer, which events are logged, day summary, `GET /api/annals` | `server/court-annals-log.js`, `server/court-annals-events.js`, `server/court-annals-summary.js`, `server/court-annals-reader.js` |
| Annals panel and the ink wording | `src/ui/court-annals-panel.js`, `src/ui/court-annals-text.js`, `src/ui/ink-level-text.js` |
| Agents: PTY, status, scrollback, resume state | `server/agent-session-store.js` |
| History of dismissed agents (recall) | `server/dismissed-scribe-history.js` |
| Hook settings given to each agent, hook event -> status | `server/claude-hooks-settings.js` |
| REST + SSE API, request trust checks | `server/http-api-routes.js` |
| Browser terminal <-> PTY over WebSocket | `server/terminal-websocket-bridge.js` |
| Court engine: camera (3D or isometric), figures, movement, frame rates, power saver | `src/scene/*` |
| World packs: each court's look, the picker, the URL and saved choice | `src/worlds/*`, `src/ui/world-picker.js` |
| Rail, chips, terminal dock (docked or popup), summon form | `src/ui/*` |
| Sound cues, background music, instruments | `src/audio/*` |

Each agent is started as `claude --dangerously-skip-permissions --settings <hooks file> --session-id <id> --name <ticket> [first order]` in the chosen repository (with ccs: `ccs <PROFILE> ...`, same flags).
The hooks file makes Claude Code POST its lifecycle events to `/api/hook/<id>`:

| Event | Status | In the court |
|---|---|---|
| SessionStart | idle | seated, still |
| UserPromptSubmit, PreToolUse, PostToolUse | working | seated, writing; a toast over its head shows its current step ("Editing app.js", "$ npm test", the in-progress todo); hovering it adds the order (first line of the prompt) and its soldiers. The dock's activity strip shows order › step (`server/hook-activity-description.js`) |
| PreToolUse of AskUserQuestion / ExitPlanMode, permission Notification | asking | kneels before the throne with a petition; the question (`questionFromHookEvent`) shows on the toast, the rail row and the dock strip |
| Stop | done | stands before the throne |
| PreToolUse of Agent, SubagentStart / SubagentStop | (soldiers) | a soldier is summoned / reports back (`server/subagent-soldier-tracker.js`) |

Agents stop when the server stops. Their ids are kept in `~/.local/state/grand-secretariat/sessions.json`, and on the next start each one is reopened in place: with `--resume` if it had a conversation, fresh otherwise. An agent that exits within 15 seconds of starting stays in the court as "Failed to start" with its output readable, until dismissed.

## Configuration (env vars)

| Variable | Default | Meaning |
|---|---|---|
| `GRAND_SECRETARIAT_PORT` | `4777` | Port (always bound to 127.0.0.1); the installed app uses `4780` |
| `GRAND_SECRETARIAT_HOSTNAME` | (none) | Extra local name allowed in `Host`/`Origin`, e.g. `grand-secretariat.localhost` |
| `GRAND_SECRETARIAT_TAILNET_ORIGIN` | (none) | The address `tailscale serve` answers for, `https://<machine>.<tailnet>.ts.net:<port>` (or `http://`), accepted in `Host`/`Origin`. Set by `scripts/tailscale-serve.sh`; ignored unless the login below is set too |
| `GRAND_SECRETARIAT_TAILNET_LOGIN` | (none) | The one Tailscale login let in through `tailscale serve` (e.g. `you@example.com`) |
| `GRAND_SECRETARIAT_ROOT` | `~/workspaces` if it exists, else `~` | Folder scanned (4 levels) for git repositories |
| `GRAND_SECRETARIAT_FOLDERS` | (none) | Plain folders (relative to the root, or absolute) also offered as working folders, listed first under "folders" |
| `GRAND_SECRETARIAT_PROFILES` | accounts in `~/.ccs/config.yaml` with ccs, none with `claude` | Comma-separated profiles offered in the summon form; the chosen one is the launcher's first argument. Empty: no profile is asked for or passed |
| `GRAND_SECRETARIAT_FLAGS` | `--dangerously-skip-permissions` | Extra flags for every agent |
| `GRAND_SECRETARIAT_LAUNCHER` | `ccs` if on PATH, else `claude` | Binary that starts an agent (`GRAND_SECRETARIAT_CCS_BIN` is the older name, still read) |
| `GRAND_SECRETARIAT_STATE_DIR` | `~/.local/state/grand-secretariat` | Session state, the annals (`annals/`) and the generated hooks file |
| `GRAND_SECRETARIAT_CONTEXT_LIMIT` | `0` (automatic) | Context window size for the ink level. `0` is 200k, latched to 1M once more than 200k has been seen; a number sets it |
| `GRAND_SECRETARIAT_ANNALS_DAYS` | `30` | Days of annals kept; older day files are deleted |

## Security

The server can start shells with permissions skipped, so:

- it only listens on 127.0.0.1 and rejects requests whose `Host` or `Origin` is not its own (DNS rebinding, cross-site requests), for the web UI as well as the API;
- every API call and terminal socket needs an access token (`<state dir>/access-token`, mode 0600). The browser gets it as an HttpOnly cookie when it loads the page; each agent's hooks send a token derived from it and the agent's id, which opens only that agent's own `/api/hook/<id>`. Other local users and processes cannot drive the server without it.
- the same token guards the folder browser (`GET /api/folders`), which lists folder names anywhere your user can read, and an agent may be started in any existing folder.
- the annals (`<state dir>/annals/`, folder 0700, files 0600) keep the first 200 characters of each order you give and the files and commits of each scribe, for 30 days. The ink reader reads only `.jsonl` transcripts under the Claude Code `projects` folder (`$CLAUDE_CONFIG_DIR`, `~/.claude` or a ccs profile in `~/.ccs/instances/<profile>`). To clear the annals, delete the `annals/` folder.

Do not expose the port: do not bind it wider, forward it, or put it behind a public proxy.

### From your other devices (Tailscale)

The one supported way in from another device is `tailscale serve`, limited to your own Tailscale login:

```bash
scripts/tailscale-serve.sh        # then open the address it prints, e.g. https://<machine>.<tailnet>.ts.net:4780
scripts/tailscale-serve.sh --off
```

The server still listens on 127.0.0.1 only. tailscaled proxies the tailnet to it and names the caller (`Tailscale-User-Login`); the server lets in that one login and answers 403 to other tailnet users, shared devices and tagged nodes. Use the full MagicDNS name: the short machine name and the 100.x address are not served. It uses HTTPS when the tailnet issues certificates (admin console, DNS, HTTPS Certificates). Without them it falls back to plain HTTP inside the WireGuard tunnel: then open the address only while Tailscale is connected, because off the tailnet a hostile network could answer for the name, and the browser treats the page as not secure (clipboard access may be limited). Never put a raw TCP forward (`tailscale serve --tcp`, `socat`, an SSH `-R`) in front of the port: it carries no caller identity. The script restarts the service, which stops running agents (they reopen with `--resume`).

## Documentation

| Document | Contents |
|---|---|
| [Project overview and PDR](docs/project-overview-pdr.md) | Purpose, users, requirements and their status |
| [Codebase summary](docs/codebase-summary.md) | Every file with its role and line count |
| [Code standards](docs/code-standards.md) | Structure, naming, error handling, security rules |
| [System architecture](docs/system-architecture.md) | Components, data flow, status model, security model |
| [Deployment guide](docs/deployment-guide.md) | Local dev and production runs, environment variables, state folder |
| [Design guidelines](docs/design-guidelines.md) | Summary of the design system; [DESIGN.md](DESIGN.md) is the source of truth |
| [Project roadmap](docs/project-roadmap.md) | Done, known gaps, proposed next steps |
