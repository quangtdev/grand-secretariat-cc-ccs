// The station's floor and the command bridge: a calm gunmetal deck of panel tiles floating in the
// void, and on the north dais (0.9 m, the shared stage plan's plinth) the bridge: a back wall with a
// wide viewport onto the stars, two console banks, the captain's chair on a platform at KING_SEAT, a
// front rail and a ramp down the east side (where the captain's strolls leave). Nothing stands
// near the petition rows. Static: the solid parts are merged; the glowing frames are one steady unlit mesh.
import * as THREE from 'three';
import { HALL, HALL_EAST_STAIR, KING_SEAT } from '../../scene/court-layout.js';
import { box, material } from '../../scene/court-mesh-helpers.js';
import { mergeStatic } from '../../scene/static-scenery-merge.js';
import { STATION } from './space-station-palette.js';
import { glow, glowMesh } from './space-station-shape-helpers.js';

export const DECK_BOUNDS = { x: 15, north: -15.5, south: 12 };
const TOP = HALL.plinthHeight;
const BRIDGE = { x0: -7.3, x1: HALL_EAST_STAIR.x, front: -6.5, back: -12.9 };
const WALL = { z: -12.7, height: 3.2, open: 3.4, sill: 0.8, lintel: 2.4 }; // the viewport spans |x| < open
const SEAT_LIFT = 0.17;
const grey = (colour, roughness = 0.6) => material(colour, roughness);

/** The deck: one slab with a tiled top, drawn once to a canvas (panel seams, a light edge, rivets). */
function floor() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = `#${new THREE.Color(STATION.deck).getHexString()}`;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = `#${new THREE.Color(STATION.deckSeam).getHexString()}`;
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, size, size);
  ctx.strokeStyle = 'rgba(160, 185, 215, 0.10)';
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, size - 8, size - 8);
  ctx.fillStyle = 'rgba(160, 185, 215, 0.18)';
  for (const [x, y] of [[10, 10], [size - 10, 10], [10, size - 10], [size - 10, size - 10]]) ctx.fillRect(x - 1, y - 1, 3, 3);
  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  const width = DECK_BOUNDS.x * 2;
  const depth = DECK_BOUNDS.south - DECK_BOUNDS.north;
  map.repeat.set(width / 2, depth / 2);
  const slab = new THREE.Mesh(new THREE.BoxGeometry(width, 0.6, depth), new THREE.MeshStandardMaterial({ map, roughness: 0.65, metalness: 0.15 }));
  slab.position.set(0, -0.3, (DECK_BOUNDS.north + DECK_BOUNDS.south) / 2);
  return slab;
}

function dais(group) {
  const width = BRIDGE.x1 - BRIDGE.x0;
  const depth = BRIDGE.front - BRIDGE.back;
  const cx = (BRIDGE.x0 + BRIDGE.x1) / 2;
  const cz = (BRIDGE.front + BRIDGE.back) / 2;
  group.add(box(width, TOP - 0.06, depth, grey(STATION.panelDark), cx, (TOP - 0.06) / 2, cz));
  group.add(box(width, 0.06, depth, grey(STATION.panel), cx, TOP - 0.03, cz));
  // The ramp follows the captain's walk: from (stairTop, bridge level) to (stairFoot, deck).
  const topX = HALL_EAST_STAIR.x - 0.2;
  const footX = HALL_EAST_STAIR.x + HALL_EAST_STAIR.run + 0.2;
  const ramp = box(Math.hypot(footX - topX, TOP), 0.08, HALL_EAST_STAIR.width, grey(STATION.panelLight), (topX + footX) / 2, TOP / 2 - 0.04, HALL_EAST_STAIR.z);
  ramp.rotation.z = -Math.atan2(TOP, footX - topX);
  group.add(ramp);
}

/** Front and side rail: posts and a bar, open at the ramp. Returns the bars' glow parts. */
function rails(group) {
  const bars = [];
  const run = (x0, z0, x1, z1) => {
    const length = Math.hypot(x1 - x0, z1 - z0);
    const count = Math.max(1, Math.round(length / 1.4));
    for (let i = 0; i <= count; i++) group.add(box(0.08, 0.5, 0.08, grey(STATION.panelLight), x0 + (x1 - x0) * i / count, TOP + 0.25, z0 + (z1 - z0) * i / count));
    const bar = glow(STATION.cyan, new THREE.BoxGeometry(0.04, 0.04, length), (x0 + x1) / 2, TOP + 0.52, (z0 + z1) / 2);
    bar.rotation.y = Math.atan2(x1 - x0, z1 - z0);
    bars.push(bar);
  };
  run(BRIDGE.x0, BRIDGE.front, BRIDGE.x1, BRIDGE.front);
  run(BRIDGE.x0, BRIDGE.front, BRIDGE.x0, BRIDGE.back);
  run(BRIDGE.x1, BRIDGE.back, BRIDGE.x1, HALL_EAST_STAIR.z - 0.9);
  run(BRIDGE.x1, HALL_EAST_STAIR.z + 0.9, BRIDGE.x1, BRIDGE.front);
  return bars;
}

