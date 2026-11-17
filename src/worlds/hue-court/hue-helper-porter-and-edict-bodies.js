// The Huế court's guard-built bodies and its flying order: the soldier (a sub-agent, with a
// spear), the desk porter (the same guard without a spear, arms out to carry) and the edict
// scroll. Their timing and travel live in scene/soldier-figure.js, scene/desk-porter-crew.js and
// scene/royal-edict-flight.js.
import * as THREE from 'three';
import { PALETTE } from '../../scene/court-layout.js';
import { buildGuardBody } from './hue-guard-body.js';

/** @returns {import('../world-pack-contract.js').HelperBody} */
export function buildHueHelperBody() {
  const { body, spear } = buildGuardBody();
  return {
    root: body,
    // Drill: the spear tilts forward on a thrust; the body bobs when walking and bows when leaving.
    animate({ thrust, bow, bob, ease }) {
      spear.rotation.x += (thrust - spear.rotation.x) * ease;
      body.position.y += (bob - body.position.y) * ease;
      body.rotation.x += (bow + thrust * 0.12 - body.rotation.x) * ease;
    },
    dispose() { body.traverse((child) => { if (child.isMesh) child.geometry.dispose(); }); },
  };
}

/** @returns {import('../world-pack-contract.js').PorterBody} */
export function buildHuePorterBody() {
  const { body } = buildGuardBody({ spear: false, armsForward: true });
  return {
    root: body,
    animate({ bow, bob }) {
      body.rotation.x = bow;
      body.position.y = bob;
    },
  };
}

let scrollGeometry;
let scrollMaterial;
/** The glaze scroll that flies from the king to the scribe (geometry and material are shared). */
export function buildHueEdictProjectile() {
  scrollGeometry ??= new THREE.CylinderGeometry(0.07, 0.07, 0.5, 10).rotateZ(Math.PI / 2);
  scrollMaterial ??= new THREE.MeshStandardMaterial({ color: PALETTE.glaze, roughness: 0.5, emissive: PALETTE.glaze, emissiveIntensity: 0.25 });
  return new THREE.Mesh(scrollGeometry, scrollMaterial);
}
