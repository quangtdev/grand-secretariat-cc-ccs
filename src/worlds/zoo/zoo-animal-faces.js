// Painted faces for the six species. A head is a sphere wrapped in a canvas painted in the
// species' fur with its markings (panda eye patches, lion muzzle, monkey mask...) and big
// round eyes, so one head is one draw call. Three's SphereGeometry puts the front (+z) at
// u = 0.25 of the texture, so every drawing is centred on x = 64 of 256, with the equator at y = 64.
import * as THREE from 'three';
import { toon } from '../../scene/figure-toon-style.js';

const CX = 64;
const hex = (c) => `#${new THREE.Color(c).getHexString()}`;
const ellipse = (ctx, x, y, rx, ry, colour, turn = 0) => {
  ctx.fillStyle = hex(colour);
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, turn, 0, Math.PI * 2); ctx.fill();
};

/** Two round eyes with a white glint. `patch` paints a coloured patch behind each. */
function eyes(ctx, { y = 58, gap = 13, r = 5.5, patch = null, patchColour = 0x23262b } = {}) {
  for (const side of [-1, 1]) {
    if (patch) ellipse(ctx, CX + side * gap, y + 2, patch[0], patch[1], patchColour, side * 0.35);
    ellipse(ctx, CX + side * gap, y, r, r * 1.15, 0x1d1a22);
    ellipse(ctx, CX + side * gap + 1.6, y - 2, r * 0.38, r * 0.38, 0xffffff);
  }
}

const smile = (ctx, y = 84, width = 6) => {
  ctx.strokeStyle = '#4a2a20';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(CX - width, y); ctx.quadraticCurveTo(CX, y + 4, CX + width, y); ctx.stroke();
};

const cheeks = (ctx) => { for (const side of [-1, 1]) ellipse(ctx, CX + side * 19, 72, 5, 3.5, 0xe9857a); };

const PAINTERS = {
  elephant: (ctx) => { eyes(ctx, { gap: 14 }); cheeks(ctx); },
  giraffe: (ctx) => {
    for (const [x, y, r] of [[-26, 40, 5], [22, 36, 6], [30, 58, 4], [-32, 66, 5], [8, 30, 4]]) ellipse(ctx, CX + x, y, r, r * 0.8, 0xb8793a);
    ellipse(ctx, CX, 86, 17, 12, 0xf3dc9a);
    eyes(ctx, { y: 56, gap: 15 });
    for (const side of [-1, 1]) ellipse(ctx, CX + side * 5, 84, 1.8, 2.2, 0x5a3320); // nostrils
  },
  lion: (ctx) => {
    ellipse(ctx, CX, 80, 20, 13, 0xf6dba4);
    eyes(ctx, { y: 56, gap: 14 });
    ellipse(ctx, CX, 72, 5.5, 4, 0x4a2a20); // nose
    smile(ctx, 84);
  },
  panda: (ctx) => {
    eyes(ctx, { y: 58, gap: 15, r: 4.5, patch: [8.5, 12], patchColour: 0x23262b });
    for (const side of [-1, 1]) ellipse(ctx, CX + side * 15 + 1.4, 56, 2.4, 2.4, 0xffffff);
    ellipse(ctx, CX, 74, 5, 3.6, 0x23262b);
    smile(ctx, 84, 5);
  },
  penguin: (ctx) => {
    ellipse(ctx, CX - 11, 62, 15, 17, 0xf6f1e4); // white face, heart shaped
    ellipse(ctx, CX + 11, 62, 15, 17, 0xf6f1e4);
    ellipse(ctx, CX, 78, 18, 14, 0xf6f1e4);
    eyes(ctx, { y: 58, gap: 13, r: 4.5 });
  },
  monkey: (ctx) => {
    ellipse(ctx, CX - 10, 60, 15, 14, 0xf0cfa0); // pale mask, heart shaped
    ellipse(ctx, CX + 10, 60, 15, 14, 0xf0cfa0);
    ellipse(ctx, CX, 78, 20, 15, 0xf0cfa0);
    eyes(ctx, { y: 58, gap: 11, r: 4.5 });
    for (const side of [-1, 1]) ellipse(ctx, CX + side * 3, 74, 1.5, 2, 0x4a2a20);
    smile(ctx, 86, 7);
  },
};

const cache = new Map();
/** Toon material with the species' face painted in its fur `colour`. */
export function animalFaceMaterial(species, colour) {
  if (cache.has(species)) return cache.get(species);
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = hex(colour);
  ctx.fillRect(0, 0, 256, 128);
  PAINTERS[species](ctx);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  cache.set(species, toon(0xffffff, map));
  return cache.get(species);
}
