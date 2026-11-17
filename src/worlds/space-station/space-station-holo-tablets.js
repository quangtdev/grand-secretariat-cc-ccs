// What a crew member holds up: the amber holo-tablet of a petition (a bold "!", lifted again and
// again until it is answered) and the green data pad of a finished job (a check mark). Each is ONE
// unlit mesh (the faces are vertex colours) with the same mark on both faces, so it reads from the
// court and from the camera. Origin: the middle of the bottom edge. Status colours are the shell's.
import * as THREE from 'three';
import { STATION } from './space-station-palette.js';
import { glow, glowMesh } from './space-station-shape-helpers.js';

const WIDTH = 0.56;
const HEIGHT = 0.4;
const THICKNESS = 0.035;
const DARK = 0x2a1c08;
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

/** Frame, face and a mark drawn by `markParts(faceSign)` on each face. */
function tablet(frameColour, faceColour, markParts) {
  const parts = [
    glow(frameColour, box(WIDTH + 0.06, HEIGHT + 0.06, THICKNESS * 0.7), 0, HEIGHT / 2, 0),
    glow(faceColour, box(WIDTH, HEIGHT, THICKNESS), 0, HEIGHT / 2, 0),
  ];
  for (const face of [-1, 1]) parts.push(...markParts(face * (THICKNESS / 2 + 0.01)));
  return glowMesh(parts);
}

/** Amber tablet with a dark "!" (glaze: the petition colour). */
export function buildPetitionTablet() {
  return tablet(STATION.petitionHoloDark, STATION.petitionHolo, (z) => [
    glow(DARK, box(0.07, 0.17, 0.02), 0, HEIGHT / 2 + 0.05, z),
    glow(DARK, box(0.07, 0.06, 0.02), 0, HEIGHT / 2 - 0.1, z),
  ]);
}

/** Green data pad with a dark check mark (jade: the report colour). */
export function buildDataPad() {
  return tablet(0x4f8f76, STATION.reportPad, (z) => {
    const short = glow(DARK, box(0.05, 0.13, 0.02), -0.08, HEIGHT / 2 - 0.03, z);
    short.rotation.z = 0.8;
    const long = glow(DARK, box(0.05, 0.27, 0.02), 0.05, HEIGHT / 2 + 0.02, z);
    long.rotation.z = -0.7;
    return [short, long];
  });
}

export const TABLET_HEIGHT = HEIGHT;
