// The office's summon point: a reception desk with a call bell in front of a pair of steel
// elevator doors in the west wall's solid lobby block, under the company name. This is the
// pickable summon target (userData.pick = { kind: 'summon' }): click it to hire an employee. It
// stands where the shared plan puts the drum pavilion (DRUM_PAVILION). The elevator lamp is a
// plain colour (static, merged).
import * as THREE from 'three';
import { DRUM_PAVILION } from '../../scene/court-layout.js';
import { box, material, mesh } from '../../scene/court-mesh-helpers.js';
import { mergeStatic } from '../../scene/static-scenery-merge.js';
import { OFFICE } from './office-palette.js';
import { ROOM } from './office-room-plan.js';
import { officeVocabulary } from './office-vocabulary.js';

const WALL_FACE = -ROOM.x + 0.15; // the lobby block's inner face
const COUNTER_X = -11.2;

/** The company name on a painted board, facing east into the room. */
function nameBoard(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#2b2f33';
  ctx.fillRect(0, 0, 512, 96);
  ctx.fillStyle = '#2f8f8a';
  ctx.fillRect(0, 84, 512, 12);
  ctx.fillStyle = '#f3f1ec';
  ctx.font = '600 52px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 44);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  const board = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.56), new THREE.MeshStandardMaterial({ map, roughness: 0.7 }));
  board.position.set(WALL_FACE + 0.02, 3.0, DRUM_PAVILION.z);
  board.rotation.y = Math.PI / 2;
  return board;
}

function elevatorDoors(group) {
  const { z } = DRUM_PAVILION;
  const steel = material(OFFICE.steel, 0.5);
  const brushed = material(0xa4adb4, 0.35);
  group.add(box(0.12, 2.6, 2.36, steel, WALL_FACE, 1.3, z)); // frame
  for (const side of [-1, 1]) group.add(box(0.06, 2.4, 1.0, brushed, WALL_FACE + 0.07, 1.2, z + side * 0.5)); // the two door leaves
  group.add(box(0.07, 2.4, 0.03, steel, WALL_FACE + 0.08, 1.2, z)); // the seam
  group.add(box(0.07, 0.26, 1.0, material(0x1c1f22, 0.4), WALL_FACE + 0.08, 2.8, z)); // floor indicator
  group.add(box(0.075, 0.1, 0.1, material(OFFICE.teal, 0.4), WALL_FACE + 0.085, 2.8, z)); // its lamp
  group.add(box(0.05, 0.14, 0.14, steel, WALL_FACE + 0.06, 1.2, z + 1.45)); // call panel
}

function receptionDesk(group) {
  const { z } = DRUM_PAVILION;
  group.add(box(0.7, 1.0, 3.0, material(OFFICE.white, 0.7), COUNTER_X, 0.5, z + 0.2)); // body
  group.add(box(0.06, 0.9, 2.9, material(OFFICE.teal, 0.6), COUNTER_X + 0.37, 0.5, z + 0.2)); // front panel
  group.add(box(0.85, 0.06, 3.15, material(OFFICE.oak, 0.5), COUNTER_X, 1.03, z + 0.2)); // top
  const dark = material(0x23262a, 0.4);
  group.add(box(0.03, 0.3, 0.5, dark, COUNTER_X - 0.1, 1.3, z - 0.7)); // monitor
  group.add(box(0.14, 0.02, 0.14, material(0xb9c0c6, 0.3), COUNTER_X + 0.15, 1.07, z + 0.7)); // bell base
  group.add(mesh(new THREE.SphereGeometry(0.07, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), material(OFFICE.accentGold, 0.3), COUNTER_X + 0.15, 1.08, z + 0.7));
  group.add(box(2.6, 0.015, 1.1, material(0x4a5258, 1), WALL_FACE + 1.6, 0.008, z)); // entrance mat
}

/** @returns {{target: THREE.Group}} the pickable reception and elevator */
export function buildReceptionAndElevator() {
  const group = new THREE.Group();
  elevatorDoors(group);
  receptionDesk(group);
  const target = new THREE.Group();
  target.add(mergeStatic(group), nameBoard(officeVocabulary.appName.toUpperCase()));
  target.userData.pick = { kind: 'summon' };
  return { target };
}
