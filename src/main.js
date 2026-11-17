// Wires the court together: live sessions -> figures, chips and roster;
// clicks -> the dock (an agent's terminal, or the summon form).
import '@fontsource/be-vietnam-pro/400.css';
import '@fontsource/be-vietnam-pro/500.css';
import '@fontsource/be-vietnam-pro/600.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/700.css';
import * as THREE from 'three';
import { subscribeToSessions } from './api-client.js';
import { CourtAudio } from './audio/court-audio.js';
import { statusOf, waitingFirst } from './status-vocabulary.js';
import { CourtPopulation } from './scene/court-population.js';
import { DeskPorterCrew } from './scene/desk-porter-crew.js';
import { createCourtScene } from './scene/court-scene.js';
import { SoldierLegion } from './scene/soldier-legion.js';
import { KingStrollRoutine } from './scene/king-stroll-routine.js';
import { RoyalEdictFlight } from './scene/royal-edict-flight.js';
import { attachPointerPicking } from './scene/scene-pointer-picking.js';
import { attachShellLayoutControls } from './ui/collapsible-rail-and-resizable-dock.js';
import { createFirstPetitionArrivalWatcher } from './ui/first-petition-arrival-watcher.js';
import { attachDockPresentation } from './ui/dock-popup-or-docked-presentation.js';
import { attachPopupCloseOnOutsideClick } from './ui/dock-popup-close-on-outside-click.js';
import { AppMaintenanceControls } from './ui/app-maintenance-controls.js';
import { HistoryPanel } from './ui/history-panel.js';
import { CourtAnnalsPanel } from './ui/court-annals-panel.js';
import { PowerSaverToggle } from './ui/power-saver-toggle.js';
import { OverheadChips } from './ui/overhead-chips.js';
import { RosterRail } from './ui/roster-rail.js';
import { SummonPanel } from './ui/summon-panel.js';
import { attachDockShortcuts } from './ui/dock-shortcuts.js';
import { TerminalPanel } from './ui/terminal-panel.js';
import { WorldPicker } from './ui/world-picker.js';
import { setVocabulary, words } from './worlds/world-vocabulary.js';
import { applyVocabularyToPage } from './ui/apply-vocabulary-to-page.js';
import { assertWorldPack, assertWorldStage } from './worlds/world-pack-contract.js';
import { DEFAULT_WORLD, loadWorld, resetToDefaultWorld, selectedWorldId } from './worlds/world-registry.js';

// The world pack dresses the court (worlds/world-pack-contract.js); the engine below only moves it.
const world = await loadWorld(selectedWorldId());
if (import.meta.env.DEV) assertWorldPack(world);
if (import.meta.env.DEV && document.documentElement.dataset.world !== world.id) {
  console.warn(`index.html head script set world "${document.documentElement.dataset.world}" but "${world.id}" loaded: its id list is out of sync with WORLDS, or the world failed to load.`);
}
document.documentElement.dataset.world = world.id; // normally set before first paint by index.html; this covers a fallback to the default world
setVocabulary(world.vocabulary); // before any UI is built: every label below reads from it

const $ = (id) => document.getElementById(id);
const dock = $('dock');
const stage = $('stage');

let chipsPlacedAt = 0; // when the overhead chips were last placed (ms)
const state = { sessions: [], connected: true, refused: false, selectedId: null, selectedOrderedAt: 0, lastOpenedId: null, hoveredId: null, pendingOpenId: null };

attachShellLayoutControls({
  shell: $('shell'), rail: document.querySelector('.rail'), dock,
  collapseButton: $('rail-collapse'), expandButton: $('rail-expand'), resizer: $('dock-resizer'),
});
const dockPresentation = attachDockPresentation({ shell: $('shell'), dock }); // docked or popup
// A click outside the popup terminal hides it (the summon form, History and the annals stay: they hold input).
attachPopupCloseOnOutsideClick({
  dock,
  isOpenPopup: () => dockPresentation.isPopup() && !dock.hidden && !dockPresentation.isClosing() && Boolean(state.selectedId),
  openedKey: () => state.selectedId,
  close: () => closeDock(),
});

