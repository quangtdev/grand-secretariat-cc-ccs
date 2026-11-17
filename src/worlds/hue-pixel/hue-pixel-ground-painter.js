// The ground of the pixel Huế court, painted once at boot as a single flat texture: grass all
// round, the paved yard inside the walls with its pale central path, the river strip at the south
// and the lotus pond. One plane, one draw call. The picture is top-down; the isometric camera
// shears it into the diamond tiles pixel artists draw.
import * as THREE from 'three';
import { COURT_BOUNDS, POND, PALETTE } from '../../scene/court-layout.js';
import { createPixelCanvas, pixelCell, shade } from './hue-pixel-sprite-painter.js';

const HALF = 32; // world units from the centre to the texture's edge
const PX = 6; // texture pixels per world unit
export const RIVER = { north: COURT_BOUNDS.south + 1, south: COURT_BOUNDS.south + 5.5 };
export const GRASS = PALETTE.moss;

const at = (v) => Math.round((v + HALF) * PX);
const noise = (seed) => { let s = seed; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };

function paintGrass(c) {
  const rnd = noise(7);
  c.rect(0, 0, c.w, c.h, GRASS);
  for (let i = 0; i < 700; i++) { // a few faint blades: the grass is a backdrop, not a pattern
    const [x, y] = [Math.floor(rnd() * c.w), Math.floor(rnd() * c.h)];
    c.rect(x, y, 2, 1, rnd() < 0.5 ? shade(GRASS, 0.95) : shade(GRASS, 1.05));
  }
}

const PAVING = 0xc4baa5;
const PATH = 0xd0c7b3;

/** Paving: one quiet tone, tiles a unit square told apart only by a faint groove. The path is a shade paler. */
function paintYard(c) {
  const { x, north, south } = COURT_BOUNDS;
  const [x0, x1, z0, z1] = [at(-x), at(x), at(north), at(south)];
  for (let ty = z0; ty < z1; ty += PX) {
    for (let tx = x0; tx < x1; tx += PX) {
      const base = (((tx - x0) / PX) + ((ty - z0) / PX)) % 2 ? shade(PAVING, 1.015) : PAVING;
      c.rect(tx, ty, PX, PX, base);
      c.rect(tx, ty + PX - 1, PX, 1, shade(base, 0.95));
      c.rect(tx + PX - 1, ty, 1, PX, shade(base, 0.95));
    }
  }
  // The central path, and the broad stretch before the throne where petitioners kneel: paler, no edging.
  const [p0, p1] = [at(-1.6), at(1.6)];
  c.rect(p0, at(-5.4), p1 - p0, z1 - at(-5.4), PATH);
  for (let ty = at(-5.4); ty < z1; ty += PX * 2) c.rect(p0, ty + PX * 2 - 1, p1 - p0, 1, shade(PATH, 0.96));
  c.rect(at(-5), at(-5.4), at(5) - at(-5), at(-3.0) - at(-5.4), PATH);
}

function paintRiver(c) {
  const rnd = noise(11);
  c.rect(0, at(RIVER.north), c.w, at(RIVER.south) - at(RIVER.north), 0x6fa8a6);
  for (let i = 0; i < 380; i++) {
    const x = Math.floor(rnd() * c.w);
    const y = at(RIVER.north) + 2 + Math.floor(rnd() * (at(RIVER.south) - at(RIVER.north) - 4));
    c.rect(x, y, 3 + Math.floor(rnd() * 5), 1, rnd() < 0.6 ? 0x8cc0bc : 0x5b918f);
  }
  c.rect(0, at(RIVER.north) - 2, c.w, 2, PALETTE.stoneDark); // the stone bank
  c.rect(0, at(RIVER.south), c.w, 2, PALETTE.stoneDark);
}

function paintPond(c) {
  const rnd = noise(5);
  const [x0, z0] = [at(POND.center.x - POND.width / 2), at(POND.center.z - POND.depth / 2)];
  const [w, h] = [Math.round(POND.width * PX), Math.round(POND.depth * PX)];
  c.rect(x0, z0, w, h, 0x4f8782);
  for (let i = 0; i < 40; i++) c.rect(x0 + Math.floor(rnd() * (w - 4)), z0 + Math.floor(rnd() * h), 3, 1, 0x6aa6a0);
  for (let i = 0; i < 12; i++) { // lily pads, some in flower
    const [x, y] = [x0 + 2 + Math.floor(rnd() * (w - 8)), z0 + 2 + Math.floor(rnd() * (h - 6))];
    c.rect(x, y, 4, 3, 0x4f8f48); c.rect(x + 1, y + 1, 2, 1, 0x69ab5a);
    if (i % 3 === 0) { c.rect(x + 1, y, 2, 1, 0xf0b6a4); }
  }
}

/** @returns {THREE.Mesh} the ground plane, y = 0. */
export function buildGround() {
  const { canvas, ctx } = createPixelCanvas(HALF * 2 * PX, HALF * 2 * PX);
  const cell = pixelCell(ctx, 0, 0, canvas.width, canvas.height);
  paintGrass(cell);
  paintYard(cell);
  paintRiver(cell);
  paintPond(cell);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(HALF * 2, HALF * 2).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: texture }));
  mesh.position.y = -0.001; // a hair under y = 0 where blocks stand
  return mesh;
}
