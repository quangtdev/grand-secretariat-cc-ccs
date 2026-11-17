// Two bits of drifting colour: butterflies over the lawn corners and a bunch of balloons tied
// at the entrance arch. Each is a single instanced draw. Both hold still while a petition
// waits and under reduced motion (the Petition Holds Rule).
import * as THREE from 'three';
import { DRUM_PAVILION } from '../../scene/court-layout.js';
import { ZOO } from './zoo-palette.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const HOMES = [[-11, 1.4, -8], [10.8, 1.2, -1.5], [-10.5, 1.3, 7], [11, 1.5, 6.4], [-7.5, 1.6, -9], [7.8, 1.2, 8.4]];
const COLOURS = [0xf2a33a, 0xf6e05a, 0xe879a8, 0x7ab6e8, 0xffffff, 0xb48ae0];
const dummy = new THREE.Object3D();

export function buildButterflies(scene) {
  const wing = new THREE.PlaneGeometry(0.2, 0.15).translate(0.1, 0, 0).rotateX(-Math.PI / 2);
  const wings = new THREE.InstancedMesh(wing, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), HOMES.length * 2);
  HOMES.forEach((_, i) => { wings.setColorAt(i * 2, new THREE.Color(COLOURS[i])); wings.setColorAt(i * 2 + 1, new THREE.Color(COLOURS[i])); });
  wings.frustumCulled = false;
  scene.add(wings);
  let petition = false; // a petition waits: hold still (reduced motion is read live)
  const SIDES = [-1, 1];
  const draw = (time, still) => {
    for (let i = 0; i < HOMES.length; i++) {
      const home = HOMES[i];
      const t = time * 0.4 + i * 2.1;
      const px = home[0] + Math.sin(t * 1.3) * 1.6;
      const pz = home[2] + Math.cos(t) * 1.4;
      const flap = still ? 0.5 : Math.abs(Math.sin(time * 13 + i)) * 1.1;
      const heading = Math.atan2(Math.cos(t * 1.3) * 1.3 * 1.6, -Math.sin(t) * 1.4);
      for (let w = 0; w < 2; w++) {
        const side = SIDES[w]; // which wing: mirrored in x
        dummy.position.set(px, home[1] + Math.sin(t * 2) * 0.25, pz);
        dummy.rotation.set(0, heading, side * flap);
        dummy.scale.set(side, 1, 1);
        dummy.updateMatrix();
        wings.setMatrixAt(i * 2 + w, dummy.matrix);
      }
    }
    wings.instanceMatrix.needsUpdate = true;
  };
  draw(0, true);
  return {
    update: (_dt, time) => { if (!petition && !reducedMotion.matches) draw(time, false); },
    settle: (value) => { petition = value; },
  };
}

const TIE = new THREE.Vector3(DRUM_PAVILION.x + 0.6, 0.9, DRUM_PAVILION.z - 1.8);
export function buildBalloons(scene) {
  const count = ZOO.balloons.length;
  const balloons = new THREE.InstancedMesh(new THREE.SphereGeometry(0.28, 12, 9).scale(1, 1.22, 1), new THREE.MeshStandardMaterial({ roughness: 0.3 }), count);
  ZOO.balloons.forEach((c, i) => balloons.setColorAt(i, new THREE.Color(c)));
  balloons.frustumCulled = false;
  const strings = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 6), 3)), new THREE.LineBasicMaterial({ color: 0x555555 }));
  strings.frustumCulled = false;
  scene.add(balloons, strings);
  let petition = false;
  const lines = strings.geometry.attributes.position.array;
  const draw = (time) => {
    for (let i = 0; i < count; i++) {
      const x = TIE.x + Math.sin(time * 0.7 + i * 1.3) * 0.25 + (i - 2) * 0.22;
      const y = TIE.y + 2.2 + (i % 3) * 0.35 + Math.sin(time * 1.1 + i) * 0.08;
      const z = TIE.z + Math.cos(time * 0.6 + i * 0.9) * 0.25;
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      balloons.setMatrixAt(i, dummy.matrix);
      const o = i * 6;
      lines[o] = TIE.x; lines[o + 1] = TIE.y; lines[o + 2] = TIE.z;
      lines[o + 3] = x; lines[o + 4] = y - 0.32; lines[o + 5] = z;
    }
    balloons.instanceMatrix.needsUpdate = true;
    strings.geometry.attributes.position.needsUpdate = true;
  };
  draw(0);
  return {
    update: (_dt, time) => { if (!petition && !reducedMotion.matches) draw(time); },
    settle: (value) => { petition = value; },
  };
}
