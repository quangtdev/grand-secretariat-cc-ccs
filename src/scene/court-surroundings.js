// Everything around the working court: the river and its bridge, trees and far hills
// outside the walls, and the small garden pieces inside (rockery, bonsai, lanterns).
import * as THREE from 'three';
import { COURT_BOUNDS, GARDEN_TREES, GARDEN_TREE_SCALE, PALETTE } from './court-layout.js';
import { box, material, mesh } from './court-mesh-helpers.js';
import { riverWaterMaterial } from './river-water-and-sampan.js';
import { mergeStatic } from './static-scenery-merge.js';

const GREENS = [0x4f6b3c, 0x5d7a45, 0x3f5a3a, 0x6b8450];
const RIVER = { near: COURT_BOUNDS.south + 1.2, far: COURT_BOUNDS.south + 5.6, eastInner: 16, eastOuter: 21 };

/** Deterministic pseudo-random so the landscape is the same on every load. */
export function seeded(seed) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function pine(scale) {
  const tree = new THREE.Group();
  tree.add(mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.2, 6), material(PALETTE.wood, 0.9), 0, 0.6, 0));
  [[1.1, 1.5, 1.5], [0.85, 1.3, 2.4], [0.55, 1.1, 3.2]].forEach(([radius, height, y], i) => {
    tree.add(mesh(new THREE.ConeGeometry(radius, height, 7), material(GREENS[2 - (i % 2) * 2], 0.9), 0, y, 0));
  });
  tree.scale.setScalar(scale);
  return tree;
}

/** Broad-crowned tree, like the old frangipani and banyan of palace gardens. */
function broadleaf(scale, random) {
  const tree = new THREE.Group();
  const trunk = mesh(new THREE.CylinderGeometry(0.14, 0.24, 1.6, 6), material(0x5b4636, 0.9), 0, 0.8, 0);
  trunk.rotation.z = (random() - 0.5) * 0.3;
  tree.add(trunk);
  for (let i = 0; i < 4; i++) {
    const crown = mesh(new THREE.IcosahedronGeometry(0.75 + random() * 0.45, 0), material(GREENS[i % GREENS.length], 0.9),
      (random() - 0.5) * 1.3, 1.9 + random() * 0.8, (random() - 0.5) * 1.3);
    tree.add(crown);
  }
  tree.scale.setScalar(scale);
  return tree;
}

function buildWoods() {
  const group = new THREE.Group();
  const random = seeded(7);
  const { x: wall, north, south } = COURT_BOUNDS;
  let planted = 0;
  while (planted < 70) {
    const x = (random() - 0.5) * 110;
    const z = north - 26 + random() * (south - north + 44);
    const insideCourt = Math.abs(x) < wall + 1.5 && z > north - 1.5 && z < south + 0.5;
    const inRiver = (z > RIVER.near - 1 && z < RIVER.far + 1 && x < RIVER.eastOuter + 1)
      || (x > RIVER.eastInner - 1 && x < RIVER.eastOuter + 1 && z < RIVER.far + 1);
    const onRoad = Math.abs(x) < 3 && z > south;
    if (insideCourt || inRiver || onRoad) continue;
    const tree = random() < 0.45 ? pine(0.9 + random() * 0.8) : broadleaf(0.9 + random() * 0.9, random);
    tree.position.set(x, 0, z);
    tree.rotation.y = random() * Math.PI;
    group.add(tree);
    planted++;
  }
  // Patches of lighter and darker grass, so the land is not one flat green.
  const patchRandom = seeded(29);
  for (let i = 0; i < 22; i++) {
    const x = (patchRandom() - 0.5) * 120;
    const z = north - 30 + patchRandom() * (south - north + 60);
    const inside = Math.abs(x) < wall + 0.5 && z > north - 0.5 && z < south + 6.5; // the court and the river
    const patch = mesh(new THREE.CircleGeometry(3 + patchRandom() * 5, 7).rotateX(-Math.PI / 2),
      material(i % 2 ? 0x7c8c62 : 0x64744f, 1), x, -0.045 + i * 0.0004, z);
    patch.castShadow = false;
    patch.scale.set(1, 1, 0.6 + patchRandom() * 0.5);
    if (!inside && !(x > RIVER.eastInner - 6 && x < RIVER.eastOuter + 6) && !(z > south && z < RIVER.far + 2)) group.add(patch);
  }
  // Far hills fading into the haze behind the hall.
  [[-34, -62, 26, 9], [4, -72, 34, 12], [40, -60, 24, 8], [-58, -40, 20, 7], [62, -36, 22, 7]].forEach(([x, z, radius, height]) => {
    const hill = mesh(new THREE.ConeGeometry(radius, height, 9), material(0x5f7350, 1), x, height / 2 - 0.4, z);
    hill.castShadow = false;
    group.add(hill);
  });
  return group;
}

