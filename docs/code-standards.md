# Code Standards

Last updated: 2026-11-14. These describe the conventions the code already follows. They are not a lint configuration, and the repository has none.

## Contents
- [Stack and tooling](#stack-and-tooling)
- [Structure](#structure)
- [Naming](#naming)
- [Module and class patterns](#module-and-class-patterns)
- [Error handling](#error-handling)
- [Security rules in code](#security-rules-in-code)
- [Browser and UI rules](#browser-and-ui-rules)
- [Scene performance rules](#scene-performance-rules)
- [CSS rules](#css-rules)
- [Comments](#comments)
- [File size](#file-size)
- [How to add a world](#how-to-add-a-world)
- [Testing and quality gates](#testing-and-quality-gates)

## Stack and tooling

| Area | Actual choice |
|---|---|
| Language | Plain JavaScript (ES modules). No TypeScript |
| Runtime | Node 22+ (`engines` not declared; README requires 22+) |
| Module type | `"type": "module"` in `package.json` |
| Server | `node:http`, `ws`, `node-pty`, `sirv` (prod), Vite middleware (dev) |
| Browser | Vanilla JS classes, Three.js, `@xterm/xterm` with `@xterm/addon-fit`, `@fontsource` fonts |
| Build | `vite build` with no `vite.config` file (defaults) |
| Formatter and linter | None configured |

Dependencies are declared as caret ranges in `package.json`, and `package-lock.json` is committed.

## Structure

```
server/   backend modules, one responsibility each; loaded by server/index.js
src/
  main.js          composition root (browser): feed, scene, chips, dock, shortcuts, frame loop
  api-client.js    network calls only
  status-vocabulary.js  shared status table, icons and sort helpers
  scene/           Three.js: layout, builders, figures, king, birds, population, desks and porters,
                   camera glide, render cost governor, static merging, picking
  worlds/          world packs: the contract, the registry, one folder per world (hue-court/, hue-pixel/)
  audio/           Web Audio: cues, music, whisper voice (no audio files)
  ui/              DOM components: rail, chips and toasts, dock (tabs, activity strip, shortcuts, panels)
  styles/          two CSS files, shared tokens in :root
index.html         single screen; the dock and stage are empty containers
```

Rules that follow from the layout:
- Server modules do not import from `src/`, and the browser does not import from `server/`. The only shared contract is JSON over HTTP and the hook payload.
- Only `src/status-vocabulary.js` maps status to label and icon. Scene, chips, roster and dock import it. Do not hard-code status text elsewhere.
- Only `src/scene/court-layout.js` holds positions and the palette. Builders take positions from it. Environment colours that are not in the palette live in their own module as constants.
- Configuration is read from `process.env` only in `server/config.js`. Two other reads exist by design: `NODE_ENV` in `server/index.js`, and the agent environment built in `#spawn()` (`agent-session-store.js`), which copies `process.env` without `CLAUDE*` variables.
- Keyboard shortcuts are defined in one place, `src/ui/dock-shortcuts.js`. Add a key there, and handle its action in `main.js`.
- A world's look lives in its folder under `src/worlds/`. Worlds import from `src/scene/` (shared builders, the stage plan); the scene and the UI never import a world folder. Only `main.js` and `src/ui/world-picker.js` reach the worlds, through `world-registry.js`.

## Naming

| Thing | Convention | Examples |
|---|---|---|
| Files | kebab-case, role in the name | `agent-session-store.js`, `render-cost-governor.js`, `desk-porter-crew.js` |
| Classes | PascalCase | `AgentSessionStore`, `AgentFigureMotion`, `RosterRail`, `DockAgentTabs` |
| Functions | camelCase, verb first | `statusFromHookEvent`, `questionFromHookEvent`, `mergeStatic`, `hasAccessToken` |
| Private members | `#` prefix | `#spawn`, `#persist`, `#route`, `#deskIndex` |
| Constants | UPPER_SNAKE_CASE | `EARLY_EXIT_MS`, `SCROLLBACK_BYTES`, `BLOCKING_TOOLS`, `QUESTION_MAX` |
| Env vars | `GRAND_SECRETARIAT_` prefix | `GRAND_SECRETARIAT_PORT` |
| Hook payload fields | Claude Code's own snake_case, read as-is | `hook_event_name`, `tool_name`, `session_id`, `agent_id` |
| Wire messages | Short keys | `{t:'i', d}`, `{t:'r', c, r}` |
| Status values | lowercase single words | `starting`, `idle`, `working`, `asking`, `done`, `exited` |
| Vocabulary | The code says "session" and "agent"; the UI says "scribe" | `session` in `agent-session-store.js`, "Summon a scribe" in the rail |

Formatting in the source: 2-space indent, single quotes, semicolons, trailing commas in multi-line literals.

## Module and class patterns

- **Server:** named exports. One stateful class (`AgentSessionStore extends EventEmitter`) owns all agent state. Route logic is a factory: `createApiHandler(store, token)` returns a request handler. Pure functions (`statusFromHookEvent`, `activityFromHookEvent`, `questionFromHookEvent`) are exported so they can be tested in isolation.
- **Browser UI:** one class per component. Constructors take a container and a handlers object (`{ onOpen, onSummon, onHover }`). Updates arrive through `sync(sessions)`, `update(...)` or `refresh(session)`. Components do not reach into one another.
- **Scene:** builders are functions (`buildCourt(scene)`, `buildSurroundings(scene)`, `addHallDetails(hall)`). Stateful objects are classes (`AgentFigureMotion`, `CourtPopulation`, `DeskPorterCrew`, `RenderCostGovernor`). Each scene object that moves exposes `update(dt, time)`, and returns `true` while it is travelling (see Scene performance rules).
- **Shared helpers:** `court-mesh-helpers.js` caches materials, `status-vocabulary.js` owns all user-visible status text, and `static-scenery-merge.js` owns the merge of fixed geometry.
- **Events:** the store emits `change` with no payload. The API layer turns each change into a full snapshot (`store.list()`). There are no partial updates.

## Error handling

- **Routes:** the whole handler is wrapped in `try`. Expected problems return a JSON `{ error }` with a fixed status (400, 403, 404, 415). Unexpected errors are logged with a scope prefix (`[api]`, `[store]`, `[server]`) and answered with a generic `400 Bad request` or `500`.
- **Request body:** `readJson()` enforces the 1 MB limit and rejects invalid JSON.
- **PTY calls:** writes, resizes and kills are wrapped so that a process that has already exited does not throw (`guarded()` in `attach()`).
- **State file:** writes are atomic (temp file, then rename). A corrupt file is renamed to `.bad` and not overwritten.
- **Hook calls:** the agent-side `curl` ends in `|| true` and swallows its errors, so a dead server cannot stop an agent.
- **Browser:** each `fetch` wrapper throws an `Error` with the server's message, or `Request failed (<status>)`. Panels show the message in plain English with the next step, for example "Check that the server is running, then reopen this panel."
- **Silent catch blocks** are used where failure is expected and harmless. Most carry a comment (missing state file on first run, a detached DOM host, an already exited PTY, an unreadable repository folder). Some do not: a malformed WebSocket message is ignored, and a font-load failure is ignored in `terminal-panel.js`. New code should say why in a comment.

## Security rules in code

These rules are enforced in the code. Keep them when you change it:

1. Bind only to `HOST = '127.0.0.1'` (`server/config.js`). Access from other devices goes through `tailscale serve` and `server/tailnet-serve-access-guard.js`, never a wider bind.
2. Every `/api/*` route and every terminal WebSocket must pass `isTrustedRequest()` and `hasAccessToken()`. Add new routes below that check, not around it.
3. Compare secrets with `timingSafeEqual`, never with `===`.
4. Spawn processes with an argument array. Never build a shell string from user input.
5. Validate every value from the summon form on the server. Repository must come from the scan, profile from `PROFILES`. The client's checks are only for usability.
6. Escape any user-controlled text placed into `innerHTML` with `escapeHtml()`. This includes the question, the order and the step, which come from hook payloads. Use `textContent` for values that are only displayed (the dock title uses it).
7. Store state files with mode 0600 and the state directory with mode 0700.
8. A sub-agent's hook event must not change its master's status, question or step (`http-api-routes.js` checks `agent_id`).

## Browser and UI rules

- Build markup with template strings and `innerHTML` inside components, and escape every interpolated value.
- Each interactive element is a real `<button>` or `<a>` with an accessible name. Overhead chips, dock tabs and roster rows are buttons, so the scene is reachable without the canvas.
- Use `data-*` attributes for state that CSS styles (`data-status`, `data-id`, `data-ticket`). Use `is-*` classes for transient state (`is-active`, `is-armed`).
- Do not add a modal. The terminal and the summon form open in the dock. See [design-guidelines.md](./design-guidelines.md).
- Respect `prefers-reduced-motion`: the CSS rule removes animations, and the figure and scene code skips travel (`matchMedia` checks in each moving module).
- Keys that switch agents go through `attachDockShortcuts()` in capture phase. They are ignored while typing in a form field, and never reach the terminal.

## Scene performance rules

The app stays open for hours beside an editor. These rules keep the court cheap to draw (DESIGN.md, "The Cheap To Render Rule"). The budget is recorded in [system-architecture.md](./system-architecture.md#render-cost-governor).

1. **Merge fixed scenery.** A piece that never moves goes through `mergeStatic(group)` (one mesh per material and shadow flag). A pointer target is merged on its own, into a separate group that carries `userData.pick`, as the drum pavilion is in `court-architecture.js`; it never joins the shared fixed group.
2. **Bake figures.** Rigid figure parts are baked with `bakeRigid()` (`figure-toon-style.js`). Keep a figure to a few meshes.
3. **No per-frame allocation.** Reuse vectors and colours held on the object (`projected` in `court-scene.js`, the cached materials in `court-mesh-helpers.js`). Create geometry and materials once, at build time or on first use.
4. **Report movement.** A scene object's `update(dt, time)` returns `true` while anything of its is travelling. `main.js` ORs these and calls `governor.markActive()`. A new moving thing must do the same, or the court drops to the ambient tier while it moves.
5. **Shadows only where needed.** Figures, desks and fixed scenery cast shadows. Ambient life (birds, koi, smoke, petals, clouds, banners, the sampan, reeds) does not: leave `castShadow` false, which is the default for `new THREE.Mesh`.
6. **No post-processing, no real-time lights, no soft-shadow filter.** A pool of light is a flat disc mesh, not a light.
7. **Frame tiers are set in one place.** The default rates and the power saver table are `RATES` in `render-cost-governor.js`. A 2D world's own rates go in its pack (`environment.camera.fps`), nowhere else.

## CSS rules

- Design tokens are CSS custom properties in `:root` in `court-shell.css`. Values are OKLCH for the shell and hex for the scene. The source of truth is [DESIGN.md](../DESIGN.md).
- Class names are flat and component-based (`.chip`, `.chip-toast`, `.roster-row`, `.dock-tab`, `.dock-activity`). There is no CSS framework or preprocessor.
- Only two files hold styles. Add new shell rules to the file that owns the area (`court-shell.css` for the shell, rail, stage and chips, `court-dock.css` for the dock).
- DESIGN.md's Petition Holds Rule allows one loop that calls for attention, the petition pulse (`petition`, infinite, in `court-shell.css`). Ambient life on the stage (the strolling king, birds, koi) may loop in the scene, but it must stop while a petition waits and when reduced motion is on. Those loops live in the scene modules, not in CSS. Never put a loop in the rail, chips or dock.
- The working toast's three dots also loop (`toast-dot`, infinite, in `court-shell.css`). That is not allowed by DESIGN.md and is listed in [project-roadmap.md](./project-roadmap.md). Do not add another loop.

## Comments

- Each JavaScript module starts with a short header comment that states its role. Keep it that way.
- Comments explain *why* a decision was made, especially when the code looks odd (for example the leading space in `#spawn()`, or the `session` vs `agent` distinction). They do not repeat what the code says.
- Comments are in English, the UI language.

## File size

- Guideline: 200 lines per code file (the project's `development-rules.md`).
- Seven files are over it (`wc -l`, at `a505ed6`): `src/styles/court-shell.css` (360), `src/main.js` (355), `server/agent-session-store.js` (300), `src/ui/terminal-panel.js` (253), `src/styles/court-dock.css` (294), `src/scene/court-surroundings.js` (230) and `src/scene/desk-porter-crew.js` (227). Split them when next edited: the store by concern (PTY lifecycle, persistence, restore, observer data), `main.js` by concern (feed, dock, living court, world loading), the dock stylesheet by part (tabs and activity strip, form, terminal, annals), the shell stylesheet by ground (rail, stage, chips), the surroundings by feature (water, gardens, gate), and the desk crew by job (carry out, carry away, queue).
- The ink branch's new files are all under 200 lines. Keep it that way: the pure helpers (`court-annals-summary.js`, `transcript-usage-parse.js`) stay free of file system and clock access so they can be tested alone.
- Markdown and JSON are exempt.

## How to add a world

A world is a folder under `src/worlds/` with one default export. `hue-court/` is the 3D example and `hue-pixel/` the 2D one. Architecture and the boot flow are in [system-architecture.md](./system-architecture.md#world-packs-and-boot).

1. **Create the folder** `src/worlds/<id>/` (kebab-case id). Name each file by its role, as `hue-pixel-stage.js` and `hue-pixel-ambient.js` are, and keep each under 200 lines.
2. **Export the pack** from `src/worlds/<id>/<id>-world-pack.js` with `export default world`, typed `@type {import('../world-pack-contract.js').WorldPack}`. Its `vocabulary` must include the ink words (`inkWord`, `inkLowWord`, `inkLabel`) and the annals words (`annalsTitle`, `annalsTip`, `annalsLead`, `annalsEmpty`) besides the rest; `checkAudioAndVocabulary()` names each one that is missing. It supplies `id`, `label`, `environment`, `palette`, `audio`, `vocabulary`, `buildStage` and the six `bodies` factories.
3. **Register it** in `WORLDS` in `src/worlds/world-registry.js`: `{ id, label, description, load: () => import('./<id>/<id>-world-pack.js') }`. Keep the import path a literal, so Vite builds its own chunk. The registry `id` is the one in `?world=` and in the saved choice; the pack's `id` and `label` must match it.
4. **Check the contract.** In `npm run dev`, `assertWorldPack()` throws one error naming every missing or mistyped member. At every boot, `assertWorldStage()` requires `buildStage()` to return `{ summonTarget, summonAnchor, ambient }`, where `summonTarget.userData.pick.kind` is `'summon'`.
5. **Walk the states by hand.** Open the world with `?world=<id>` and run through summon, order, petition, answer, report and dismiss. Turn the power saver on and check the court still shows a petition. For a 2D world, check that the view pans and zooms and does not turn.
6. **No image or audio files.** Paint sprites and textures in code, as `hue-pixel-sprite-painter.js` does. Sounds are synthesized: the pack's `audio` (`hue-court/hue-court-audio.js` is the model: instruments, reverb, eleven cue scores, a music class, the typing murmur) builds on `src/audio/web-audio-primitives.js`; a world may import another's audio. Words go in `vocabulary` (`hue-court/hue-court-vocabulary.js` lists every key; plurals as `{ one, many }` or functions). UI colours: add one `:root[data-world="<id>"]` block to `src/styles/world-themes.css`, add the id to the short list in the `index.html` head script, and leave the status colours (glaze, jade, danger) alone.
7. **For a 2D world**, set `environment.camera` to `{ type: 'orthographic', view: 'isometric', zoom: [min, max], pixelScale: <integer>, fps }`, and build its bodies from the sprite helpers in `src/scene/sprite-body-animators.js`.
8. **Keep the stage plan.** Desks, the throne and the paths come from `court-layout.js`. Moving them changes every world, so it is a separate decision.
9. **Dark worlds.** The renderer uses neutral tone mapping, which crushes the smallest colour channel of a very dark pixel, so a near-black albedo under cool light renders as saturated blue or teal. Keep surfaces mid-dark (the space station's deck is `0x5c6572`) and darken by lighting, not by albedo.

## Testing and quality gates

- **Unit tests for the pure helpers.** `npm test` runs `node --test "test/*.test.js"` (Node's built-in runner, no dependency). Put a new pure function in its own module and give it a file under `test/`, named after the module. Nothing tests the server routes, the browser or the court scene; those are checked by hand (see [deployment-guide.md](./deployment-guide.md)).
- **No linter or formatter.** Keep to the style above by reading the neighbouring code.
- **Build:** `npm run build` must pass after any change to `src/` or CSS.
- **Manual checks** cover what the tests do not: the running server and the court. See [deployment-guide.md](./deployment-guide.md) for the smoke test to run after a change.
- The `window.court` debug handle in `src/main.js` exposes internal state to the browser console (`state`, `population`, `porters`, `legion`, `audio`, `king`, `edicts`, `flock`, `camera`, `controls`, `cost()`, `THREE`). `court.cost()` reports the tier, the frames drawn per second, draw calls and triangles. It is a development aid, and it is not a stable API.
