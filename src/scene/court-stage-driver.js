// The 3D (or isometric 2D) court as a stage driver: everything main.js needs from a world that
// draws figures with three.js. Builds the scene, the figures, the chips over their heads, the
// strolling ruler and the flying edicts, and runs the frame loop. main.js talks to it only through
// the StageDriver interface (worlds/world-pack-contract.js), so a DOM world can stand in its place.
import * as THREE from 'three';
import { CourtPopulation } from './court-population.js';
import { DeskPorterCrew } from './desk-porter-crew.js';
import { createCourtScene } from './court-scene.js';
import { SoldierLegion } from './soldier-legion.js';
import { KingStrollRoutine } from './king-stroll-routine.js';
import { RoyalEdictFlight } from './royal-edict-flight.js';
import { attachPointerPicking } from './scene-pointer-picking.js';
import { OverheadChips } from '../ui/overhead-chips.js';
import { applyVocabularyToPage } from '../ui/apply-vocabulary-to-page.js';
import { assertWorldStage } from '../worlds/world-pack-contract.js';

/**
 * @param {object} options
 * @param {import('../worlds/world-pack-contract.js').WorldPack} options.world
 * @param {{cue: (name: string) => void, murmur: () => void}} options.audio
 * @param {{onOpen: (id: string) => void, onSummon: () => void, onHover: (id: string|null) => void}} options.handlers
 * @returns {import('../worlds/world-pack-contract.js').StageDriver}  throws when the world cannot be built
 */
export function createCourtStageDriver({ world, audio, handlers }) {
  const $ = (id) => document.getElementById(id);
  const court = createCourtScene($('court'), $('stage'), world.environment);
  const stageParts = assertWorldStage(world.buildStage(court.scene, { onChirp: () => audio.cue('chirp') }), world.id);
  // Each body factory once, so a pack that cannot build a figure fails here, not later in the feed.
  [world.bodies.agent({ id: 'boot', status: 'idle' }), world.bodies.ruler(), world.bodies.helper({ id: 'boot' }, 'boot'), world.bodies.porter()].forEach((body) => body.dispose?.());

  const { summonTarget, summonAnchor, ambient } = stageParts;
  // The static page text and the hint (a 3D court can also be turned; a 2D one only slides and zooms).
  applyVocabularyToPage(world.environment.camera.type === 'orthographic');
  const porters = new DeskPorterCrew(court.scene, world, { onDeskDown: () => audio.cue('desk') }); // carry desks out and away
  const population = new CourtPopulation(court.scene, porters, world);
  const legion = new SoldierLegion(court.scene, world); // sub-agents, as soldiers beside their agent
  const chips = new OverheadChips($('chips'), handlers);
  const king = new KingStrollRoutine(court.scene, world);
  const edicts = new RoyalEdictFlight(court.scene, world);
  const handPosition = new THREE.Vector3();

  let powerSaver = false;
  let chipsPlacedAt = 0; // when the overhead chips were last placed (ms)
  let sceneSignature = '';

  /** @returns {boolean} true while the king or an edict travels */
  function updateLivingCourt(dt, time) {
    const kingMoves = king.update(dt, time);
    const edictFlies = edicts.update(dt);
    if (powerSaver) return kingMoves || edictFlies; // background life holds still
    for (const life of ambient) life.update(dt, time);
    return kingMoves || edictFlies;
  }

  attachPointerPicking($('court'), court.camera, () => [summonTarget, ...[...population.figures.values()].map((f) => f.group), ...legion.pickTargets()], {
    onHover: (pick) => handlers.onHover(pick?.kind === 'agent' ? pick.id : null),
    onPick: (pick) => (pick.kind === 'summon' ? handlers.onSummon() : handlers.onOpen(pick.id)),
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

  return {
    /** Every feed: figures, the king and soldiers follow the sessions at once. */
    sync(sessions) {
      population.sync(sessions);
      king.observe(sessions);
      const petition = sessions.some((s) => s.status === 'asking');
      court.governor.setPetition(petition); // the court never goes fully still while someone asks
      for (const life of ambient) life.settle?.(petition);
      legion.sync(sessions, population);
      // Wake a court that is holding still only when something in it has to change: an agent
      // came, left or changed state, or its soldiers did. A new step alone needs no drawing.
      const signature = sessions.map((s) => `${s.id}:${s.status}:${s.statusSince}:${(s.soldiers || []).map((x) => x.id).join(',')}`).join('|');
      if (signature !== sceneSignature) court.governor.markMoving(0.6);
      sceneSignature = signature;
    },
    /** The throttled shell render: chip text and sizes. */
    render(sessions) {
      chips.sync(sessions);
      chipsPlacedAt = 0; // place the chips with the next frame
      // A still court draws no frame: place the chips now (their toasts may have changed size).
      if (court.governor.sleeping) chips.place(population.figures, summonAnchor, court.toScreen);
    },
    highlight(ids, selectedId) {
      population.highlight(ids);
      population.spotlight(selectedId);
      chips.setActive(ids);
    },
    hovered() {
      court.governor.markActive(0.1); // show the ring without waiting for the next ambient frame
      chipsPlacedAt = 0; // a hovered chip grows (order, soldiers): place again
    },
    /** Bring its scribe forward in the frame: where it is going, if it is still on its way. */
    focus(id) {
      const figure = population.figures.get(id);
      if (figure) court.focus.focusOn(figure.waypoints.at(-1) ?? figure.group.position);
    },
    release() { court.focus.release(); },
    setPowerSaver(on) {
      powerSaver = on;
      court.setPowerSaver(on);
      king.setLeisure(!on);
    },
    /** The user is typing an order in the dock: the king whispers it and comes back to the throne. */
    dictate() {
      if (king.state !== 'seated') court.governor.markMoving(1); // the king has to come back: wake a still court
      king.attend();
    },
    /** An order was sent: the king points, an edict flies to the scribe, who bows. */
    edict(id) {
      court.governor.markMoving(1.5);
      const figure = population.figures.get(id);
      if (!figure || figure.leaving) return;
      king.decree(figure);
      // Let the king's arm come up before the scroll leaves his hand.
      setTimeout(() => {
        if (figure.leaving) return;
        edicts.launch(king.king.handPosition(handPosition), figure.group.position, () => { if (!figure.leaving) figure.bow(); });
      }, 350);
    },
    debug: { population, porters, legion, king, edicts, ambient, camera: court.camera, controls: court.controls, cost: court.cost, governor: court.governor, THREE, saver: () => powerSaver },
  };
}
