// What the window walls look at: a ring of city towers (merged, soft blue-greys that melt into
// the haze with distance) and a few slow clouds drifting by. The towers reach far below the
// floor so the office reads as high up. Clouds are instanced flattened puffs; they hold still
// while a petition waits and under reduced motion (office-ambient-gate.js).
import * as THREE from 'three';
import { box, material } from '../../scene/court-mesh-helpers.js';
import { seeded } from '../../scene/court-surroundings.js';
import { mergeStatic } from '../../scene/static-scenery-merge.js';
import { gatedAmbient } from './office-ambient-gate.js';

const TOWER_COLOURS = [0x9db3c4, 0xa8bccb, 0xb4c5d2, 0x93abbd];
const BAND_COLOURS = [0xc8d6e0, 0x7f98ab];
const CLOUDS = 9;
const PUFFS = 3;
const SPAN = 150; // clouds wrap round this width
const dummy = new THREE.Object3D();

/** Towers on a ring round the office, none on the camera's side (south) so nothing blocks the view. */
export function buildSkyline() {
  const random = seeded(11);
  const group = new THREE.Group();
  for (let i = 0; i < 90; i++) {
    const angle = (i / 90) * Math.PI * 2 + random() * 0.05;
    const radius = 62 + random() * 50;
    const x = Math.cos(angle) * radius * 1.3;
    const z = Math.sin(angle) * radius;
    if (z > 6) continue;
    const w = 5 + random() * 8;
    const d = 5 + random() * 8;
    const top = 6 + random() * 30;
    const bottom = -40;
    const colour = TOWER_COLOURS[i % TOWER_COLOURS.length];
    group.add(box(w, top - bottom, d, material(colour, 1), x, (top + bottom) / 2, z));
    for (let y = top - 2; y > top - 14; y -= 3.6) { // floors: thin light and dark bands, glass and slab
      group.add(box(w + 0.06, 0.55, d + 0.06, material(BAND_COLOURS[Math.floor(y / 3.6) % 2], 1), x, y, z));
    }
    group.add(box(w * 0.4, 1.2, d * 0.4, material(0x8fa2b2, 1), x, top + 0.6, z)); // plant room on the roof
  }
  group.traverse((node) => { if (node.isMesh) node.castShadow = node.receiveShadow = false; });
  return mergeStatic(group);
}

/** @returns {{ambient: import('../world-pack-contract.js').AmbientLife}} */
export function buildClouds(scene) {
  const random = seeded(23);
  const home = Array.from({ length: CLOUDS }, () => ({
    x: (random() - 0.5) * SPAN, y: 16 + random() * 16, z: -18 - random() * 60, size: 2.4 + random() * 2.2, speed: 0.25 + random() * 0.3,
  }));
  const puffs = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 10, 7),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, fog: false, depthWrite: false }),
    CLOUDS * PUFFS,
  );
  puffs.frustumCulled = false;
  scene.add(puffs);
  const draw = (time) => {
    for (let c = 0; c < CLOUDS; c++) {
      const cloud = home[c];
      const x = ((cloud.x + time * cloud.speed + SPAN / 2) % SPAN + SPAN) % SPAN - SPAN / 2;
      for (let p = 0; p < PUFFS; p++) {
        const k = p - 1;
        dummy.position.set(x + k * cloud.size * 1.1, cloud.y + (p === 1 ? 0.4 : 0), cloud.z);
        dummy.scale.set(cloud.size * (p === 1 ? 1.5 : 1.1), cloud.size * 0.42, cloud.size * 0.8);
        dummy.updateMatrix();
        puffs.setMatrixAt(c * PUFFS + p, dummy.matrix);
      }
    }
    puffs.instanceMatrix.needsUpdate = true;
  };
  draw(0);
  return gatedAmbient((_dt, time) => draw(time));
}
