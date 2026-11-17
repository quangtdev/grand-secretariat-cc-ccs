// What an animal holds: the petition sign (lifted again and again while it waits for the
// keeper) and the medal it wears when it shows off a finished job. Each is baked to one mesh.
import * as THREE from 'three';
import { bakeRigid, part, toon } from '../../scene/figure-toon-style.js';
import { ZOO } from './zoo-palette.js';
import { pair, stub } from './zoo-animal-parts.js';

const BOARD = { width: 0.74, height: 0.36, thickness: 0.045 };

/**
 * A wooden sign in glaze yellow with a dark "!" on both faces, held on two posts that reach down to the raised paws.
 * Group origin = where the board's bottom edge rests above the head; `postDrop` is how far the paws are below it.
 */
export function buildPetitionSign({ postDrop, shoulderX }) {
  const sign = new THREE.Group();
  const dark = toon(ZOO.woodDark);
  const { width, height, thickness } = BOARD;
  sign.add(part(new THREE.BoxGeometry(width + 0.06, height + 0.06, thickness * 0.7), dark, 0, height / 2, 0));
  sign.add(part(new THREE.BoxGeometry(width, height, thickness), toon(ZOO.petitionSign), 0, height / 2, 0));
  for (const face of [-1, 1]) { // the same "!" on both faces: the sign reads from the keeper's side and from the camera's
    sign.add(part(new THREE.BoxGeometry(0.07, 0.16, 0.02), dark, 0, height / 2 + 0.05, face * thickness * 0.55));
    sign.add(part(new THREE.BoxGeometry(0.07, 0.06, 0.02), dark, 0, height / 2 - 0.1, face * thickness * 0.55));
  }
  const length = postDrop + 0.14; // reaches into the paws, so the sign can bob without parting from them
  pair((side) => sign.add(stub(ZOO.wood, 0.022, 0.022, length, side * shoulderX, -length / 2 + 0.02, 0)));
  bakeRigid(sign);
  return sign;
}

/** A gold medal on a jade ribbon hanging in a V from the neck, on the chest and again on the back (the camera sees backs). Origin: the base of the neck. */
export function buildMedal(depth) {
  const medal = new THREE.Group();
  const ribbon = toon(ZOO.reportRibbon);
  const gold = toon(ZOO.medalGold);
  for (const face of [-1, 1]) {
    pair((side) => {
      const strap = part(new THREE.BoxGeometry(0.075, 0.3, 0.02), ribbon, side * 0.075, -0.13, face * depth);
      strap.rotation.z = side * 0.42;
      medal.add(strap);
    });
    const disc = part(new THREE.CylinderGeometry(0.09, 0.09, 0.03, 14), gold, 0, -0.3, face * (depth + 0.02));
    disc.rotation.x = Math.PI / 2;
    medal.add(disc);
  }
  bakeRigid(medal);
  return medal;
}

export const SIGN_HEIGHT = BOARD.height;
