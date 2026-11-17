# Project Roadmap

Last updated: 2026-11-14. No dates or milestones are committed in this repository. Everything under "Next steps" is a **proposal**, not a commitment.

## Status

| Phase | Scope | Status |
|---|---|---|
| 1. Core court | Agents as PTYs, 3D court, roster, chips, dock terminal, summon form | Done at `58292b8` |
| 2. Status and waiting | Hook-driven status, throne queue, tab title count, activity toast | Done at `58292b8` |
| 3. Persistence and resume | State file, restore with `--resume`, failed-to-start handling | Done at `58292b8` |
| 4. Security baseline | Loopback bind, Host and Origin checks, token for API and WebSocket | Done at `58292b8`, with gaps listed below |
| 5. Sound | Cues for summon, petition, report, failure, departure; ambient music; rail toggles | Done, committed (`8760cc0`, `fe564b2`) |
| 6. Documentation set | This `docs/` folder and the README section | Written 2026-11-13, updated 2026-11-14 |
| 7. Living court | King strolls and returns; whispered orders with a royal edict; egrets and koi; birds settle while a petition waits | Done in the working tree of `feat/living-court-ambient-effects`; not committed |
| 8. Living court extras | Smoke, petals, dragonflies (plan phase 4) | Done |
| 9. Terminal-first court polish | Dock tabs, activity strip and Alt shortcuts; rail rows with the live step; petition text; render cost governor; desks on demand; sky, river, hall detail and south gate. Plan: `plans/261114-0018-terminal-first-court-polish/` | Done on master (phases 1 to 6 from `feat/terminal-first-polish`, tip `95e012d`) |
| 10. Frame pacing and power saver | Frame-rate fix (the 30 and 20 fps tiers drew at 52 to 60 fps on a 60 Hz screen); leaf button in the rail foot that lowers rates, turns shadows off and rests the background life | Done on master (`738036e`, `e311cca`, merged in `4ecf31d`) |
| 11. World packs and picker | Court look split from its behaviour; world contract, registry with lazy chunks and fallbacks; the Huế 3D court as the default pack; globe button in the rail foot; `?world=` | Done on master (`6e9b67f`, `643cf4b`, from `feat/selectable-world-styles`) |
| 12. Isometric pixel court | Orthographic isometric camera rig, pixel-scaled rendering, sprite figure bodies, per-world frame rates; the pixel Huế court as a second world; review fixes | Done on master (`35ba0ea` to `3c02b13`) |
| 14. Ink on the stage (P21b) | An ink gauge on every world's workplace: inkstone pool, pixel ink pot, office level strip, feed bucket, fuel cell; engine quantises to 5 % (`src/scene/ink-left-steps.js`), calls `setInk` only on change. Plan: `plans/261114-1414-ink-on-stage/` | Done on `feat/ink-on-stage`; not in master |
| 13. Ink level and court annals (P21, P22) | Per-scribe context % and tokens from its transcript; a per-day chronicle of every scribe with a dock panel; hook intake moved to its own module; `npm test` for the pure helpers. Plan: `plans/261114-1232-ink-annals-idle-scribes/` | Done on `feat/ink-annals-idle-scribes` (tip `a505ed6` plus the docs commit); not in master. Idle scribes (P24) dropped; scene ink pile deferred (P21b) |

## Done (verified in source at `58292b8`)

- Agent lifecycle: summon (new, continue last, pick an old one), dismiss with two-press confirmation, failed-to-start kept for inspection (`server/agent-session-store.js`).
- Live feed over Server-Sent Events, with a full snapshot on every change (`server/http-api-routes.js`).
- Terminal bridge: xterm.js over WebSocket to the PTY, scrollback replay on open, resize (`server/terminal-websocket-bridge.js`, `src/ui/terminal-panel.js`).
- Hook intake and mapping for six Claude Code events (`server/claude-hooks-settings.js`); toast text with the order and current step, clipped to 56 and 48 characters (`server/hook-activity-description.js`).
- Court scene: architecture, surroundings, desks, throne queue with rows of seven, walking routes, reduced-motion handling (`src/scene/*`).
- Overhead chips with priority placement and no overlap; roster grouped "Before the throne" and "At their desks" (`src/ui/overhead-chips.js`, `src/ui/roster-rail.js`).
- Repository scan of git folders up to 4 levels deep, cached for 30 s (`server/repository-scanner.js`).
- Persistence with atomic writes and a `.bad` backup for a corrupt file (`server/agent-session-store.js`).

