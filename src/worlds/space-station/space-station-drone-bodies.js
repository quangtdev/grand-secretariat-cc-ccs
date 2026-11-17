// The station's two drones. The helper (a sub-agent) is a small hover drone with a lamp that stays
// behind its master's console: it bobs in the air, tilts into motion and, while the master works,
// circles in a small orbit. The cargo drone (porter) is a bigger flat one: two of them lift a console
// on tractor beams. Neither is humanoid, so both implement `animate` directly (no pose maths).
// Hover phases read the wall clock (the contract hands the helper no time); reduced motion is read live.
import * as THREE from 'three';
import { bakeRigid } from '../../scene/figure-toon-style.js';
import { STATION } from './space-station-palette.js';
import { blob, disposeGeometries, glow, glowMesh, slab, stub } from './space-station-shape-helpers.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const HELPER_SCALE = 1.35;
const HELPER_HOVER = 0.62;
const CARGO_HOVER = 1.15;
const seconds = () => performance.now() / 1000;

let beamMaterial;
let shadowMaterial;
/** Soft additive glow shared by every beam and every lamp pool (cached, so never disposed with a drone). */
function beam() {
  beamMaterial ??= new THREE.MeshBasicMaterial({ color: STATION.cyan, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  return beamMaterial;
}
function floorGlow() {
  shadowMaterial ??= new THREE.MeshBasicMaterial({ color: STATION.cyan, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false });
  return shadowMaterial;
}

/** The little round drone: pale shell, cyan ring, a lens in front, an antenna and a lamp underneath. */
function droneHull(radius) {
  const hull = new THREE.Group();
  hull.add(blob(STATION.white, [radius, radius * 0.7, radius], 0, 0, 0));
  hull.add(stub(STATION.panelLight, 0.012, 0.012, radius * 1.2, 0, radius * 0.95, 0, 5)); // antenna
  const trims = [
    glow(STATION.cyan, new THREE.TorusGeometry(radius * 1.02, radius * 0.1, 6, 20).rotateX(Math.PI / 2), 0, 0, 0), // equator ring
    glow(STATION.cyan, new THREE.SphereGeometry(1, 10, 8).scale(radius * 0.36, radius * 0.3, radius * 0.2), 0, radius * 0.1, radius * 0.88), // lens
    glow(0xffffff, new THREE.SphereGeometry(radius * 0.18, 8, 6), 0, radius * 1.6, 0), // antenna tip
    glow(0xbff6ff, new THREE.CylinderGeometry(radius * 0.3, radius * 0.4, radius * 0.1, 10), 0, -radius * 0.62, 0), // lamp
  ];
  hull.add(glowMesh(trims, hull));
  bakeRigid(hull);
  return hull;
}

/** @returns {import('../world-pack-contract.js').HelperBody} */
export function buildDroneHelperBody() {
  const root = new THREE.Group();
  const hover = droneHull(0.2);
  const spot = new THREE.Mesh(new THREE.CircleGeometry(0.34, 16).rotateX(-Math.PI / 2), floorGlow()); // the lamp's pool on the deck
  spot.position.y = 0.02;
  root.add(hover, spot);
  const phase = Math.random() * 6;
  return {
    root,
    scale: HELPER_SCALE,
    animate({ thrust, bow, bob, ease }) {
      const t = seconds() + phase;
      const still = reducedMotion.matches;
      const orbit = still ? 0 : thrust * 0.2;
      const lift = HELPER_HOVER + (still ? 0 : Math.sin(t * 2.2) * 0.04) + bob + thrust * 0.12;
      hover.position.y += (lift - hover.position.y) * ease;
      hover.position.x += (Math.sin(t * 6) * orbit - hover.position.x) * ease;
      hover.position.z += (Math.cos(t * 6) * orbit - hover.position.z) * ease;
      hover.rotation.x += (bow + thrust * 0.3 - hover.rotation.x) * ease; // tilts into a bow or a drill
      hover.rotation.z += ((still ? 0 : Math.sin(t * 1.7) * 0.07) - hover.rotation.z) * ease;
      hover.rotation.y += ((still ? 0 : thrust * Math.sin(t * 6) * 0.4) - hover.rotation.y) * ease;
    },
    dispose() { disposeGeometries(root); },
  };
}

/** @returns {import('../world-pack-contract.js').PorterBody} */
export function buildCargoDroneBody() {
  const root = new THREE.Group();
  const hover = new THREE.Group();
  hover.position.y = CARGO_HOVER;
  hover.add(stub(STATION.panelLight, 0.3, 0.34, 0.14, 0, 0, 0, 6));
  hover.add(slab(STATION.panelDark, 0.34, 0.07, 0.22, 0, 0.1, 0));
  const trims = [
    glow(STATION.cyan, new THREE.TorusGeometry(0.33, 0.025, 6, 6).rotateX(Math.PI / 2), 0, -0.02, 0),
    glow(0xbff6ff, new THREE.BoxGeometry(0.1, 0.03, 0.04), 0, 0.15, 0.1), // a working-light bar (never amber: amber means a petition)
    glow(0xbff6ff, new THREE.CylinderGeometry(0.16, 0.2, 0.04, 10), 0, -0.1, 0), // emitter
  ];
  hover.add(glowMesh(trims, hover));
  bakeRigid(hover);
  // The tractor beam: a cone of light from the emitter down to the deck, a pool where it lands.
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.42, CARGO_HOVER - 0.1, 14, 1, true).translate(0, -(CARGO_HOVER - 0.1) / 2, 0), beam());
  cone.position.y = -0.1;
  hover.add(cone);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(0.46, 16).rotateX(-Math.PI / 2), floorGlow());
  pool.position.y = 0.02;
  root.add(hover, pool);
  const phase = Math.random() * 6;
  return {
    root,
    animate({ bow, bob }) {
      hover.position.y = CARGO_HOVER + bob + (reducedMotion.matches ? 0 : Math.sin(seconds() * 3 + phase) * 0.025);
      hover.rotation.x = bow * 0.6;
      cone.scale.y = hover.position.y / CARGO_HOVER; // the beam follows the hover
    },
    dispose() { disposeGeometries(root); },
  };
}
