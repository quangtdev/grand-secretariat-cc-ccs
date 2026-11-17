// Three places the captain strolls to, east of the bridge: the star-map table (a holo globe turning
// slowly above it), the airlock window (a round port in a bulkhead) and a nav beacon pole at the
// south end of the east walk. Same stop points as the shared outings (court-layout KING_OUTINGS):
// rockery -> star table, pond -> airlock window, riverView -> beacon. The globe holds still while a
// petition waits and under reduced motion.
import * as THREE from 'three';
import { box, material, mesh } from '../../scene/court-mesh-helpers.js';
import { mergeStatic } from '../../scene/static-scenery-merge.js';
import { STATION } from './space-station-palette.js';
import { glow, glowMesh } from './space-station-shape-helpers.js';

export const STAR_TABLE = new THREE.Vector3(9.7, 0, -5);
export const AIRLOCK = new THREE.Vector3(12.2, 0, 1.8);
export const BEACON = new THREE.Vector3(8, 0, 9.2);
const BEACON_HEIGHT = 1.6;

function holoGlobe() {
  const holo = new THREE.MeshBasicMaterial({ color: STATION.cyan, wireframe: true, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
  const globe = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), holo);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.012, 4, 36), holo);
  ring.rotation.x = Math.PI / 2 - 0.4;
  const group = new THREE.Group();
  group.add(globe, ring);
  group.position.set(STAR_TABLE.x, 1.5, STAR_TABLE.z);
  return group;
}

/** @returns {{group: THREE.Group, ambient: {update: (dt: number, time: number) => void, settle: (petition: boolean) => void}}} */
export function buildStarTableAndAirlock() {
  const solid = new THREE.Group();
  const dark = material(STATION.panelDark, 0.5);
  solid.add(mesh(new THREE.CylinderGeometry(0.75, 0.9, 0.78, 18), dark, STAR_TABLE.x, 0.39, STAR_TABLE.z));
  solid.add(mesh(new THREE.CylinderGeometry(0.98, 0.98, 0.06, 18), material(STATION.panel, 0.5), STAR_TABLE.x, 0.81, STAR_TABLE.z));
  solid.add(box(0.45, 3.2, 4.8, dark, AIRLOCK.x + 0.2, 1.6, AIRLOCK.z)); // the bulkhead
  solid.add(box(0.16, 0.2, 5.0, material(STATION.panelLight, 0.5), AIRLOCK.x - 0.05, 0.1, AIRLOCK.z)); // its foot
  solid.add(box(0.14, BEACON_HEIGHT, 0.14, material(STATION.panelLight, 0.5), BEACON.x, BEACON_HEIGHT / 2, BEACON.z));
  solid.add(mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.1, 10), dark, BEACON.x, 0.05, BEACON.z));

  const portX = AIRLOCK.x - 0.04;
  const lit = [
    glow(STATION.cyan, new THREE.TorusGeometry(0.98, 0.07, 6, 28).rotateX(Math.PI / 2), STAR_TABLE.x, 0.86, STAR_TABLE.z),
    glow(0x155f70, new THREE.CylinderGeometry(0.75, 0.75, 0.04, 22).rotateZ(Math.PI / 2), portX, 1.9, AIRLOCK.z), // the port's glass
    glow(STATION.cyan, new THREE.TorusGeometry(0.8, 0.07, 6, 26).rotateY(Math.PI / 2), portX - 0.02, 1.9, AIRLOCK.z), // its rim
    glow(STATION.cyan, new THREE.BoxGeometry(0.05, 0.05, 4.6), portX, 3.05, AIRLOCK.z), // light along the top
    glow(STATION.cyan, new THREE.BoxGeometry(0.05, 0.05, 4.6), portX, 0.45, AIRLOCK.z),
  ];
  const group = new THREE.Group();
  group.add(mergeStatic(solid), glowMesh(lit, null));
  const globe = holoGlobe();
  group.add(globe);

  let petition = false;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  return {
    group,
    ambient: {
      update: (dt) => { if (!petition && !reducedMotion.matches) globe.rotation.y += dt * 0.35; },
      settle: (value) => { petition = value; },
    },
  };
}
