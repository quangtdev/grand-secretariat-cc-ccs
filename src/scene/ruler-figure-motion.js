// The king as a figure that can leave the throne: movement and pose choice only (the world's
// RulerBody, see worlds/world-pack-contract.js, is the costume). Decisions (when to stroll,
// when to hurry back) live in king-stroll-routine.js.
//   seated   -> on the throne           standing -> upright, hands folded in front
//   gazing   -> upright, looking out    walking  -> while moving; faster when he runs
// Movement is in 3D (x, y and z) so he can walk down the plinth stair.
import * as THREE from 'three';

const KING_SCALE = 1.25;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

export class RulerFigureMotion {
  /** @param {THREE.Vector3} position  @param {number} facing  rotation.y  @param {import('../worlds/world-pack-contract.js').RulerBody} body */
  constructor(position, facing, body) {
    this.waypoints = [];
    this.speed = 0;
    this.onArrive = null;
    this.pose = 'seated';
    this.restFacing = facing;
    this.pointing = null; // { target: Vector3, until: number(seconds of this.clock) }
    this.clock = 0;
    this.body = body;

    this.group = new THREE.Group();
    this.group.position.copy(position);
    this.group.rotation.y = facing;
    this.group.scale.setScalar(body.scale ?? KING_SCALE);
    this.group.add(body.root);
    body.setPose(this.pose);
  }

  get moving() { return this.waypoints.length > 0; }

  /** Walk (or run) through 3D waypoints at `speed` units/s, then turn to `facing`. */
  walkTo(waypoints, facing, { speed, onArrive = null }) {
    this.waypoints = waypoints.map((p) => p.clone());
    this.restFacing = facing;
    this.speed = speed;
    this.onArrive = onArrive;
    if (reducedMotion.matches && waypoints.length) { // no travel: arrive at once
      this.group.position.copy(waypoints.at(-1));
      this.waypoints = [];
      this.#arrived();
    }
  }

  /** Stop where he is (a new walk will be issued at once). */
  halt() {
    this.waypoints = [];
    this.onArrive = null;
  }

  setPose(pose) {
    this.pose = pose;
    this.body.setPose(pose);
  }

  /** Turn towards a world point and raise the right arm at it for `seconds`. */
  point(target, seconds = 1.4) {
    if (reducedMotion.matches) return;
    this.pointing = { target: target.clone(), until: this.clock + seconds };
  }

  /** World position of the right hand, where an edict leaves from. */
  handPosition(target) {
    return this.body.handPosition(target);
  }

  update(dt, time) {
    this.clock += dt;
    const position = this.group.position;
    let facing = this.restFacing;

    if (this.moving) {
      const next = this.waypoints[0];
      const dx = next.x - position.x;
      const dy = next.y - position.y;
      const dz = next.z - position.z;
      const distance = Math.hypot(dx, dy, dz);
      const step = this.speed * dt;
      if (distance <= step) {
        position.copy(next);
        this.waypoints.shift();
        if (!this.moving) this.#arrived();
      } else {
        position.x += (dx / distance) * step;
        position.y += (dy / distance) * step;
        position.z += (dz / distance) * step;
        if (Math.hypot(dx, dz) > 0.01) facing = Math.atan2(dx, dz);
      }
    }

    const pointing = this.pointing && this.clock < this.pointing.until ? this.pointing : null;
    if (pointing && !this.moving) {
      facing = Math.atan2(pointing.target.x - position.x, pointing.target.z - position.z);
    }

    // Turn the short way round towards the facing.
    const turn = Math.atan2(Math.sin(facing - this.group.rotation.y), Math.cos(facing - this.group.rotation.y));
    this.group.rotation.y += turn * (1 - Math.exp(-dt * 8));

    const running = this.speed > 4;
    this.body.animate({
      pose: this.moving ? 'walking' : this.pose,
      moving: this.moving,
      running,
      pointing: Boolean(pointing),
      time,
      ease: 1 - Math.exp(-dt * 7),
      still: reducedMotion.matches,
      bob: this.moving ? Math.abs(Math.sin(time * (running ? 13 : 8))) * 0.05 : 0,
    });
  }

  #arrived() {
    const done = this.onArrive;
    this.onArrive = null;
    done?.();
  }
}
