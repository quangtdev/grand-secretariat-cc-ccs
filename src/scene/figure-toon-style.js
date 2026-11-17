// The look shared by the court's figures (the king, the scribes, their soldiers):
// three-step toon shading and painted faces.
// Buildings keep their own standard materials; only figures are drawn this way.
import * as THREE from 'three';
import { mergeAsVertexColours } from './static-scenery-merge.js';

let toonRamp;
/** Three flat tones of light: shade, mid, lit. */
function ramp() {
  if (toonRamp) return toonRamp;
  toonRamp = new THREE.DataTexture(new Uint8Array([90, 175, 255]), 3, 1, THREE.RedFormat);
  toonRamp.minFilter = toonRamp.magFilter = THREE.NearestFilter;
  toonRamp.needsUpdate = true;
  return toonRamp;
}

const toonCache = new Map();
/** Cached toon material in a flat colour (or with a texture map). */
export function toon(color, map = null) {
  const key = `${color}:${map?.uuid ?? ''}`;
  if (!toonCache.has(key)) toonCache.set(key, new THREE.MeshToonMaterial({ color, map, gradientMap: ramp() }));
  return toonCache.get(key);
}

/** A mesh in a figure: casts a shadow but does not receive one, so the toon tones stay clean. */
export function part(geometry, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geometry, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

let bakedMaterial;
/** One toon material for every baked part: the colours live in the vertices. */
function vertexColourToon() {
  bakedMaterial ??= new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: ramp() });
  return bakedMaterial;
}

/**
 * Bakes a rigid part of a figure into one mesh. A figure is dozens of small shapes (hat,
 * belt, collar, boots...), each a draw call for the scene and another for the shadow map;
 * the plain-coloured ones under `root` are merged into a single vertex-coloured mesh.
 * Textured meshes (face, badge, dragon robe) stay as they are. Subtrees in `separate`
 * move or hide on their own (an arm, a prop) and are left out; bake those themselves.
 */
export function bakeRigid(root, separate = []) {
  const meshes = [];
  root.traverse((node) => {
    if (!node.isMesh || node.material.map || !node.material.isMeshToonMaterial) return;
    for (let n = node; n && n !== root; n = n.parent) if (separate.includes(n)) return;
    meshes.push(node);
  });
  if (meshes.length < 2) return;
  const mesh = mergeAsVertexColours(meshes, root, vertexColourToon());
  mesh.castShadow = true;
  root.add(mesh);
}

const faceCache = new Map();
/**
 * A face painted on a sphere's texture: closed, calm eyes and brows, a hint of a mouth.
 * Three's SphereGeometry puts +z (the front) at u = 0.25 of the texture.
 */
export function faceMaterial({ skin, brows = 1 }) { // `skin`: the world's skin colour, always given by the caller
  const key = `${brows}:${skin}`;
  if (faceCache.has(key)) return faceCache.get(key);
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = `#${new THREE.Color(skin).getHexString()}`;
  ctx.fillRect(0, 0, 256, 128);
  const cx = 64; // u = 0.25
  ctx.strokeStyle = '#2a1a12';
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    ctx.lineWidth = 3.5;
    ctx.beginPath(); // eye: a downward arc
    ctx.arc(cx + side * 11, 60, 4.5, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    ctx.lineWidth = 2.5 * brows;
    ctx.beginPath(); // brow, rising outwards
    ctx.moveTo(cx + side * 5, 50);
    ctx.lineTo(cx + side * 17, 47 - brows * 2);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(200, 90, 70, 0.25)'; // cheeks
  for (const side of [-1, 1]) { ctx.beginPath(); ctx.arc(cx + side * 15, 72, 5, 0, Math.PI * 2); ctx.fill(); }
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#7a3a2a';
  ctx.beginPath(); // mouth
  ctx.moveTo(cx - 4, 82);
  ctx.quadraticCurveTo(cx, 84, cx + 4, 82);
  ctx.stroke();
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const mat = toon(0xffffff, map);
  faceCache.set(key, mat);
  return mat;
}
