// A zookeeper: khaki shirt, blue overalls, boots and a hat. One builder serves the head
// zookeeper (safari hat, zoo-head-zookeeper-body.js) and the two porters (caps) who carry the
// trough. Legs hang from the waist in two segments so the keeper can sit on a chair, and parts
// are baked to a few meshes (figure-toon-style.js).
import * as THREE from 'three';
import { bakeRigid, faceMaterial, part, toon } from '../../scene/figure-toon-style.js';
import { ZOO } from './zoo-palette.js';
import { blob, pair, stub } from './zoo-animal-parts.js';

export const STANDING_WAIST = 0.4; // waist height above the feet when standing
export const SEATED_WAIST = 0.2; // the same, sitting on a chair: thighs forward, shins down
const THIGH = 0.2;

function safariHat() {
  const hat = new THREE.Group();
  hat.add(stub(0xd9c28a, 0.2, 0.21, 0.025, 0, 0.0, 0));
  hat.add(stub(0xd9c28a, 0.1, 0.125, 0.11, 0, 0.065, 0));
  hat.add(stub(0x6b4a2a, 0.128, 0.128, 0.03, 0, 0.03, 0)); // band
  return hat;
}

function cap() {
  const hat = new THREE.Group();
  hat.add(blob(ZOO.overalls, [0.125, 0.09, 0.125], 0, 0.02, 0));
  hat.add(blob(0x2c4f86, [0.1, 0.012, 0.1], 0, -0.01, 0.12)); // peak
  return hat;
}

/**
 * @param {{hat: 'safari'|'cap', armsForward?: boolean, bakedLegs?: boolean}} options
 * @returns {{root: THREE.Group, torso: THREE.Group, head: THREE.Group, arms: THREE.Group[], legs: {hip: THREE.Group, knee: THREE.Group}[]}}
 */
export function buildKeeperParts({ hat, armsForward = false, bakedLegs = false }) {
  const torso = new THREE.Group();
  torso.add(stub(ZOO.khaki, 0.13, 0.155, 0.42, 0, 0.21, 0));
  torso.add(stub(ZOO.overalls, 0.158, 0.158, 0.2, 0, 0.08, 0));
  torso.add(part(new THREE.BoxGeometry(0.2, 0.22, 0.03), toon(ZOO.overalls), 0, 0.2, 0.135)); // bib
  pair((side) => torso.add(part(new THREE.BoxGeometry(0.035, 0.2, 0.025), toon(ZOO.overalls), side * 0.075, 0.33, 0.12)));

  const head = new THREE.Group();
  head.position.y = 0.55;
  head.add(part(new THREE.SphereGeometry(0.115, 16, 12), faceMaterial({ skin: ZOO.skin })));
  const hatMesh = hat === 'safari' ? safariHat() : cap();
  hatMesh.position.y = 0.09;
  head.add(hatMesh);
  bakeRigid(head);
  torso.add(head);

  const legs = pair((side) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.075, 0, 0);
    hip.add(stub(ZOO.overalls, 0.065, 0.06, THIGH, 0, -THIGH / 2, 0));
    const knee = new THREE.Group();
    knee.position.y = -THIGH;
    knee.add(stub(ZOO.overalls, 0.06, 0.055, 0.15, 0, -0.075, 0));
    knee.add(part(new THREE.BoxGeometry(0.09, 0.07, 0.15), toon(0x4a3426), 0, -0.165, 0.025)); // boot
    hip.add(knee);
    torso.add(hip);
    return { hip, knee };
  });
  const arms = pair((side) => {
    const arm = new THREE.Group();
    arm.position.set(side * 0.18, 0.4, 0);
    arm.add(stub(ZOO.khaki, 0.05, 0.045, 0.26, 0, -0.13, 0));
    arm.add(blob(ZOO.skin, [0.04, 0.04, 0.04], 0, -0.28, 0));
    arm.rotation.x = armsForward ? -0.9 : 0;
    torso.add(arm);
    return arm;
  });
  arms.forEach((arm) => bakeRigid(arm));
  if (!bakedLegs) legs.forEach(({ hip, knee }) => { bakeRigid(knee); bakeRigid(hip, [knee]); });
  bakeRigid(torso, [head, ...arms, ...(bakedLegs ? [] : legs.map(({ hip }) => hip))]);
  torso.position.y = STANDING_WAIST;
  const root = new THREE.Group();
  root.add(torso);
  return { root, torso, head, arms, legs };
}

const dispose = (root) => root.traverse((child) => { if (child.isMesh) child.geometry.dispose(); });

/** Two of these carry the trough, arms out in front. @returns {import('../world-pack-contract.js').PorterBody} */
export function buildZooPorterBody() {
  const { root, torso } = buildKeeperParts({ hat: 'cap', armsForward: true, bakedLegs: true });
  return {
    root,
    animate({ bow, bob }) {
      torso.rotation.x = bow;
      root.position.y = bob;
    },
    dispose: () => dispose(root),
  };
}
export { dispose as disposeKeeper };
