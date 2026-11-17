# Project Overview and PDR

Last updated: 2026-11-14. Version 1.0.0 (`package.json`). Branch `feat/ink-annals-idle-scribes` at `a505ed6`, not yet in master (FR-19, FR-20). Baseline: branch `feat/living-court-ambient-effects` at commit `244b7aa`, with the living court in the working tree.

## Overview

**Grand Secretariat** is a localhost web app that shows every running Claude Code agent as a figure in a 3D court of Hue (Three.js). Each figure is one agent session: a real terminal (PTY) that the server holds. Click a figure, its chip or its roster row and the dock opens that agent's live prompt.

It replaces the routine of opening a terminal, `cd`-ing into a repository and typing `claude`. The user can see all agents at once, notice the ones waiting for them, and start new ones from the same screen.

| Item | Value |
|---|---|
| Platform | Desktop browser, one user, one Linux machine |
| Network | Binds `127.0.0.1` only. Not hosted, not multi-user. Optional access from the owner's other devices through `tailscale serve`, one Tailscale login only |
| Runtime | Node 22+ (ESM), no framework |
| Key dependencies | `node-pty`, `ws`, `sirv`, Vite, Three.js, `@xterm/xterm`, `@fontsource` fonts |
| External tools | `claude` on `PATH` (or the `ccs` account switcher, used when installed), `curl`, Claude Code (hooks) |
| Entry commands | `npm run dev`, `npm run build`, `npm start` |

## Users and purpose

- **User:** one developer running several Claude Code agents across repositories under `~/workspaces`.
- **Job to be done:** see all agents in one place, jump into any of them, start a new one for a ticket.
- **Success (from PRODUCT.md):** the user never opens a terminal by hand to start or find an agent, and never misses an agent that is waiting for them. Nothing in the repository measures this.

## Product principles

Taken from [PRODUCT.md](../PRODUCT.md) and [DESIGN.md](../DESIGN.md):

1. Status at a glance: working, waiting and done are readable from across the room.
2. One click from the scene to the real prompt.
3. Waiting agents come to the user.
4. The scene is the interface, not decoration around a list.

## Functional requirements

Status is what the code does at HEAD. "Verified" means read in source. No runtime test exists (see [roadmap](./project-roadmap.md)).

