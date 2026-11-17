---
name: Grand Secretariat
description: The court of Hue at a morning audience. Every running agent session is a scribe in a 3D courtyard.
colors:
  # Shell tokens (src/styles/court-shell.css :root). OKLCH is the normative source.
  lacquer: "oklch(0.43 0.14 30)"
  lacquer-deep: "oklch(0.35 0.12 30)"
  lacquer-raise: "oklch(0.5 0.15 30)"
  glaze: "oklch(0.8 0.145 82)"
  glaze-bright: "oklch(0.86 0.14 86)"
  glaze-ink: "oklch(0.25 0.05 60)"
  jade: "oklch(0.8 0.085 165)"
  jade-ink: "oklch(0.24 0.04 165)"
  bone: "oklch(0.95 0.025 85)"
  bone-dim: "oklch(0.87 0.05 55)"
  ink: "oklch(0.19 0.015 40)"
  ink-raise: "oklch(0.25 0.02 40)"
  ink-line: "oklch(0.36 0.03 40)"
  ink-edge: "oklch(0.56 0.03 50)"
  danger: "oklch(0.55 0.17 28)"
  danger-text: "oklch(0.8 0.12 40)"
  ink-dim: "oklch(0.76 0.03 60)"
  mist: "#cdd2c4"
  terminal-ground: "#17110f"
  # Scene materials (src/scene/court-layout.js PALETTE). Hex is the normative source; lit by the scene's sun.
  scene-lacquer: "#c23a22"
  scene-lacquer-dark: "#8a2a1c"
  scene-glaze: "#e3a72b"
  scene-glaze-dark: "#b97f16"
  scene-gold: "#d9a441"
  scene-jade: "#7fc4a4"
  scene-stone: "#b9ad98"
  scene-stone-path: "#d3c8b2"
  scene-stone-dark: "#8f8574"
  scene-wood: "#4a2c1c"
  scene-paper: "#f1e8d2"
  scene-straw: "#d9c08a"
  scene-skin: "#d9a57e"
  # Robe dyes (ROBE_DYES), one per agent, picked by a hash of the session id.
  robe-indigo: "#2f4a73"
  robe-umber: "#6a4a32"
  robe-leaf: "#4d6240"
  robe-plum: "#5b4a6a"
  robe-slate-teal: "#3f5f66"
  robe-madder: "#7a3f3a"
typography:
  title:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.45
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.45
  body:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.45
  caption:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.45
  chip:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.3
  terminal:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.2
rounded:
  inner: "0.375rem"
  control: "0.5rem"
  pill: "999px"
spacing:
  hair: "0.125rem"
  xs: "0.25rem"
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.75rem"
  xl: "1.25rem"
  2xl: "1.5rem"
  rail-width: "19rem"
components:
  button-primary:
    backgroundColor: "{colors.glaze}"
    textColor: "{colors.glaze-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 0.875rem"
    height: "2.25rem"
  button-primary-hover:
    backgroundColor: "{colors.glaze-bright}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.bone}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 0.875rem"
    height: "2.25rem"
  button-quiet-hover:
    backgroundColor: "{colors.ink-raise}"
  button-quiet-armed:
    backgroundColor: "oklch(0.55 0.17 28)"
    textColor: "{colors.bone}"
  button-icon:
    backgroundColor: "transparent"
    textColor: "{colors.bone}"
    rounded: "{rounded.control}"
    width: "2.25rem"
    height: "2.25rem"
  button-icon-hover:
    backgroundColor: "{colors.ink-raise}"
  rail:
    backgroundColor: "{colors.lacquer}"
    textColor: "{colors.bone}"
    width: "{spacing.rail-width}"
    padding: "1.25rem 0.75rem 0.75rem"
  roster-row:
    backgroundColor: "transparent"
    textColor: "{colors.bone}"
    rounded: "{rounded.control}"
    padding: "0.5rem"
  roster-row-hover:
    backgroundColor: "{colors.lacquer-raise}"
  roster-row-current:
    backgroundColor: "{colors.lacquer-deep}"
  chip:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bone}"
    typography: "{typography.chip}"
    rounded: "{rounded.pill}"
    padding: "0.25rem 0.625rem 0.25rem 0.5rem"
  chip-asking:
    backgroundColor: "{colors.glaze}"
    textColor: "{colors.glaze-ink}"
  chip-asking-hover:
    backgroundColor: "{colors.glaze-bright}"
  chip-done:
    backgroundColor: "{colors.jade}"
    textColor: "{colors.jade-ink}"
  chip-exited:
    backgroundColor: "{colors.bone}"
    textColor: "{colors.lacquer-deep}"
  chip-summon:
    backgroundColor: "{colors.lacquer}"
    textColor: "{colors.bone}"
    rounded: "{rounded.pill}"
    padding: "0.375rem 0.75rem 0.375rem 0.625rem"
  chip-summon-hover:
    backgroundColor: "{colors.lacquer-raise}"
  chip-toast:
    # ink at 82% opacity at rest, solid ink on hover; text 0.6875rem (below the ramp, see Chips)
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bone}"
    rounded: "{rounded.control}"
    padding: "0.1875rem 0.5rem"
  dock:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bone}"
    width: "clamp(30rem, 52vw, 64rem)"
  field:
    backgroundColor: "{colors.ink-raise}"
    textColor: "{colors.bone}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0.5rem 0.75rem"
  segments:
    backgroundColor: "{colors.ink-raise}"
    rounded: "{rounded.control}"
    padding: "0.25rem"
  segment:
    backgroundColor: "transparent"
    textColor: "{colors.ink-dim}"
    typography: "{typography.label}"
    rounded: "{rounded.inner}"
    padding: "0.3125rem 0.875rem"
  segment-checked:
    backgroundColor: "{colors.lacquer}"
    textColor: "{colors.bone}"
  terminal:
    backgroundColor: "{colors.terminal-ground}"
    textColor: "#ece3d0"
    typography: "{typography.terminal}"
    padding: "0.625rem 0 0.25rem 0.875rem"
