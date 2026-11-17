// The keeper's lookout: a raised wooden deck on the north dais (0.9 m, the shared stage plan's
// plinth) with a roofed hut at its back, the head zookeeper's chair on a small platform at
// KING_SEAT, a ramp down the east side (where the keeper's strolls leave), a rail along the
// front and a few crates and a bucket. Static: merged.
import * as THREE from 'three';
import { HALL, HALL_EAST_STAIR, KING_SEAT } from '../../scene/court-layout.js';
import { box, material, mesh } from '../../scene/court-mesh-helpers.js';
import { mergeStatic } from '../../scene/static-scenery-merge.js';
import { ZOO } from './zoo-palette.js';

const DECK_TOP = HALL.plinthHeight;
const DECK = { x0: -7.3, x1: HALL_EAST_STAIR.x, front: -6.5, back: -12.9 };
const SEAT_LIFT = 0.17; // chair seat above the keeper's feet: SEATED_WAIST minus his thigh, times his scale

function deckAndRamp(group) {
  const wood = material(ZOO.wood, 0.85);
  const width = DECK.x1 - DECK.x0;
  const depth = DECK.front - DECK.back;
  const cx = (DECK.x0 + DECK.x1) / 2;
  const cz = (DECK.front + DECK.back) / 2;
  group.add(box(width, DECK_TOP - 0.06, depth, material(ZOO.woodDark, 0.9), cx, (DECK_TOP - 0.06) / 2, cz));
  group.add(box(width, 0.06, depth, wood, cx, DECK_TOP - 0.03, cz));
  for (let z = DECK.back + 0.5; z < DECK.front; z += 0.5) { // plank seams
    const seam = box(width, 0.01, 0.025, material(ZOO.woodDark, 1), cx, DECK_TOP + 0.002, z);
    seam.castShadow = false;
    group.add(seam);
  }
  // The ramp follows the keeper's walk: from (stairTop, deck level) to (stairFoot, ground).
  const topX = HALL_EAST_STAIR.x - 0.2;
  const footX = HALL_EAST_STAIR.x + HALL_EAST_STAIR.run + 0.2;
  const rise = Math.hypot(footX - topX, DECK_TOP);
  const ramp = box(rise, 0.08, HALL_EAST_STAIR.width, wood, (topX + footX) / 2, DECK_TOP / 2 - 0.04, HALL_EAST_STAIR.z);
  ramp.rotation.z = -Math.atan2(DECK_TOP, footX - topX);
  group.add(ramp);
}

function railing(group) {
  const wood = material(ZOO.woodLight, 0.9);
  const run = (x0, z0, x1, z1) => {
    const length = Math.hypot(x1 - x0, z1 - z0);
    const count = Math.max(1, Math.round(length / 1.2));
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      group.add(box(0.1, 0.55, 0.1, wood, x0 + (x1 - x0) * t, DECK_TOP + 0.275, z0 + (z1 - z0) * t));
    }
    const rail = box(0.06, 0.07, length, wood, (x0 + x1) / 2, DECK_TOP + 0.5, (z0 + z1) / 2);
    rail.rotation.y = Math.atan2(x1 - x0, z1 - z0);
    group.add(rail);
  };
  run(DECK.x0, DECK.front, DECK.x1, DECK.front);
  run(DECK.x0, DECK.front, DECK.x0, DECK.back);
  run(DECK.x1, DECK.back, DECK.x1, HALL_EAST_STAIR.z - 0.9); // the east side stays open at the ramp
  run(DECK.x1, HALL_EAST_STAIR.z + 0.9, DECK.x1, DECK.front);
}

/** The hut: a back wall with a window, side walls, four posts and a hipped roof over the chair. */
function hut(group) {
  const wall = material(0xe6d3a8, 0.95);
  const timber = material(ZOO.woodDark, 0.9);
  const z0 = -12.6;
  group.add(box(5.6, 2.6, 0.2, wall, 0, DECK_TOP + 1.3, z0));
  for (const side of [-1, 1]) {
    group.add(box(0.2, 2.6, 2.6, wall, side * 2.7, DECK_TOP + 1.3, z0 + 1.3));
    group.add(box(0.28, 3.0, 0.28, timber, side * 2.8, DECK_TOP + 1.5, z0 + 3.5));
  }
  group.add(box(1.4, 0.9, 0.06, material(0x7fb7d4, 0.3), 0, DECK_TOP + 1.7, z0 + 0.12)); // window
  group.add(box(1.6, 0.1, 0.1, timber, 0, DECK_TOP + 1.2, z0 + 0.14));
  const roof = mesh(new THREE.ConeGeometry(4.6, 1.5, 4).rotateY(Math.PI / 4), material(ZOO.roof, 0.7), 0, DECK_TOP + 3.75, z0 + 1.3);
  roof.scale.set(1.28, 1, 0.72);
  group.add(roof);
  group.add(box(5.9, 0.12, 0.18, timber, 0, DECK_TOP + 3.0, z0 + 3.5)); // front beam
}

function seatAndDressing(group) {
  const platformTop = KING_SEAT.y;
  group.add(box(2.6, 0.24, 1.9, material(0xb5524a, 1), KING_SEAT.x, platformTop - 0.12, KING_SEAT.z - 0.1)); // rug platform
  const wood = material(ZOO.woodLight, 0.9);
  const seatY = platformTop + SEAT_LIFT;
  group.add(box(0.7, 0.06, 0.6, wood, KING_SEAT.x, seatY - 0.03, KING_SEAT.z - 0.05));
  group.add(box(0.7, 0.55, 0.06, wood, KING_SEAT.x, seatY + 0.27, KING_SEAT.z - 0.38));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) group.add(box(0.06, SEAT_LIFT, 0.06, wood, KING_SEAT.x + sx * 0.3, platformTop + SEAT_LIFT / 2, KING_SEAT.z - 0.05 + sz * 0.25));
  group.add(mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.34, 10), material(0x6f8fb0, 0.5), 1.3, DECK_TOP + 0.17, -9.6)); // the keeper's bucket
  for (const [x, z, y, size] of [[-3.8, -12, 0, 0.9], [-3.9, -11.1, 0, 0.8], [-3.8, -11.9, 0.9, 0.7]]) group.add(box(size, size, size, wood, x, DECK_TOP + y + size / 2, z));
  group.add(box(0.9, 0.9, 0.9, material(ZOO.woodDark, 0.9), 3.9, DECK_TOP + 0.45, -12));
}

/** @returns {THREE.Group} */
export function buildLookoutHut() {
  const group = new THREE.Group();
  deckAndRamp(group);
  railing(group);
  hut(group);
  seatAndDressing(group);
  return mergeStatic(group);
}