let court;
let stageParts;
try {
  court = createCourtScene($('court'), stage, world.environment);
  stageParts = assertWorldStage(world.buildStage(court.scene, { onChirp: () => audio.cue('chirp') }), world.id);
  // Each body factory once, so a pack that cannot build a figure fails here, not later in the feed.
  [world.bodies.agent({ id: 'boot', status: 'idle' }), world.bodies.ruler(), world.bodies.helper({ id: 'boot' }, 'boot'), world.bodies.porter()].forEach((body) => body.dispose?.());
} catch (error) {
  console.error(`World "${world.id}" could not be built`, error);
  if (world.id === DEFAULT_WORLD) throw error;
  resetToDefaultWorld(); // a broken world must not keep the app from starting: forget it and reload into Huế
  await new Promise(() => {}); // the page is leaving
}
const { summonTarget, summonAnchor, ambient } = stageParts;
// The static page text and the hint (a 3D court can also be turned; a 2D one only slides and zooms).
applyVocabularyToPage(world.environment.camera.type === 'orthographic');
const porters = new DeskPorterCrew(court.scene, world, { onDeskDown: () => audio.cue('desk') }); // carry desks out and away
const population = new CourtPopulation(court.scene, porters, world);
const legion = new SoldierLegion(court.scene, world); // sub-agents, as soldiers beside their agent

const audio = new CourtAudio($('sound-controls'), world.audio);
// Update / restart buttons; the confirmation counts scribes a restart would cut off mid-turn.
new WorldPicker($('world-controls'), world.id);
new AppMaintenanceControls($('app-controls'), { busyCount: () => state.sessions.filter((s) => s.status === 'working').length });

const handlers = { onOpen: openTerminal, onSummon: openSummon, onHistory: openHistory, onAnnals: openAnnals, onHover: setHover };
const chips = new OverheadChips($('chips'), handlers);
const rail = new RosterRail({ tally: $('tally'), roster: $('roster'), summonButton: $('summon-button'), historyButton: $('history-button'), annalsButton: $('annals-button') }, handlers);
// --- Living court: the strolling king, royal orders, the world's background life -------------------
const king = new KingStrollRoutine(court.scene, world);
const edicts = new RoyalEdictFlight(court.scene, world);
const handPosition = new THREE.Vector3();

/** The user is typing an order in the dock: the king whispers it and comes back to the throne. */
function dictate() {
  if (king.state !== 'seated') court.governor.markMoving(1); // the king has to come back: wake a still court
  audio.murmur();
  king.attend();
}

/** An order was sent: the seal sounds, the king points, an edict flies to the scribe, who bows. */
function sendEdict(id) {
  court.governor.markMoving(1.5);
  audio.cue('edict');
  const figure = population.figures.get(id);
  if (!figure || figure.leaving) return;
  king.decree(figure);
  // Let the king's arm come up before the scroll leaves his hand.
  setTimeout(() => {
    if (figure.leaving) return;
    edicts.launch(king.king.handPosition(handPosition), figure.group.position, () => { if (!figure.leaving) figure.bow(); });
  }, 350);
}

function observeLivingCourt(sessions) {
  king.observe(sessions);
  const petition = sessions.some((s) => s.status === 'asking');
  court.governor.setPetition(petition); // the court never goes fully still while someone asks
  for (const life of ambient) life.settle?.(petition);
}

/** @returns {boolean} true while the king or an edict travels */
function updateLivingCourt(dt, time) {
  const kingMoves = king.update(dt, time);
  const edictFlies = edicts.update(dt);
  if (powerSaver) return kingMoves || edictFlies; // background life holds still
  for (const life of ambient) life.update(dt, time);
  return kingMoves || edictFlies;
}
// ---------------------------------------------------------------------------------------

// Power saver (rail foot): lower frame rates, no shadows, background life and the king's walks at rest.
let powerSaver = false;
new PowerSaverToggle($('saver-controls'), (on) => {
  powerSaver = on;
  court.setPowerSaver(on);
  king.setLeisure(!on);
});

const terminalPanel = new TerminalPanel(dock, { onClose: closeDock, onSwitch: openTerminal, onTyping: dictate, onOrder: sendEdict });
const summonPanel = new SummonPanel(dock, {
  onClose: closeDock,
  // The new agent may not be in the feed yet; open its terminal as soon as it is.
  onSummoned: (id) => { audio.cue('summon'); state.pendingOpenId = id; tryOpenPending(); },
});
// A recalled scribe arrives like a summoned one.
const historyPanel = new HistoryPanel(dock, {
  onClose: closeDock,
  onRecalled: (id) => { audio.cue('summon'); state.pendingOpenId = id; tryOpenPending(); },
});
const annalsPanel = new CourtAnnalsPanel(dock, { onClose: closeDock });

