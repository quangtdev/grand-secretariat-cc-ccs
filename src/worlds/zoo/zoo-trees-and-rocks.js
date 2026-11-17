// Round-crowned trees (with shadows), a few rocks, and the far hills and tree line that melt
// into the haze. The big tree on the east side is where the keeper stops to look at the
// rockery spot of the shared stage plan (KING_OUTINGS.rockery). Static: merged.
import * as THREE from 'three';
import { box, material, mesh } from '../../scene/court-mesh-helpers.js';
import { seeded } from '../../scene/court-surroundings.js';
import { mergeStatic } from '../../scene/static-scenery-merge.js';
import { ZOO } from './zoo-palette.js';

/** A broad tree: a trunk and a cluster of leafy balls. */
function tree(x, z, scale, random) {
  const group = new THREE.Group();
  group.add(mesh(new THREE.CylinderGeometry(0.16, 0.26, 1.7, 7), material(ZOO.woodDark, 0.9), 0, 0.85, 0));
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 + random();
    const crown = mesh(new THREE.IcosahedronGeometry(0.85 + random() * 0.35, 0), material(ZOO.leaves[i % ZOO.leaves.length], 0.9),
      i === 4 ? 0 : Math.cos(angle) * 0.8, 2.1 + (i === 4 ? 0.7 : random() * 0.5), i === 4 ? 0 : Math.sin(angle) * 0.8);
    group.add(crown);
  }
  group.position.set(x, 0, z);
  group.scale.setScalar(scale);
  group.rotation.y = random() * Math.PI;
  return group;
}

function rock(x, z, size, random) {
  const stone = mesh(new THREE.DodecahedronGeometry(size, 0), material(ZOO.rock, 1), x, size * 0.45, z);
  stone.scale.set(1.2, 0.75 + random() * 0.2, 1);
  stone.rotation.y = random() * Math.PI;
  return stone;
}

/** Where the animals' neighbours are: the tree tops are also the birds' perches (see zoo-perching-birds.js). */
export const YARD_TREES = [
  { x: 11.6, z: -5.4, scale: 1.55 }, // the big tree, at the keeper's rockery stop
  { x: -11.8, z: -6.2, scale: 1.3 },
  { x: -11.7, z: 6.8, scale: 1.2 },
  { x: 11.7, z: 8, scale: 1.2 },
  { x: -11.4, z: -10.6, scale: 1.25 },
  { x: 11.4, z: -10.4, scale: 1.3 },
];
export const treeTop = ({ x, z, scale }) => new THREE.Vector3(x, 3.65 * scale, z);

/** @returns {THREE.Group} static trees, rocks and far scenery, merged */
export function buildTreesAndRocks() {
  const group = new THREE.Group();
  const random = seeded(17);
  for (const { x, z, scale } of YARD_TREES) group.add(tree(x, z, scale, random));
  for (const [x, z, size] of [[10.1, -4.2, 0.5], [10.7, -3.5, 0.32], [12.2, -4.4, 0.4], [9.6, 5.9, 0.34], [-12, -4.6, 0.42]]) group.add(rock(x, z, size, random));
  // The tree line beyond the fence, and soft hills behind the hut.
  for (let i = 0; i < 46; i++) {
    const angle = random() * Math.PI * 2;
    const x = Math.cos(angle) * (30 + random() * 26);
    const z = -14 + Math.sin(angle) * (26 + random() * 22);
    if (Math.abs(x) < 16 && z > -16 && z < 24) continue;
    group.add(tree(x, z, 1.3 + random() * 1.2, random));
  }
  for (const [x, z, radius, height] of [[-30, -58, 24, 8], [6, -66, 32, 11], [42, -56, 22, 7], [-62, -30, 18, 6]]) {
    const hill = mesh(new THREE.SphereGeometry(radius, 12, 6), material(0x7fb064, 1), x, -radius + height, z);
    hill.castShadow = false;
    group.add(hill);
  }
  return mergeStatic(group);
}
