// The body of a palace guard, shared by the soldiers (sub-agents, with a spear) and the
// porters who carry desks (without): nón dấu, red tunic with a round emblem, yellow sash,
// black trousers and boots. Baked to a few meshes (figure-toon-style.js).
import * as THREE from 'three';
import { PALETTE } from '../../scene/court-layout.js';
import { belt, boots, guardEmblem, guardHat, sleevedArm } from '../../scene/court-costume-parts.js';
import { bakeRigid, faceMaterial, part, toon } from '../../scene/figure-toon-style.js';

const TROUSER_BLACK = 0x231d19;

/**
 * @param {{spear?: boolean, armsForward?: boolean}} options  armsForward: both arms held out, as when carrying
 * @returns {{body: THREE.Group, spear: THREE.Group | null}}
 */
export function buildGuardBody({ spear: withSpear = true, armsForward = false } = {}) {
  const tunic = toon(PALETTE.lacquer);
  const body = new THREE.Group();
  for (const side of [-1, 1]) body.add(part(new THREE.CylinderGeometry(0.055, 0.05, 0.32, 8), toon(TROUSER_BLACK), side * 0.08, 0.16, 0));
  body.add(boots(0.08));
  body.add(part(new THREE.CylinderGeometry(0.12, 0.23, 0.44, 12), tunic, 0, 0.52, 0));
  body.add(belt(0.19, 0.42, PALETTE.glaze)); // yellow sash
  const emblem = guardEmblem();
  emblem.position.set(0, 0.6, 0.172);
  emblem.rotation.x = -0.25; // lies on the tunic's taper
  body.add(emblem);
  body.add(part(new THREE.SphereGeometry(0.11, 14, 10), faceMaterial({ skin: PALETTE.skin }), 0, 0.84, 0));
  const hat = guardHat();
  hat.position.y = 0.91;
  body.add(hat);
  // Left arm hangs (or reaches forward to carry); the right holds the spear forward.
  const left = sleevedArm(tunic, { length: 0.26, cuff: 0.055 });
  left.position.set(-0.16, 0.7, 0);
  left.rotation.x = armsForward ? -0.9 : 0;
  const right = sleevedArm(tunic, { length: 0.22, cuff: 0.055 });
  right.position.set(0.16, 0.7, 0.02);
  right.rotation.x = armsForward ? -0.9 : -0.45;
  body.add(left, right);

  let spear = null;
  if (withSpear) {
    // Pivots at the hand, so a thrust tilts it forward.
    spear = new THREE.Group();
    spear.position.set(0.19, 0.55, 0.06);
    spear.add(part(new THREE.CylinderGeometry(0.016, 0.016, 1.55, 5), toon(PALETTE.wood), 0, 0.38, 0));
    spear.add(part(new THREE.ConeGeometry(0.04, 0.16, 5), toon(PALETTE.bronze), 0, 1.23, 0));
    spear.add(part(new THREE.ConeGeometry(0.05, 0.1, 6), tunic, 0, 1.1, 0)); // red tassel under the blade
    body.add(spear);
    bakeRigid(spear);
  }
  bakeRigid(body, spear ? [spear] : []); // the whole guard: body, face and spear are a few draws
  return { body, spear };
}
