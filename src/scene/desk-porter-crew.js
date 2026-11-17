// Desks on demand. The yard holds only the desks in use: when an agent is summoned, two
// porters (guards without spears) carry its desk out from behind the drum pavilion, set
// it down at its place, bow and trot back; when the agent has gone they carry it away.
// One crew of two serves every request in turn. Agents already present when the page
// opens, and anyone under reduced motion, simply have their desk in place.
import * as THREE from 'three';
import { DESKS as DEFAULT_DESKS, DRUM_PAVILION } from './court-layout.js';

const DEPOT = DRUM_PAVILION.clone().add(new THREE.Vector3(2.4, 0, 1.6)); // where desks come from
const WEST_AISLE_X = -8.6; // north-south aisle outside the west desks and their soldiers
const ROW_GAP = 1.3; // the east-west corridor runs this far south of a desk row
const CARRY_SPEED = 4.6;
const EMPTY_SPEED = 6;
const LIFT = 0.45; // how high a carried desk hangs
const REACH = 0.85; // each porter stands this far from the desk's centre
const SET_SECONDS = 0.35; // lifting or setting down
const BOW_SECONDS = 0.45;
const PORTER_SCALE = 1.05;
const TURN_RATE = 9; // how quickly the crew and each porter swing round to a new heading (1/s)
const MAX_TURN_SPEED = 7; // rad/s: a half turn takes at least ~0.45 s
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/** Angle wrapped into (-π, π]. */
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
/** The crew's axis is a line, not a direction: turn `axis` the short way to lie along `heading` either way round. */
function foldTowards(axis, heading) {
  let d = wrap(heading - axis);
  if (d > Math.PI / 2) d -= Math.PI;
  else if (d < -Math.PI / 2) d += Math.PI;
  return d;
}
/** Desk yaw relative to the crew axis: a whole number of half turns that lands the mat on its side. */
/** One frame of an eased turn by `delta`, no faster than MAX_TURN_SPEED. */
const turnStep = (delta, ease, dt) => Math.sign(delta) * Math.min(Math.abs(delta) * ease, MAX_TURN_SPEED * dt);
const halfTurns = (rest, axis) => Math.round(wrap(rest - axis) / Math.PI) * Math.PI;

export class DeskPorterCrew {
  /**
   * @param {THREE.Scene} scene
   * @param {import('../worlds/world-pack-contract.js').WorldPack} world  gives the porters and the desks
   * @param {{onDeskDown?: () => void}} handlers  onDeskDown: a desk was set on the paving
   */
  constructor(scene, world, { onDeskDown = () => {} } = {}) {
    this.scene = scene;
    this.world = world;
    this.desksPlan = world.desks ?? DEFAULT_DESKS; // the world's own slots, or the shared plan
    this.bow = 0; // the porters' bow, held between phases as it always was
    this.onDeskDown = onDeskDown;
    this.desks = new Map(); // desk index -> WritingDesk
    this.jobs = []; // waiting: { type: 'bring' | 'take', index, onSetOff }
    this.job = null; // in progress
    this.point = new THREE.Vector3(); // centre of the crew
    this.heading = 0; // the way they walk
    this.axis = 0; // the line porter-desk-porter, eased round corners; never spins on a reversal
    this.porters = [0, 1].map(() => {
      const body = world.bodies.porter();
      const group = new THREE.Group();
      group.add(body.root);
      group.scale.setScalar(body.scale ?? PORTER_SCALE);
      group.visible = false;
      scene.add(group);
      return { group, body, yaw: 0 };
    });
  }

  /** The desk at `index`, if it is out. */
  deskAt(index) { return this.desks.get(index); }

  /** Put a desk in place at once (page load, reduced motion). */
  place(index) {
    if (this.desks.has(index)) return;
    const desk = this.world.bodies.workplace(this.desksPlan[index]);
    this.scene.add(desk.group);
    this.desks.set(index, desk);
  }

  /** Have the desk at `index` carried out. `onSetOff` tells its scribe to come: when the porters near the desk's place (or at once if the desk is already there). */
  bring(index, onSetOff = () => {}) {
    const queuedTake = this.jobs.findIndex((j) => j.type === 'take' && j.index === index);
    if (queuedTake >= 0) { this.jobs.splice(queuedTake, 1); onSetOff(); return; } // it never left
    // Already being brought for someone else (a shared or re-used desk): come along with it.
    const pending = [this.job, ...this.jobs].find((j) => j?.type === 'bring' && j.index === index);
    if (pending) {
      if (pending.setOff) onSetOff();
      else { const first = pending.onSetOff; pending.onSetOff = () => { first(); onSetOff(); }; }
      return;
    }
    const beingTaken = this.job?.type === 'take' && this.job.index === index;
    if (this.desks.has(index) && !beingTaken) { onSetOff(); return; }
    // No carrying under reduced motion, while the tab is hidden (jobs would pile up unseen),
    // or when the crew is already behind: the desk is simply put in place.
    if (!beingTaken && (reducedMotion.matches || document.hidden || this.jobs.length >= 2)) { this.place(index); onSetOff(); return; }
    this.jobs.push({ type: 'bring', index, onSetOff });
  }

