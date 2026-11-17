// A royal edict in flight: when the user sends an order from the dock, a scroll (the world's projectile) leaves the king's hand, arcs over the court trailing golden sparks, and
// lands at the scribe it is meant for (who bows). One-shot; several may fly at once.
import * as THREE from 'three';
import { sparkTexture } from './summoning-portal-effect.js';

const DURATION = 1.1; // seconds
const ARC_HEIGHT = 3.5; // how far above the straight line the arc rises
const TRAIL = 16; // spark positions kept behind the scroll
const LANDING_HEIGHT = 1.3; // the scribe's chest
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const easeInOut = (x) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);

/** Point on a quadratic Bezier curve. */
function bezier(a, control, b, t, target) {
  const u = 1 - t;
  return target.set(
    u * u * a.x + 2 * u * t * control.x + t * t * b.x,
    u * u * a.y + 2 * u * t * control.y + t * t * b.y,
    u * u * a.z + 2 * u * t * control.z + t * t * b.z,
  );
}

class EdictFlight {
  constructor(scene, from, to, onArrive, scroll, trailColor) {
    this.age = 0;
    this.from = from.clone();
    this.to = to; // live reference: the scribe may still be walking
    this.onArrive = onArrive;
    this.scroll = scroll;
    this.scroll.position.copy(from);

    this.trailGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(TRAIL * 3);
    for (let i = 0; i < TRAIL; i++) positions.set([from.x, from.y, from.z], i * 3);
    this.trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.trailMaterial = new THREE.PointsMaterial({
      color: trailColor, size: 0.18, map: sparkTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.trail = new THREE.Points(this.trailGeometry, this.trailMaterial);
    this.trail.frustumCulled = false; // positions change every frame
    scene.add(this.scroll, this.trail);
    this.target = new THREE.Vector3();
    this.control = new THREE.Vector3();
  }

  /** Advance; returns false once landed (then dispose). */
  update(dt) {
    this.age += dt;
    const t = Math.min(this.age / DURATION, 1);
    this.target.copy(this.to).setY(this.to.y + LANDING_HEIGHT);
    this.control.addVectors(this.from, this.target).multiplyScalar(0.5).setY(Math.max(this.from.y, this.target.y) + ARC_HEIGHT);
    bezier(this.from, this.control, this.target, easeInOut(t), this.scroll.position);
    this.scroll.rotation.y = Math.atan2(this.target.x - this.from.x, this.target.z - this.from.z) + Math.PI / 2;
    this.scroll.rotation.x = this.age * 9; // the scroll tumbles as it flies
    this.scroll.scale.setScalar(Math.min(1, t * 6, (1 - t) * 6 + 0.3));

    // Shift the trail one step and put the newest spark at the scroll.
    const positions = this.trailGeometry.attributes.position.array;
    positions.copyWithin(3, 0, (TRAIL - 1) * 3);
    positions[0] = this.scroll.position.x;
    positions[1] = this.scroll.position.y;
    positions[2] = this.scroll.position.z;
    this.trailGeometry.attributes.position.needsUpdate = true;
    this.trailMaterial.opacity = t < 0.85 ? 1 : (1 - t) / 0.15;

    if (t >= 1) {
      const arrive = this.onArrive;
      this.onArrive = null; // land once, however often update is called afterwards
      arrive?.();
      return false;
    }
    return true;
  }

  dispose() {
    this.scroll.removeFromParent();
    this.scroll.userData.dispose?.(); // a world whose scrolls own their geometry frees it here
    this.trail.removeFromParent();
    this.trailGeometry.dispose();
    this.trailMaterial.dispose();
  }
}

export class RoyalEdictFlight {
  /** @param {import('../worlds/world-pack-contract.js').WorldPack} world  gives the flying scroll and the colour of its sparks */
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.flights = new Set();
  }

  /** Send an edict from `from` to the live position `to`; `onArrive` runs when it lands. */
  launch(from, to, onArrive) {
    if (reducedMotion.matches) return; // no flight: the whisper and seal still sound
    this.flights.add(new EdictFlight(this.scene, from, to, onArrive, this.world.bodies.edictProjectile(), this.world.palette.edictTrail));
  }

  /** @returns {boolean} true while an edict is in the air */
  update(dt) {
    for (const flight of this.flights) {
      if (!flight.update(dt)) { flight.dispose(); this.flights.delete(flight); }
    }
    return this.flights.size > 0;
  }
}
