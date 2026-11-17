// Potted plants that sway in the air-conditioning draught, and two pedestal fans that turn
// their heads and spin their blades. Pots and poles are one static mesh; each plant's leaves
// are a mesh sharing one geometry (so nothing per plant to dispose); each fan's blades one
// mesh. All hold still while a petition waits and under reduced motion (office-ambient-gate.js).
import * as THREE from 'three';
import { box, material, mesh } from '../../scene/court-mesh-helpers.js';
import { mergeAsVertexColours, mergeStatic } from '../../scene/static-scenery-merge.js';
import { gatedAmbient } from './office-ambient-gate.js';
import { OFFICE } from './office-palette.js';
import { GLASS_OFFICE, PLANT_CORNER, PLANT_NOOK_WEST } from './office-room-plan.js';

const deck = GLASS_OFFICE.top;
const POT_HEIGHT = 0.42;
/** [x, y, z, scale]: the glass office's corners and nook, the plant corner by the east steps, the lounge, the lobby. */
const PLANTS = [
  [PLANT_NOOK_WEST.x, deck, PLANT_NOOK_WEST.z, 1.3], [-6.4, deck, -13.1, 1.5], [6.3, deck, -13.1, 1.4],
  [PLANT_CORNER.x, 0, PLANT_CORNER.z, 1.7], [PLANT_CORNER.x + 1.1, 0, PLANT_CORNER.z + 1.3, 1.2],
  [12.3, 0, 3.7, 1.3], [-12.2, 0, 4.4, 1.3],
];
/** [x, z, facing]: fans at the plant corner and in the west aisle, blowing across the floor. */
const FANS = [[12.3, -1.6, -Math.PI / 2], [-12.4, 6.6, Math.PI / 2]];
const FAN_HEIGHT = 1.15;

let foliage; // the leaves, built once and shared
function leafGeometry() {
  if (foliage) return foliage;
  const parts = new THREE.Group();
  const greens = [OFFICE.leaf, OFFICE.leafLight, 0x3f8450];
  for (let i = 0; i < 11; i++) {
    const lean = 0.35 + (i % 3) * 0.2;
    const leaf = mesh(new THREE.ConeGeometry(0.13, 0.78, 5).translate(0, 0.39, 0), material(greens[i % 3], 0.9));
    leaf.rotation.set(Math.cos(i * 2.4) * lean, i * 0.57, Math.sin(i * 2.4) * lean);
    parts.add(leaf);
  }
  parts.add(mesh(new THREE.SphereGeometry(0.2, 8, 6).translate(0, 0.35, 0), material(OFFICE.leaf, 0.9)));
  const merged = mergeAsVertexColours([...parts.children], parts, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, flatShading: true }));
  foliage = { geometry: merged.geometry, material: merged.material };
  return foliage;
}

/** One blade set: three flat blades round a hub, one mesh. */
function bladeMesh() {
  const parts = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const blade = box(0.34, 0.03, 0.12, material(OFFICE.steelLight, 0.4), 0.17, 0, 0);
    const holder = new THREE.Group();
    holder.rotation.z = (i * Math.PI * 2) / 3;
    holder.add(blade);
    parts.add(holder);
  }
  parts.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 8).rotateX(Math.PI / 2), material(OFFICE.steel, 0.5)));
  const meshes = [];
  parts.traverse((node) => { if (node.isMesh) meshes.push(node); });
  return mergeAsVertexColours(meshes, parts, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, flatShading: true }));
}

/** Pots, fan poles and fan cages in one static mesh; returns the swaying and spinning parts too. */
export function buildPlantsAndFans(scene) {
  const fixed = new THREE.Group();
  const pot = material(OFFICE.pot, 0.8);
  const { geometry, material: leaves } = leafGeometry();
  const plants = PLANTS.map(([x, y, z, scale], i) => {
    fixed.add(mesh(new THREE.CylinderGeometry(0.2 * scale, 0.15 * scale, POT_HEIGHT * scale, 10), pot, x, y + (POT_HEIGHT * scale) / 2, z));
    const crown = new THREE.Mesh(geometry, leaves);
    crown.position.set(x, y + POT_HEIGHT * scale, z);
    crown.scale.setScalar(scale);
    crown.frustumCulled = false; // it sways about its own foot; the box is small
    scene.add(crown);
    return { crown, phase: i * 1.7 };
  });
  const fans = FANS.map(([x, z, facing]) => {
    const steel = material(OFFICE.steel, 0.5);
    fixed.add(mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.05, 12), steel, x, 0.025, z), box(0.04, FAN_HEIGHT, 0.04, steel, x, FAN_HEIGHT / 2, z));
    const head = new THREE.Group();
    head.position.set(x, FAN_HEIGHT, z);
    const cage = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.012, 5, 18), steel);
    const blades = bladeMesh();
    head.add(cage, blades);
    head.rotation.y = facing;
    scene.add(head);
    return { head, blades, facing };
  });
  scene.add(mergeStatic(fixed));
  return { plants, fans };
}

/** @returns {import('../world-pack-contract.js').AmbientLife} */
export function buildPlantsAndFansAmbient(scene) {
  const { plants, fans } = buildPlantsAndFans(scene);
  return gatedAmbient((dt, time) => {
    for (let i = 0; i < plants.length; i++) {
      const { crown, phase } = plants[i];
      crown.rotation.z = Math.sin(time * 0.9 + phase) * 0.04;
      crown.rotation.x = Math.cos(time * 0.7 + phase) * 0.035;
    }
    for (let i = 0; i < fans.length; i++) {
      const { head, blades, facing } = fans[i];
      blades.rotation.z -= dt * 11;
      head.rotation.y = facing + Math.sin(time * 0.4 + i * 2) * 0.5; // the head turns to and fro
    }
  });
}
