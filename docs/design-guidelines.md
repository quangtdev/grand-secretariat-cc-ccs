# Design Guidelines

Last updated: 2026-11-14. This is a pointer and a summary. **[DESIGN.md](../DESIGN.md) is the source of truth** for tokens, rules and components. Product intent is in [PRODUCT.md](../PRODUCT.md). The screen's design direction is in `.impeccable/surfaces/index-html.md`. If this page and DESIGN.md disagree, DESIGN.md wins and this page should be fixed.

## Concept

"The Morning Audience": the court of Hue seen from the king's side. Each agent is a scribe at a low desk, and a desk is carried out to its place when its scribe is summoned. An agent that needs the user runs up the central path and kneels before the throne with a yellow petition, and its question is written on its toast and in the rail. Who works and who waits is read from place and posture first, then from the label. The king (the user) is a figure too: he sits on the throne, strolls the court when it is quiet, and points at a scribe when an order is sent.

## Three grounds

| Ground | Where | Material |
|---|---|---|
| Rail | Left, 19 rem | Lacquer: title, tally, Summon, History and Annals, roster, foot row (Sounds, Music, Power saver, World, App) |
| Stage | Centre | Morning mist: the 3D court and its chips and toasts |
| Dock | Right, hidden until opened | Ink: agent tabs, header, activity strip, terminal or summon form |

The grounds sit edge to edge with no border or shadow between them. The dock is never a modal over the court.

## Status vocabulary

One label and one icon per status, used unchanged by the roster, chips, toasts and dock. Source: `src/status-vocabulary.js`.

| Status | Label | Icon | Place and pose in the court | Colour role |
|---|---|---|---|---|
| `starting` | Arriving | arrow to a gate | Walks in to its desk | none (ink chip) |
| `idle` | Awaiting orders | three dots | Seated at desk | none |
| `working` | Working | brush | Seated, brush in hand; toast and rail row show the current step; activity strip shows order › step | none |
| `asking` | Needs your ruling | scroll | Kneels at the petition ground, scroll raised; chip pulses; toast, rail row and dock strip show the question | glaze (yellow) |
| `done` | Reporting back | seal | Stands before the throne with a jade tablet | jade |
| `exited` | Failed to start | cross | Queues at the petition ground, seated | bone |

Colour is never the only signal (DESIGN.md, "The Place and Posture Rule").

## Colour

- **Lacquer** builds the structure. It is never a status colour.
- **Imperial glaze (yellow)** is for what needs the king: petitions, their questions, the primary action, the focus ring and caret. An asking dock tab and an asking activity strip are glaze too.
- **Jade** means a finished report only. It is not a general success colour.
- **Ink** is the dock, the chips, the toasts and the text on dark grounds. Use the dim text colour that matches each ground (bone-dim on lacquer, ink-dim on ink).
- **Robe dyes** identify agents. They never signal status.

Tokens are CSS custom properties in `:root` of `src/styles/court-shell.css`, and scene colours are the `PALETTE` object in `src/scene/court-layout.js`. The scene uses hex and the shell uses OKLCH. Environment colours (sky, water, sand, grass, reeds) are constants in their own scene modules.

## Type

- **Be Vietnam Pro** for everything in the shell (400, 500, 600 only).
- **JetBrains Mono** only inside the terminal well (400 and 700).
- Sizes are a fixed ramp: 1.25, 1, 0.875, 0.8125, 0.75 rem. Sentence case, no uppercase, no letter-spacing except the title.
- **Known exception:** the toast text is 0.6875rem, below the ramp (DESIGN.md, Chips).

## Motion

- The petition pulse (chip, infinite) is the one loop that calls for attention.
- **Court life is stage only.** The strolling king, the birds, the koi and the sampan may move on a loop, but only on the stage, and only slowly, small and low in contrast. Never in the rail, chips or dock.
- **While a petition waits, court life falls still.** The king sits, the birds settle on the roofs, the sampan rests and the banners hang still.
- **Camera:** opening a scribe glides the view to it in 0.6 s; closing glides back. A drag or scroll cancels the glide.
- **Desks:** porters carry a desk out on summon and away on dismiss. There is no loop.
- Transitions: 160 ms on `cubic-bezier(0.16, 1, 0.3, 1)`. Press: 1 px drop for 120 ms.
- Reduced motion: travel, loops and pulses stop, including the king's stroll, the birds' flight, the koi, the sampan, the banners and the camera glide (a cut). Desks appear in place without porters. No edict flies. Place, posture, icon and colour still carry state, and the whisper, the seal and the desk knock still sound.
- **Known deviation:** the working toast's three dots loop forever (`toast-dot` in `court-shell.css`). See [project-roadmap.md](./project-roadmap.md).

## Components at a glance

| Component | Rule |
|---|---|
| Button, primary | One per ground at most. Glaze fill, glaze-ink text |
| Button, quiet | Transparent, ink-edge border. Used for Dismiss, the foot toggles and App |
| Destructive action | Two presses in place. No dialog |
| Chip | Pill over the figure's hat, real button, status icon and ticket name |
| Toast | Ink box over a chip: the step or the question at rest; order and soldiers on hover or open |
| Dock tab | Pill, one per agent, waiting ones first; glaze when asking, jade text when done |
| Roster row | Full-width button in the rail, grouped by place; step line and meta line under the name |
| Field | Ink-raise fill, 0.5 rem radius, glaze caret |
| Focus | 2 px glaze-bright outline |

Full specifications are in DESIGN.md, sections "Components" and "Do's and Don'ts".

## Wording

- UI language is English.
- The UI's words are **"scribe"** for agents and **"king"** for the user.
- Error text says what failed and what to do next. Example: "Check that the server is running, then reopen this panel."

## Implementation pointers

| Need | File |
|---|---|
| Shell layout, rail, roster rows, chips, toast, animations | `src/styles/court-shell.css` |
| Dock, tabs, activity strip, form controls, terminal well | `src/styles/court-dock.css` |
| Dock tabs, activity strip, Alt shortcuts | `src/ui/dock-agent-tabs.js`, `src/ui/dock-activity-strip.js`, `src/ui/dock-shortcuts.js` |
| Status labels and icons | `src/status-vocabulary.js` |
| Figure poses and walking | `src/scene/agent-figure-motion.js` (walk, pose), `src/worlds/hue-court/hue-agent-body.js` (costume) |
| Desks carried by porters | `src/scene/desk-porter-crew.js`, `src/scene/writing-desk.js` |
| Camera glide to the open scribe | `src/scene/camera-focus-ease.js` |
| King figure and his stroll | `src/scene/ruler-figure-motion.js`, `src/worlds/hue-court/hue-ruler-body.js`, `src/scene/king-stroll-routine.js` |
| Royal edict flight | `src/scene/royal-edict-flight.js` |
| Birds and koi | `src/scene/ambient-bird-flock.js`, `src/scene/lotus-pond-with-koi.js` |
| Sky, river, gate, banners | `src/scene/sky-dome-and-clouds.js`, `src/scene/river-water-and-sampan.js`, `src/scene/south-gate-and-banners.js` |
| Throne hall details | `src/scene/throne-hall-details.js` |
| Scene palette and layout | `src/scene/court-layout.js` |
| Frame rate tiers | `src/scene/render-cost-governor.js` |
| Chip and toast placement | `src/ui/overhead-chips.js` |