export function lotus(x, z, random) {
  const plant = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const pad = mesh(new THREE.CylinderGeometry(0.22 + random() * 0.12, 0.22, 0.02, 9), material(0x4f8a55, 0.8),
      (random() - 0.5) * 0.9, 0.02, (random() - 0.5) * 0.9);
    plant.add(pad);
  }
  plant.add(mesh(new THREE.ConeGeometry(0.11, 0.24, 6), material(0xe79ab0, 0.6), 0, 0.22, 0));
  plant.position.set(x, 0, z);
  return plant;
}

/** The river bends round the south-east corner of the court; a stone bridge carries the central path over it. */
function buildRiverAndBridge() {
  const group = new THREE.Group();
  const water = riverWaterMaterial(); // shared: its texture scrolls (river-water-and-sampan.js)
  const { near, far, eastInner, eastOuter } = RIVER;
  const reaches = [
    [(-60 + eastOuter) / 2, (near + far) / 2, eastOuter + 60, far - near], // along the south
    [(eastInner + eastOuter) / 2, (near - 70) / 2, eastOuter - eastInner, near + 70], // up the east side
  ];
  for (const [x, z, width, depth] of reaches) {
    const reach = new THREE.Mesh(new THREE.BoxGeometry(width, 0.04, depth), water);
    reach.position.set(x, -0.03, z);
    reach.receiveShadow = true;
    group.add(reach);
  }
  // A sandy strip and clumps of reeds along the far bank, so the water has an edge.
  const sand = material(0xcdbf9a, 1);
  const bank = box(eastOuter + 60, 0.05, 0.9, sand, (eastOuter - 60) / 2, -0.02, far + 0.45);
  bank.castShadow = false;
  group.add(bank);
  const reedRandom = seeded(11);
  for (let i = 0; i < 16; i++) {
    const x = -34 + reedRandom() * 50;
    for (let blade = 0; blade < 4; blade++) {
      const reed = mesh(new THREE.ConeGeometry(0.05, 0.7 + reedRandom() * 0.6, 4), material(GREENS[blade % GREENS.length], 0.9),
        x + (reedRandom() - 0.5) * 0.5, 0.35, far - 0.1 + (reedRandom() - 0.5) * 0.4);
      reed.rotation.z = (reedRandom() - 0.5) * 0.35;
      reed.castShadow = false;
      group.add(reed);
    }
  }
  // Stone embankment on the court side.
  const stone = material(PALETTE.stoneDark, 0.95);
  group.add(box(eastInner + 60, 0.3, 0.4, stone, (eastInner - 60) / 2, 0.05, near - 0.2));
  group.add(box(0.4, 0.3, near + 70, stone, eastInner - 0.2, 0.05, (near - 70) / 2));

  const random = seeded(21);
  for (let i = 0; i < 9; i++) {
    const alongSouth = i < 6;
    group.add(alongSouth
      ? lotus(-22 + random() * 34 + (random() < 0.5 ? 0 : 6), near + 0.8 + random() * (far - near - 1.6), random)
      : lotus(eastInner + 0.9 + random() * (eastOuter - eastInner - 1.8), -22 + random() * 28, random));
  }

  // Arched bridge on the central axis: stone deck segments following an arc, lacquer rails.
  const span = far - near + 1.6;
  const segments = 9;
  for (let i = 0; i < segments; i++) {
    const t = (i + 0.5) / segments;
    const z = near - 0.8 + t * span;
    const y = Math.sin(t * Math.PI) * 0.75;
    const slab = box(2.9, 0.22, span / segments + 0.12, material(PALETTE.stonePath, 0.9), 0, y + 0.08, z);
    slab.rotation.x = -Math.cos(t * Math.PI) * 0.36;
    group.add(slab);
    for (const side of [-1, 1]) {
      group.add(box(0.14, 0.62, 0.14, material(PALETTE.lacquer, 0.4), side * 1.38, y + 0.5, z));
      const rail = box(0.1, 0.1, span / segments + 0.14, material(PALETTE.lacquer, 0.4), side * 1.38, y + 0.76, z);
      rail.rotation.x = slab.rotation.x;
      group.add(rail);
    }
  }
  // The road carries on south of the river.
  const road = box(2.9, 0.04, 40, material(PALETTE.stonePath, 0.95), 0, -0.02, far + 20.6);
  road.castShadow = false;
  group.add(road);
  return group;
}

