// Pieces of Nguyễn court dress, built from simple shapes for the figures:
//   mandarin: mũ cánh chuồn (black cap with flat side wings), áo giao lĩnh with crossed
//             collar, a bổ tử badge on the chest, a belt, wide sleeves, hia boots
//   king:     mũ xung thiên (gold cap with wings rising behind), long bào with clouds
//             and a dragon, red trim, a beard
import * as THREE from 'three';
import { PALETTE } from './court-layout.js';
import { part, toon } from './figure-toon-style.js';

/** A detail too small for its shadow to show: skip it in the shadow pass. */
const detail = (mesh) => { mesh.castShadow = false; return mesh; };

const LACQUER_BLACK = 0x1d1a22;
const COLLAR_WHITE = 0xf3ece0;

/** An arm in a wide sleeve, hanging below its shoulder pivot, with a hand at the cuff. */
export function sleevedArm(robeMat, { length = 0.3, cuff = 0.085, cuffMat = robeMat } = {}) {
  const arm = new THREE.Group();
  arm.add(part(new THREE.CylinderGeometry(0.05, cuff, length, 8).translate(0, -length / 2, 0), robeMat));
  arm.add(part(new THREE.CylinderGeometry(cuff + 0.004, cuff + 0.004, 0.035, 8), cuffMat, 0, -length + 0.02, 0));
  arm.add(part(new THREE.SphereGeometry(0.036, 8, 6), toon(PALETTE.skin), 0, -length - 0.03, 0));
  return arm;
}

/** Mũ cánh chuồn: rounded black cap, a raised back, and two flat wings to the sides. */
export function mandarinHat() {
  const hat = new THREE.Group();
  const black = toon(LACQUER_BLACK);
  hat.add(part(new THREE.CylinderGeometry(0.125, 0.135, 0.1, 12), black, 0, 0.05, 0));
  hat.add(part(new THREE.SphereGeometry(0.125, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), black, 0, 0.1, 0.01));
  hat.add(part(new THREE.CylinderGeometry(0.1, 0.11, 0.12, 10), black, 0, 0.12, -0.07)); // raised back
  for (const side of [-1, 1]) {
    const wing = detail(part(new THREE.BoxGeometry(0.2, 0.06, 0.012), black, side * 0.2, 0.14, -0.1));
    wing.rotation.z = side * 0.12; // tips lifting slightly
    hat.add(wing);
  }
  return hat;
}

/** Mũ xung thiên: gold cap, a jewel at the brow, two wings rising up behind. */
export function kingCrown() {
  const crown = new THREE.Group();
  const gold = toon(PALETTE.gold);
  crown.add(part(new THREE.CylinderGeometry(0.15, 0.17, 0.14, 12), toon(PALETTE.glaze), 0, 0.07, 0));
  crown.add(part(new THREE.CylinderGeometry(0.175, 0.175, 0.04, 12), gold, 0, 0.02, 0));
  crown.add(part(new THREE.SphereGeometry(0.15, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), toon(PALETTE.glaze), 0, 0.14, 0));
  crown.add(detail(part(new THREE.OctahedronGeometry(0.035), toon(PALETTE.lacquer), 0, 0.08, 0.17))); // jewel
  for (const side of [-1, 1]) {
    const wing = part(new THREE.BoxGeometry(0.06, 0.24, 0.015), gold, side * 0.09, 0.27, -0.12);
    wing.rotation.z = -side * 0.25; // rising and spreading
    crown.add(wing);
  }
  return crown;
}

/** Áo giao lĩnh collar: two white bands crossing over the chest, left over right. */
export function crossedCollar(y, z) {
  const collar = new THREE.Group();
  const white = toon(COLLAR_WHITE);
  for (const side of [-1, 1]) {
    const band = detail(part(new THREE.BoxGeometry(0.04, 0.18, 0.02), white, side * 0.04, y, z));
    band.rotation.z = -side * 0.5; // the bands meet low on the chest: a V
    band.rotation.x = -0.25;
    collar.add(band);
  }
  return collar;
}

/** A belt round the waist with a gold plaque at the front. */
export function belt(radius, y, color = PALETTE.lacquerDark) {
  const group = new THREE.Group();
  group.add(part(new THREE.CylinderGeometry(radius, radius, 0.05, 14), toon(color), 0, y, 0));
  group.add(detail(part(new THREE.BoxGeometry(0.07, 0.05, 0.02), toon(PALETTE.gold), 0, y, radius)));
  return group;
}

