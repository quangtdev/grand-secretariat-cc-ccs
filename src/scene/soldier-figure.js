// One sub-agent as a soldier: its behaviour only (the costume is the world's HelperBody).
// Smaller than the scribe who summoned it, so the master stays readable.
//   arriving -> rises out of the summoning seal
//   present  -> stands in formation behind its master's desk; drills with the spear while the master works
//   leaving  -> bows, then sinks back into a jade seal
import * as THREE from 'three';
const SOLDIER_SCALE = 1.05;
const FOLLOW_SPEED = 5.5;
const RISE_DELAY = 0.3; // let the light column appear before the soldier does
const RISE_TIME = 0.75;
const BOW_TIME = 0.4;
const SINK_TIME = 0.4;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/** Overshoots a little at the end, so the soldier lands with a small spring. */
const easeOutBack = (x) => 1 + 2.2 * (x - 1) ** 3 + 1.2 * (x - 1) ** 2;

export class SoldierFigure {
  /**
   * @param {string} masterId  session id of the agent that sent this sub-agent
   * @param {import('../worlds/world-pack-contract.js').HelperBody} body  the world's costume for it
   */
  constructor(soldier, masterId, position, facing, body) {
    this.id = soldier.id;
    this.masterId = masterId;
    this.data = soldier;
    this.phase = Math.random() * 10;
    this.baseScale = body.scale ?? SOLDIER_SCALE;
    this.state = 'arriving';
    this.clock = reducedMotion.matches ? RISE_DELAY + RISE_TIME : 0;
    this.target = position.clone();
    this.facing = facing;

    this.group = new THREE.Group();
    this.group.position.copy(position);
    this.group.rotation.y = facing;
    this.group.userData.pick = { kind: 'agent', id: masterId }; // clicking a soldier opens its master

    this.body = body;
    this.group.add(body.root);
    this.group.scale.setScalar(0.001);
  }

  get gone() { return this.state === 'gone'; }

  /** Start the bow-and-sink exit. `onSink` fires when the soldier starts sinking. */
  dismiss(onSink) {
    if (this.state === 'leaving' || this.state === 'gone') return;
    this.state = 'leaving';
    this.clock = reducedMotion.matches ? BOW_TIME + SINK_TIME : 0;
    this.onSink = onSink;
  }

  /** @param {boolean} drilling  the master is working: the soldier drills with its spear */
  update(dt, time, drilling) {
    this.clock += dt;
    const t = time + this.phase;
    let scale = 1;
    let bow = 0;

    if (this.state === 'arriving') {
      const x = Math.min(Math.max((this.clock - RISE_DELAY) / RISE_TIME, 0), 1);
      scale = x > 0 ? easeOutBack(x) : 0.001;
      if (x >= 1) this.state = 'present';
    } else if (this.state === 'leaving') {
      bow = Math.min(this.clock / BOW_TIME, 1) * 0.55;
      const sink = Math.min(Math.max((this.clock - BOW_TIME) / SINK_TIME, 0), 1);
      if (sink > 0 && this.onSink) { this.onSink(); this.onSink = null; }
      scale = Math.max(1 - sink, 0.001);
      if (sink >= 1) this.state = 'gone';
    }
    this.group.scale.set(this.baseScale * scale, this.baseScale * (this.state === 'leaving' ? scale ** 0.5 : scale), this.baseScale * scale);

    // Follow the formation slot; face where it walks, then the master's facing.
    const position = this.group.position;
    const dx = this.target.x - position.x;
    const dz = this.target.z - position.z;
    const distance = Math.hypot(dx, dz);
    const walking = distance > 0.05 && this.state !== 'leaving';
    this.travelling = walking || this.state !== 'present'; // rising, walking, bowing out
    let facing = this.facing;
    if (walking) {
      const step = Math.min(distance, FOLLOW_SPEED * dt);
      position.x += (dx / distance) * step;
      position.z += (dz / distance) * step;
      if (distance > 0.3) facing = Math.atan2(dx, dz);
    }
    const turn = Math.atan2(Math.sin(facing - this.group.rotation.y), Math.cos(facing - this.group.rotation.y));
    this.group.rotation.y += turn * (1 - Math.exp(-dt * 10));

    const still = reducedMotion.matches;
    const ease = 1 - Math.exp(-dt * 10);
    // Drill: a sharp thrust forward every ~1.3s; at rest the spear stands upright.
    const thrust = drilling && !walking && !still ? Math.max(0, Math.sin(t * 4.8)) ** 4 * 0.9 : 0;
    const bob = walking && !still ? Math.abs(Math.sin(t * 13)) * 0.06 : 0;
    this.body.animate({ thrust, bow, bob, ease });
  }

  dispose() {
    this.group.removeFromParent();
    this.body.dispose();
  }
}
