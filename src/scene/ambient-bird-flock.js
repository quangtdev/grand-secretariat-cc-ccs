// A loose flock of white egrets over the court. Each bird circles on its own ring
// around a slowly drifting centre (no flocking simulation: offsets keep them together),
// flapping, then gliding. Now and then one lands on a roof perch, sits a while and
// takes off again. While a petition waits the whole flock settles on the roofs, so
// nothing in the sky competes with the scribe asking for a ruling.
import * as THREE from 'three';
import { BIRD_PERCHES, PALETTE } from './court-layout.js';

const BIRD_COUNT = 7;
const FLY_SPEED = 3.2;
const LAND_SECONDS = 3;
const PERCH_EVERY = [30, 60]; // seconds between one bird landing
const PERCH_SECONDS = [10, 20];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const between = ([low, high]) => low + Math.random() * (high - low);
const smooth = (x) => x * x * (3 - 2 * x);
const before = new THREE.Vector3(); // scratch: position at the previous frame
const flightEnd = new THREE.Vector3(); // scratch: where a take-off rejoins the ring

let shared;
function sharedParts() {
  if (shared) return shared;
  const wing = new THREE.BufferGeometry();
  // A swept triangle from the shoulder out to the tip, built for the right wing (+x).
  wing.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.09, 0, 0, -0.07, 0.42, 0, -0.12], 3));
  wing.computeVertexNormals();
  shared = {
    body: new THREE.OctahedronGeometry(0.1, 0).scale(0.75, 0.7, 2.4),
    wing,
    feathers: new THREE.MeshStandardMaterial({ color: PALETTE.paper, roughness: 0.8, flatShading: true, side: THREE.DoubleSide }),
  };
  return shared;
}

function buildBird() {
  const { body, wing, feathers } = sharedParts();
  const group = new THREE.Group();
  group.add(new THREE.Mesh(body, feathers));
  const wings = [-1, 1].map((side) => {
    const w = new THREE.Mesh(wing, feathers);
    w.scale.x = side; // mirrored for the left wing
    group.add(w);
    return w;
  });
  return { group, wings };
}

