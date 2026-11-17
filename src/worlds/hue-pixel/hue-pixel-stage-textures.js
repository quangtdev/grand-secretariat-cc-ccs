// The patterns and upright props of the pixel Huế stage, painted at boot into one atlas
// (see hue-pixel-iso-mesh-builder.js). Patterns cover one world unit of a wall, roof or floor;
// props (trees, urns, lamps, rock, drum) and small ambient sprites (egret, petal, glint, koi)
// are drawn to be stood upright facing the camera.
import { PALETTE } from '../../scene/court-layout.js';
import { packAtlas } from './hue-pixel-iso-mesh-builder.js';
import { shade } from './hue-pixel-sprite-painter.js';

const INK = 0x2a1d16;

/** Deterministic noise so the art is the same on every load. */
function noise(seed) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}

function disc(c, cx, cy, r, color) {
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) c.dot(cx + x, cy + y, color);
}

const flat = (base, mortar) => (c) => { // brick or plank courses, four rows each
  c.rect(0, 0, c.w, c.h, base);
  for (let y = 3; y < c.h; y += 4) c.rect(0, y, c.w, 1, mortar);
  for (let y = 0; y < c.h; y += 4) c.dot(((y / 4) % 2) * 3, y, mortar);
};

function roofTiles(c) { // yellow glazed tiles in curved courses
  const { glaze } = PALETTE;
  c.rect(0, 0, c.w, c.h, glaze);
  for (let band = 0; band < 2; band++) {
    c.rect(0, band * 4, c.w, 1, shade(glaze, 1.08));
    c.rect(0, band * 4 + 3, c.w, 1, shade(glaze, 0.88));
    for (let x = (band % 2) * 2; x < c.w; x += 3) c.rect(x, band * 4 + 1, 1, 2, shade(glaze, 0.95));
  }
}

function lacquer(base) {
  return (c) => {
    c.rect(0, 0, c.w, c.h, base);
    c.rect(0, 0, 1, c.h, shade(base, 1.2)); // a lit edge
    c.rect(c.w - 1, 0, 1, c.h, shade(base, 0.8));
  };
}

function crownTree(w, h, leaf, flower) {
  return (c) => {
    const rnd = noise(w * 31 + h);
    const trunkTop = Math.round(h * 0.6);
    c.rect(Math.floor(w / 2) - 1, trunkTop, 3, h - trunkTop, 0x5a3a25);
    const blobs = [[w / 2, h * 0.36, w * 0.36], [w * 0.28, h * 0.46, w * 0.22], [w * 0.72, h * 0.46, w * 0.22], [w / 2, h * 0.2, w * 0.2]];
    for (const [x, y, r] of blobs) disc(c, Math.round(x), Math.round(y), Math.round(r), shade(leaf, 0.82));
    for (const [x, y, r] of blobs) disc(c, Math.round(x - 1), Math.round(y - 1), Math.round(r * 0.8), leaf);
    for (let i = 0; i < w * 1.5; i++) { // leaf specks, only on the crown
      const [x, y] = [Math.floor(rnd() * w), Math.floor(rnd() * h * 0.6)];
      if ((x - w / 2) ** 2 + (y - h * 0.36) ** 2 < (w * 0.3) ** 2) c.dot(x, y, rnd() < 0.5 ? shade(leaf, 1.25) : shade(leaf, 0.66));
    }
    if (flower) for (let i = 0; i < 14; i++) c.dot(Math.floor(w * (0.15 + rnd() * 0.7)), Math.floor(h * (0.1 + rnd() * 0.4)), flower);
    c.outline(INK);
  };
}

function rock(c) {
  const heights = [8, 13, 19, 24, 17, 22, 14, 9];
  heights.forEach((top, i) => {
    const x = 2 + i * 3;
    c.rect(x, c.h - top - 1, 3, top, i % 3 === 0 ? 0x8f8574 : 0x777066);
    c.rect(x, c.h - top - 1, 1, top, 0xa8a090);
  });
  c.outline(INK);
}

function urn(c) {
  c.rect(2, 8, 10, 3, 0x7d6b45);
  c.rect(1, 6, 12, 2, 0xa38d58);
  c.rect(2, 11, 10, 1, 0x5a4c30);
  c.rect(3, 12, 2, 3, 0x5a4c30); c.rect(9, 12, 2, 3, 0x5a4c30); c.rect(6, 12, 2, 3, 0x5a4c30);
  c.rect(3, 6, 8, 1, 0x2a2420); // dark incense bed
  c.outline(INK);
}

