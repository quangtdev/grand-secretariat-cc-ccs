// Penguin (tuxedo, orange beak and feet, flippers) and monkey (brown, pale mask, big ears,
// long curling tail). Two-legged cartoon bodies on the shared humanoid pose maths.
import { blob, pair, spike, tube } from './zoo-animal-parts.js';

export const PENGUIN = {
  id: 'penguin', scale: 1.12,
  fur: 0x2a3040, belly: 0xf6f1e4, limb: 0x2a3040, paw: 0xf29a2e, legColour: 0xf29a2e,
  hip: 0.26,
  body: { y: 0.62, rx: 0.27, ry: 0.4, rz: 0.25 },
  shoulder: 0.84,
  head: { y: 1.12, r: 0.21 },
  flippers: true,
  decorate(add) {
    add(spike(0xf29a2e, 0.055, 0.15, 0, 1.07, 0.23, [Math.PI / 2, 0])); // beak
    add(blob(0x2a3040, [0.1, 0.05, 0.14], 0, 0.36, -0.22)).rotation.x = 0.5; // short tail
  },
};

export const MONKEY = {
  id: 'monkey', scale: 1.02,
  fur: 0x8b5a34, belly: 0xe2bb8c, limb: 0x8b5a34, paw: 0xe2bb8c,
  head: { y: 1.1, r: 0.23 },
  decorate(add) {
    pair((side) => {
      add(blob(0x8b5a34, [0.1, 0.1, 0.045], side * 0.25, 1.12, -0.02)); // big round ears
      add(blob(0xe2bb8c, [0.06, 0.06, 0.04], side * 0.25, 1.12, 0.01));
    });
    add(tube(0x8b5a34, [[0, 0.44, -0.22], [0, 0.28, -0.5], [0.14, 0.24, -0.82], [0.34, 0.46, -0.88], [0.34, 0.78, -0.72]], 0.04, 0x6e4426));
  },
};
