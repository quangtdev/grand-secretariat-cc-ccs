# Codebase Summary

Last updated: 2026-11-14. Branch `feat/ink-annals-idle-scribes` (tip `a505ed6`, base `ddcdbd7`). This branch adds the ink level (context used and tokens per scribe, read from its transcript), the court annals (a per-day chronicle, `GET /api/annals`), the hook intake module, and unit tests run by `npm test`. Master has two commits this branch does not have yet. LOC are `wc -l` on the working tree at `a505ed6`.

## Totals

| Group | Files | LOC |
|---|---|---|
| Server (`server/`) | 20 | 1,722 |
| Browser entry and shared (`src/*.js`) | 3 | 494 |
| Worlds (`src/worlds/`) | 98 | 6,972 |
| Scene (`src/scene/`) | 35 | 4,108 |
| Audio (`src/audio/`) | 2 | 183 |
| UI (`src/ui/`) | 22 | 1,759 |
| Styles (`src/styles/`) | 3 | 721 |
| Tests (`test/`) | 8 | 396 |
| HTML entry (`index.html`) | 1 | 56 |
| **Application code and tests** | **192** | **16,411** |

Seven files exceed the 200-line guideline: `src/styles/court-shell.css` (360), `src/main.js` (277), `src/styles/court-dock.css` (294), `server/agent-session-store.js` (300), `src/ui/terminal-panel.js` (253), `src/scene/court-surroundings.js` (230) and `src/scene/desk-porter-crew.js` (227). Every new file on this branch is under 200. Every file under `src/worlds/` is under 200.

## Repository tree

```
grand-secretariat/
├── index.html                     HTML shell: rail (title, tally, buttons, roster, foot), stage canvas, chip layer, dock
├── package.json                   Scripts: dev, build, start, install-app, update; ESM; dependencies
├── package-lock.json              npm lockfile
├── .gitignore                     node_modules, dist, .idea, .impeccable review and cache
├── README.md                      Overview, keyboard, worlds, run instructions, env vars, security
├── PRODUCT.md                     Product truth (users, purpose, principles)
├── DESIGN.md                      Design system (source of truth for visual design)
├── .impeccable/                   Design-tool state and design direction
├── scripts/                       Desktop-app install, update and launcher scripts; icon
├── server/                        Node backend
├── src/                           Browser frontend: engine (scene, ui, audio) and worlds (looks)
├── test/                          Unit tests for pure helpers (`node --test`, run by `npm test`)
└── docs/                          This documentation set
```

## Server (`server/`)

