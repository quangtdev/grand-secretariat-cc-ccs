// One agent as a figure in the yard: everything that is behaviour and not costume. It owns the
// group, the walk along waypoints (walk / run speed), the turn, the bob, the bow timer, the choice
// of pose for each status and the hover ring; the world's body (see worlds/world-pack-contract.js,
// AgentBody) is the costume and is told what to do through `body.animate(state)` each update.
//   working -> seated at the desk      idle -> seated      asking -> kneels before the throne
//   done    -> stands before the throne    moving -> walking
import * as THREE from 'three';

const WALK_SPEED = 3.4;
const RUN_SPEED = 6.2;
const DEFAULT_SCALE = 1.5; // larger than life so states read from the default camera
const BOW_SECONDS = 0.8;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/** Stable small number from text (de-syncs neighbours, picks a robe dye). */
export function hashIndex(text, modulo) {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % modulo;
}

export class AgentFigureMotion {
  /**
   * @param {{id: string, status: string}} session
   * @param {import('../worlds/world-pack-contract.js').AgentBody} body
   * @param {import('../worlds/world-pack-contract.js').WorldPalette} palette
   */
  constructor(session, position, facing, body, palette) {
    this.id = session.id;
    this.status = session.status;
    this.waypoints = [];
    this.restFacing = facing;
    this.running = false;
    this.onArrive = null;
    this.bowLeft = 0; // seconds of a bow still to play
    this.held = false; // waiting at the entrance until its desk is on the way
    this.phase = hashIndex(session.id, 100) / 10; // de-syncs neighbours' motion
    this.body = body;
    this.scale = body.scale ?? DEFAULT_SCALE;

    this.group = new THREE.Group();
    this.group.position.copy(position);
    this.group.rotation.y = facing;
    this.group.scale.setScalar(this.scale);
    this.group.userData.pick = { kind: 'agent', id: session.id };
    this.group.add(body.root);

    // Ground ring shown while hovered or selected.
    this.ring = new THREE.Mesh(
      new THREE.RingGeometry(0.44, 0.54, 32),
      new THREE.MeshBasicMaterial({ color: palette.ring, transparent: true, opacity: 0.95 }),
    );
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.y = 0.03;
    this.ring.visible = false;
    this.group.add(this.ring);
  }

  /** Walk through `waypoints` (Vector3 list), then turn to `facing`. */
  walkTo(waypoints, facing, { run = false, onArrive = null } = {}) {
    this.waypoints = waypoints.map((p) => p.clone());
    this.restFacing = facing;
    this.running = run;
    this.onArrive = onArrive;
    if (reducedMotion.matches && waypoints.length) { // no travel animation: arrive at once
      this.group.position.copy(waypoints.at(-1));
      this.waypoints = [];
      this.#arrived();
    }
  }

  #arrived() {
    const done = this.onArrive;
    this.onArrive = null;
    done?.();
  }

  /** On its way somewhere (a figure held at the entrance is not: it stands and waits). */
  get moving() { return this.waypoints.length > 0 && !this.held; }

  /** A short bow, as when an edict from the king reaches this scribe. */
  bow() {
    if (!reducedMotion.matches) this.bowLeft = BOW_SECONDS;
  }

  /** World position just above the head, where the name chip is anchored. */
  chipAnchor(target) {
    return target.copy(this.group.position).setY(this.group.position.y + this.body.chipHeight(this.status) * this.scale);
  }

  update(dt, time) {
    const position = this.group.position;
    let facing = this.restFacing;

    if (this.moving) {
      const next = this.waypoints[0];
      const dx = next.x - position.x;
      const dz = next.z - position.z;
      const distance = Math.hypot(dx, dz);
      const step = (this.running ? RUN_SPEED : WALK_SPEED) * dt;
      if (distance <= step) {
        position.copy(next);
        this.waypoints.shift();
        if (!this.moving) this.#arrived();
      } else {
        position.x += (dx / distance) * step;
        position.z += (dz / distance) * step;
        facing = Math.atan2(dx, dz);
      }
    }

    const t = time + this.phase;
    const pose = this.moving ? 'walking'
      : this.status === 'asking' ? 'kneeling'
      : this.status === 'done' ? 'standing' : 'seated';
    const ease = 1 - Math.exp(-dt * 9);

    // Turn the short way round towards the facing.
    const turn = Math.atan2(Math.sin(facing - this.group.rotation.y), Math.cos(facing - this.group.rotation.y));
    this.group.rotation.y += turn * (1 - Math.exp(-dt * 12));

    const bob = this.moving ? Math.abs(Math.sin(t * (this.running ? 15 : 10))) * 0.07 : 0;
    this.bowLeft = Math.max(0, this.bowLeft - dt);
    const bow = Math.sin(Math.PI * (1 - this.bowLeft / BOW_SECONDS)) * (this.bowLeft > 0 ? 1 : 0);

    this.body.animate({
      pose, moving: this.moving, running: this.running, working: this.status === 'working',
      status: this.status, bow, bob, t, dt, ease, still: reducedMotion.matches,
    });
  }

  dispose() {
    this.group.removeFromParent();
    this.ring.geometry.dispose();
    this.ring.material.dispose();
    this.body.dispose();
  }
}