export class AmbientBirdFlock {
  /** @param {THREE.Scene} scene  @param {{onPerch?: () => void}} handlers  onPerch: a bird has landed */
  constructor(scene, { onPerch = () => {} } = {}) {
    this.onPerch = onPerch;
    this.settled = false;
    this.clock = 0;
    this.nextPerch = between(PERCH_EVERY);
    this.centre = new THREE.Vector3();
    this.birds = Array.from({ length: BIRD_COUNT }, (_, i) => {
      const { group, wings } = buildBird();
      scene.add(group);
      return {
        group, wings, perch: null, state: 'flying', clock: 0, stay: 0, from: new THREE.Vector3(),
        radius: 11 + (i % 3) * 1.6, height: 10 + (i % 4) * 0.9, angle: i * 0.32, phase: i * 1.3,
      };
    });
    for (const bird of this.birds) this.#flightPoint(bird, 0, bird.group.position);
    if (reducedMotion.matches) this.birds.forEach((bird, i) => this.#placeOnPerch(bird, BIRD_PERCHES[i % BIRD_PERCHES.length]));
  }

  /** While true (a petition waits) every bird lands and stays. */
  settle(on) {
    if (on === this.settled) return;
    this.settled = on;
    if (on) for (const bird of this.birds) if (bird.state === 'flying') this.#land(bird);
    if (!on) this.birds.forEach((bird, i) => { if (bird.state === 'perched') bird.stay = 1 + i * 1.5; }); // take off in turn
  }

  update(dt, time) {
    if (reducedMotion.matches) return;
    this.clock += dt;
    // The flock's centre drifts slowly over the court.
    this.centre.set(Math.sin(this.clock * 0.05) * 4, 0, -3 + Math.sin(this.clock * 0.037) * 3);

    if (!this.settled) {
      this.nextPerch -= dt;
      if (this.nextPerch <= 0) {
        this.nextPerch = between(PERCH_EVERY);
        const flier = this.birds.find((b) => b.state === 'flying');
        if (flier) this.#land(flier);
      }
    }
    for (const bird of this.birds) this.#updateBird(bird, dt, time);
  }

  #updateBird(bird, dt, time) {
    const { group, wings } = bird;
    bird.angle += (FLY_SPEED / bird.radius) * dt;
    bird.clock += dt;
    let flap = 0;
    if (bird.state === 'flying') {
      before.copy(group.position);
      this.#flightPoint(bird, time, group.position);
      this.#face(group, before);
      // Flap for a few seconds, then glide with wings held level.
      const gliding = Math.sin(time * 0.35 + bird.phase) > 0.35;
      flap = gliding ? 0.08 : Math.sin(time * 9 + bird.phase) * 0.75;
    } else if (bird.state === 'landing' || bird.state === 'takeoff') {
      const t = Math.min(bird.clock / LAND_SECONDS, 1);
      const end = bird.state === 'landing' ? bird.perch : this.#flightPoint(bird, time, flightEnd);
      before.copy(group.position);
      group.position.lerpVectors(bird.from, end, smooth(t));
      group.position.y += Math.sin(Math.PI * t) * 1.2; // a small swoop
      this.#face(group, before);
      flap = Math.sin(time * (bird.state === 'landing' && t > 0.7 ? 14 : 9) + bird.phase) * 0.7;
      if (t >= 1) {
        if (bird.state === 'landing') { this.#placeOnPerch(bird, bird.perch); this.onPerch(); } else {
          bird.state = 'flying';
          if (this.settled) this.#land(bird); // a petition arrived during take-off
        }
      }
    } else if (bird.state === 'perched') {
      group.rotation.z = 0;
      if (!this.settled) {
        bird.stay -= dt;
        if (bird.stay <= 0) this.#takeOff(bird);
      }
    }
    // Folded on a perch; flapping or gliding in the air.
    wings.forEach((w, i) => { w.rotation.z = bird.state === 'perched' ? (i ? -1.25 : 1.25) : (i ? flap : -flap); });
  }

  /** Point on the bird's ring at `time`, written into `target`. */
  #flightPoint(bird, time, target) {
    return target.set(
      this.centre.x + Math.cos(bird.angle) * bird.radius,
      bird.height + Math.sin(time * 0.6 + bird.phase) * 0.8,
      this.centre.z + Math.sin(bird.angle) * bird.radius * 0.75,
    );
  }

  /** Head along the direction of travel and bank into the turn. */
  #face(group, previous) {
    const dx = group.position.x - previous.x;
    const dz = group.position.z - previous.z;
    if (Math.hypot(dx, dz) < 1e-5) return;
    const heading = Math.atan2(dx, dz);
    const turn = Math.atan2(Math.sin(heading - group.rotation.y), Math.cos(heading - group.rotation.y));
    group.rotation.y += turn * 0.2;
    group.rotation.z = THREE.MathUtils.clamp(-turn * 4, -0.5, 0.5);
  }

  #land(bird) {
    const taken = new Set(this.birds.map((b) => b.perch).filter(Boolean));
    const free = BIRD_PERCHES.filter((p) => !taken.has(p));
    if (!free.length) return;
    bird.perch = free[Math.floor(Math.random() * free.length)];
    bird.from.copy(bird.group.position);
    bird.state = 'landing';
    bird.clock = 0;
  }

  #placeOnPerch(bird, perch) {
    bird.perch = perch;
    bird.state = 'perched';
    bird.stay = between(PERCH_SECONDS);
    bird.group.position.copy(perch);
    bird.group.rotation.set(0, Math.random() * Math.PI * 2, 0);
  }

  #takeOff(bird) {
    bird.from.copy(bird.group.position);
    bird.perch = null;
    bird.state = 'takeoff';
    bird.clock = 0;
  }
}