const badgeCache = new Map();
/** Bổ tử: the embroidered square of rank on a mandarin's chest (a crane in flight). */
export function rankBadge(robeColor) {
  if (!badgeCache.has(robeColor)) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#d9a441';
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = `#${new THREE.Color(robeColor).multiplyScalar(0.7).getHexString()}`;
    ctx.fillRect(6, 6, 52, 52);
    ctx.strokeStyle = '#f3ece0';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath(); // crane: wings and neck
    ctx.moveTo(12, 30); ctx.quadraticCurveTo(24, 18, 32, 32); ctx.quadraticCurveTo(40, 18, 52, 30);
    ctx.moveTo(32, 32); ctx.lineTo(36, 46);
    ctx.stroke();
    ctx.fillStyle = '#c23a22';
    ctx.beginPath(); ctx.arc(37, 47, 3, 0, Math.PI * 2); ctx.fill(); // red crown of the crane
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    badgeCache.set(robeColor, toon(0xffffff, map));
  }
  return detail(part(new THREE.PlaneGeometry(0.13, 0.13), badgeCache.get(robeColor)));
}

/** Hia: the dark court boots, toes showing under the robe. */
export function boots(spread = 0.08) {
  const group = new THREE.Group();
  for (const side of [-1, 1]) group.add(part(new THREE.BoxGeometry(0.07, 0.06, 0.14), toon(LACQUER_BLACK), side * spread, 0.03, 0.06));
  return group;
}

let dragonRobe;
/** Long bào: imperial yellow with darker clouds, a coiling dragon and a red hem. */
export function dragonRobeMaterial() {
  if (dragonRobe) return dragonRobe;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#e3a72b';
  ctx.fillRect(0, 0, 512, 256);
  ctx.strokeStyle = '#b97f16';
  ctx.lineWidth = 4;
  for (let i = 0; i < 9; i++) { // cloud scrolls
    const x = 30 + i * 56;
    const y = 50 + (i % 3) * 45;
    ctx.beginPath(); ctx.arc(x, y, 10, Math.PI, 2.2 * Math.PI); ctx.arc(x + 18, y, 8, Math.PI, 2.4 * Math.PI); ctx.stroke();
  }
  ctx.strokeStyle = '#c0611c'; // the dragon: a long body coiling round the robe, with scales
  ctx.lineWidth = 12;
  ctx.beginPath();
  for (let x = 0; x <= 512; x += 8) ctx.lineTo(x, 120 + Math.sin(x / 40) * 40);
  ctx.stroke();
  ctx.fillStyle = '#f6d27a';
  for (let x = 8; x < 512; x += 22) { ctx.beginPath(); ctx.arc(x, 120 + Math.sin(x / 40) * 40, 3, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = '#c23a22'; // hem
  ctx.fillRect(0, 222, 512, 34);
  ctx.fillStyle = '#d9a441';
  ctx.fillRect(0, 226, 512, 4);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  dragonRobe = toon(0xffffff, map);
  return dragonRobe;
}

/** A short black beard and moustache for the king. */
export function beard() {
  const group = new THREE.Group();
  const black = toon(0x2a1d16);
  const chin = part(new THREE.ConeGeometry(0.05, 0.13, 6), black, 0, -0.17, 0.11);
  chin.rotation.x = Math.PI + 0.3;
  group.add(chin);
  for (const side of [-1, 1]) {
    const tash = detail(part(new THREE.BoxGeometry(0.07, 0.015, 0.015), black, side * 0.04, -0.05, 0.155));
    tash.rotation.z = side * -0.35;
    group.add(tash);
  }
  return group;
}

/** Nón dấu: the guard's small black lacquered cone with a brass spike and a red tassel. */
export function guardHat() {
  const hat = new THREE.Group();
  hat.add(part(new THREE.ConeGeometry(0.21, 0.12, 14), toon(LACQUER_BLACK), 0, 0.06, 0));
  hat.add(detail(part(new THREE.ConeGeometry(0.025, 0.12, 6), toon(PALETTE.bronze), 0, 0.17, 0)));
  hat.add(detail(part(new THREE.SphereGeometry(0.035, 6, 5), toon(PALETTE.lacquer), 0, 0.1, 0)));
  return hat;
}

/** The round emblem on a guard's tunic: a yellow disc ringed in red. */
export function guardEmblem() {
  const emblem = new THREE.Group();
  emblem.add(detail(part(new THREE.CircleGeometry(0.075, 16), toon(PALETTE.lacquerDark))));
  emblem.add(detail(part(new THREE.CircleGeometry(0.06, 16), toon(PALETTE.glaze), 0, 0, 0.002)));
  return emblem;
}