function refreshHighlights() {
  const ids = [state.selectedId, state.hoveredId].filter(Boolean);
  population.highlight(ids);
  population.spotlight(state.selectedId);
  chips.setActive(ids);
}

function setHover(id) {
  state.hoveredId = id;
  court.governor.markActive(0.1); // show the ring without waiting for the next ambient frame
  chipsPlacedAt = 0; // a hovered chip grows (order, soldiers): place again
  refreshHighlights();
}

function showDock() {
  dockPresentation.show();
  $('stage-hint').hidden = true; // the hint has done its job once the user acts
}

function openTerminal(id) {
  const session = state.sessions.find((s) => s.id === id);
  if (!session) return;
  if (id === state.selectedId && terminalPanel.isLive(id)) return; // already open and connected: keep its terminal
  state.selectedId = id;
  state.selectedOrderedAt = session.orderedAt || 0; // prompts sent before it opened do not close it
  state.lastOpenedId = id;
  showDock();
  terminalPanel.open(session, state.sessions);
  const figure = population.figures.get(id);
  // Bring its scribe forward in the frame: where it is going, if it is still on its way.
  if (figure) court.focus.focusOn(figure.waypoints.at(-1) ?? figure.group.position);
  rail.update(state.sessions, state.selectedId, state.connected);
  refreshHighlights();
}

function openSummon() {
  court.focus.release();
  audio.cue('call'); // the drum pavilion is struck
  terminalPanel.close();
  state.selectedId = null;
  showDock();
  summonPanel.open();
  rail.update(state.sessions, state.selectedId, state.connected);
  refreshHighlights();
}

function openHistory() {
  court.focus.release();
  terminalPanel.close();
  state.selectedId = null;
  showDock();
  historyPanel.open();
  rail.update(state.sessions, state.selectedId, state.connected);
  refreshHighlights();
}

function openAnnals() {
  court.focus.release();
  terminalPanel.close();
  state.selectedId = null;
  showDock();
  annalsPanel.open();
  rail.update(state.sessions, state.selectedId, state.connected);
  refreshHighlights();
}

function closeDock() {
  court.focus.release();
  state.selectedId = null;
  // As a popup the panel shrinks away first; its terminal stays drawn until it is gone.
  dockPresentation.hide(() => {
    terminalPanel.close();
    dock.innerHTML = '';
  });
  rail.update(state.sessions, state.selectedId, state.connected);
  refreshHighlights();
}

/** Agent-switching keys (see ui/dock-shortcuts.js). The order is the rail's: waiting first. */
attachDockShortcuts((action) => {
  // Not while the summon form, the history or the annals are in the dock: switching would discard it.
  if (!dock.hidden && !dockPresentation.isClosing() && !state.selectedId) return;
  const order = waitingFirst(state.sessions);
  if (!order.length) return;
  const at = order.findIndex((s) => s.id === state.selectedId);
  if (action === 'toggle') {
    if (state.selectedId) closeDock();
    else openTerminal((order.find((s) => s.id === state.lastOpenedId) || order[0]).id);
  } else if (action === 'waiting') {
    // The longest-waiting petition first, then anyone else before the throne.
    const waiting = order.filter((s) => statusOf(s).atThrone && s.id !== state.selectedId);
    const next = waiting.find((s) => s.status === 'asking') || waiting[0];
    if (next) openTerminal(next.id);
  } else {
    const step = action === 'next' ? 1 : -1;
    openTerminal(order[at < 0 ? 0 : (at + step + order.length) % order.length].id);
  }
});

/**
 * As a popup the dock covers the court: once the user submits a prompt to the open agent it steps
 * aside, so the edict can be seen. Driven by the agent's UserPromptSubmit hook, not by keystrokes,
 * so short replies, prompts recalled from history and accepted suggestions count too.
 */
const firstPetitionArrival = createFirstPetitionArrivalWatcher();

/**
 * In popup mode, with the dock closed, an agent coming before the ruler while nobody else waits
 * there opens its terminal at once. Never while something is open in the dock (a terminal, the
 * summon form, the history) and never in docked mode.
 */
function openPopupForFirstPetition(sessions) {
  const id = firstPetitionArrival(sessions); // runs on every feed, to keep its record current
  if (!id || !dockPresentation.isPopup() || !dock.hidden || dockPresentation.isClosing()) return;
  openTerminal(id);
}

