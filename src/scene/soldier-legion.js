// Keeps the soldiers (sub-agents) in step with the session feed: each agent's soldiers
// are summoned out of a golden seal, stand in ranks behind their master's desk, and sink
// into a jade seal when they report back. They hold their post at the desk while the
// master goes before the throne: soldiers do not attend court, and the petition queue
// stays clear.
import * as THREE from 'three';
import { SoldierFigure } from './soldier-figure.js';
import { SummoningPortal } from './summoning-portal-effect.js';

// Slot i in the master's frame: files to either side, ranks further behind.
const FILE_OFFSETS = [-0.8, 0.8, -1.5, 1.5];
const FIRST_RANK = 0.8; // clear of the sitting mat, which reaches ~0.5 behind the seat
const RANK_GAP = 0.8;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const keyOf = (masterId, soldierId) => `${masterId}:${soldierId}`;

/** World position of formation slot `index` for a master at `origin` facing `facing`. */
function slotPosition(origin, facing, index, target) {
  const lateral = FILE_OFFSETS[index % FILE_OFFSETS.length];
  const back = FIRST_RANK + Math.floor(index / FILE_OFFSETS.length) * RANK_GAP;
  const sin = Math.sin(facing);
  const cos = Math.cos(facing);
  // right = (cos, -sin), forward = (sin, cos); the slot is right * lateral - forward * back.
  return target.set(origin.x + cos * lateral - sin * back, 0, origin.z - sin * lateral - cos * back);
}

export class SoldierLegion {
  /** @param {import('../worlds/world-pack-contract.js').WorldPack} world */
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.soldiers = new Map(); // master:soldier -> SoldierFigure
    this.portals = new Set();
    this.slots = new Map(); // master:soldier -> formation index
    this.working = new Set(); // master ids whose soldiers drill
    this.firstSync = true;
  }

  /** @param {Array} sessions  the session feed  @param {CourtPopulation} population */
  sync(sessions, population) {
    const live = new Set();
    this.slots.clear();
    this.working.clear();
    for (const session of sessions) {
      if (session.status === 'working') this.working.add(session.id);
      const desk = population.homeDesk(session.id);
      (session.soldiers || []).forEach((soldier, index) => {
        const key = keyOf(session.id, soldier.id);
        live.add(key);
        this.slots.set(key, index);
        let figure = this.soldiers.get(key);
        if (!figure && desk) {
          const spot = slotPosition(desk.seat, desk.facing, index, new THREE.Vector3());
          figure = new SoldierFigure(soldier, session.id, spot, desk.facing, this.world.bodies.helper(soldier, session.id));
          this.soldiers.set(key, figure);
          this.scene.add(figure.group);
          // Soldiers already out when the page opens are simply there; new ones are summoned.
          if (!this.firstSync) this.#portal(spot, this.world.palette.portalSummon);
          else figure.clock = Infinity;
        }
        if (figure) figure.data = soldier;
      });
    }
    for (const [key, figure] of this.soldiers) {
      if (!live.has(key)) figure.dismiss(() => this.#portal(figure.group.position, this.world.palette.portalDismiss));
    }
    this.firstSync = false;
  }

  #portal(position, color) {
    if (!reducedMotion.matches) this.portals.add(new SummoningPortal(this.scene, position, color));
  }

  /** @returns {boolean} true while a soldier travels or a summoning seal plays */
  update(dt, time, population) {
    let travelling = this.portals.size > 0;
    for (const [key, figure] of this.soldiers) {
      const master = population.figures.get(figure.masterId);
      const desk = population.homeDesk(figure.masterId);
      if (!master || master.leaving || !desk) figure.dismiss(() => this.#portal(figure.group.position, this.world.palette.portalDismiss));
      else if (this.slots.has(key)) {
        // Post behind the desk; ranks close up when a soldier ahead reports back.
        slotPosition(desk.seat, desk.facing, this.slots.get(key), figure.target);
        figure.facing = desk.facing;
      }
      figure.update(dt, time, this.working.has(figure.masterId));
      travelling ||= figure.travelling;
      if (figure.gone) { figure.dispose(); this.soldiers.delete(key); }
    }
    for (const portal of this.portals) {
      if (!portal.update(dt)) { portal.dispose(); this.portals.delete(portal); }
    }
    return travelling;
  }

  /** Soldier groups, for pointer picking (a soldier picks as its master). */
  pickTargets() {
    return [...this.soldiers.values()].map((f) => f.group);
  }
}
