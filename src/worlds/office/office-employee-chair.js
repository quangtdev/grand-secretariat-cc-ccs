// The employee's swivel chair. It belongs to the figure, not to the desk: it shows while the
// employee sits and hides while the employee walks or stands (so nobody ever sits on thin air
// while the movers are still carrying the desk out). One baked mesh, built in metres at the
// figure's origin (the seat) and scaled back by the figure's scale so it keeps its real size.
import * as THREE from 'three';
import { box, material } from '../../scene/court-mesh-helpers.js';
import { mergeAsVertexColours } from '../../scene/static-scenery-merge.js';
import { OFFICE } from './office-palette.js';

let shared;

/** @param {number} figureScale  the scale the chair will be drawn under; it is divided out */
export function buildEmployeeChair(figureScale) {
  shared ??= new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, flatShading: true });
  const parts = new THREE.Group();
  const fabric = material(OFFICE.tealDark, 0.9);
  const steel = material(OFFICE.steel, 0.5);
  parts.add(box(0.46, 0.06, 0.46, fabric, 0, 0.27, 0.02)); // seat
  const back = box(0.46, 0.42, 0.05, fabric, 0, 0.54, -0.24);
  back.rotation.x = -0.12;
  parts.add(back);
  parts.add(box(0.05, 0.2, 0.05, steel, 0, 0.15, 0)); // gas post
  for (let i = 0; i < 5; i++) { // five spokes, each ending in a wheel
    const angle = i * 1.2566;
    const spoke = box(0.3, 0.03, 0.04, steel, Math.cos(angle) * 0.15, 0.06, Math.sin(angle) * 0.15);
    spoke.rotation.y = -angle;
    parts.add(spoke, box(0.05, 0.05, 0.05, steel, Math.cos(angle) * 0.29, 0.025, Math.sin(angle) * 0.29));
  }
  const meshes = [];
  parts.traverse((node) => { if (node.isMesh) meshes.push(node); });
  const chair = mergeAsVertexColours(meshes, parts, shared);
  chair.scale.setScalar(1 / figureScale);
  return chair;
}
