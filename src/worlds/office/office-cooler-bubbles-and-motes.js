// Two small bits of life: bubbles that rise through the water cooler's jug, and dust motes
// drifting in the daylight over the floor. Both hold still while a petition waits and under
// reduced motion (office-ambient-gate.js). The same ambient also pings, rarely, like a laptop
// notification somewhere in the office: the world's "chirp" cue (silent when the tab is hidden).
import * as THREE from 'three';
import { sparkTexture } from '../../scene/summoning-portal-effect.js';
import { gatedAmbient } from './office-ambient-gate.js';
import { JUG } from './office-fixtures-coffee-lounge-cooler.js';
import { WATER_COOLER } from './office-room-plan.js';

const BUBBLES = 6;
const MOTES = 40;
const MOTE_AREA = { x: 22, y: 2.6, z: 14, y0: 0.6, cz: 1.5 }; // centred on x = 0
const dummy = new THREE.Object3D();

export function buildCoolerBubbles(scene) {
  const bubbles = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.025, 6, 5),
    new THREE.MeshBasicMaterial({ color: 0xf2fbff, transparent: true, opacity: 0.9 }),
    BUBBLES,
  );
  bubbles.frustumCulled = false;
  scene.add(bubbles);
  const draw = (time) => {
    for (let i = 0; i < BUBBLES; i++) {
      const phase = (time * 0.32 + i * 0.37) % 1;
      dummy.position.set(
        WATER_COOLER.x + Math.sin(time * 2.2 + i * 2.1) * 0.06,
        JUG.y - JUG.height / 2 + 0.05 + phase * (JUG.height - 0.12),
        WATER_COOLER.z + Math.cos(time * 1.7 + i * 1.3) * 0.06,
      );
      dummy.scale.setScalar(0.6 + phase * 0.6);
      dummy.updateMatrix();
      bubbles.setMatrixAt(i, dummy.matrix);
    }
    bubbles.instanceMatrix.needsUpdate = true;
  };
  draw(0);
  return draw;
}

export function buildDustMotes(scene) {
  const base = new Float32Array(MOTES * 3);
  const phase = new Float32Array(MOTES);
  for (let i = 0; i < MOTES; i++) {
    base.set([(Math.random() - 0.5) * MOTE_AREA.x, MOTE_AREA.y0 + Math.random() * MOTE_AREA.y, MOTE_AREA.cz + (Math.random() - 0.5) * MOTE_AREA.z], i * 3);
    phase[i] = Math.random() * 20;
  }
  const geometry = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(base.slice(), 3));
  const motes = new THREE.Points(geometry, new THREE.PointsMaterial({
    color: 0xfff3d6, size: 0.07, map: sparkTexture(), transparent: true, opacity: 0.55, depthWrite: false, sizeAttenuation: true,
  }));
  motes.frustumCulled = false;
  scene.add(motes);
  const out = geometry.attributes.position.array;
  return (time) => {
    for (let i = 0; i < MOTES; i++) {
      const p = phase[i];
      out[i * 3] = base[i * 3] + Math.sin(time * 0.13 + p) * 0.9;
      out[i * 3 + 1] = base[i * 3 + 1] + Math.sin(time * 0.21 + p * 1.7) * 0.35;
      out[i * 3 + 2] = base[i * 3 + 2] + Math.cos(time * 0.11 + p) * 0.8;
    }
    geometry.attributes.position.needsUpdate = true;
  };
}

/** @param {{onChirp?: () => void}} hooks  @returns {import('../world-pack-contract.js').AmbientLife} */
export function buildBubblesMotesAndPings(scene, { onChirp = () => {} } = {}) {
  const drawBubbles = buildCoolerBubbles(scene);
  const drawMotes = buildDustMotes(scene);
  let pingAt = 20 + Math.random() * 30;
  return gatedAmbient((_dt, time) => {
    drawBubbles(time);
    drawMotes(time);
    if (time >= pingAt) { pingAt = time + 40 + Math.random() * 50; onChirp(); }
  });
}
