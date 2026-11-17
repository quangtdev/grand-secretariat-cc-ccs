// The lotus pond on the east side of the yard: a hollow stone basin under clear
// water, lotus on the surface, and koi wandering beneath. Now and then a koi rises
// to the surface and leaves a ring spreading on the water.
import * as THREE from 'three';
import { PALETTE, POND } from './court-layout.js';
import { box, material, mesh } from './court-mesh-helpers.js';
import { lotus, seeded } from './court-surroundings.js';
import { mergeStatic } from './static-scenery-merge.js';

const KOI = [
  { body: 0xe0602c, patch: 0xf3efe6 }, // orange-red with a white head
  { body: 0xf3efe6, patch: 0xd2462c }, // white with a red head (kohaku)
  { body: 0xd98a2b, patch: 0xd98a2b }, // gold
  { body: 0xe0602c, patch: 0xe0602c },
  { body: 0xf3efe6, patch: 0x2b2522 }, // white with a dark head
];
const KOI_SCALE = 1.7;
const SWIM_Y = 0.2;
const RISE_EVERY = [8, 15]; // seconds between koi surfacing
const RIPPLE_SECONDS = 1.6;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const between = ([low, high]) => low + Math.random() * (high - low);

function buildBasin(group) {
  const { width, depth, rim, waterY } = POND;
  const stone = material(PALETTE.stoneDark, 0.95);
  const wallHeight = waterY + 0.04;
  group.add(box(width, wallHeight, rim, stone, 0, wallHeight / 2, -(depth - rim) / 2));
  group.add(box(width, wallHeight, rim, stone, 0, wallHeight / 2, (depth - rim) / 2));
  group.add(box(rim, wallHeight, depth - rim * 2, stone, -(width - rim) / 2, wallHeight / 2, 0));
  group.add(box(rim, wallHeight, depth - rim * 2, stone, (width - rim) / 2, wallHeight / 2, 0));
  const floor = box(width - rim * 2, 0.04, depth - rim * 2, material(0x2f4b46, 1), 0, 0.02, 0);
  floor.castShadow = false;
  group.add(floor);
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(width - rim * 2, depth - rim * 2).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x4f8f8a, roughness: 0.1, metalness: 0.15, transparent: true, opacity: 0.55, depthWrite: false }),
  );
  water.position.y = waterY;
  group.add(water);

  const random = seeded(3);
  for (let i = 0; i < 5; i++) {
    const plant = lotus((random() - 0.5) * 1.8, (random() - 0.5) * 3.6, random);
    plant.position.y = waterY + 0.02;
    group.add(plant);
  }
}

function buildKoi({ body, patch }) {
  const fish = new THREE.Group();
  const flesh = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, flatShading: true });
  const torso = mesh(new THREE.SphereGeometry(0.1, 10, 8), flesh(body));
  torso.scale.set(0.7, 0.45, 2);
  const head = mesh(new THREE.SphereGeometry(0.075, 8, 6), flesh(patch), 0, 0.005, 0.13);
  head.scale.set(0.9, 0.6, 1.1);
  const tail = new THREE.Group();
  tail.position.z = -0.18;
  const fin = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.16, 4).rotateX(-Math.PI / 2).translate(0, 0, -0.08), flesh(body));
  fin.scale.y = 0.25;
  tail.add(fin);
  fish.add(torso, head, tail);
  fish.traverse((part) => { part.castShadow = false; });
  fish.scale.setScalar(KOI_SCALE); // large enough to read from the default camera
  return { group: fish, tail };
}

/** Builds the pond into `scene` and returns its animation step. */
export function buildLotusPond(scene) {
  // The basin, water and lotus never move: merged to one mesh per material.
  const basin = new THREE.Group();
  basin.position.copy(POND.center);
  buildBasin(basin);
  scene.add(mergeStatic(basin));
  // Koi and ripples live in their own group, in pond coordinates.
  const group = new THREE.Group();
  group.position.copy(POND.center);
  scene.add(group);

  const halfX = (POND.width - POND.rim * 2) / 2 - 0.25;
  const halfZ = (POND.depth - POND.rim * 2) / 2 - 0.25;
  const randomSpot = (target) => target.set((Math.random() * 2 - 1) * halfX, 0, (Math.random() * 2 - 1) * halfZ);

  const koi = KOI.map((colors, i) => {
    const { group: fish, tail } = buildKoi(colors);
    const depth = SWIM_Y - i * 0.02; // each koi keeps its own depth so they pass over one another
    const position = randomSpot(new THREE.Vector3()).setY(depth);
    fish.position.copy(position);
    group.add(fish);
    return { fish, tail, heading: Math.random() * Math.PI * 2, speed: 0.3 + Math.random() * 0.3, target: randomSpot(new THREE.Vector3()), phase: i * 1.7, rise: 0, depth };
  });

  const ripples = Array.from({ length: 3 }, () => {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.08, 0.1, 24).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xf1f4ec, transparent: true, opacity: 0, depthWrite: false }),
    );
    ring.position.y = POND.waterY + 0.005;
    ring.visible = false;
    ring.renderOrder = 1; // over the merged water whatever the camera angle
    group.add(ring);
    return { ring, age: RIPPLE_SECONDS };
  });

  let nextRise = between(RISE_EVERY);

  function update(dt, time) {
    if (reducedMotion.matches) return; // the koi hold still

    nextRise -= dt;
    if (nextRise <= 0) {
      nextRise = between(RISE_EVERY);
      koi[Math.floor(Math.random() * koi.length)].rise = 1.2; // seconds of rising and sinking
    }

    for (const k of koi) {
      const { fish } = k;
      const dx = k.target.x - fish.position.x;
      const dz = k.target.z - fish.position.z;
      if (Math.hypot(dx, dz) < 0.3) randomSpot(k.target);
      // Steer gently towards the target, the short way round.
      const wanted = Math.atan2(dx, dz);
      const turn = Math.atan2(Math.sin(wanted - k.heading), Math.cos(wanted - k.heading));
      k.heading += THREE.MathUtils.clamp(turn, -1.2 * dt, 1.2 * dt);
      fish.position.x = THREE.MathUtils.clamp(fish.position.x + Math.sin(k.heading) * k.speed * dt, -halfX, halfX);
      fish.position.z = THREE.MathUtils.clamp(fish.position.z + Math.cos(k.heading) * k.speed * dt, -halfZ, halfZ);
      fish.rotation.y = k.heading + Math.sin(time * 3 + k.phase) * 0.08;
      k.tail.rotation.y = Math.sin(time * (6 + k.speed * 10) + k.phase) * 0.5;

      if (k.rise > 0) {
        const before = k.rise;
        k.rise = Math.max(0, k.rise - dt);
        fish.position.y = k.depth + Math.sin(Math.PI * (1 - k.rise / 1.2)) * 0.11;
        if (before > 0.6 && k.rise <= 0.6) startRipple(fish.position); // at the top: it breaks the surface
      }
    }

    for (const r of ripples) {
      if (r.age >= RIPPLE_SECONDS) continue;
      r.age += dt;
      const t = Math.min(r.age / RIPPLE_SECONDS, 1);
      r.ring.scale.setScalar(1 + t * 9);
      r.ring.material.opacity = 0.5 * (1 - t);
      r.ring.visible = t < 1;
    }
  }

  function startRipple(at) {
    const r = ripples.reduce((oldest, candidate) => (candidate.age > oldest.age ? candidate : oldest));
    r.age = 0;
    r.ring.position.x = at.x;
    r.ring.position.z = at.z;
    r.ring.visible = true;
  }

  return { update };
}