## Done on the polish branch (`feat/terminal-first-polish`)

Verified in source at `95e012d`. Measured numbers are from the plan's phase 3b. The last commit, `95e012d`, fixed frame pacing across displays, aimed the camera at a scribe's destination, kept held scribes still, and made the desk queue safer.

- **Dock workbench (phase 1):** a tab per agent, waiting ones first (`src/ui/dock-agent-tabs.js`); one activity line of order › step, soldiers and elapsed time, or the question while asking (`src/ui/dock-activity-strip.js`); Alt+↓ / Alt+↑ / Alt+W / Alt+` (`src/ui/dock-shortcuts.js`). The header's status pill is gone.
- **Rail rows (phase 2):** a live step on the second line while working, the question or outcome before the throne; group counts; 19 rem wide; a one-row foot with the icon toggles and the App disclosure.
- **Chips and toasts (phase 3):** the server keeps a short `question` (80 characters at most) while an agent asks (`server/hook-activity-description.js`, `server/agent-session-store.js`); a soldier's events no longer lift its master's petition (`server/http-api-routes.js`). Toasts use the chips' ink material.
- **Render cost (phase 3b):** frame-rate tiers, shadows on demand, merged scenery, baked figures (`src/scene/render-cost-governor.js`, `src/scene/static-scenery-merge.js`, `src/scene/figure-toon-style.js`). Draw calls on the default camera with three agents: 1247 before, 214 after.
- **Scene follows the work (phase 4):** the camera glides to the open scribe (`src/scene/camera-focus-ease.js`); desks exist only while an agent owns one, and two porters carry them out on summon and away on dismiss (`src/scene/desk-porter-crew.js`, `src/scene/writing-desk.js`, `src/worlds/hue-court/hue-guard-body.js`); piles of sheets and a brush at working desks.
- **Environment (phase 5):** sky dome with clouds (`src/scene/sky-dome-and-clouds.js`), river water and a sampan (`src/scene/river-water-and-sampan.js`), sandy bank, reeds and grass patches (`src/scene/court-surroundings.js`).
- **Architecture (phase 6):** hall column bases, name board, lanterns, ridge ornaments, balustrade, throne canopy and fans (`src/scene/throne-hall-details.js`); the three-bay south gate and the yard banners (`src/scene/south-gate-and-banners.js`).

## Done on the worlds branch (`feat/selectable-world-styles`)

Verified in source at `3c02b13`. Frame and CPU numbers were measured in headless Chrome with three simulated agents; absolute numbers on a visible window will differ.

- **Frame pacing fix (master `738036e`):** `frameDue()` carries only how late a frame is. Before, the 30 and 20 fps tiers drew at 52 to 60 fps on a 60 Hz screen. The court's main-thread time fell from about 83 ms per second to about 44 (`src/scene/render-cost-governor.js`).
- **Power saver (master `e311cca`, merged in `4ecf31d`):** rail-foot leaf button (`src/ui/power-saver-toggle.js`). Measured on the production build: main-thread time about 36% lower, script time about 45% lower, frame rate halved, shadows off. The king's walks and the background life rest.
- **World packs (`6e9b67f`, `643cf4b`):** the look is a pack (`src/worlds/world-pack-contract.js`); a registry loads each world as its own chunk and falls back safely (`src/worlds/world-registry.js`). The Huế 3D court is the default pack. Behaviour moved to `agent-figure-motion.js` and `ruler-figure-motion.js`; costumes moved to `src/worlds/hue-court/`.
- **World picker (`6e9b67f`):** globe button in the rail foot (`src/ui/world-picker.js`). A choice is saved per browser and the page reloads into it.
- **Isometric 2D mode (`35ba0ea`, `a493a18`, `41a8c11`):** orthographic camera rig with pan and zoom (`src/scene/court-camera-rig.js`), pixel-scaled rendering, one-plane sprite figures with alpha-aware picking (`src/scene/sprite-figure-body.js`, `src/scene/sprite-body-animators.js`), per-world frame rates.
- **Pixel Huế court (`b7f568f`):** the same court in isometric pixel art, painted in code at boot (`src/worlds/hue-pixel/`).
- **Review fixes (`5b1fcea`, `706624f`, `9caffd1`, `536eb4a`, `4225df3`, `3c02b13`):** the stage hint matches the drag mapping; clicks land only on opaque sprite pixels; a world that fails to build is forgotten and the app reloads into the Huế court; edict sprites free their geometry; the picker changes world on click, Enter or Space, not on arrow keys; the saver recompiles materials only when shadows change, and it lowers a 2D world's rates.

## Done on `feat/ink-annals-idle-scribes`

Verified in source at `a505ed6`. Tokens only, no cost figures: the ccs profiles are mostly subscriptions, and price tables go stale.

- **Hook intake (phase 1):** one hook event is applied to the store, then to two observers that never delay the hook's reply (`server/hook-event-intake.js`). A transcript is read only from the `transcript_path` a scribe's own hooks give, and only under the Claude Code `projects` folder (`$CLAUDE_CONFIG_DIR`, `~/.claude` or a ccs profile in `~/.ccs/instances/<profile>`).
- **Ink level (P21):** `~62% ink` in the rail row and the dock strip, worded by the world; the tooltip gives the tokens (`server/transcript-usage-reader.js`, `server/transcript-usage-parse.js`, `src/ui/ink-level-text.js`). The stage is unchanged.
- **Court annals (P22):** one JSONL file per day in `<state>/annals/`, kept 30 days; summaries are computed on read; `GET /api/annals`; a dock panel with day arrows, opened from a book button in the rail (`server/court-annals-*.js`, `src/ui/court-annals-panel.js`).
- **Tests:** `npm test` runs `node --test` over six files for the pure helpers (`test/`).
- **Dropped:** idle retirement (P24). The user dismisses long-waiting scribes by hand.

## Deviations from the plan

Decided during the build, or not built. None blocks use.

| Planned | Built | Why |
|---|---|---|
| Toasts drop out when three or more stack | Not implemented | No reason recorded in the plan; open for a decision |
| Pixel ratio 1 in the background tier | 1.5 in every tier | Resizing the drawing buffer on each focus change cost more than it saved (phase 3b notes) |
| Contact-shadow blobs, tree sway, soft shadows | Not built | CPU budget (the user's rule: rendering must not cost much CPU) |
| Camera focus can be switched off | No localStorage toggle | Not built; `prefers-reduced-motion` already turns the glide into a cut |

## Verification gaps

| Gap | Detail |
|---|---|
| Few automated tests | `npm test` (Node's built-in runner) covers the pure helpers of the ink level and the annals (6 files, 30 tests on `feat/ink-annals-idle-scribes`). The hook-status functions, the trust checks, the summon validation, the court scene and the browser are untested |
| No linter or formatter | No configuration of any kind |
| `asking` and `exited` tested only with simulated hook events | Not yet exercised with a real Claude Code permission prompt or a real failing launch |
| Living court not yet run with a real agent | The stroll, recall, edict flight, birds, koi and extras were checked in a browser with simulated feed changes; the asking/order flows still need one run with a real agent (smoke test steps) |
| Polish branch not run with a real agent | Phase 7's checklist (summon, order, petition, answer, finish) with one real agent is not recorded. Smoke test steps 10 to 15 in [deployment-guide.md](./deployment-guide.md) cover the new parts |
| Frame rate and CPU not measured in the automation tab | Draw calls were measured. The automation tab throttles frames, so the tab's CPU before and after the change is still to be read by the user in the browser task manager |
| Contrast over the new sky and ground | Chips and toasts were not checked against the new environment by eye on a real display |
| `continue` and `resume` modes verified to the level of CLI arguments | The arguments are correct in the code. A real run against Claude's session list was not recorded |
| Worlds not compared in a browser | The 3D Huế court was checked against the old figure code by reading (review, "Huế 3D regression check"). No side-by-side browser run is recorded |
| Pixel court with a real agent | Checked with a headless probe and simulated feed changes (phase-08 report), including the power saver. Not run with a real agent |

### Product gaps

| Gap | Detail |
|---|---|
| Stale step between tools | Hooks cannot tell thinking from writing. Between tools the toast and strip keep the last step, so it can look out of date. "Thinking" shows only before any step is known |
| No distinct pose for "Failed to start" | Figure queues at the throne and sits, the same as idle. The icon and label are the only difference |
| Agents stop with the server | Reopened on the next start with `--resume`, but a running turn is interrupted |
| Terminal does not reconnect | Panel must be closed and reopened after a drop |

### Code and design gaps

| Gap | Detail |
|---|---|
| Seven files over 200 lines | `src/styles/court-shell.css` (360), `src/main.js` (355), `server/agent-session-store.js` (300), `src/ui/terminal-panel.js` (253), `src/styles/court-dock.css` (294), `src/scene/court-surroundings.js` (230), `src/scene/desk-porter-crew.js` (227). The new files on the ink branch are all under 200 |
| Looping toast dots | `toast-dot` loops forever while an agent works (1.1 s, infinite). DESIGN.md allows one loop that calls for attention (the petition); the toast dots are not that. Also the toast text is 0.6875rem, below the type ramp |
| Dead status-pill CSS | `.status-pill` rules remain in `src/styles/court-dock.css`; the markup no longer uses them |
| Debug global | `window.court` exposes internal state (`src/main.js`). Intended for development only |
| Pixel art scale mismatch | The engine scales the king by 1.25 and the porters and soldiers by 1.05, so their art pixels are larger than the scribes' and shimmer at `pixelScale` 3 (review low 7). Open question: is the king's size intended? |
| Pixel stage width | Art pixels are 1/9 unit at a fixed `pixelScale` of 3, crisp at a stage about 1100 px wide. Other widths scale sprites by a non-integer factor, so pixel columns are uneven (phase-08 report; review low 13). Fix: an adaptive integer `pixelScale` from the stage size |
| Pixel world fog | `fog: [900, 1000]` stands in for "no fog", and the shaders still compile the fog code (review low 12) |
| Pack id check | Nothing checks that a pack's `id` matches its registry entry (review low 15) |
| Scribes seen from behind | Scribes on the east flank of the pixel court are seen from behind; writing shows only in the arm and brush motion (phase-08 report) |
| Per-frame allocation | Partly removed in the pixel world (`706624f`). The per-figure state literal each frame is still there (review low 11), not re-measured |

### Security gaps (found while writing these docs)

| Gap | Detail | Evidence |
|---|---|---|
| Agent token scope | Fixed after `58292b8`: each agent gets `hookTokenFor(accessToken, id)`, valid only for `POST /api/hook/<its id>`. Checked on a test port: own hook 200, another agent's hook 403, summon 403 | `hookTokenFor()` in `server/claude-hooks-settings.js`, check in `server/http-api-routes.js` |
| Silent hook failure | Hook `curl` errors are ignored. A lost `Stop` leaves an agent "Working" until an `idle_prompt` arrives | `server/claude-hooks-settings.js` |
| Cookie not `Secure` | Acceptable only while the server is plain HTTP on localhost | `server/index.js` |

### Minor observations

- `SCROLLBACK_BYTES` counts string characters, not bytes. The name is misleading, and the limit is approximate for non-ASCII output.
- A new repository can take up to 30 s to appear in the summon form (scan cache).
- `package.json` has an empty `description`.

## Next steps (proposals)

Ordered by suggested priority. Each needs an owner decision before work starts.

| # | Proposal | Closes | Decision needed |
|---|---|---|---|
| P1 | ~~Merge `feat/terminal-first-polish` to master~~: merged (`95e012d` is in master) | Phases 4 to 6 | - |
| P1b | Run the real-agent pass (summon, order, petition with a question, answer, finish) and record it in the deployment guide | Polish verification gap | None |
| P1c | Read the tab's CPU in the browser task manager before and after the polish, and record both numbers in phase 3b | CPU gap | None |
| P1d | Commit the living court work on `feat/living-court-ambient-effects` | Phase 7 | None |
| P2 | Record a browser run of the smoke test in [deployment-guide.md](./deployment-guide.md), including the king, edict and bird checks | Living court verification gap | None |
| P5 | Give "Failed to start" a distinct pose, following "The Place and Posture Rule" in DESIGN.md | Pose gap | Visual direction |
| P6 | Stop the toast dots looping, or record an exception in DESIGN.md. Decide whether toast text stays at 0.6875rem | Looping toast, type ramp exception | Design owner's call |
| P7 | Split the seven files over 200 lines (see Code and design gaps) | Size gaps | None |
| P7b | Remove the unused `.status-pill` rules | Dead CSS | None |
| P8 | Partly done: `npm test` (Node's runner, no other tooling) with six files for the ink and annals helpers. Still to do: focused tests for `statusFromHookEvent`, `activityFromHookEvent`, `questionFromHookEvent`, `isTrustedRequest` and summon validation | Few tests | None |
| P9 | Run the untested paths on a real machine (continue, resume, permission prompt, failing launcher) and record results in a report | Verification gaps | None |
| P10 | Let the terminal panel reconnect after a drop | Reconnect gap | None |
| P11 | Surface hook delivery failures, for example as a dock note | Silent hook failure | None |
| P12 | ~~Merge `feat/selectable-world-styles` to master~~: merged (`3c02b13` is in master). The open Low items are listed under the gaps above | Worlds branch | - |
| P13 | ~~Office, space station and zoo worlds (batch B). Each needs its own audio (the cues and music are the Huế court's), its vocabulary (the court's words in the UI and the stage hint), and a CSS theme layer (the shell's colour tokens are fixed in `court-shell.css`)~~: done, the office, space station and zoo worlds exist with their own audio, vocabulary and theme | New worlds | None |
| P14 | Isometric 2D variants of the office, space station and zoo worlds, on the existing camera rig | New worlds | After P13 |
| P15 | Adaptive integer `pixelScale` from the stage size (phase-08 gap) | Pixel world sizing | None |
| P16 | Close the open review Low items: king and guard scale (7), fog `null` (12), render target width (13), pack id check (15), the still-open part of per-frame allocation (11), and the file-size splits (`desk-porter-crew.js` at 227 lines, `main.js` at 355) | Review lows | None |
| P17 | Browser run of the 3D court before and after the branch, and of the pixel court with a real agent | Verification gaps | None |
| P18 | Rule from the petition: AskUserQuestion options from the hook payload as buttons on the toast and rail row, answered without opening the terminal | Waiting agents need a terminal round trip | Input path into the PTY |
| P19 | Notify outside the browser (Notification API or `notify-send`, optional ntfy text to a phone) when a petition arrives and the window is not focused | Missed petitions | Channels |
| P20 | Warn when two scribes in one repository edit the same file (PostToolUse Edit/Write per repo); optional "own worktree" on summon | Edit collisions | Worktree default |
| P21 | Ink level and treasury: context % and token cost per scribe from its transcript JSONL. Done on `feat/ink-annals-idle-scribes` (tokens only, no cost). Plan: `plans/261114-1232-ink-annals-idle-scribes/` | No usage visibility | None |
| P21b | ~~Ink on the stage~~: done on `feat/ink-on-stage`. A separate gauge of ink LEFT on each workplace (`Workplace.setInk`, 5 % steps); the sheet pile keeps its meaning. Plan: `plans/261114-1414-ink-on-stage/` | Ink only in rail and dock | None |
| P22 | Court annals: per-day chronicle of each scribe (orders, files changed, commits, time waiting on the king). Done on `feat/ink-annals-idle-scribes` | No daily record | None |
| P23 | Edict templates: saved orders, summon several scribes at once | Repeated typing | None |
| P24 | ~~Idle scribes~~: dropped 2026-11-14, user dismisses long-waiting scribes by hand | - | - |
| P25 | Spoken orders (Web Speech API) | None | None |
| P26 | Forward a report: hand one scribe's result to another as its order | None | UX |
| P27 | End-of-day time-lapse replay of the court from the event log | None | None |
| P28 | Name: keep "Grand Secretariat" as the product name; reword README and PRODUCT.md so the Huế court is one world among several, not the product | Naming drift since batch B worlds | Wording |
| P29 | Cross-platform: native Windows and macOS beside Linux (Linux stays first-class, unchanged). Core stays OS-blind; OS code goes in `server/platform/{linux,macos,windows}/`; one Node app CLI replaces the bash install/update/open scripts; full installed-app parity (login start, launcher, Update/Restart); CI on all three OS. Deferred 2026-11-14, plan ready: `plans/261114-1348-cross-platform-windows-macos/` | Linux-only | Mac/Windows test machine; GitHub Actions OK |
| P30 | Final report on the jade tablet: first line of `last_assistant_message` (Stop hook payload) on the toast and rail row when a scribe reports back; kept in its History entry so Recall shows what it last said | Done shows only "Reporting back" | None |
| P31 | Compact button: when ink is 85 % or more and the scribe is done, the dock offers a button that sends `/compact` to its terminal | Typing /compact by hand | None |
| P32 | Stuck scribe: working with no hook event for N minutes shows a "silent for Nm" marker (a stuck turn, not an idle scribe; P24 stays dropped) | Hung tools or network unnoticed | N |
| P33 | Usage limit: detect "usage limit reached" in a scribe's output, give it a dozing posture with the reset time; with ccs, suggest another profile | Limit hit unnoticed | Detection pattern |
| P34 | Six Ministries: scribes of one repository sit together in one area of the court and are grouped by repository in the rail (pairs with P20) | Repos mixed in the court | Layout per world |
| P35 | Who touched this file: search box in the annals, file name → scribe, day and order | No cross-day lookup | None |
| P36 | Git state per scribe in the dock: branch, changed files, ahead/behind, PR link via `gh` | Repo state needs a terminal | None |
| P37 | Weekly ledger: annals summed over 7 days (tokens per repository, commits, total time scribes waited on the king) | Annals are one day at a time | None |
| P38 | Open in editor: click a file in the annals or dock to open it with `code -g file:line` | Copy-paste paths | Editor command |
| P39 | Scheduled edicts: summon a scribe on a schedule with a ready order (e.g. 8:00 "summarise open PRs and failing CI") | Repeated morning routine | Scheduler (cron vs in-server) |
| P40 | Mini window: an always-on-top strip with only the waiting petitions | Full court needed to see petitions | None |

Not proposed: keeping agents alive across server restarts. PRODUCT.md records that the user decided against tmux, and that agents are reopened with `--resume` after a restart.

## Related documents

- [Project overview and PDR](./project-overview-pdr.md): requirement status by ID
- [System architecture](./system-architecture.md): the security model, the render cost governor and failure modes referenced above
