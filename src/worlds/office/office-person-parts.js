// One person, dressed from a style: shirt, trousers, shoes, hair. The employee, the manager,
// the contractor and the movers all start from this and add their own touches (blazer, hood,
// overalls, cap) through `extras`. Origin = the feet, +z = the way the person faces. Parts are
// toon-shaded in flat colours (scene/figure-toon-style.js) and baked into very few meshes:
// the torso with its hair and clothes is one mesh, each arm one, each leg two (thigh, shin
// so a person can sit), the face its own textured mesh.
import * as THREE from 'three';
import { bakeRigid, faceMaterial, part, toon } from '../../scene/figure-toon-style.js';
import { OFFICE } from './office-palette.js';

export const HIP = 0.4; // standing hip height above the feet (local units)
export const SEATED_DROP = -0.13; // how far the whole body drops when sitting on a chair
export const SHOULDER = 0.78;
export const HEAD_TOP = 1.07; // top of the hair
const THIGH = 0.2;

const unitSphere = new THREE.SphereGeometry(1, 12, 9);
/** A toon box centred at (x, y, z). */
export const slab = (color, w, h, d, x = 0, y = 0, z = 0) => part(new THREE.BoxGeometry(w, h, d), toon(color), x, y, z);
/** An ellipsoid with radii (rx, ry, rz). */
export const blob = (color, [rx, ry, rz], x = 0, y = 0, z = 0) => part(unitSphere.clone().scale(rx, ry, rz), toon(color), x, y, z);
/** A (tapered) cylinder. */
export const stub = (color, rTop, rBottom, height, x = 0, y = 0, z = 0) => part(new THREE.CylinderGeometry(rTop, rBottom, height, 8), toon(color), x, y, z);

/**
 * @param {{top: number, bottom: number, hair: number, shoe?: number, skin?: number, extras?: (torso: THREE.Group) => void}} style
 * @param {{bakedLegs?: boolean}} [options]  bakedLegs: the legs stand straight inside the torso mesh (movers, contractors)
 * @returns {{torso: THREE.Group, arms: THREE.Group[], legs: {hip: THREE.Group, knee: THREE.Group}[], finish: (props?: THREE.Object3D[]) => void}}
 */
export function buildPerson({ top, bottom, hair, shoe = 0x2d2f33, skin = OFFICE.skin, extras }, { bakedLegs = false } = {}) {
  const torso = new THREE.Group();
  torso.add(stub(bottom, 0.15, 0.155, 0.16, 0, HIP + 0.04, 0)); // pelvis
  torso.add(stub(top, 0.125, 0.15, 0.42, 0, HIP + 0.21, 0)); // shirt
  torso.add(part(new THREE.SphereGeometry(0.115, 16, 12), faceMaterial({ skin }), 0, 0.94, 0)); // head, painted face
  torso.add(blob(hair, [0.122, 0.085, 0.125], 0, 1.0, -0.02)); // hair on top and behind the face
  extras?.(torso);

  const legs = [-1, 1].map((side) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.075, HIP, 0);
    hip.add(stub(bottom, 0.065, 0.06, THIGH, 0, -THIGH / 2, 0));
    const knee = new THREE.Group();
    knee.position.y = -THIGH;
    knee.add(stub(bottom, 0.06, 0.055, 0.15, 0, -0.075, 0));
    knee.add(slab(shoe, 0.09, 0.07, 0.15, 0, -0.165, 0.025));
    hip.add(knee);
    torso.add(hip);
    return { hip, knee };
  });
  const arms = [-1, 1].map((side) => {
    const arm = new THREE.Group();
    arm.position.set(side * 0.18, SHOULDER, 0);
    arm.add(stub(top, 0.05, 0.045, 0.26, 0, -0.13, 0));
    arm.add(blob(skin, [0.04, 0.04, 0.04], 0, -0.28, 0));
    torso.add(arm);
    bakeRigid(arm);
    return arm;
  });
  if (!bakedLegs) legs.forEach(({ hip, knee }) => { bakeRigid(knee); bakeRigid(hip, [knee]); });
  /** Bakes the body; call after adding props (`props` stay separate meshes). */
  const finish = (props = []) => bakeRigid(torso, [...arms, ...props, ...(bakedLegs ? [] : legs.map(({ hip }) => hip))]);
  return { torso, arms, legs, finish };
}

/** Frees this figure's own geometry (materials are the shared toon / baked ones). */
export const disposeFigure = (root) => root.traverse((child) => { if (child.isMesh) child.geometry.dispose(); });
