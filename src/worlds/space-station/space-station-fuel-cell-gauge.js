// The station's ink gauge: a vertical fuel cell, a dark glass tube on a plinth with a glowing
// cyan core, standing at the end of the console. The core drains as the crew member's context
// fills (`setInk(left)`, 0..1): "fuel". Built once per console; an update only rescales the one
// core mesh. The station's own cyan is its neutral light, never a status colour (DESIGN.md,
// The Same Signal Rule).
import * as THREE from 'three';
import { STATION } from './space-station-palette.js';

const TUBE_HEIGHT = 0.52;
const BASE = 0.07; // height of the foot the tube stands on
const MIN_SCALE = 0.04; // a last glimmer at the bottom
let frameMaterial;
let glassMaterial;
let coreMaterial;

/** @param {number} x  @param {number} z  where the cell stands, in the console's frame */
export function buildFuelCellGauge(x, z) {
  frameMaterial ??= new THREE.MeshStandardMaterial({ color: STATION.panelDark, roughness: 0.6, flatShading: true });
  glassMaterial ??= new THREE.MeshBasicMaterial({ color: 0x0c1118, transparent: true, opacity: 0.22, depthWrite: false });
  coreMaterial ??= new THREE.MeshBasicMaterial({ color: STATION.cyan });
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, BASE, 12).translate(0, BASE / 2, 0), frameMaterial);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.04, 12).translate(0, BASE + TUBE_HEIGHT + 0.02, 0), frameMaterial);
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, TUBE_HEIGHT, 12).translate(0, BASE + TUBE_HEIGHT / 2, 0), glassMaterial);
  glass.renderOrder = 2;
  // Core anchored at the tube's floor: scale.y is the level.
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, TUBE_HEIGHT - 0.04, 10).translate(0, (TUBE_HEIGHT - 0.04) / 2 + BASE + 0.02, 0), coreMaterial);
  core.position.y = 0;
  group.add(foot, cap, core, glass);
  return {
    object: group,
    setInk(left) {
      // Scaling about y = 0 would lift the core's floor: keep its bottom on the tube floor.
      const k = Math.max(left, MIN_SCALE);
      core.scale.y = k;
      core.position.y = (BASE + 0.02) * (1 - k);
    },
    dispose() {
      group.removeFromParent();
      for (const mesh of [foot, cap, glass, core]) mesh.geometry.dispose();
    },
  };
}