function lamp(c) {
  c.rect(1, 14, 6, 2, 0x8f8574);
  c.rect(3, 8, 2, 6, 0xb9ad98);
  c.rect(1, 3, 6, 5, 0xb9ad98);
  c.rect(2, 4, 4, 3, 0xf3c75a); // lit window
  c.rect(0, 2, 8, 1, 0x8f8574); c.rect(2, 0, 4, 2, 0x8f8574);
  c.outline(INK);
}

function drum(c) {
  c.rect(1, 10, 2, 4, 0x4a2c1c); c.rect(11, 10, 2, 4, 0x4a2c1c);
  c.rect(1, 1, 12, 10, PALETTE.lacquer);
  c.rect(1, 1, 12, 1, 0xe08a70); c.rect(1, 10, 12, 1, PALETTE.lacquerDark);
  c.rect(0, 5, 14, 1, PALETTE.gold);
  for (let x = 2; x < 13; x += 3) { c.dot(x, 3, PALETTE.gold); c.dot(x, 8, PALETTE.gold); }
  c.outline(INK);
}

function egret(wingUp) {
  return (c) => {
    c.rect(1, 2, 4, 2, 0xf4f1e8); c.rect(4, 1, 2, 1, 0xf4f1e8); c.dot(6, 1, 0xe3a72b); c.dot(0, 3, 0xd8d4c8);
    if (wingUp) { c.rect(2, 0, 3, 2, 0xffffff); c.dot(3, 4, 0x777066); } else { c.rect(2, 4, 4, 1, 0xe6e2d6); c.dot(3, 4, 0x777066); }
  };
}

/** @returns {ReturnType<typeof packAtlas>} */
export function buildStageAtlas() {
  return packAtlas([
    { name: 'stone', w: 6, h: 8, paint: flat(PALETTE.stone, 0x9a8f7c) },
    { name: 'floor', w: 6, h: 6, paint: (c) => { c.rect(0, 0, 6, 6, 0xd0c7b3); c.rect(0, 5, 6, 1, 0xbdb39e); c.rect(5, 0, 1, 6, 0xbdb39e); } },
    { name: 'red', w: 6, h: 8, paint: lacquer(PALETTE.lacquer) },
    { name: 'redDark', w: 6, h: 8, paint: lacquer(PALETTE.lacquerDark) },
    { name: 'roof', w: 6, h: 8, paint: roofTiles },
    { name: 'wood', w: 6, h: 8, paint: flat(0x6b4a2e, 0x4a2c1c) },
    { name: 'plank', w: 6, h: 6, paint: (c) => { c.rect(0, 0, 6, 6, 0x9a6b44); c.rect(0, 2, 6, 1, 0x7a5232); c.rect(0, 5, 6, 1, 0x7a5232); } },
    { name: 'gold', w: 6, h: 8, paint: (c) => { c.rect(0, 0, 6, 8, PALETTE.gold); c.rect(0, 0, 6, 1, 0xf3d27a); c.rect(1, 2, 4, 4, 0xb97f16); c.dot(2, 3, 0xe3a72b); } },
    { name: 'dark', w: 6, h: 8, paint: (c) => c.rect(0, 0, 6, 8, 0x3a2a22) },
    { name: 'tree', w: 40, h: 48, paint: crownTree(40, 48, 0x4f7a3c) },
    { name: 'frangipani', w: 36, h: 44, paint: crownTree(36, 44, 0x6a9040, 0xf6efe0) },
    { name: 'pine', w: 22, h: 28, paint: crownTree(22, 28, 0x3f6a46) },
    { name: 'rock', w: 28, h: 28, paint: rock },
    { name: 'urn', w: 14, h: 15, paint: urn },
    { name: 'lamp', w: 8, h: 16, paint: lamp },
    { name: 'drum', w: 14, h: 14, paint: drum },
    { name: 'egret0', w: 7, h: 5, paint: egret(true) },
    { name: 'egret1', w: 7, h: 5, paint: egret(false) },
    { name: 'petal', w: 2, h: 2, paint: (c) => { c.rect(0, 0, 2, 2, 0xf6efe0); c.dot(1, 1, 0xf0b6a4); } },
    { name: 'glint', w: 3, h: 3, paint: (c) => { c.rect(1, 0, 1, 3, 0xffffff); c.rect(0, 1, 3, 1, 0xffffff); } },
    { name: 'koi', w: 5, h: 2, paint: (c) => { c.rect(0, 0, 4, 2, 0xe8743a); c.dot(4, 1, 0xf4f1e8); c.dot(1, 0, 0xf4f1e8); } },
    { name: 'smoke', w: 2, h: 2, paint: (c) => c.rect(0, 0, 2, 2, 0xe9e5da) },
  ]);
}