/** The back wall with the viewport, and a console bank on each side of it. Returns glow parts. */
function viewportWall(group) {
  const lit = [];
  const sideWidth = BRIDGE.x1 - WALL.open;
  const frame = grey(STATION.panelDark, 0.5);
  for (const side of [-1, 1]) {
    group.add(box(sideWidth, WALL.height, 0.3, frame, side * (WALL.open + sideWidth / 2), TOP + WALL.height / 2, WALL.z));
    // A console bank in front of each wall block, its screen glowing.
    const x = side * 5.3;
    group.add(box(2.6, 0.85, 0.75, grey(STATION.panel), x, TOP + 0.425, WALL.z + 0.7));
    const keys = box(2.4, 0.05, 0.5, grey(STATION.panelLight), x, TOP + 0.88, WALL.z + 0.72);
    keys.rotation.x = 0.15;
    group.add(keys);
    const keyLight = glow(STATION.holo, new THREE.BoxGeometry(2.0, 0.01, 0.3), x, TOP + 0.915, WALL.z + 0.72);
    keyLight.rotation.x = 0.15;
    lit.push(keyLight);
    lit.push(glow(STATION.cyanDim, new THREE.BoxGeometry(2.0, 0.9, 0.02), x, TOP + 1.95, WALL.z + 0.17));
  }
  group.add(box(BRIDGE.x1 * 2, WALL.height - WALL.lintel, 0.3, frame, 0, TOP + (WALL.height + WALL.lintel) / 2, WALL.z)); // lintel
  group.add(box(WALL.open * 2, WALL.sill, 0.3, frame, 0, TOP + WALL.sill / 2, WALL.z)); // sill under the viewport
  for (const [w, h, x, y] of [[WALL.open * 2, 0.06, 0, WALL.lintel], [WALL.open * 2, 0.06, 0, WALL.sill], [0.06, WALL.lintel - WALL.sill, -WALL.open, (WALL.lintel + WALL.sill) / 2], [0.06, WALL.lintel - WALL.sill, WALL.open, (WALL.lintel + WALL.sill) / 2]]) {
    lit.push(glow(STATION.cyan, new THREE.BoxGeometry(w, h, 0.34), x, TOP + y, WALL.z)); // the viewport's lit frame
  }
  return lit;
}

/** The command chair on its platform, at the captain's seat. Returns glow parts. */
function commandChair(group) {
  const base = KING_SEAT.y;
  group.add(box(2.8, 0.24, 2.0, grey(STATION.panelLight), KING_SEAT.x, base - 0.12, KING_SEAT.z - 0.1));
  const seatY = base + SEAT_LIFT;
  const chair = grey(STATION.panelDark, 0.5);
  group.add(box(0.8, 0.07, 0.68, chair, KING_SEAT.x, seatY - 0.035, KING_SEAT.z - 0.05));
  group.add(box(0.8, 0.7, 0.08, chair, KING_SEAT.x, seatY + 0.35, KING_SEAT.z - 0.4));
  group.add(box(0.14, SEAT_LIFT - 0.07, 0.14, grey(STATION.panel), KING_SEAT.x, base + (SEAT_LIFT - 0.07) / 2, KING_SEAT.z - 0.05));
  for (const side of [-1, 1]) group.add(box(0.1, 0.07, 0.5, chair, KING_SEAT.x + side * 0.46, seatY + 0.2, KING_SEAT.z - 0.1));
  return [
    glow(STATION.cyan, new THREE.BoxGeometry(2.8, 0.02, 0.03), KING_SEAT.x, base - 0.01, KING_SEAT.z + 0.9), // platform's lit edge
    glow(STATION.cyan, new THREE.BoxGeometry(0.5, 0.03, 0.02), KING_SEAT.x, seatY + 0.7, KING_SEAT.z - 0.35), // chair back's light
  ];
}

/** @returns {THREE.Group} the floor, the bridge and their steady glow */
export function buildDeckAndBridge() {
  const root = new THREE.Group();
  root.add(floor());
  const solid = new THREE.Group();
  dais(solid);
  const lit = [...rails(solid), ...viewportWall(solid), ...commandChair(solid)];
  root.add(mergeStatic(solid));
  const glowing = glowMesh(lit, null);
  glowing.matrixAutoUpdate = false;
  root.add(glowing);
  return root;
}