| File | Role | LOC |
|---|---|---|
| `index.js` | Entry point. Creates the access token, mounts Vite (dev) or `sirv` over `dist/` (prod), routes requests, starts the store on listen, handles shutdown signals | 83 |
| `config.js` | Reads every `GRAND_SECRETARIAT_*` variable; host, port, launcher, profiles, flags, state dir, scrollback size, cookie and header names, allowed Host and Origin values | 60 |
| `agent-launcher-detection.js` | `isOnPath()`; with nothing configured, finds `ccs` and its account profiles when installed, else plain `claude` | 41 |
| `agent-session-store.js` | `AgentSessionStore` (EventEmitter). Spawns and owns agent PTYs, scrollback (400 000 characters), status, activity, `question` (set by `setQuestion()`, cleared when the agent leaves `asking`), resume bookkeeping, the state file, restore; `annotate(id, patch)` merges observer data (such as `ink`) into the feed; emits `left` when a scribe leaves | 300 |
| `claude-hooks-settings.js` | Writes `agent-hooks-settings.json`; maps hook payloads to status (`statusFromHookEvent`); `hookTokenFor()` | 80 |
| `hook-activity-description.js` | Turns hook events into the words shown: the order (`orderFromHookEvent`, 56 characters), the current step (`activityFromHookEvent`, 48 characters) and the question (`questionFromHookEvent`, 80 characters) | 106 |
| `subagent-soldier-tracker.js` | Tracks an agent's sub-agents from hook events: mustered on the Agent tool, dismissed when they report back | 112 |
| `hook-event-intake.js` | `handleHookEvent()`: applies one hook event to the store (status, question, activity, soldiers), then hands it to the observers, ink and annals. Their work is fire-and-forget, so the hook's reply never waits on a transcript read. A hook from a scribe that already left is not recorded or read | 48 |
| `transcript-usage-parse.js` | Pure. Reads transcript JSONL lines: the last main-chain assistant `message.usage` (context used), token totals with each streamed message counted once, and `contextLimitFor()` (200k, latched to 1M once more than 200k was seen, or the env override) | 62 |
| `transcript-usage-reader.js` | `TranscriptUsageReader`: per scribe, reads the transcript from its last offset in 1 MB chunks that yield to the event loop. Throttled to one read per 2 s, immediate on `Stop`. Accepts only an absolute `.jsonl` under the Claude Code `projects` folder (`$CLAUDE_CONFIG_DIR`, `~/.claude` or a ccs profile in `~/.ccs/instances/<profile>`). Writes `ink` through `annotate()` (cleared with `null` on `/clear`) and reports token deltas at `Stop`. A conversation started in this server's life (`SessionStart` with source `startup` or `clear`) counts its tokens from zero; a resumed one is baselined | 129 |
| `transcript-path-guard.js` | Which transcript files may be read: the real path must be a `.jsonl` regular file inside `$CLAUDE_CONFIG_DIR/projects`, `~/.claude/projects` or `~/.ccs/instances/<profile>/projects`; the reader then opens that real path | 51 |
| `court-annals-events.js` | Pure. Which annals entries a hook event is worth: the order (first 200 characters), file edits, commits (from the `git commit` output or its `-m` message), and throne enter and leave | 66 |
| `court-annals-log.js` | `CourtAnnalsLog`: append-only JSONL, one file per local day in `<state>/annals/`. Writes are queued in order; the folder is 0700 and the files 0600. `prune()` removes days older than `GRAND_SECRETARIAT_ANNALS_DAYS`, once at start and then daily. `dayKey()` gives the local day | 65 |
| `court-annals-summary.js` | Pure. Turns one day's lines into a per-scribe chronicle: orders, files and commits (capped), throne waits, tokens and when a scribe left. Broken lines are skipped | 76 |
| `court-annals-reader.js` | `annalsResponse()` for `GET /api/annals?day=`: strict `YYYY-MM-DD` check (400); without `day`, today or else the latest earlier day with records. Answers the day's chronicle, `prevDay` (a day with records), `nextDay` (a day with records, or today) and `today`. A day file over 5 MB answers 413 | 54 |
| `http-api-routes.js` | `createApiHandler(store, token, observers)`: `/api/*` routes, SSE feed, summon validation, `GET /api/annals`, and the hook route (which calls `hook-event-intake.js`); `isTrustedRequest()` and `hasAccessToken()` | 164 |
| `terminal-websocket-bridge.js` | Upgrades `/ws/term/<id>` after the trust checks and connects the socket to the agent's PTY | 48 |
| `app-maintenance.js` | `maintenanceInfo()` / `startMaintenance()`: restart the systemd service, or run `scripts/update-app.sh` (optionally `--pull`) as a transient unit | 62 |
| `dismissed-scribe-history.js` | `DismissedScribeHistory`: `history.json` (newest first, max 50, deduped by conversation); `record()`, `get()`, `remove()`, `list()` | 71 |
| `repository-scanner.js` | `listRepositories()`: finds `.git` folders up to 4 levels under the workspace root; skips hidden and build folders; 30 s cache | 51 |
| `tailnet-serve-access-guard.js` | `isAllowedTailnetCaller()`: a request that came through `tailscale serve` passes only under the tailnet Host and from the configured Tailscale login; called by `isTrustedRequest()` | 20 |
| `folder-browser.js` | `listFolder()` (one level of sub-folders, home by default, hidden ones left out) and `resolveFolder()` (validates a chosen path) behind `GET /api/folders`, so an agent can start in any folder | 39 |

Changed on this branch: `http-api-routes.js` (hook intake moved to `hook-event-intake.js`; `GET /api/annals` added), `agent-session-store.js` (`annotate()`, the `left` event), `config.js` (`GRAND_SECRETARIAT_CONTEXT_LIMIT`, `GRAND_SECRETARIAT_ANNALS_DAYS`) and `index.js` (creates the annals log and the ink reader, passes them to the API).

## Browser entry and shared (`src/`)

