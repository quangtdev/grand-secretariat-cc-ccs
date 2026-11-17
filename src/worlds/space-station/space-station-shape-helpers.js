// Small shape helpers for the station's bodies and scenery: toon-shaded blobs, stubs and slabs for
// figures (baked by scene/figure-toon-style.js) and glowing parts that are merged into ONE
// vertex-coloured, unlit mesh per body (the trims, the visor, the screens).
import * as THREE from 'three';
import { part, toon } from '../../scene/figure-toon-style.js';
import { mergeAsVertexColours } from '../../scene/static-scenery-merge.js';

/** An ellipsoid with radii (rx, ry, rz) at (x, y, z). Own geometry per call: a body frees it on dispose. */
export function blob(color, [rx, ry, rz], x = 0, y = 0, z = 0) {
  return part(new THREE.SphereGeometry(1, 12, 8).scale(rx, ry, rz), toon(color), x, y, z);
}

/** A (tapered) cylinder with its own geometry. */
export function stub(color, rTop, rBottom, height, x = 0, y = 0, z = 0, sides = 10) {
  return part(new THREE.CylinderGeometry(rTop, rBottom, height, sides), toon(color), x, y, z);
}

/** A box. */
export function slab(color, width, height, depth, x = 0, y = 0, z = 0) {
  return part(new THREE.BoxGeometry(width, height, depth), toon(color), x, y, z);
}

const basicCache = new Map();
/** Cached unlit material for a part that is about to be merged (only its colour is read). */
const basic = (color) => {
  if (!basicCache.has(color)) basicCache.set(color, new THREE.MeshBasicMaterial({ color }));
  return basicCache.get(color);
};

/** A glowing part (unlit) at (x, y, z); merge it with `glowMesh`. */
export function glow(color, geometry, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(geometry, basic(color));
  mesh.position.set(x, y, z);
  return mesh;
}

let bodyGlowMaterial;
/** Shared unlit vertex-coloured material of every body's glow mesh. */
export function bodyGlow() {
  bodyGlowMaterial ??= new THREE.MeshBasicMaterial({ vertexColors: true });
  return bodyGlowMaterial;
}

/**
 * Merges glowing parts into one mesh in the space of `root` (their ancestor, or a holder made here
 * when they have none) and returns it, not yet added anywhere.
 */
export function glowMesh(parts, root, material = bodyGlow()) {
  const holder = root ?? new THREE.Group().add(...parts);
  return mergeAsVertexColours(parts, holder, material);
}

/** Both of a pair: calls `make(side)` for -1 and +1 and returns the results. */
export const pair = (make) => [-1, 1].map(make);

/** Frees every geometry under `root`; materials are shared caches and stay. */
export const disposeGeometries = (root) => root.traverse((child) => { if (child.isMesh) child.geometry.dispose(); });
