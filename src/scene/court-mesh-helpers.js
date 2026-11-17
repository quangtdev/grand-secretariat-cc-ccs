// Small builders shared by the court's buildings and figures.
import * as THREE from 'three';
import { PALETTE } from './court-layout.js';

const materialCache = new Map();

/** Cached standard material; lacquer and glaze are glossier than stone and cloth. */
export function material(color, roughness = 0.85) {
  const key = `${color}:${roughness}`;
  if (!materialCache.has(key)) {
    materialCache.set(key, new THREE.MeshStandardMaterial({ color, roughness, flatShading: true }));
  }
  return materialCache.get(key);
}

export function mesh(geometry, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geometry, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export const box = (w, h, d, mat, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z);

export const column = (radius, height, mat, x, y, z) =>
  mesh(new THREE.CylinderGeometry(radius, radius, height, 12), mat, x, y + height / 2, z);

/**
 * A glazed hip roof with upturned corners, the silhouette of Hue palace roofs.
 * Width/depth are measured at the eaves; the group's origin is the eave line.
 */
let roofTiles;
/** Glazed tube tiles: ribs running down the slope, drawn once as a striped texture. */
function roofTileMaterial() {
  if (roofTiles) return roofTiles;
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const shade = ctx.createLinearGradient(0, 0, 64, 0);
  shade.addColorStop(0, '#b97f16');
  shade.addColorStop(0.45, '#f0b63a');
  shade.addColorStop(0.75, '#e3a72b');
  shade.addColorStop(1, '#a8720f');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = 'rgba(120, 78, 10, 0.35)'; // tile joints across the ribs
  ctx.fillRect(0, 0, 64, 3);
  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(72, 5);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  roofTiles = new THREE.MeshStandardMaterial({ map, roughness: 0.3 });
  return roofTiles;
}

export function hipRoof(width, depth, height) {
  const group = new THREE.Group();
  const tiles = roofTileMaterial();
  // A four-sided frustum whose base is a square of side sqrt(2), stretched to width x depth.
  // The rotation is baked into the geometry so the stretch below runs along the eaves, not the diagonals.
  const slope = mesh(new THREE.CylinderGeometry(0.42, 1, height, 4, 1).rotateY(Math.PI / 4), tiles, 0, height / 2, 0);
  slope.scale.set(width / Math.SQRT2, 1, depth / Math.SQRT2);
  group.add(slope);

  const ridgeLength = width * 0.42;
  group.add(box(ridgeLength, 0.16, 0.22, material(PALETTE.glazeDark, 0.4), 0, height + 0.06, 0));
  for (const side of [-1, 1]) {
    group.add(box(0.22, 0.36, 0.26, material(PALETTE.glazeDark, 0.4), side * ridgeLength / 2, height + 0.14, 0));
  }
  // Upturned eave corners.
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const tip = mesh(new THREE.ConeGeometry(0.13, 0.7, 5), material(PALETTE.glazeDark, 0.4), sx * width / 2, 0.16, sz * depth / 2);
      tip.rotation.set(sz * 0.9, 0, -sx * 0.9);
      group.add(tip);
    }
  }
  return group;
}

/** Stone paving drawn once to a canvas: slabs with slight tone drift and dark joints. */
export function pavingTexture(base, joint, repeat) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const tone = new THREE.Color(base);
  const slab = size / 4;
  for (let row = 0; row < 4; row++) {
    for (let col = -1; col < 4; col++) {
      const drift = (Math.sin(row * 12.9898 + col * 78.233) * 43758.5453 % 1) * 0.07;
      const c = tone.clone().offsetHSL(0, 0, drift);
      ctx.fillStyle = `#${c.getHexString()}`;
      ctx.fillRect(col * slab + (row % 2) * slab / 2, row * slab, slab, slab);
    }
  }
  ctx.strokeStyle = `#${new THREE.Color(joint).getHexString()}`;
  ctx.lineWidth = 3;
  for (let row = 0; row < 4; row++) {
    for (let col = -1; col < 4; col++) {
      ctx.strokeRect(col * slab + (row % 2) * slab / 2, row * slab, slab, slab);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}