function hidePopupAfterSubmittedOrder(sessions) {
  const open = state.selectedId && sessions.find((s) => s.id === state.selectedId);
  if (!open || (open.orderedAt || 0) <= state.selectedOrderedAt) return;
  state.selectedOrderedAt = open.orderedAt;
  if (dockPresentation.isPopup() && !dock.hidden && !dockPresentation.isClosing()) closeDock();
}

function tryOpenPending() {
  if (state.pendingOpenId && state.sessions.some((s) => s.id === state.pendingOpenId)) {
    const id = state.pendingOpenId;
    state.pendingOpenId = null;
    openTerminal(id);
  }
}

/** The shell (rail, chips, dock tabs and strip, tab title) from the latest feed. */
function renderShell() {
  shellTimer = null;
  shellRenderedAt = performance.now();
  const sessions = state.sessions;
  chips.sync(sessions);
  chipsPlacedAt = 0; // place the chips with the next frame
  // A still court draws no frame: place the chips now (their toasts may have changed size).
  if (court.governor.sleeping) chips.place(population.figures, summonAnchor, court.toScreen);
  rail.update(sessions, state.selectedId, state.connected);
  const selected = sessions.find((s) => s.id === state.selectedId);
  if (selected) terminalPanel.refresh(selected, sessions);
  // The open scribe left the feed (exited, ended its session, or was dismissed): close its panel.
  else if (state.selectedId) closeDock();
  else terminalPanel.updateTabs(sessions);
  refreshHighlights();
  document.title = titleFor(sessions);
}
// Busy agents send several hook events a second each: the shell is redrawn at most five
// times a second, the last feed always winning.
const SHELL_INTERVAL_MS = 200;
let shellTimer = null;
let shellRenderedAt = 0;
let sceneSignature = '';

subscribeToSessions((sessions) => {
  state.sessions = sessions;
  audio.observe(sessions);
  population.sync(sessions);
  observeLivingCourt(sessions);
  legion.sync(sessions, population);
  // Wake a court that is holding still only when something in it has to change: an agent
  // came, left or changed state, or its soldiers did. A new step alone needs no drawing.
  const signature = sessions.map((s) => `${s.id}:${s.status}:${s.statusSince}:${(s.soldiers || []).map((x) => x.id).join(',')}`).join('|');
  if (signature !== sceneSignature) court.governor.markMoving(0.6);
  sceneSignature = signature;
  tryOpenPending();
  hidePopupAfterSubmittedOrder(sessions);
  openPopupForFirstPetition(sessions);
  const wait = SHELL_INTERVAL_MS - (performance.now() - shellRenderedAt);
  if (wait <= 0) { clearTimeout(shellTimer); renderShell(); }
  else shellTimer ??= setTimeout(renderShell, wait);
}, (connected, refused = false) => {
  if (connected === state.connected && refused === state.refused) return;
  state.connected = connected;
  state.refused = refused;
  rail.update(state.sessions, state.selectedId, refused ? 'refused' : connected);
});

/** The tab title carries the count of agents waiting, so it is visible from another tab. */
function titleFor(sessions) {
  const waiting = sessions.filter((s) => statusOf(s).atThrone).length;
  return waiting ? `(${waiting}) ${words.appName}` : words.appName;
}

attachPointerPicking($('court'), court.camera, () => [summonTarget, ...[...population.figures.values()].map((f) => f.group), ...legion.pickTargets()], {
  onHover: (pick) => setHover(pick?.kind === 'agent' ? pick.id : null),
  onPick: (pick) => (pick.kind === 'summon' ? openSummon() : openTerminal(pick.id)),
});

// Chips are re-placed when something moved or the feed changed; otherwise a few times a second is plenty.
court.start((dt, time) => {
  const scribesMove = population.update(dt, time);
  const courtMoves = updateLivingCourt(dt, time);
  const soldiersMove = legion.update(dt, time, population);
  const portersMove = porters.update(dt, time);
  const moving = scribesMove || courtMoves || soldiersMove || portersMove;
  if (moving) court.governor.markMoving();
  const now = performance.now();
  // Chips follow whatever moves; when all is still they only need placing after a feed or hover change.
  const tier = court.governor.tier(now);
  if (moving || tier === 'active' || now - chipsPlacedAt > 1000) {
    chipsPlacedAt = now;
    chips.place(population.figures, summonAnchor, court.toScreen);
  }
});


// Exposed for debugging from the browser console.
window.court = { world, saver: () => powerSaver, state, population, porters, legion, audio, king, edicts, ambient, camera: court.camera, controls: court.controls, cost: court.cost, governor: court.governor, THREE };