| File | Role | LOC |
|---|---|---|
| `main.js` | Composition root. Loads the chosen world (`loadWorld`), imports its stage driver (court or board), subscribes to the feed, owns `state` (selection, hover, pending open), opens and closes the dock, the Alt shortcuts, the power saver switch; `window.court` exposes `world`, `state`, `audio`, `stage` and the driver's `debug` (court: `population`, `porters`, `legion`, `king`, `edicts`, `camera`, `controls`, `cost()`, `THREE`, `saver()`; board: `board`, `dockets`) | 277 |
| `api-client.js` | `subscribeToSessions()` (EventSource), `fetchSummonOptions()`, `summonAgent()`, `dismissAgent()`, `fetchAppInfo()`, `runAppAction()`, `terminalSocketUrl()` | 45 |
| `status-vocabulary.js` | `STATUS` table (label, icon, `atThrone`), `ICONS` (16-unit SVGs, including `world` and `leaf` for the rail foot), `statusOf()`, `waitingFirst()`, `formatElapsed()`, `escapeHtml()`, `tailOfPath()` | 94 |

## Worlds (`src/worlds/`)

A world is the look of one court: lights, buildings, costumes, figure bodies and background life. The engine (`src/scene/`, `src/ui/`) owns behaviour: walking, queueing, bowing, desks carried out, the king's walks. The stage plan (desks, throne, petition spots, paths, drum pavilion) is shared in `src/scene/court-layout.js`, so every world puts things in the same places. See [system-architecture.md](./system-architecture.md#world-packs-and-boot) for the boot flow and the pack contract.

