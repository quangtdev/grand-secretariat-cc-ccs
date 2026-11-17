// The zoo's entrance: a wooden arch with a painted name board, and a striped ticket booth.
// This is the pickable summon point (userData.pick = { kind: 'summon' }): click it to admit
// an animal. The arch stands where the shared plan puts the drum pavilion (DRUM_PAVILION).
import * as THREE from 'three';
import { DRUM_PAVILION } from '../../scene/court-layout.js';
import { box, material, mesh } from '../../scene/court-mesh-helpers.js';
import { mergeStatic } from '../../scene/static-scenery-merge.js';
import { zooVocabulary } from './zoo-vocabulary.js';
import { ZOO } from './zoo-palette.js';

const ARCH_HALF = 1.5;
const ARCH_HEIGHT = 3.3;
export const GATE_BEAM_TOP = new THREE.Vector3(DRUM_PAVILION.x, ARCH_HEIGHT + 0.3, DRUM_PAVILION.z);

function nameBoard(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f2c14e';
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = '#5e3b22';
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, 502, 118);
  ctx.fillStyle = '#4a2c18';
  ctx.font = '700 62px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 68);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  return new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.65), new THREE.MeshStandardMaterial({ map, roughness: 0.8 }));
}

function arch(group) {
  const wood = material(ZOO.wood, 0.85);
  const { x, z } = DRUM_PAVILION;
  for (const side of [-1, 1]) {
    group.add(box(0.36, ARCH_HEIGHT, 0.36, wood, x, ARCH_HEIGHT / 2, z + side * ARCH_HALF));
    group.add(mesh(new THREE.SphereGeometry(0.28, 10, 8), material(ZOO.woodLight, 0.8), x, ARCH_HEIGHT + 0.1, z + side * ARCH_HALF));
  }
  group.add(box(0.4, 0.5, ARCH_HALF * 2 + 0.6, material(ZOO.woodDark, 0.85), x, ARCH_HEIGHT - 0.2, z));
}

function booth(group) {
  const { x, z } = DRUM_PAVILION;
  const bx = x - 0.2;
  const bz = z - 3.2;
  const red = material(0xd6523f, 0.7);
  const cream = material(ZOO.white, 0.8);
  group.add(box(1.8, 0.9, 1.6, cream, bx, 0.45, bz));
  for (let i = 0; i < 6; i++) group.add(box(0.3, 1.3, 1.62, i % 2 ? cream : red, bx - 0.75 + i * 0.3, 1.55, bz)); // striped walls
  group.add(box(1.5, 0.08, 0.5, material(ZOO.woodDark, 0.8), bx + 0.1, 1.2, bz + 0.95)); // counter
  group.add(box(1.0, 0.7, 0.05, material(0x2c3b40, 0.5), bx, 1.55, bz + 0.82)); // window
  for (let i = 0; i < 6; i++) { // striped awning, sloping out over the window
    const strip = box(0.3, 0.06, 1.0, i % 2 ? cream : red, bx - 0.75 + i * 0.3, 2.35, bz + 1.0);
    strip.rotation.x = 0.35;
    group.add(strip);
  }
  group.add(mesh(new THREE.ConeGeometry(1.4, 0.8, 4).rotateY(Math.PI / 4), red, bx, 2.7, bz));
}

/** @returns {{target: THREE.Group}} the pickable gate and booth */
export function buildEntranceGateAndBooth() {
  const group = new THREE.Group();
  arch(group);
  booth(group);
  const target = new THREE.Group();
  target.add(mergeStatic(group));
  const board = nameBoard(zooVocabulary.appName.toUpperCase());
  board.position.set(DRUM_PAVILION.x + 0.21, ARCH_HEIGHT - 0.2, DRUM_PAVILION.z);
  board.rotation.y = Math.PI / 2; // faces east, into the yard
  const back = board.clone();
  back.rotation.y = -Math.PI / 2;
  back.position.x = DRUM_PAVILION.x - 0.21;
  target.add(board, back);
  target.userData.pick = { kind: 'summon' };
  return { target };
}