function bonsai(x, z, random) {
  const pot = new THREE.Group();
  pot.add(mesh(new THREE.CylinderGeometry(0.42, 0.32, 0.4, 8), material(0x3c5f7a, 0.4), 0, 0.2, 0)); // blue glazed pot
  const trunk = mesh(new THREE.CylinderGeometry(0.05, 0.09, 0.7, 5), material(PALETTE.wood, 0.9), 0, 0.7, 0);
  trunk.rotation.z = (random() - 0.5) * 0.7;
  pot.add(trunk);
  for (let i = 0; i < 3; i++) {
    pot.add(mesh(new THREE.IcosahedronGeometry(0.26 + random() * 0.12, 0), material(GREENS[i], 0.9),
      (random() - 0.5) * 0.7, 1.0 + i * 0.16, (random() - 0.5) * 0.5));
  }
  pot.position.set(x, 0, z);
  return pot;
}

function stoneLantern(x, z) {
  const lantern = new THREE.Group();
  const stone = material(PALETTE.stoneDark, 0.9);
  lantern.add(box(0.5, 0.16, 0.5, stone, 0, 0.08, 0), box(0.2, 0.8, 0.2, stone, 0, 0.56, 0));
  lantern.add(box(0.44, 0.36, 0.44, material(PALETTE.paper, 0.6), 0, 1.14, 0));
  const cap = mesh(new THREE.ConeGeometry(0.44, 0.3, 4), stone, 0, 1.47, 0);
  cap.rotation.y = Math.PI / 4;
  lantern.add(cap);
  lantern.position.set(x, 0, z);
  return lantern;
}

/** Garden pieces inside the walls, kept clear of the desks and the petition ground. */
function buildCourtGardens() {
  const group = new THREE.Group();
  const random = seeded(3);
  const stone = material(PALETTE.stoneDark, 0.95);

  // The lotus pond on the east side is built with its koi in lotus-pond-with-koi.js.

  // Rockery (hon non bo): a miniature mountain in a shallow basin.
  const rockery = new THREE.Group();
  rockery.add(box(3, 0.3, 3, stone, 0, 0.15, 0));
  for (let i = 0; i < 6; i++) {
    const height = 0.8 + random() * 1.5;
    const rock = mesh(new THREE.ConeGeometry(0.35 + random() * 0.3, height, 5), material(0x77756c, 1),
      (random() - 0.5) * 1.7, 0.3 + height / 2, (random() - 0.5) * 1.7);
    rock.rotation.y = random() * 3;
    rockery.add(rock);
  }
  rockery.add(mesh(new THREE.IcosahedronGeometry(0.4, 0), material(GREENS[1], 0.9), 0.5, 1.5, 0.3));
  rockery.position.set(10.3, 0, -5);
  group.add(rockery);

  // Bonsai along the walls, lanterns along the central path, two old trees in the north corners.
  for (const x of [-11.6, -9.6, 9, 11.6]) group.add(bonsai(x, -12.4, random));
  for (const z of [-9, 6.2, 8.4]) group.add(bonsai(-12, z, random), bonsai(12, z + (z > 0 ? 0 : 0.6), random));
  for (const z of [0, 4.6, 8.6]) group.add(stoneLantern(-1.75, z), stoneLantern(1.75, z));
  for (const position of GARDEN_TREES) {
    const tree = broadleaf(GARDEN_TREE_SCALE, random);
    tree.position.copy(position);
    group.add(tree);
  }
  return group;
}

export function buildSurroundings(scene) {
  const fixed = new THREE.Group();
  fixed.add(buildWoods(), buildRiverAndBridge(), buildCourtGardens());
  scene.add(mergeStatic(fixed)); // static scenery: one mesh per material
}
