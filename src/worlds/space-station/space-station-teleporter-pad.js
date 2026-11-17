// The teleporter pad: the pickable summon point (userData.pick = { kind: 'summon' }). It stands where
// the shared plan puts the drum pavilion (DRUM_PAVILION): a round pad on a low plate with three
// pylons and an emitter ring overhead. Click it to beam a crew member aboard. The pad's light rises
// as a faint column that breathes slowly (stepped by the stage's ambient list; still on petition).
import * as THREE from 'three';
import { DRUM_PAVILION } from '../../scene/court-layout.js';
import { box, material, mesh } from '../../scene/court-mesh-helpers.js';
import { mergeStatic } from '../../scene/static-scenery-merge.js';
import { STATION } from './space-station-palette.js';
import { glow, glowMesh } from './space-station-shape-helpers.js';

const PAD_RADIUS = 1.35;
const EMITTER_HEIGHT = 3.3;
const PYLONS = [0, 1, 2].map((i) => (i / 3) * Math.PI * 2 + Math.PI / 6);

/** @returns {{target: THREE.Group, ambient: {update: (dt: number, time: number) => void, settle: (petition: boolean) => void}}} */
export function buildTeleporterPad() {
  const { x, z } = DRUM_PAVILION;
  const solid = new THREE.Group();
  solid.add(mesh(new THREE.CylinderGeometry(PAD_RADIUS + 0.9, PAD_RADIUS + 1.0, 0.06, 28), material(STATION.panelDark, 0.6), x, 0.03, z)); // plate
  solid.add(mesh(new THREE.CylinderGeometry(PAD_RADIUS, PAD_RADIUS, 0.12, 24), material(STATION.panel, 0.5), x, 0.12, z)); // the pad
  const lit = [
    glow(STATION.cyan, new THREE.TorusGeometry(PAD_RADIUS - 0.08, 0.04, 6, 36).rotateX(Math.PI / 2), x, 0.19, z),
    glow(STATION.holo, new THREE.TorusGeometry(PAD_RADIUS * 0.55, 0.03, 6, 28).rotateX(Math.PI / 2), x, 0.19, z),
    glow(STATION.cyan, new THREE.TorusGeometry(PAD_RADIUS - 0.1, 0.05, 6, 36).rotateX(Math.PI / 2), x, EMITTER_HEIGHT, z), // emitter ring
  ];
  for (const angle of PYLONS) {
    const px = x + Math.cos(angle) * (PAD_RADIUS + 0.35);
    const pz = z + Math.sin(angle) * (PAD_RADIUS + 0.35);
    solid.add(box(0.22, EMITTER_HEIGHT, 0.22, material(STATION.panelDark, 0.5), px, EMITTER_HEIGHT / 2, pz));
    lit.push(glow(STATION.cyan, new THREE.BoxGeometry(0.05, EMITTER_HEIGHT - 0.4, 0.05), px + (x - px) * 0.18, EMITTER_HEIGHT / 2, pz + (z - pz) * 0.18));
  }
  const target = new THREE.Group();
  target.add(mergeStatic(solid));
  target.add(glowMesh(lit, null));

  // The column of light between the pad and the emitter ring.
  const columnMaterial = new THREE.MeshBasicMaterial({ color: STATION.cyan, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const column = new THREE.Mesh(new THREE.CylinderGeometry(PAD_RADIUS - 0.2, PAD_RADIUS - 0.1, EMITTER_HEIGHT - 0.2, 24, 1, true), columnMaterial);
  column.position.set(x, 0.2 + (EMITTER_HEIGHT - 0.2) / 2, z);
  target.add(column);
  target.userData.pick = { kind: 'summon' };

  let petition = false;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  return {
    target,
    ambient: {
      update: (_dt, time) => { if (!petition && !reducedMotion.matches) columnMaterial.opacity = 0.1 + Math.sin(time * 1.1) * 0.04; },
      settle: (value) => { petition = value; },
    },
  };
}
