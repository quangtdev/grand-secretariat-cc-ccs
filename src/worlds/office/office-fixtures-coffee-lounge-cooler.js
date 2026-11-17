// The places the manager strolls to that are not plants: the coffee counter with its machine
// (where the front glass of his office opens), a lounge bench and low table at the east window
// wall, and the water cooler at the end of the east corridor (its jug is translucent; the
// bubbles inside are ambient life, office-cooler-bubbles-and-motes.js). Static: merged.
import * as THREE from 'three';
import { box, material, mesh } from '../../scene/court-mesh-helpers.js';
import { mergeStatic } from '../../scene/static-scenery-merge.js';
import { OFFICE } from './office-palette.js';
import { COFFEE_STATION, GLASS_OFFICE, WATER_COOLER, WINDOW_LOUNGE } from './office-room-plan.js';

export const JUG = { y: 1.3, radius: 0.17, height: 0.5 }; // the cooler's water jug, for the bubbles

function coffeeCounter(group) {
  const { x, y, z } = COFFEE_STATION;
  const cz = GLASS_OFFICE.front - 0.3;
  group.add(box(1.7, 0.9, 0.42, material(OFFICE.white, 0.7), x, y + 0.45, cz));
  group.add(box(1.74, 0.04, 0.46, material(OFFICE.oakDark, 0.5), x, y + 0.92, cz));
  const steel = material(OFFICE.steelLight, 0.35);
  group.add(box(0.5, 0.46, 0.34, material(0x23262a, 0.4), x + 0.3, y + 1.17, cz)); // the machine
  group.add(box(0.5, 0.05, 0.36, steel, x + 0.3, y + 1.42, cz));
  group.add(box(0.12, 0.02, 0.1, steel, x + 0.3, y + 0.96, cz + 0.1)); // drip tray
  for (const dx of [-0.35, -0.15]) group.add(mesh(new THREE.CylinderGeometry(0.04, 0.032, 0.08, 8), material(OFFICE.white, 0.5), x + dx, y + 0.98, cz)); // cups
}

function windowLounge(group) {
  const { x, z } = WINDOW_LOUNGE;
  const fabric = material(OFFICE.tealDark, 0.9);
  group.add(box(0.7, 0.4, 2.4, fabric, x, 0.2, z)); // bench along the glass
  group.add(box(0.16, 0.45, 2.4, fabric, x + 0.4, 0.6, z));
  group.add(box(0.7, 0.04, 0.7, material(OFFICE.oak, 0.5), x - 1.1, 0.4, z));
  group.add(box(0.05, 0.4, 0.05, material(OFFICE.steel, 0.5), x - 1.1, 0.2, z));
}

function waterCooler(group, glassGroup) {
  const { x, z } = WATER_COOLER;
  group.add(box(0.4, 1.05, 0.4, material(OFFICE.white, 0.6), x, 0.525, z));
  group.add(box(0.42, 0.06, 0.42, material(OFFICE.steelLight, 0.4), x, 1.08, z));
  group.add(box(0.1, 0.06, 0.04, material(0x4f86c6, 0.4), x - 0.08, 0.85, z + 0.205)); // cold tap
  group.add(box(0.1, 0.06, 0.04, material(0xd95f4a, 0.4), x + 0.08, 0.85, z + 0.205)); // hot tap
  const jug = new THREE.Mesh(new THREE.CylinderGeometry(JUG.radius, JUG.radius, JUG.height, 14), new THREE.MeshStandardMaterial({ color: 0x9fd3f0, transparent: true, opacity: 0.45, depthWrite: false, roughness: 0.1 }));
  jug.position.set(x, JUG.y, z);
  glassGroup.add(jug);
}

/** @returns {THREE.Group} the fixtures, merged */
export function buildFixtures() {
  const group = new THREE.Group();
  const glassGroup = new THREE.Group();
  coffeeCounter(group);
  windowLounge(group);
  waterCooler(group, glassGroup);
  group.add(glassGroup);
  return mergeStatic(group);
}