  /** Have the desk at `index` carried away. */
  take(index) {
    const queuedBring = this.jobs.findIndex((j) => j.type === 'bring' && j.index === index);
    if (queuedBring >= 0) { this.jobs.splice(queuedBring, 1); return; } // it never came
    if (!this.desks.has(index) || this.jobs.some((j) => j.type === 'take' && j.index === index)) return;
    if (reducedMotion.matches) { this.#remove(index); return; }
    this.jobs.push({ type: 'take', index });
  }

  /** @returns {boolean} true while the porters are out */
  update(dt, time) {
    if (!this.job) {
      if (!this.jobs.length) return false;
      const next = this.jobs.shift();
      if (next.type === 'take' && !this.desks.has(next.index)) return true; // nothing left to take
      this.#start(next);
    }
    const job = this.job;
    const ease = 1 - Math.exp(-dt * TURN_RATE);
    this.axis += turnStep(foldTowards(this.axis, this.heading), ease, dt);
    if (job.phase === 'walk') {
      this.#walk(dt);
    } else {
      job.clock += dt;
      const t = Math.min(job.clock / (job.phase === 'bow' ? BOW_SECONDS : SET_SECONDS), 1);
      if (job.phase === 'set') this.#carryDesk(1 - t); // lowering onto the paving
      if (job.phase === 'lift') this.#carryDesk(t);
      this.bow = job.phase === 'bow' ? Math.sin(Math.PI * t) * 0.5 : 0;
      if (t >= 1) this.#phaseDone();
    }
    this.#placePorters(time, ease, dt);
    return true;
  }

  #start(job) {
    this.job = job;
    const slot = this.desksPlan[job.index].desk;
    const corridor = slot.z + ROW_GAP;
    job.path = [new THREE.Vector3(WEST_AISLE_X, 0, corridor), new THREE.Vector3(slot.x, 0, corridor), slot.clone()];
    job.carrying = job.type === 'bring';
    job.phase = 'walk';
    job.returning = false;
    this.point.copy(DEPOT);
    this.heading = Math.atan2(job.path[0].x - DEPOT.x, job.path[0].z - DEPOT.z);
    this.axis = this.heading;
    for (const porter of this.porters) porter.yaw = this.heading;
    if (job.type === 'bring') this.place(job.index);
    job.desk = this.desks.get(job.index);
    // Where the axis will lie on arrival decides which way round the desk is carried, so it
    // needs no turn when set down: walk the axis along the path ahead of time.
    let axis = this.axis;
    let from = DEPOT;
    for (const to of job.path) { if (to.distanceTo(from) > 1e-6) axis += foldTowards(axis, Math.atan2(to.x - from.x, to.z - from.z)); from = to; }
    job.deskTurn = halfTurns(job.desk.restRotation, axis);
    if (job.carrying) this.#carryDesk(1);
    for (const porter of this.porters) porter.group.visible = true;
  }

  #walk(dt) {
    const job = this.job;
    const next = job.path[0];
    const dx = next.x - this.point.x;
    const dz = next.z - this.point.z;
    const distance = Math.hypot(dx, dz);
    const step = (job.carrying ? CARRY_SPEED : EMPTY_SPEED) * dt;
    if (distance > 1e-6) this.heading = Math.atan2(dx, dz);
    if (distance > step) {
      this.point.x += (dx / distance) * step;
      this.point.z += (dz / distance) * step;
    } else {
      this.point.copy(next);
      job.path.shift();
      // On the last stretch to the desk's place: its scribe may set off now, and arrive after it.
      if (job.type === 'bring' && !job.returning && job.path.length === 1) { job.setOff = true; job.onSetOff(); }
    }
    if (job.carrying) this.#carryDesk(1);
    if (!job.path.length) this.#phaseDone();
  }

  /** Moves on after a walk, a lift, a set-down or a bow. */
  #phaseDone() {
    const job = this.job;
    job.clock = 0;
    if (job.phase === 'walk' && !job.returning) {
      job.phase = job.type === 'bring' ? 'set' : 'lift'; // arrived at the desk's place
    } else if (job.phase === 'set') {
      job.carrying = false;
      this.#carryDesk(0);
      this.onDeskDown();
      job.phase = 'bow';
    } else if (job.phase === 'bow' || job.phase === 'lift') {
      // Back the way they came, with the desk if they came to take it.
      job.carrying = job.type === 'take';
      job.returning = true;
      const slot = this.desksPlan[job.index].desk;
      job.path = [new THREE.Vector3(slot.x, 0, slot.z + ROW_GAP), new THREE.Vector3(WEST_AISLE_X, 0, slot.z + ROW_GAP), DEPOT.clone()];
      job.phase = 'walk';
    } else {
      if (job.type === 'take') this.#remove(job.index);
      for (const porter of this.porters) porter.group.visible = false;
      this.job = null;
    }
  }

  /** Desk hung between the porters (`lift` 1) or resting at its place (`lift` 0). */
  #carryDesk(lift) {
    const { desk } = this.job;
    desk.group.position.set(this.point.x, LIFT * lift, this.point.z); // lifted and set down at its own place
    // Carried lengthwise between the porters (who hold the table's ends, the mat out to the
    // side), squared to the path when it rests.
    const carried = this.axis + (this.job.deskTurn ?? 0);
    desk.group.rotation.y = desk.restRotation + wrap(carried - desk.restRotation) * lift;
  }

  /** One porter at each end of the desk: facing the way they go, or the desk while lifting and setting it down. */
  #placePorters(time, ease, dt) {
    const walking = this.job?.phase === 'walk';
    this.porters.forEach((porter, i) => {
      const side = i ? 1 : -1;
      porter.group.position.set(this.point.x + Math.sin(this.axis) * REACH * side, 0, this.point.z + Math.cos(this.axis) * REACH * side);
      const facing = walking ? this.heading : this.axis + (side > 0 ? Math.PI : 0);
      porter.yaw += turnStep(wrap(facing - porter.yaw), ease, dt); // turn round, never snap
      porter.group.rotation.y = porter.yaw;
      porter.body.animate({ bow: this.bow, bob: walking ? Math.abs(Math.sin(time * 12 + i)) * 0.05 : 0 });
    });
  }

  #remove(index) {
    this.desks.get(index)?.dispose();
    this.desks.delete(index);
  }
}