| File | Role | LOC |
|---|---|---|
| `world-pack-contract.js` | Typedefs for `WorldPack`, `WorldEnvironment`, the two camera specs, the body interfaces and the stage. `assertWorldPack()` (checked in dev at boot, names every missing member) and `assertWorldStage()` (every boot) | 195 |
| `world-registry.js` | `WORLDS` (id, label, description, lazy `load`), `DEFAULT_WORLD = 'hue-court'`. `selectedWorldId()` reads `?world=`, then the saved choice; `chooseWorld()`, `forgetWorld()`, `resetToDefaultWorld()`; `loadWorld()` falls back to the default when a non-default pack fails to import | 91 |
| `zoo/*` (26 files, under 200 lines each) | The Zoo world: `zoo-world-pack.js` (environment, palette, bodies), `zoo-stage.js` (lawn, paths, fence, lookout hut on the dais, entrance arch and ticket booth as the summon target, duck pond, trees), ambient life with `settle` (ducks, butterflies, balloons, birds), animal bodies (`zoo-animal-body-factory.js` + three `zoo-species-*.js`, painted faces, sign and medal props, cubs) on the shared humanoid pose maths, keepers, feeding trough, thrown treat, synthesized audio (`zoo-instruments.js`, `zoo-audio-cues.js`, `zoo-ambience.js`) and vocabulary; ink gauge: a feed bucket whose grain sinks (`zoo-feed-bucket-gauge.js`) | 1,689 |
| `office/*` (25 files, under 200 lines each) | The Modern office world: `office-world-pack.js` (environment without shadows, palette, bodies), `office-stage.js` (floor and glass window walls, the manager's glass corner office with east steps, reception desk and elevator doors as the summon target, coffee counter, lounge, water cooler, skyline and clouds), ambient life with `settle` through `office-ambient-gate.js` (clouds, swaying plants, fans, cooler bubbles, dust motes, notification pings), people from one builder (`office-person-parts.js`: employee with an own chair and held ticket and laptop, manager, contractor, movers) on the shared humanoid pose maths, desk with sticky notes, paper plane, synthesized audio (`office-instruments.js`, `office-audio-cues.js`, `office-ambience.js`) and vocabulary; ink gauge: a level strip on the desk (`office-context-gauge.js`) | 1,570 |
| `space-station/*` (20 files, under 200 lines each) | The Space station world: `space-station-world-pack.js` (environment, palette, bodies), `space-station-stage.js` (deck, command bridge on the dais, teleporter pad as the summon target, star-map table, airlock, beacon), ambient life with `settle` (starfield dome and planet, floor light strips, status lights, shuttle, holo globe), crew bodies (`space-station-crew-body.js`) on the shared humanoid pose maths, captain, hover and cargo drones (own `animate`), console with holo panels, data packet, synthesized audio (`space-station-instruments.js`, `space-station-audio-cues.js`, `space-station-ambience.js`) and vocabulary; ink gauge: a fuel cell tube (`space-station-fuel-cell-gauge.js`) | 1,454 |
| `order-rail/*` (2 files) | The Order rail board world (`kind: 'board'`): `order-rail-world-pack.js` (office instruments rescored: pass bell, ticket stamp) and `order-rail-vocabulary.js` (kitchen words + the board's station words) | 109 |
| `world-vocabulary.js` | `words`: the shell's words for the active world, installed once by `main.js`; UI modules read its fields when they render | 19 |
| `world-audio-and-vocabulary-contract.js` | What a pack supplies for sound (`audio`) and words (`vocabulary`, including the ink and annals words), and the dev-time check of both | 82 |
| `hue-court/hue-court-audio.js` | The Huế court's sound in the pack's `audio` shape: instruments, hall reverb, one score per cue, background music, typing whisper | 62 |
| `hue-pixel/hue-pixel-desk-layout.js` | The pixel court's own desk slots, spaced so neighbours do not stack on screen in the isometric view | 15 |
| `hue-court/hue-court-world-pack.js` | The default world: the 3D Huế court's environment (haze, lights, shadows, perspective camera), palette and body factories | 48 |
| `hue-court/hue-court-stage.js` | The 3D stage: throne hall, yard, drum pavilion, gardens, river, sky (calls the scene builders in `src/scene/`) | 42 |
| `hue-court/hue-agent-body.js` | The scribe's costume: mandarin cap, dyed robe, brush, scroll and tablet; `buildHueAgentBody()` | 84 |
| `hue-court/hue-ruler-body.js` | The king's costume: yellow bào with clouds, dragon, red hem, crown, beard; `buildHueRulerBody()` | 83 |
| `hue-court/hue-guard-body.js` | Body of a palace guard, shared by soldiers (with spear) and porters (without). Moved here from `src/scene/guard-figure-body.js` | 52 |
| `hue-court/hue-helper-porter-and-edict-bodies.js` | `buildHueHelperBody()` (soldier), `buildHuePorterBody()`, `buildHueEdictProjectile()` (the flying order) | 43 |
| `hue-pixel/hue-pixel-world-pack.js` | The pixel 2D world: isometric orthographic camera (`zoom` 0.8 to 2.6, `pixelScale: 3`, `fps` active 30, moving 12, ambient 8, petition 6), palette, bodies as sprites | 55 |
| `hue-pixel/hue-pixel-stage.js` | The pixel stage: painted ground, one merged mesh of walls, throne hall, bridge and pavilion; returns the summon target and ambient life | 83 |
| `hue-pixel/hue-pixel-stage-textures.js` | Patterns and upright props of the pixel stage, painted at boot into one atlas | 132 |
| `hue-pixel/hue-pixel-ground-painter.js` | The ground, painted once at boot as one flat texture | 88 |
| `hue-pixel/hue-pixel-hall-and-pavilion.js` | The throne hall and the drum pavilion as textured blocks | 62 |
| `hue-pixel/hue-pixel-iso-mesh-builder.js` | Builds static scenery into very few meshes; `ART_PIXEL = 1/9` (one art pixel in world units) | 125 |
| `hue-pixel/hue-pixel-sprite-painter.js` | Pixel painter on canvases: `dot`, `rect`, `line`, palette-indexed `rows`; a cell has its own origin | 69 |
| `hue-pixel/hue-pixel-humanoid-painter.js` | Paints one frame of a person into a 24 x 32 cell, in the Huế costumes | 154 |
| `hue-pixel/hue-pixel-figure-sheets.js` | Sprite sheets for the scribe (one per robe dye), the king, the soldier and the porter | 86 |
| `hue-pixel/hue-pixel-desk-and-edict-sprites.js` | The desk and the flying edict as sprites; the desk sheet has a frame per pile height and ink-pot level (24 frames); the edict owns its geometry and disposes it when its flight ends | 81 |
| `hue-pixel/hue-pixel-ambient.js` | Background life of the pixel court: egrets that circle and land on the roof ridges, petals, glints and koi, as one sprite batch (one mesh, one draw call) | 137 |

## Board (`src/board/`)

| File | Role | LOC |
|---|---|---|
| `order-rail-board.js` | `createOrderRailBoard()`: the board world's `StageDriver`; stations, docket placement and FLIP, focus kept on re-insert and handed on when a focused docket leaves, station heads (count, oldest wait) | 193 |
| `order-rail-docket-card.js` | One docket: markup, in-place patching (status band, step, order, prep cooks, context gauge), the per-agent dye of its clip | 110 |
| `order-rail-docket-motion.js` | WAAPI motion: station-to-station flight by a clone plus the landing swing, print, spike, step roll, order stamp; `still()` for reduced motion | 129 |

## Scene (`src/scene/`)

| File | Role | LOC |
|---|---|---|
| `court-layout.js` | Shared stage plan: desks, throne, drum pavilion, petition spots, king seat, east stair and outings, lotus pond, bird perches; the palette and robe dyes | 132 |
| `court-stage-driver.js` | `createCourtStageDriver({world, audio, handlers})`: the `StageDriver` of a scene world. Builds the court, figures, porters, soldiers, chips, the king and edicts; pointer picking; the frame loop and chip placement gating | 138 |
| `court-scene.js` | `createCourtScene(canvas, stage, environment)`: renderer, the world's lights, fog and shadows, the camera from `court-camera-rig.js`, pixel ratio and `is-pixelated` for 2D worlds, `setPowerSaver()`, `start()` frame loop with real `dt`, `cost()` readout | 135 |
| `court-camera-rig.js` | `createCameraRig()`: `perspective` (orbit, left pan, middle turn, right zoom) or `orthographic` with `view: 'isometric'` (yaw 45°, pitch 30°, pan and zoom only, frustum fits the whole yard at zoom 1 for any aspect); both keep the look-at point over the court | 138 |
| `render-cost-governor.js` | `RenderCostGovernor`: frame-rate tiers (active 60, moving 30, ambient 20, petition 12, still 0: the loop sleeps), a world's own rates, the power saver table (`setSaver()`), `markActive()`, `markMoving()`, `setPetition()`, `sleepUntilNeeded()`, `frameDue()` (keeps only the lateness of a frame, so rates average out on any display), `shadowsDue()` | 167 |
| `static-scenery-merge.js` | `mergeStatic(group)`: one mesh per material and shadow flag; `mergeAsVertexColours()` for vertex-coloured merges | 103 |
| `camera-focus-ease.js` | `CameraFocusEase`: glides to an opened scribe (0.6 s, at most 17 units away) and back; a drag or scroll cancels it; it respects `maxZoom` in 2D; reduced motion is a cut | 77 |
| `scene-pointer-picking.js` | Raycast hover and click on figures and the drum pavilion; separates clicks from drags | 43 |
| `court-architecture.js` | Static 3D court: paved yard, throne hall, east stair, drum pavilion (merged, kept pickable); calls `addHallDetails(hall)` | 153 |
| `throne-hall-details.js` | `addHallDetails(hall)`: column bases, name board over the central bay, lanterns, ridge sun disc and finials, balustrade; on the dais armrests, footstool, canopy and fans | 105 |
| `court-surroundings.js` | River and bridge, trees, far hills, garden pieces (rockery, bonsai, lanterns), grass patches, reeds, sandy bank (`buildSurroundings()`); exports `seeded()` and `lotus()` | 230 |
| `sky-dome-and-clouds.js` | Mist-to-blue dome and four drifting clouds; backdrop only, casts no shadow | 58 |
| `river-water-and-sampan.js` | Scrolling water texture (one material) and one sampan on the southern reach; the sampan rests while a petition waits | 82 |
| `south-gate-and-banners.js` | Three-bay south gate beyond the bridge head; two yard banners that hang still while a petition waits | 69 |
| `ground-grab-panning.js` | Drag-to-pan that keeps the paving under the cursor at any tilt, with either camera; no easing or coasting | 55 |
| `court-mesh-helpers.js` | Shared builders: cached materials, boxes, columns, hip roof, glazed tile and paving textures | 113 |
| `court-population.js` | `CourtPopulation`: diffs the session list into figures; petition placement; desk placement and removal through the crew; sheet pile per step; ink gauge per desk through `setInk` (only when the 5 % step or the desk changes); pool of light under the open scribe | 182 |
| `agent-figure-motion.js` | `AgentFigureMotion`: one agent's group, walk, pose choice, `bow()`, ground ring; calls the world's `AgentBody.animate()` after each move. Replaces the behaviour half of `courtier-figure.js` | 138 |
| `humanoid-pose-animator.js` | Poses of a two-armed figure and the easing of torso and arms into them (3D bodies) | 36 |
| `ruler-figure-motion.js` | `RulerFigureMotion`: the king's movement and poses (seated, standing, gazing, walking), the walk down the east stair, `point()`. Replaces the behaviour half of `king-figure.js` | 120 |
| `sprite-figure-body.js` | `SpriteFigure`: one textured plane that always faces the isometric camera, so a figure is one draw call; heading picks front, back or the mirrored side view; picking ignores transparent cells (alpha read once per sheet) | 165 |
| `sprite-body-animators.js` | `spriteAgentBody`, `spriteRulerBody`, `spriteHelperBody`, `spritePorterBody`: the body interfaces over a sprite sheet; the clip follows the engine's state; the name chip follows the clip actually playing | 82 |
| `soldier-figure.js` | One sub-agent as a soldier: smaller than its master, rises and sinks with its seal, drills and bows (behaviour only; costume from the world) | 103 |
| `soldier-legion.js` | Keeps soldiers in step with the feed: summoned from a seal, ranked behind the master's desk | 101 |
| `desk-porter-crew.js` | `DeskPorterCrew`: two porters carry a desk out on summon and away on dismiss; one `desk` knock; `place()` for page load, reduced motion, a hidden tab or a queue of two; a bring joins one already under way | 227 |
| `writing-desk.js` | `WritingDesk`: low table, mat, the inkstone gauge and a sheet pile (up to 6 sheets); fixed parts in one vertex-coloured mesh | 66 |
| `inkstone-ink-gauge.js` | The Huế desk's ink gauge: a pale inkstone with a pool of ink that shrinks with `setInk(left)`; owns its geometry | 39 |
| `ink-left-steps.js` | Pure. `inkLeftSteps(ink)`: ink left 0..1 in 5 % steps from `session.ink.pct`; 1 when there is no reading | 15 |
| `king-stroll-routine.js` | `KingStrollRoutine`: decides when he strolls, runs back on a petition, walks back on a report or typing, stays seated while anyone waits; `setLeisure(false)` (power saver) stops the walks | 148 |
| `royal-edict-flight.js` | `RoyalEdictFlight`: a glaze scroll arcs from the king's hand to a scribe, trailing sparks; the scribe bows on landing | 106 |
| `ambient-bird-flock.js` | `AmbientBirdFlock`: seven egrets circle, land on roof perches and chirp; `settle()` holds them while a petition waits | 175 |
| `ambient-particles.js` | `createAmbientParticles()`: incense smoke over the urns, petals from the garden trees, dragonflies over the pond; hidden under reduced motion | 174 |
| `lotus-pond-with-koi.js` | `buildLotusPond()`: hollow basin (merged), transparent water, lotus, koi, rising ripples | 158 |
| `summoning-portal-effect.js` | One-shot seal ring with rising light and sparks (golden on muster, jade on dismissal); exports `sparkTexture` | 136 |
| `figure-toon-style.js` | Shared 3D figure look: `toon()` materials, `part()`, `faceMaterial()`, `bakeRigid()` (one mesh per rigid part) | 101 |
| `court-costume-parts.js` | Nguyễn court dress pieces for the 3D bodies: `mandarinHat`, `kingCrown`, `crossedCollar`, `belt`, `rankBadge`, `boots`, `sleevedArm`, `dragonRobeMaterial`, `beard`, `guardHat`, `guardEmblem` | 176 |

Removed on this branch: `courtier-figure.js` (201 lines) and `king-figure.js` (173 lines). Their behaviour moved to `agent-figure-motion.js` and `ruler-figure-motion.js`; their costumes moved to `src/worlds/hue-court/`.

## Audio (`src/audio/`)

| File | Role | LOC |
|---|---|---|
| `court-audio.js` | `CourtAudio`: the engine. Which status change calls which cue, `murmur()` for typing (70 ms throttle), cue gap, resting the engine, Sounds and Music toggles. Sounds come from the world's `audio` | 154 |
| `web-audio-primitives.js` | Shared `noise()`, `envelope()` and `play()` helpers | 29 |

The Huế sound moved into the world: `src/worlds/hue-court/hue-court-audio.js` (cue scores), `court-sound-synth.js` (instruments, hall reverb), `court-ambience.js` (music), `court-whisper-voice.js`. Words: `src/worlds/world-vocabulary.js` (live `words`) and `hue-court/hue-court-vocabulary.js`. UI colours per world: `src/styles/world-themes.css`.

The sounds and music are the Huế court's own. A new world reuses them (see [code-standards.md](./code-standards.md#how-to-add-a-world)).

## UI (`src/ui/`)

| File | Role | LOC |
|---|---|---|
| `activity-text.js` | `activityText()`: the step an agent is on, worded by the current world (the server sends the Huế text plus the delegation task) | 6 |
| `apply-vocabulary-to-page.js` | Replaces the Huế text `index.html` carries before boot with the active world's words | 13 |
| `dock-popup-close-on-outside-click.js` | Popup mode: a real click outside the popup hides it; a press that becomes a drag, or a click that opens another scribe, does not | 36 |
| `world-picker.js` | `WorldPicker`: globe button in the rail foot; a popover of radio options (label and one-line note); click, Enter or Space chooses (arrow keys only move); a different world calls `chooseWorld()` and reloads | 80 |
| `power-saver-toggle.js` | `PowerSaverToggle`: leaf button in the rail foot; `aria-pressed`; remembers the choice in `localStorage` (`grand-secretariat:saver`); calls `onChange` at once and once at start | 49 |
| `roster-rail.js` | `RosterRail`: tally, Summon, History and Annals buttons, roster grouped "Before the throne" and "At their desks" with counts; each row has a live step line (working) or question (before the throne), and the scribe's ink (`~62% ink`) at the end of its meta line | 97 |
| `overhead-chips.js` | `OverheadChips`: one button per agent plus the summon chip; toast (step and question at rest; order and soldiers on hover or open); per-frame placement without overlap, called only when something moved or every 200 ms | 157 |
| `dock-agent-tabs.js` | `DockAgentTabs`: one pill per agent, waiting ones first; `SHORTCUT_HINT` as its tooltip | 35 |
| `dock-popup-drag-to-move.js` | Popup mode: drag by header or tab strip to move, offset clamped on screen and remembered, double-click recentres | 76 |
| `dock-popup-resize-by-edges.js` | Popup mode: resize from any edge or corner (opposite edge stays put), size remembered, double-click an edge resets | 108 |
| `dock-popup-or-docked-presentation.js` | Dock mode: docked right or centred popup (remembered); popup grows from the last click and shrinks on close; `dockModeToggleHtml()` header button | 102 |
| `dock-activity-strip.js` | `DockActivityStrip`: one line under the header: order › step, soldiers roll, ink (`~62%`, the word in its tooltip), elapsed time; the question on a glaze strip while asking | 56 |
| `dock-shortcuts.js` | `dockShortcut()` and `attachDockShortcuts()`: Alt+↓ / Alt+↑ (next, previous), Alt+W (longest waiting), Alt+` (close or reopen); capture phase on `window` | 29 |
| `terminal-panel.js` | `TerminalPanel`: dock with tabs, header (name, meta, two-press Dismiss, close), activity strip, xterm.js bound to one agent's WebSocket. Reports `onTyping` and `onOrder` (Enter after at least three typed characters) | 253 |
| `terminal-touch-scroll.js` | `enableTerminalTouchScroll(host, term)`: xterm.js 6 has no touch scrolling, so a one-finger vertical drag on the terminal host becomes `term.scrollLines()` (normal buffer, no mouse tracking) or a wheel event xterm reports to a full-screen program; a flick glides. Returns its own remover; a sideways drag is left to the browser (pans a zoomed-in page); `.terminal-host` has `touch-action: pan-x pinch-zoom` |
| `collapsible-rail-and-resizable-dock.js` | Shell layout controls: hide and show the rail; drag the dock's left edge to resize it (remembered in `localStorage`) | 96 |
| `history-panel.js` | `HistoryPanel`: dock list of dismissed agents with Recall and Forget | 95 |
| `court-annals-panel.js` | `CourtAnnalsPanel`: dock view of one day of the annals, grouped by scribe (dismissed ones included); day arrows; each day is fetched when shown, reopen the panel to refresh | 81 |
| `court-annals-text.js` | Pure. `annalsCounts()` ("3 orders · 12 files · 2 commits · waited 1h 05m · 1.4M tokens"), `formatWaited()`, `clockTime()`, `dayLabel()` ("Today · Sat 14 Nov") | 40 |
| `ink-level-text.js` | Pure. `inkText()` ("~62% ink", the low wording from 85%, never a colour), `inkDetail()` (the tooltip) and `formatTokens()` (950, 12k, 1.4M) | 30 |
| `summon-panel.js` | `SummonPanel`: the summon form (repository, profile, session mode, ticket, first order); remembers the last repo and profile in `localStorage` | 141 |
| `app-maintenance-controls.js` | Rail-foot "App" disclosure: Pull & update, Update and Restart; shown only under the systemd service; polls `GET /api/app` | 122 |
| `folder-browser.js` | `mountFolderBrowser()`: the **Browse** panel of the summon form; walk folders or type a path, then use it as the working folder | 57 |

## Styles (`src/styles/`)

| File | Role | LOC |
|---|---|---|
| `court-shell.css` | `:root` tokens, three-column shell, rail (19rem), roster rows with step line, chips, toast (ink material, petition question), petition animation, toast dots, sound toggles and rail-foot buttons, reduced-motion and 820 px rules | 360 |
| `court-dock.css` | Dock: tab strip, header, activity strip (asking strip is glaze), form controls, segments, terminal well, the annals panel (`.annals-*`), 1100 px rule. The `.status-pill` rules are no longer used by the markup | 294 |
| `world-themes.css` | Per-world shell colours: one block per world that sets its own rail and ink tokens over `court-shell.css`'s `:root`; the Huế worlds have none | 83 |
| `order-rail-board.css` | The Order rail board: paper/steel tokens, stations with a graphite rail, dockets (clip, status band, tear line, gauge), the petition ring (`::after`), the ticket slot, stacking under a 44rem stage (container query) | 230 |

Fonts are imported in `src/main.js` from `@fontsource` packages (Be Vietnam Pro 400, 500, 600; JetBrains Mono 400, 700).

## Config and documentation files

| File | Role | LOC |
|---|---|---|
| `index.html` | Single screen: rail, stage canvas, chip layer, dock container | 56 |
| `package.json` | Scripts and dependencies | 32 |
| `package-lock.json` | npm lockfile | 1055 |
| `scripts/install-app.sh`, `open-app.sh`, `update-app.sh` | Desktop-app install, launcher and update scripts | 113, 24, 29 |
| `README.md` | Overview, keyboard, worlds, run, env vars, security | 113 |
| `PRODUCT.md` | Product truth: platform, users, purpose, constraints, principles | 50 |
| `DESIGN.md` | Design system: tokens (YAML front matter), rules and components, the Worlds section | 500 |
| `docs/*.md` | This documentation set | see `wc -l docs/*.md` |

## Tests (`test/`)

`npm test` runs `node --test "test/*.test.js"` (Node's built-in runner, no dependencies). The tests cover pure functions only; nothing starts the server or a browser.

| File | Covers | LOC |
|---|---|---|
| `order-rail-board-world.test.js` | The board pack passes `assertWorldPack`; missing vocabulary, board words or an unknown `kind` are refused; `index.html`'s pre-paint id list matches `WORLDS` | 32 |
| `ink-left-steps.test.js` | `inkLeftSteps()`: no reading is full, 100 - pct in 5 % steps, clamping, no churn within a step | 26 |
| `ink-level-text.test.js` | `inkText()`, `inkDetail()`, `formatTokens()` | 30 |
| `transcript-usage-parse.test.js` | Context and totals per message id, ignored lines, compaction, partial lines, the 1M latch and the env override | 60 |
| `transcript-usage-reader.test.js` | Resume baseline, only observed spend reported, path and sub-agent checks, rewritten file, `/clear` | 83 |
| `court-annals-events.test.js` | Which entries a hook event gives: orders, file edits, commits, throne enter and leave | 51 |
| `court-annals-summary.test.js` | Per-scribe counts, throne waits, rename and recall, broken lines, `endOfDay()`, the `annalsResponse()` answers | 90 |
| `court-annals-text.test.js` | `formatWaited()`, `annalsCounts()`, `dayLabel()` | 22 |

## Local-only (not tracked, not documented in detail)

| Path | Notes |
|---|---|
| `node_modules/` | npm install output |
| `dist/` | Production build output (gitignored; produced by `npm run build`) |
| `.idea/` | IDE project files (gitignored) |
| `.impeccable/review/`, `.impeccable/questions/`, `.impeccable/hook.cache.json` | Local design-tool state (gitignored) |
| `plans/` | Planning folder for this work; not part of the application |

## Not present

No linter or formatter configuration, no `vite.config.*`, no CI workflow, no TypeScript, no UI or end-to-end tests. There is no `docs/project-changelog.md`. See [code-standards.md](./code-standards.md) and [project-roadmap.md](./project-roadmap.md).
