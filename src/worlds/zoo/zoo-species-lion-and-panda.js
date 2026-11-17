// Lion (golden, with a great mane and a tufted tail) and panda (round, white, black limbs).
// Two-legged cartoon bodies; the shared humanoid pose maths drives them (zoo-animal-body-factory.js).
import { blob, pair, tube } from './zoo-animal-parts.js';

export const LION = {
  id: 'lion', scale: 1.12,
  fur: 0xe0ab4a, belly: 0xf1d08e, limb: 0xd89d3c, paw: 0xc98c2e,
  head: { y: 1.1, r: 0.22 },
  decorate(add) {
    add(blob(0x8a4b22, [0.37, 0.37, 0.26], 0, 1.09, -0.07)); // mane, round the face
    add(blob(0x7a3f1c, [0.3, 0.1, 0.2], 0, 0.88, -0.04)); // mane running down the chest
    pair((side) => add(blob(0xe0ab4a, [0.085, 0.085, 0.05], side * 0.2, 1.4, -0.02))); // ears above the mane
    add(tube(0xe0ab4a, [[0, 0.5, -0.22], [0, 0.4, -0.46], [0.12, 0.46, -0.64], [0.2, 0.66, -0.66]], 0.035, 0x7a3f1c));
  },
};

export const PANDA = {
  id: 'panda', scale: 1.12,
  fur: 0xf4f1ea, belly: null, limb: 0x23262b, paw: 0x23262b,
  body: { y: 0.64, rx: 0.3, ry: 0.3, rz: 0.26 },
  head: { y: 1.1, r: 0.25, sx: 1.08 },
  decorate(add) {
    pair((side) => add(blob(0x23262b, [0.09, 0.09, 0.05], side * 0.2, 1.32, -0.02))); // round black ears
    add(blob(0x23262b, [0.33, 0.1, 0.24], 0, 0.88, 0)); // black band over the shoulders
    add(blob(0xf4f1ea, [0.07, 0.07, 0.07], 0, 0.5, -0.27)); // tail
  },
};