| ID | Requirement | Status | Where |
|---|---|---|---|
| FR-01 | Show every live agent, updated without reload | Implemented | `GET /api/events` (SSE); `src/api-client.js` |
| FR-02 | Summon an agent: repository or any folder (Browse), profile (ccs only), ticket, optional first order | Implemented | `POST /api/sessions`, `GET /api/folders`; `src/ui/summon-panel.js`, `src/ui/folder-browser.js` |
| FR-03 | Session mode: new, continue last, or pick an old one | Implemented. "Continue" and "resume" pass the right CLI flags; a real run of those flags is not verified | `#spawn()` in `server/agent-session-store.js` |
| FR-04 | Open an agent's live terminal in the dock | Implemented | `/ws/term/<id>`; `src/ui/terminal-panel.js` |
| FR-05 | Show status from Claude Code hook events | Implemented. `asking` and `exited` were tested with simulated hook events only | `server/claude-hooks-settings.js` |
| FR-06 | Waiting agents walk to the throne; tab title counts them | Implemented | `src/scene/court-population.js`; `titleFor()` in `src/main.js` |
| FR-07 | Show the current step of a working agent | Implemented: toast, rail row and dock strip. Between tools the step is kept; hooks cannot show thinking | `activityFromHookEvent()` in `server/hook-activity-description.js` |
| FR-08 | Dismiss an agent, with a two-press confirmation | Implemented | `DELETE /api/sessions/:id`; `src/ui/terminal-panel.js` |
| FR-09 | Keep agents across server restarts | Implemented: reopened with `--resume` or `--session-id` | `restore()` in `server/agent-session-store.js` |
| FR-10 | Show an agent that exits within 15 s of starting as "Failed to start" | Implemented. No distinct pose in the scene | `EARLY_EXIT_MS` in `server/agent-session-store.js` |
| FR-11 | Reject requests from other Hosts, Origins, or without the token | Implemented for `/api/*`, terminal sockets and the static UI. Requests through `tailscale serve` also need the allowed Tailscale login | `server/http-api-routes.js`, `server/terminal-websocket-bridge.js`, `server/index.js`, `server/tailnet-serve-access-guard.js` |
| FR-12 | Respect reduced motion | Implemented: CSS rule and figure code | `src/styles/court-shell.css`; `agent-figure-motion.js` |
| FR-14 | History: recall a dismissed agent, resuming its conversation | Implemented (last 50 kept; only agents that had a conversation) | `GET /api/history`, `POST /api/history/:id/recall`, `DELETE /api/history/:id`; `server/dismissed-scribe-history.js`; `src/ui/history-panel.js` |
| FR-13 | Keyboard and screen-reader access to every agent | Implemented: each figure has a chip button and a roster button | `src/ui/overhead-chips.js`; `src/ui/roster-rail.js` |
| FR-14 | Living court: the king strolls and comes back to the throne; a typed order is whispered and sent as a royal edict to its scribe; birds and koi live on the stage and settle while a petition waits | Implemented in the working tree, not committed. Read in source; no browser run recorded | `src/scene/king-stroll-routine.js`; `src/scene/royal-edict-flight.js`; `src/scene/ambient-bird-flock.js`; `src/ui/terminal-panel.js` |
| FR-15 | Switch agents from the dock: a tab per agent (waiting first), Alt+↓ / Alt+↑ / Alt+W / Alt+`; one activity line (order › step, or the question) | Implemented (in master); not yet run with a real agent | `src/ui/dock-agent-tabs.js`; `src/ui/dock-activity-strip.js`; `src/ui/dock-shortcuts.js` |
| FR-16 | Say what a petition asks: the agent's question (80 characters at most) on its toast, rail row and dock strip | Implemented (in master); only simulated hook events checked | `questionFromHookEvent()` in `server/hook-activity-description.js`; `setQuestion()` in `server/agent-session-store.js` |
| FR-17 | Stay cheap to draw: frame-rate tiers, shadows on demand, merged scenery and baked figures; draw calls at or below the phase 3b baseline | Implemented (in master). 214 draw calls with three agents (baseline 1247). CPU not yet read by the user | `src/scene/render-cost-governor.js`; `src/scene/static-scenery-merge.js`; `window.court.cost()` |
| FR-18 | Desks exist only while an agent owns one: porters carry a desk out on summon and away on dismiss; the open scribe is framed by the camera | Implemented (in master); reduced motion places desks at once | `src/scene/desk-porter-crew.js`; `src/scene/camera-focus-ease.js` |
| FR-19 | Show each scribe's ink: the context its conversation holds (`~62% ink`) and its tokens, read from its own transcript. Tokens only, no cost | Implemented on `feat/ink-annals-idle-scribes`. Parser and reader unit-tested; the running app not yet checked (manual checklist pending) | `server/transcript-usage-reader.js`; `server/transcript-usage-parse.js`; `src/ui/ink-level-text.js`; rail and dock strip |
| FR-20 | Keep a per-day chronicle of every scribe (orders, files, commits, time waiting on the throne, tokens) for 30 days, and show a day in the dock's Annals panel | Implemented on `feat/ink-annals-idle-scribes`. Summary and endpoint unit-tested; the running app not yet checked (manual checklist pending) | `server/court-annals-*.js`; `GET /api/annals`; `src/ui/court-annals-panel.js` |

## Non-functional requirements

| Area | Requirement | Current state |
|---|---|---|
| Security | Local only; token for API and terminal; no shell built from input | Met, with the gaps in [system-architecture.md](./system-architecture.md#security-model) |
| Reliability | A failed hook or a closed panel must not break the server or the agent | Hook calls swallow errors. Terminal socket does not auto-reconnect |
| Persistence | Conversations survive restarts | Met by `--resume`. Agents themselves stop with the server |
| Performance | No targets defined | Not measured |
| Maintainability | Files at or under 200 lines | 177 of 184 code files met; seven exceed (see [code standards](./code-standards.md#file-size)) |
| Testability | Automated tests | `npm test` (Node's runner): 30 unit tests for the pure helpers of the ink level and the annals. None for the server routes, the browser or the court |
| Accessibility | Reachable without the canvas; reduced motion | Partly. Chips and rows are buttons. No accessibility audit is recorded in the repository |

## Constraints and dependencies

- The launcher (`claude`, or `ccs` when installed) must exist and accept `[<PROFILE>] --settings <file> --session-id|--continue|--resume --name <ticket> [order]`. Profiles exist only with ccs (read from `~/.ccs/config.yaml`, or set by `GRAND_SECRETARIAT_PROFILES`).
- Claude Code must honour the `--settings` hooks file. Its hook payload field names (`hook_event_name`, `tool_name`, `session_id`, `source`, `notification_type`, `transcript_path`) are read directly. The ink level also reads `message.usage` from each line of the transcript JSONL, a file format this app does not control; if that shape changes, the ink stops updating and nothing else breaks.
- Agents run with `--dangerously-skip-permissions` by default (`GRAND_SECRETARIAT_FLAGS`). The app inherits that risk and is designed for a single trusted user.
- Node 22+ is required. `node-pty` is a native module.

## Scope

In scope: local monitoring, starting, opening and dismissing agents; waiting-state signalling; resume after restart; sound cues; the living court (ambient figures and royal orders on the stage); the ink level and the court annals (tokens only, no cost).

Out of scope: remote access, multiple users, hosting, a chat interface in place of the terminal (PRODUCT.md: "not a chat wrapper"), tmux, cost in dollars (ccs profiles are mostly subscriptions, and price tables go stale).

## Open decisions

- The UI calls agents "scribes" (replacing the earlier "slave"); the code says "agent" and "session".
- Agents are not kept alive when the server stops (tmux was ruled out).
- The sound feature (cues and background music, synthesized in the browser) is committed on this branch. The living court is not yet committed; see the roadmap.
- Living-court extras (smoke, petals, dragonflies) are built.

## Version history

| Version | Date | Change |
|---|---|---|
| 1.0.0 | 2026-11-13 | Baseline documentation set written from commit `58292b8` |
| 1.0.0 (docs) | 2026-11-13 | Docs refreshed for the living court; baseline moved to `244b7aa` on `feat/living-court-ambient-effects`. Version in `package.json` unchanged |
| 1.0.0 (docs) | 2026-11-14 | Docs updated for the terminal-first court polish (phases 1 to 6) on `feat/terminal-first-polish` at `95e012d`: FR-15 to FR-18 added. Version in `package.json` unchanged |
| 1.0.0 (docs) | 2026-11-14 | Docs updated for the ink level and court annals on `feat/ink-annals-idle-scribes` at `a505ed6`: FR-19 and FR-20 added; testability and file sizes updated. Idle scribes (P24) dropped. Version in `package.json` unchanged |

## Related documents

[System architecture](./system-architecture.md) · [Codebase summary](./codebase-summary.md) · [Code standards](./code-standards.md) · [Deployment guide](./deployment-guide.md) · [Design guidelines](./design-guidelines.md) · [Roadmap](./project-roadmap.md)