---

# Design System: Grand Secretariat

## Overview

**Creative North Star: "The Morning Audience"**

The screen is the court of Hue at a morning audience, seen from the king's side of the glass. Agents are scribes at low writing desks in a paved courtyard. One that needs the user leaves its desk, runs up the central path, and kneels below the throne steps with a yellow petition held over its hat. The scene is the interface: who works and who waits is read from where figures stand and how they hold themselves, before any label is read.

Three grounds hold everything, and each is one material. A vermilion lacquer rail on the left carries the roster. A hazy daylight stage in the middle carries the 3D court. An ink-dark dock on the right, hidden until opened, carries a row of agent tabs, a one-line activity strip, and a real terminal or the summon form. Colour is spent like court colour: lacquer is the building, imperial yellow glaze belongs to the roofs and to whatever needs the king, jade is a finished report. Everything else is stone, wood, paper and straw.

The register is an operating tool that stays open for hours beside an editor. Type is small, even and unshouting. Surfaces are flat. Motion is short and exists to report a state change, with one exception that is the signature: a waiting petition keeps calling until it is answered.

**Key Characteristics:**
- One screen, three grounds: lacquer rail, mist stage, ink dock.
- State is carried four ways at once: place in the court, posture, icon, colour.
- Imperial yellow is the king's colour. In the shell it marks what needs the user and where the user's hand is.
- One UI family at three weights; monospace lives only inside the terminal.
- Flat surfaces; shadow only under things that float over the scene.
- The dock sits beside the scene. Nothing opens as a modal.

## Colors

A warm, low-chroma world with three saturated court colours used by rank: vermilion to build, yellow to call, jade to close.

### Primary
- **Son Lacquer** (`lacquer`, oklch(0.43 0.14 30)): the rail ground, the summon chip on the stage, and the checked segment in the dock. It is the colour of structure, never of status.
- **Lacquer Deep** (`lacquer-deep`, oklch(0.35 0.12 30)): the selected roster row, pressed into the rail; also the text colour on a bone "failed to start" chip.
- **Lacquer Raise** (`lacquer-raise`, oklch(0.5 0.15 30)): hover on anything lacquer (roster row, summon chip).

### Secondary
- **Imperial Glaze** (`glaze`, oklch(0.8 0.145 82)): the asking state everywhere it appears (chip, roster seal, dock tab, activity strip), the primary button, the text caret, the text selection, and dock notes that need reading.
- **Glaze Bright** (`glaze-bright`, oklch(0.86 0.14 86)): hover on glaze surfaces, and the focus ring on every ground.
- **Glaze Ink** (`glaze-ink`, oklch(0.25 0.05 60)): the only text colour used on glaze.

### Tertiary
- **Report Jade** (`jade`, oklch(0.8 0.085 165)): the done state only (chip, roster seal, dock tab, activity strip text; the jade tablet in the scene).
- **Jade Ink** (`jade-ink`, oklch(0.24 0.04 165)): the only text colour used on jade.

