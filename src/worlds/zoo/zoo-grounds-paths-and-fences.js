// The zoo's ground: grass with a few soft patches, sand paths along the central path, the
// petition plaza before the keeper's hut and the strolling path on the east side, and a low
// wooden fence round the yard. Calm on purpose: nothing near the petition rows but sand.
// Static: merged into a handful of meshes (scene/static-scenery-merge.js).
import * as THREE from 'three';
import { COURT_BOUNDS } from '../../scene/court-layout.js';
import { box, material, mesh } from '../../scene/court-mesh-helpers.js';
import { seeded } from '../../scene/court-surroundings.js';
import { mergeStatic } from '../../scene/static-scenery-merge.js';
import { ZOO } from './zoo-palette.js';

const PATH_TOP = 0.012;
const FENCE_HEIGHT = 0.55;
const POST_GAP = 1.5;
const GATE_GAP = { z: 0.6, half: 1.5 }; // the west fence is open by the entrance arch
const SOUTH_GAP = 1.7; // and the south fence where the central path leaves

/** A flat, shadowless slab whose top lies at `top`. */
function slab(group, colour, width, depth, x, z, top = PATH_TOP, thickness = 0.04) {
  const piece = box(width, thickness, depth, material(colour, 1), x, top - thickness / 2, z);
  piece.castShadow = false;
  group.add(piece);
}

function lawnPatches(group) {
  const random = seeded(5);
  for (let i = 0; i < 16; i++) {
    const x = (random() - 0.5) * 56;
    const z = -26 + random() * 46;
    const patch = mesh(new THREE.CylinderGeometry(1.6 + random() * 2.4, 1.6 + random() * 2.4, 0.01, 9), material(i % 2 ? ZOO.grassLight : ZOO.grassDark, 1), x, 0.002 + i * 0.0002, z);
    patch.scale.z = 0.6 + random() * 0.5;
    patch.castShadow = false;
    group.add(patch);
  }
}

function sandPaths(group) {
  slab(group, ZOO.sand, 9.8, 5.4, 0, -3.8); // the petition plaza before the hut's deck
  slab(group, ZOO.sand, 2.8, 16.2, 0, 6.9); // the central path, out through the south fence
  slab(group, ZOO.sand, 1.3, 17.2, 8, -0.6, PATH_TOP + 0.002); // the keeper's stroll, down the east side
  slab(group, ZOO.sandDark, 3, 3, -9.6, 0.6, PATH_TOP + 0.001); // the entrance forecourt
}

/** A run of post-and-rail fence along (x0, z0) -> (x1, z1). */
function fenceRun(group, x0, z0, x1, z1) {
  const length = Math.hypot(x1 - x0, z1 - z0);
  const count = Math.max(1, Math.round(length / POST_GAP));
  const angle = Math.atan2(x1 - x0, z1 - z0); // yaw: +z is "along" for a rail built with its depth along z
  const wood = material(ZOO.woodLight, 0.9);
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    group.add(box(0.1, FENCE_HEIGHT, 0.1, wood, x0 + (x1 - x0) * t, FENCE_HEIGHT / 2, z0 + (z1 - z0) * t));
  }
  for (const height of [0.22, 0.43]) {
    const rail = box(0.05, 0.06, length, wood, (x0 + x1) / 2, height, (z0 + z1) / 2);
    rail.rotation.y = angle;
    group.add(rail);
  }
}

function perimeter(group) {
  const { x, north, south } = COURT_BOUNDS;
  const lo = GATE_GAP.z - GATE_GAP.half;
  const hi = GATE_GAP.z + GATE_GAP.half;
  fenceRun(group, -x, north, -x, lo);
  fenceRun(group, -x, hi, -x, south);
  fenceRun(group, x, north, x, south);
  fenceRun(group, -x, south, -SOUTH_GAP, south);
  fenceRun(group, SOUTH_GAP, south, x, south);
}

/** @returns {THREE.Group} static ground, merged */
export function buildZooGrounds() {
  const group = new THREE.Group();
  const lawn = box(260, 0.1, 260, material(ZOO.grass, 1), 0, -0.05, -20);
  lawn.castShadow = false;
  group.add(lawn);
  lawnPatches(group);
  sandPaths(group);
  perimeter(group);
  return mergeStatic(group);
}