### Neutral
- **Bone** (`bone`, oklch(0.95 0.025 85)): primary text on lacquer and on ink; the ground of the "failed to start" chip.
- **Bone Dim** (`bone-dim`, oklch(0.87 0.05 55)): secondary text on lacquer only (tally, group headings, row meta, elapsed time).
- **Ink** (`ink`, oklch(0.19 0.015 40)): the dock ground, the page ground, and the resting chip (at 88% opacity over the scene, solid on hover).
- **Ink Raise** (`ink-raise`, oklch(0.25 0.02 40)): raised fills inside the dock: fields, the segment track, the open dock tab, quiet-button hover.
- **Ink Line** (`ink-line`, oklch(0.36 0.03 40)): hairlines in the dock (header rule, note rule).
- **Ink Edge** (`ink-edge`, oklch(0.56 0.03 50)): the resting edge of fields and quiet buttons, 3:1 against the dock.
- **Danger** (`danger`, oklch(0.55 0.17 28)): the armed second press of Dismiss.
- **Danger Text** (`danger-text`, oklch(0.8 0.12 40)): form error text on ink.
- **Ink Dim** (`ink-dim`, oklch(0.76 0.03 60)): secondary text on ink only (dock meta, field hints, placeholders, unchecked segments); also the hovered edge of fields and quiet buttons.
- **Morning Mist** (`mist`, #cdd2c4): the stage ground behind the canvas, the scene background, and the fog colour. One value in CSS and in the scene, so the canvas has no visible edge.
- **Terminal Ground** (`terminal-ground`, #17110f): the terminal well, one step darker and browner than the dock around it.

### Scene materials
The court is built from its own palette, kept in hex in `PALETTE` and lit by the scene's sun, so these read brighter than the shell tokens of the same name.
- **Lacquer and Lacquer Dark** (`scene-lacquer`, `scene-lacquer-dark`): columns, walls, the bridge rail.
- **Glaze and Glaze Dark** (`scene-glaze`, `scene-glaze-dark`): roof tiles and wall caps; `scene-glaze` is also the petition scroll and the ground ring under a hovered or selected figure.
- **Gold** (`scene-gold`): the throne and its fittings.
- **Jade** (`scene-jade`): the tablet a reporting figure holds.
- **Stone, Stone Path, Stone Dark** (`scene-stone`, `scene-stone-path`, `scene-stone-dark`): paving, the lighter central path, plinths and lanterns.
- **Wood, Paper, Straw, Skin** (`scene-wood`, `scene-paper`, `scene-straw`, `scene-skin`): desks (only while an agent owns one), the sheets on each desk, mats, faces.
- **Robe dyes** (`robe-indigo`, `robe-umber`, `robe-leaf`, `robe-plum`, `robe-slate-teal`, `robe-madder`): six muted dyes, one per agent by a hash of its session id, so neighbours are told apart. Dyes identify; they never signal status.

Environment colours (the sky's zenith, the water, sand, grass greens, reeds and garden flowers) are constants in their own modules, not in `PALETTE`: `sky-dome-and-clouds.js`, `river-water-and-sampan.js` and `court-surroundings.js`. Change them there.

### Named Rules
**The King's Yellow Rule.** In the rail, the chips and the dock, glaze appears only on what needs the king (an asking agent, the primary action, a note to read) and on where the king's hand is (focus ring, caret, selection, the ring under a pointed-at figure). In the scene it is also the roofs, the wall caps and the king's own robe, because that is their material. A courtier's robe, a heading or a decoration never wears it.

**The Jade Closes Rule.** Jade means a finished report and nothing else. It is not a general "success" green.

**The Own-Ink Rule.** Every filled status colour brings its own text colour: glaze-ink on glaze, jade-ink on jade, lacquer-deep on bone. Bone text never sits on glaze, jade or bone.

**The Ground Keeps Its Dim Rule.** Secondary text is bone-dim on lacquer and ink-dim on ink. The two are not interchangeable.

## Typography

**Display Font:** Be Vietnam Pro (with system-ui, sans-serif), self-hosted at weights 400, 500, 600
**Body Font:** Be Vietnam Pro (with system-ui, sans-serif)
**Label/Mono Font:** JetBrains Mono (with ui-monospace, monospace), weights 400 and 700, inside the terminal only

**Character:** One humanist sans with full Vietnamese coverage does all of the interface work at a tight, small ramp. Hierarchy comes from weight and from the dim text colour of each ground, not from size jumps.

### Hierarchy
- **Title** (600, 1.25rem, 1.45, -0.01em): the product name at the top of the rail. The largest type on the screen.
- **Headline** (600, 1rem, 1.45): the dock heading: a ticket name or "Summon a scribe". Single line, ellipsis on overflow.
- **Body** (400, 0.875rem, 1.45): the base size. Tally line, form control text, empty and error messages. Button labels are body at 500 (600 on the primary). Ticket names in the roster are body at 500.
- **Label** (500, 0.8125rem, 1.45): field labels and segment labels in the dock. Dock notes and the stage hint use the size at 400.
- **Caption** (400, 0.75rem, 1.45): row meta, dock meta, field hints. Roster group headings use it at 500. Elapsed times use it with tabular figures.
- **Chip** (500, 0.75rem, 1.3): overhead chips; 600 on an asking chip.
- **Toast** (400, 0.6875rem, 1.3): the text above a chip. Below the ramp; see Chips.
- **Terminal** (400, 13px, 1.2): JetBrains Mono in the xterm, with 700 for bold output.

### Named Rules
**The Mono Stays Inside Rule.** JetBrains Mono appears only inside the terminal well. Ticket ids, elapsed times and paths in the shell are set in Be Vietnam Pro; numbers that update in place use tabular figures.

**The Three Weights Rule.** 400 reads, 500 names, 600 leads. No other weight, no uppercase, no tracked-out labels. The only letter-spacing in the system is -0.01em on the title.

**The Sentence Case Rule.** Group headings, labels, buttons and statuses are sentence case in plain words from the court vocabulary ("Before the throne", "At their desks", "Needs your ruling").

## Layout

One screen, never scrolled as a page (`100dvh`, body overflow hidden). A three-column grid: the rail at a fixed 19rem, the stage taking all remaining width, and the dock at `clamp(30rem, 52vw, 64rem)` when open and absent when closed. The rail can be hidden (a sidebar button in its title row; a floating ink button at the stage's top-left brings it back). The dock's left edge is a 6px separator: dragging it sets `--dock-width` (at least 360px, always leaving the stage 240px), shown in glaze on hover, focus and drag; double-click resets. Both choices persist in localStorage. Opening the dock narrows the stage; the camera widens its field of view (from 36 degrees, once the stage aspect falls below 1.25) so the whole yard stays in view.

Density is high and even. Spacing is written as literal rem values on an eighth-rem grid, clustered at 0.25, 0.375, 0.5, 0.75, 1.25 and 1.5rem: 0.125rem between roster rows, 0.375rem between an icon and its label inside a chip, 0.5rem inside rows and buttons, 0.75rem between rail blocks, 1.25rem above a roster group and between form fields, 1.5rem at the top of the form. Controls are 2.25rem tall (selects 2.5rem). The summon form caps at 34rem wide inside the dock.

The rail stacks title, tally, the Summon, History and Annals buttons, then the roster, which is the only part of the rail that scrolls, then a foot row: the Sounds, Music, Power saver and World icon buttons and, in the installed app only, an App button. The roster is grouped by place, not by status name: "Before the throne" (asking, done, failed; oldest wait first) above "At their desks", each heading with its count. A row is a seal icon, ticket name and elapsed time, with two lines beneath (see Navigation).

Overhead chips are absolutely placed each frame at the projected point above a figure's hat. They never cover one another: chips are placed in priority order (asking, failed, done, working, idle, arriving) and any chip that would overlap an earlier one is lifted above it with a 4px gap. The summon chip is clamped to stay fully inside the stage.

Responsive changes:
- **At 1100px and below** the dock stops taking a column and covers the stage from the right edge at `min(100vw, 44rem)`.
- **At 820px and below** the rail becomes a wrapping strip across the top (title, tally, Summon, then a roster capped at 9.5rem tall) and the stage hint is hidden.

### Named Rules
**The Docked, Never Modal Rule.** The terminal and the summon form open in the dock beside the scene. The court stays visible and live while the user types.

**The Grouped By Place Rule.** Lists are grouped by where the agent stands in the court. The scene and the roster always tell the same story in the same order.

## Elevation & Depth

The shell is flat. Side by side, the three grounds meet edge to edge with no shadow, border or gradient between them; depth between them is tonal (lacquer, mist, ink). Inside the dock, raised things are a slightly lighter ink fill and separation is a 1px ink-line hairline.

Shadow belongs to things that float over the scene. Depth inside the court is real: one directional sun (#fff0d6, from the south-west, high) casts PCF shadows from the figures, desks and fixed scenery onto the paving, a hemisphere light (#f6f1e4 sky, #8a8468 ground) fills, and mist-coloured linear fog (40 to 105 units) swallows the far ground. Neutral tone mapping keeps lacquer red and glaze yellow true. Materials are flat-shaded standard materials at roughness 0.85 unless a surface is meant to gleam (roof tiles 0.3, water 0.1). Figures are drawn differently so they stand clear of the paving: three-tone toon shading, painted faces, and a warm rim light (#ffe0b0) from behind the hall that catches their edges. No outlines. Soldiers (sub-agents) wear the guard's dress: a black nón dấu with a brass spike, a red tunic with a round yellow emblem, a yellow sash, black trousers and boots, and a spear. Desk porters wear the same dress without the spear.

### Shadow Vocabulary
- **Chip rest** (`box-shadow: 0 2px 6px oklch(0.2 0.02 40 / 0.28)`): every overhead chip, to lift it off the paving.
- **Chip raised** (`box-shadow: 0 4px 12px oklch(0.2 0.02 40 / 0.4)`): a hovered chip, or the chip of the agent open in the dock.
- **Petition pulse** (`0 0 0 0 oklch(0.8 0.145 82 / 0.7)` expanding to `0 0 0 10px` at zero alpha, over the chip rest shadow): the ring that keeps leaving an asking chip.
- **Dock overlay** (`box-shadow: -12px 0 32px oklch(0.15 0.02 40 / 0.45)`): only at 1100px and below, when the dock covers the stage instead of sitting beside it.

### Named Rules
**The Floating Earns Shadow Rule.** A surface gets a shadow only when it is physically over the scene. Anything seated in the rail or the dock is flat.

**The One Sun Rule.** The court has one shadow-casting light. Shadow tint is warm ink (hue 40), never neutral black.

**The Cheap To Render Rule.** The court is drawn only as often as something happens. 60 fps only while the user drags, zooms or the view glides; 30 fps while a figure travels; 20 fps when the user is looking at a court where only background life moves. While the user types in the dock with the pointer off the court, or the window has lost focus, the court holds still and nothing is drawn (12 fps if someone is asking for a ruling, so the petition keeps calling); it wakes when an agent changes state, a figure has to move, or the pointer returns. The shadow map is redrawn every frame while something travels and at most five times a second when the court is still. Ambient life casts no shadow. Chips are re-placed when something moved, or every 200 ms. Fixed scenery is merged to one mesh per material, and figures are baked to a few meshes each. No post-processing, no extra real-time light and no soft-shadow filter. Measured on the default camera with three agents: 1247 draw calls before, 214 after.

## Shapes

Two corner behaviours and nothing between. Controls and rows are gently rounded (0.5rem): buttons, roster rows, fields, the segment track; a nested segment steps down to 0.375rem so its corner stays concentric. Anything that is a status or floats over the scene is a full pill (999px): overhead chips, the summon chip, the dock tabs. The toast above a chip is the one floating surface with a 0.5rem corner, because it holds lines of text rather than a status. The roster's status seal is a 1.5rem circle. The three grounds themselves are square-edged and full-bleed.

Borders are rare and 1px: ink-edge on fields and quiet buttons, and two hairlines in the dock. The rail has none. Focus is a 2px glaze-bright outline at 2px offset on every ground (bone on the primary button, where glaze-bright would vanish; flush to the edge on fields, replacing their border).

Icons are one family: 16px, drawn on a 16-unit grid, 1.5px stroke, round caps and joins, no fill, in the current text colour. Each status has one icon from the court's own objects: brush (working), scroll (asking), seal (done), three dots (awaiting orders), arrow to a gate (arriving), cross (failed).

In the scene the form language is low-poly and flat-shaded: cylinders, cones and boxes with few segments, built large enough to read from the default camera. Figures are drawn at 1.5 times architectural scale: a tapered robe with belt, collar and badge, a head with a painted face under a winged court cap, two arms in wide sleeves (court-costume-parts.js).

## Components

Controls are quiet and seated: flat fills, short colour transitions (160ms on `cubic-bezier(0.16, 1, 0.3, 1)`), and a 1px press-down (120ms). Only an asking chip moves on its own. The working toast's three dots are the one other loop, a known deviation (see Chips).

### Buttons
- **Shape:** gently rounded (0.5rem), 2.25rem tall, 0.875rem side padding, 0.5rem between icon and label, weight 500.
- **Primary:** glaze fill, glaze-ink text, weight 600. One per ground at most: "Summon a scribe" in the rail, "Summon" in the form. Hover is glaze-bright. Focus ring is bone.
- **Quiet:** transparent with an ink-edge edge, bone text; hover fills ink-raise and lifts the edge to ink-dim. Used in the dock for "Dismiss".
- **Quiet, armed:** the first press of a destructive quiet button turns it lacquer-red (oklch(0.55 0.17 28)) with bone text and changes its label to the question ("End this session?") for four seconds; a second press confirms. No confirmation dialog.
- **Icon:** a 2.25rem square, transparent, ink-raise on hover; always carries an `aria-label`.
- **Rail foot:** Sounds, Music and Power saver are icon-only quiet buttons, named by `aria-label` ("Sounds", "Music", "Power saver") with `aria-pressed` for on or off. World is an icon-only quiet button (`aria-haspopup`, `aria-expanded`) that opens a small popover of the worlds: radio options, each with its name and a one-line note; it does not toggle. App is a quiet text button that opens Pull & update, Update and Restart in place.
- **Pressed / Disabled:** every button drops 1px while pressed. Disabled is 60% opacity with a progress cursor and a present-participle label ("Summoning").

### Chips
- **Overhead chip:** a pill button anchored above a figure's hat: status icon, then the ticket name, single line, ellipsis past 13rem. Resting fill is ink at 88% opacity with bone text and the chip rest shadow; hover or selection makes it solid ink with the raised shadow.
- **State:** asking is glaze with glaze-ink text at weight 600, sits above other chips, and pulses (2.4s, infinite) until answered; done is jade with jade-ink; failed to start is bone with lacquer-deep. Working, idle and arriving keep the ink fill and differ by icon.
- **Summon chip:** the same pill in lacquer with slightly larger padding, anchored over the drum pavilion; lacquer-raise on hover. It is lacquer, not glaze, so the only yellow chips on the stage are petitions.
- **Toast:** the box above a chip. While working it shows the three dots and the current step; while asking it shows the question. Hovering or opening the chip adds the order (ink-dim) and one line per soldier (glaze spear, its task, its step). Resting fill is ink at 82% opacity, solid ink on hover, bone text, a 0.5rem corner and a small shadow. It fades in in 260 ms. Its text is 0.6875rem, below the type ramp: a known exception, to be raised to 0.75rem if the ramp must hold. Its three dots loop forever (`toast-dot`), also a known deviation; see [project-roadmap.md](./docs/project-roadmap.md).
- **Question:** a petition's own words, one sentence from the server (80 characters at most). It runs on the toast (two lines at most), in the rail's second line and in the dock's activity strip. With no question known, the status label stands in.
- **Dock tabs** are the agents' pills in the dock's tab strip, not chips; see Cards / Containers.

### Ink and annals
Ink is the context a scribe's conversation holds, shown as text on what the scribe already shows: `~62% ink` at the end of its rail row's meta line and before the elapsed time in the dock's activity strip. The strip's tooltip and the rail row's title give the absolute tokens.

**The Ink Is Words Rule.** Ink takes no colour, icon, shape or animation, and it adds no status. A status keeps its own colour; ink only changes its words. From 85% the wording changes (`ink low`, `context full`, `appetite full`, `fuel spent`), not the colour. Nothing on the stage shows ink yet.

The annals panel (`src/ui/court-annals-panel.js`) opens in the dock, the same way History does, and holds the dock: the Alt shortcuts do nothing while it is open. It is read-only: a day line with previous and next arrows (`Today · Sat 14 Nov`, `Yesterday · Fri 13 Nov`), then one `<details>` row per scribe, closed by default, with its counts (orders, files, commits, time waited, tokens) and, when opened, its orders with times, its commits and its files. A dismissed scribe shows when it left. The rail's book button is the entry point, beside History.

### Cards / Containers
There are no cards. The three grounds are the only containers.
- **Rail:** lacquer, 19rem, padding 1.25rem top and 0.75rem elsewhere, no border.
- **Dock:** ink, from the top. A tab strip holds one pill per agent, waiting ones first: the open tab is ink-raise with an inset hairline, an asking tab is glaze, a done tab takes jade text (jade fill when open). Then the header (0.75rem padding, 1.125rem on the leading edge, ink-line rule beneath) with the name (a pencil to rename) over a one-line meta, the quiet Dismiss and the close icon button. Then the activity strip, one line tall: order › step, soldiers and elapsed time while working; the question on a glaze strip while asking; the status word otherwise. The terminal fills the rest. An optional note strip at the bottom (ink-line rule above, glaze text at 0.8125rem) reports connection and dismissal problems and collapses when empty.
- **Stage:** mist. The canvas fills it; chips overlay it; a one-line hint sits bottom-left.

### Inputs / Fields
- **Style:** ink-raise fill, 1px ink-line edge, 0.5rem radius, 0.5rem by 0.75rem padding, glaze caret, ink-dim placeholder. Selects are 2.5rem tall; textareas start at 6rem and resize vertically.
- **Hover / Focus:** hover lifts the edge to ink-dim; focus replaces the edge with the 2px glaze-bright outline, flush.
- **Field anatomy:** label (0.8125rem, 500) above, control, optional hint (0.75rem, ink-dim) below, 0.375rem apart; fields 1.25rem apart.
- **Segmented choice:** radio groups are a track (ink-raise, 0.25rem padding) of segments (0.3125rem by 0.875rem, 0.8125rem at 500). Unchecked is ink-dim text, bone on hover; checked is a lacquer fill with bone text. Used for two to three exclusive options.
- **Error / Loading:** errors are a line of warm text (oklch(0.8 0.12 40)) above the submit button that says what failed and what to do next. Loading is a single ink-raise line in plain words ("Reading your repositories."), not a spinner.
- **Open gap:** the resting field edge (ink-line on ink-raise) is well under 3:1 against the dock. The build ships it; do not take it as licence to go fainter.

### Navigation
The roster is the navigation. Each row is a full-width button (0.5rem padding, 0.5rem radius, transparent on lacquer): a 1.5rem circular seal with the status icon, the ticket name at 500, the elapsed time right-aligned in tabular figures. Beneath the name come two lines in bone-dim: a step line, which is the live step while working or the question before the throne (absent when idle), and a meta line ("repository", with "· N soldiers" when any are out; before the throne the status label comes first). Hover is lacquer-raise; the row open in the dock is lacquer-deep and carries `aria-current`. Seals fill only for throne states: glaze for asking, jade for done, bone for failed; desk states show the bare icon. Hovering or focusing a row lights the ground ring under its figure and raises its chip; pointing at the figure or its chip does the same. Below 820px the roster wraps under the top strip and scrolls within 9.5rem.

**Keyboard.** Alt+↓ and Alt+↑ open the next and previous scribe (waiting ones first), Alt+W opens the one that has waited longest, and Alt+` closes the dock or reopens the last scribe. The keys work wherever focus is, and never reach the terminal. They are ignored while typing in a form field, and while the summon form or the history is in the dock.

### Terminal
A real xterm session in a well of terminal-ground (#17110f), inset 0.875rem on the leading edge. JetBrains Mono 13px at 1.2, blinking cursor in the scene's glaze (#e3a72b), foreground #ece3d0, selection in translucent lacquer (#6e1d1499). The ANSI palette is tuned to the court: red #e0604c, green #7fc4a4 (the scene's jade), yellow #e3a72b (the scene's glaze), blue #7fa3d6, magenta #c48fb0, cyan #79b8bd, white #d6ccb8, bright white #fbf5e6, black #2a211e, bright black #75685f.

### Courtier figure (signature)
One agent is one figure. Its robe dye is its identity; its place and posture are its status. Dress is Nguyễn court dress: a black mũ cánh chuồn with flat side wings, an áo giao lĩnh with a white crossed collar, a bổ tử badge of rank (a crane) on the chest, a belt with a gold plaque, wide sleeves and black hia boots. The robe takes the agent's dye; badge and collar are the same for all.
- **Working:** seated at its desk on the outer side, turned 0.35 rad towards the camera, leaning in; the brush is in its hand and moves in short strokes. The pile of finished sheets on its desk grows with each step.
- **Awaiting orders / arriving:** seated at its desk, still.
- **Asking:** runs (6.2 units/s) down its lane of the central path to a petition spot below the throne steps and kneels, both arms up, holding a glaze scroll clear above its hat. The scroll is lifted a little, again and again, until answered. The first to arrive takes the centre; later ones fill outwards in rows of seven.
- **Done:** walks (3.4 units/s) to the throne and stands holding a jade tablet.
- **Pointed at or selected:** a flat glaze ring on the ground around the figure.
- **Reduced motion:** figures arrive at once with no travel, the brush and the scroll hold still, and the chip pulse stops. Place, posture, icon and colour still carry the state.

### King figure
The king in imperial yellow is the user's own figure. He wears the mũ xung thiên (gold cap, wings rising behind, a red jewel at the brow), a long bào with clouds, a coiling dragon and a red hem, red cuffs and collar, and a short black beard.
- **Seated:** on the throne, facing the yard. This is where he is whenever anyone waits before the throne.
- **Strolling:** after 8 to 15 seconds on the throne with no petition waiting he rises, walks the hall gallery or goes down a small stair on the east side of the plinth to stand looking at the rockery, the lotus pond or, on the long walk, south over the river, then comes back. A scribe that has only reported back does not keep him in. He keeps to the east side and never crosses the petition ground.
- **Called back:** a scribe asking for a ruling sends him back to the throne at a run along the way he came; a report, or the user typing in the dock, brings him back at a walk.
- **Giving an order:** when the user sends a prompt from the dock he points at that scribe and a glaze scroll arcs from his hand to it; the scribe bows. A whisper sealed with a knock of the mõ sounds with it.
- **Ambient life:** egrets circle high over the court and land on the roof ridges with a soft chirp; koi swim under clear water in the lotus pond. The king and the birds settle while a petition waits. Fainter still, and left running: incense smoke curls from the bronze urns, frangipani petals drift down from the two old trees, and two dragonflies dart over the pond.
- **Reduced motion:** the king stays seated, birds sit on the roofs, koi hold still, no edict flies. The whisper and seal still sound.

The 3D camera is a fixed-range orbit: 36 degree lens, looking north over the yard at the throne hall. Left drag slides the view along the ground, middle drag turns it within about 43 degrees either side, and right drag or the wheel moves it between 11 and 40 units, never below the paving; the view's centre stays over the court. The pixel world's camera is described under Worlds.

Opening a scribe's terminal glides the view to it (0.6 s, a little closer, with a soft disc of warm light on the paving under it). Closing the dock glides back to the view the user had, unless the user has since dragged or scrolled the view, which then stays. Any drag or scroll during the glide cancels it. Reduced motion makes both a cut.

### Desks and porters
A desk exists only while its agent does. The yard starts empty of desks.
- **Summon:** two porters (palace guards without spears) come from behind the drum pavilion and carry the desk to its place. The scribe waits at the entrance until they are near, then walks in.
- **Dismiss:** the same two carry the desk away.
- **Page load:** agents already present have their desks in place, with no porters.
- **Working:** the sheets pile grows with each step; the scribe's brush is in hand.
- **Ink gauge:** each workplace carries a separate gauge of the scribe's context. It shows what is LEFT (100 minus the ink percentage): full while the context is empty or unknown (a new desk, no reading yet, after `/clear`), draining as the context fills, in 5 % steps. It is a different object from the sheet pile and never changes what the pile means (steps written). It is made of the world's own neutral materials, never a status colour (The Same Signal Rule), and the text in the rail and dock stays the precise source. One mesh scales or one sprite frame changes; there is no animation. Per world: Huế 3D, the inkstone's pool of ink shrinks; Huế pixel, an ink pot with four levels (full, two thirds, a third, dregs) beside the sheets; office, a white level strip on the desk's back edge (the monitor screens face away from the camera, so a bar on a screen cannot be read) that shortens; zoo, a feed bucket beside the trough whose grain sinks ("appetite"); space station, a fuel cell, a glass tube whose cyan core drops ("fuel"). Zoo and station gauges stand at the workplace's south end, the end the camera sees on both flanks.
- **Reduced motion:** the desk appears at once, with no porters.

### Environment and architecture
The vocabulary the scene is built from, so new scenery matches it.
- **Sky:** a dome from the mist at the horizon (the fog colour) to a pale blue overhead, with four flat clouds that drift east very slowly. Backdrop only; nothing in it casts a shadow.
- **River and bank:** the water is one material whose pale streak texture scrolls slowly. One sampan drifts on the southern reach and rests while a petition waits. Sandy bank, reeds and grass patches sit on the edges.
- **Throne hall:** stone column bases, a name board over the central bay, hanging lanterns, a sun disc and finials on the ridge, a stone balustrade on the plinth. On the dais: armrests, a footstool, a canopy and two ceremonial fans.
- **South gate:** a three-bay gate in the manner of Ngọ Môn, at the far bridge head, below the default view and seen when zoomed out.
- **Yard banners:** two tall lacquer banners on poles that stir in the wind, and hang still while a petition waits.

### Named Rules
**The Place and Posture Rule.** A status that matters must be readable with colour removed: the figure is somewhere different and holding itself differently, and its chip and row carry a distinct icon.

**The Petition Holds Rule.** Only an agent waiting on the user *calls*: the chip pulse and the lifted scroll loop until the user answers. They do not time out or settle. The court may have ambient life (the strolling king, birds, koi) on the stage only, never in the rail, chips or dock. It is slow, small and low in contrast. While a scribe asks for a ruling, the king sits and the birds settle on the roofs, so the petition stays the one thing moving to get attention. The sampan rests and the yard banners hang still for the same reason.

**The One Vocabulary Rule.** Each status has one label and one icon, defined once and used unchanged by the roster, the chips and the dock.

**The Two-Press Rule.** Ending a session arms the same button in place and asks in its label. Destructive actions do not open a dialog.

## Worlds

The court can be dressed as more than one world. A world changes the look: light, buildings, costumes, figure bodies and background life. It does not change where things stand or what they do. The stage plan (desks, throne, petition ground, paths, drum pavilion) is shared, so every world tells the same story in the same places. The world picker is the globe button in the rail foot. The two Huế worlds keep the court's own words: ink (`ink low` from 85%) and Annals.

**The Same Signal Rule.** Status colours and icons are the same in every world: glaze for a petition, jade for a report, bone with lacquer-deep for a failed start, ink for working and idle. A world may dress a scribe differently; it may not give a status a different meaning. Place and posture carry the state in every world, as in The Place and Posture Rule.

**The Petition Holds Rule applies to every world.** While a petition waits, the world's background life settles or holds still: in the Huế worlds the egrets land on their perches and the king sits. The ambient life stays on the stage only, never in the rail, chips or dock.

The pixel world (Huế court, pixel 2D) follows these art rules:
- **Palette from Huế.** Its colours are the Huế court's palette (`court-layout.js`). It adds none.
- **Painted in code.** Sprites, textures and the ground are painted on canvases at boot. No image files.
- **Integer pixel scale.** The stage renders at one third of the screen size and is scaled up without smoothing (`pixelScale: 3`), so every art pixel is a crisp block.
- **One draw call per figure.** A figure is one textured plane that always faces the camera. Background life is one sprite batch.
- **Cells.** A figure's frames are 24 by 32 art pixels. Only opaque pixels take a click, so the empty part of a cell does not.
- **Camera.** A fixed isometric view (30 degree pitch) with pan and zoom only. Sprites are drawn for that one view, so the view does not turn.

The zoo world (Zoo, 3D) follows these rules:
- **Upright animals, shared poses.** Every agent is a two-legged cartoon animal (elephant, giraffe, lion, panda, penguin or monkey, picked by a hash of the session id) driven by the same pose maths as the Huế scribe: seated at its trough working, kneeling with a wooden sign held up and lifted again and again (a petition), standing with a medal on a jade ribbon (done), walking, bowing. The sign is glaze yellow and the ribbon jade: the invariant status colours. Sign and medal show on both faces, so they read from the default camera, which sees the animals from behind.
- **Cap the tall.** The giraffe's neck is short and its chip and sign sit at its own head height, so it never hides a neighbour or a chip.
- **Calm yard.** Sand under the petition rows, few props, ducks, butterflies, balloons and birds that all hold still while a petition waits.
- **Palette.** Scenery is bright (lawn, sand, wood, terracotta roof). The shell takes an olive forest-green/brown rail (`oklch(0.4 0.07 125)`) and warm ink, set in `styles/world-themes.css`; jade (hue 165, light) stays distinct from the rail (hue 125, dark).
- **Vocabulary.** The Menagerie; animal / animals, cub / cubs; Arriving, Resting, Busy, Needs the keeper, Showing off, Failed to arrive; Admit an animal, Release. Icons paw (busy and cubs), sign (needs the keeper), ribbon (showing off). Ink: appetite, `appetite full` from 85%. Annals: Keeper's diary.
- **Sound.** Synthesized marimba, xylophone, keeper's whistle and bell, soft trumpet, squeaks and a breeze; music is playful major-pentatonic marimba phrases.

The office world (Modern office, 3D) follows these rules:
- **Employees at desks.** Every agent is an employee (shirt or hoodie in a colour picked by the session id) on the shared pose maths: seated at a desk with a monitor and typing while working, standing with a yellow ticket held overhead and lifted again and again (a petition), standing with a laptop held up (done), walking. The ticket is glaze yellow and the laptop screen jade: the invariant status colours, shown on both faces so they read from the default camera, which sees the employees from behind. The swivel chair belongs to the employee and only shows while seated; sticky notes on the monitor edge are the finished work.
- **Glass and a manager.** The dais is the manager's glass-walled corner office on a raised floor with steps down on the east side; the manager sits in a leather chair and strolls to the coffee counter, the plant corners, the window lounge and the water cooler. Sub-agents are contractors with a laptop; the two movers in orange overalls carry the desks; an order is a paper plane.
- **Calm floor.** Pale concrete with a wood aisle, few props, nothing near the petition rows. Window walls (east, west, north) and a low south wall so the floor reads; no ceiling. A city and slow clouds beyond the glass, plants swaying, pedestal fans turning, water-cooler bubbles and dust motes all hold still while a petition waits and under reduced motion. No shadow map.
- **Palette.** Warm concrete, oak, white walls, black steel mullions, one teal accent. The shell takes a deep charcoal-teal rail (`oklch(0.38 0.045 200)`) and cool ink, set in `styles/world-themes.css`; jade (hue 165, light) stays distinct from the rail.
- **Vocabulary.** Head Office; employee / employees, contractor / contractors, manager; Arriving, Waiting for a task, Working, Needs your decision, Reporting back, Failed to start; Hire an employee, Let go. Icons keyboard (working), ticket (needs your decision), laptop (reporting back, contractors). Ink: context, `context full` from 85%. Annals: Daily log.
- **Sound.** Synthesized key clicks, desk-phone trill, elevator ding, marimba chimes, desk bell and a low room hum; music is slow lo-fi electric-piano seventh chords.

The space station world (Space station, 3D) follows these rules:
- **Light figures on a dark deck.** The deck is calm gunmetal tile floating in the void, so the figures are light: flight suits in six pale colours (none amber or green, picked by a hash of the session id), white helmets with a glowing visor, cyan trims. A cool key light and a cyan rim light pick out their outlines. Neutral tone mapping crushes very dark albedos into saturated blue, so the deck's base colour is mid-dark, not near-black.
- **Shared poses.** Crew members sit on a pod seat at their console with hands on the holo-keys (drumming while they work), stand holding an amber holo-tablet with a bold "!" overhead, lifted again and again (a petition), or hold a green data pad with a check mark out to the side (done). Tablet and pad show on both faces. They are glaze amber and jade: the invariant status colours.
- **Drones are not people.** Sub-agents are small hover drones with a lamp that bob and tilt, and circle in a small orbit while the master works. Two cargo drones lift a console on tractor-beam cones.
- **Calm deck.** Nothing stands near the petition rows. Light strips run along the deck edge and the south walk and pulse slowly; status lights blink; a shuttle crosses the void now and then; a holo globe turns over the star-map table. All of it holds still while a petition waits and under reduced motion.
- **Palette.** Gunmetal deck, panel grey, cyan light, amber and green only for status. The shell takes a deep navy rail (`oklch(0.32 0.07 255)`) and cool ink, set in `styles/world-themes.css`; amber (hue 80) and jade (hue 165) stay distinct from the navy (hue 255).
- **Vocabulary.** Mission Control; crew member / crew, drone / drones, captain; Beaming in, Standing by, On task, Requests orders, Reporting, Failed to beam in; Beam aboard, Stand down; "Launching a drone: <task>". Icons console (on task and the rail), comm (requests orders), check (reporting), drone (sub-agents). Ink: fuel, `fuel spent` from 85%. Annals: Mission log.
- **Sound.** Synthesized sine and square beeps, FM chirps and bells, sweeps, a low buzz, a magnetic clunk, keypad blips and a sub hum; music is slow glassy pad chords with a sparse bell arpeggio.

## Do's and Don'ts

### Do:
- **Do** keep every new surface on one of the three grounds: lacquer rail, mist stage, ink dock. Put secondary text in that ground's own dim (bone-dim on lacquer, ink-dim on ink).
- **Do** spend glaze only on what needs the user or on where the user's hand is, with glaze-ink text on it.
- **Do** give every new status a place in the court, a posture, an icon from the court's objects and a label in the shared vocabulary before giving it a colour.
- **Do** use the pill (999px) for anything that floats over the scene or names a status, and the 0.5rem corner for anything that is pressed or typed into.
- **Do** keep type inside the built ramp (1.25, 1, 0.875, 0.8125, 0.75rem) and the three weights (400, 500, 600), in sentence case.
- **Do** draw new icons at 16px with a 1.5px round-capped stroke in the current text colour.
- **Do** time state transitions at 160ms on `cubic-bezier(0.16, 1, 0.3, 1)` and honour reduced motion by removing travel, loops and pulses while keeping place, posture, icon and colour.
- **Do** tint shadows with warm ink (hue 40) and take scene colours from the scene palette so the court stays one material world.
- **Do** make every figure reachable without the canvas: a real button chip over its head and a real button row in the roster.
- **Do** merge new fixed scenery into one mesh per material, bake figure parts, and report movement to the render governor (The Cheap To Render Rule).

### Don't:
- **Don't** use glaze as decoration in the shell, or put a second glaze button on the same ground.
- **Don't** use jade for anything but a finished report, or robe dyes to signal status.
- **Don't** set shell text in JetBrains Mono; it belongs to the terminal well.
- **Don't** use uppercase, letter-spaced labels or a weight outside 400, 500 and 600.
- **Don't** put a shadow, border or gradient between the three grounds while they sit side by side, or a shadow on anything seated in the rail or dock.
- **Don't** open the terminal, the summon form or a confirmation as a modal over the court.
- **Don't** add a looping animation that calls for attention, or any loop in the shell. The petition is the only thing allowed to keep calling; ambient life on the stage must fall still while it waits.
- **Don't** signal a state with a coloured dot alone; the court replaces the status-dot dashboard, it does not sit beside one.
- **Don't** let chips overlap or let a petition chip be pushed out of place by a lower-priority one.
- **Don't** add post-processing, a real-time light, a soft-shadow filter or a per-frame allocation to the scene. Don't put a desk in the yard without an agent behind it.
