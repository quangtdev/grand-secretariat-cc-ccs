// Elephant and giraffe: the two big silhouettes. Both stand on two legs like every zoo animal
// (the shared humanoid pose maths drives them); only the body is theirs. See zoo-animal-body-factory.js
// for the fields of a species. The giraffe's neck is short and capped, so it never hides its
// neighbours or its chip; its chip and sign sit higher than the others' by its own `head`.
import { blob, pair, spike, stub, tube } from './zoo-animal-parts.js';

const GIRAFFE_SPOTS = [
  [-0.2, 0.74, 0.18, 0.07], [0.12, 0.62, 0.23, 0.08], [0.22, 0.8, 0.12, 0.06], [-0.1, 0.5, 0.24, 0.06],
  [0.2, 0.5, 0.2, 0.06], [-0.24, 0.6, 0.1, 0.06], [0.04, 0.9, 0.17, 0.05],
  [0.07, 1.18, 0.1, 0.045], [-0.07, 1.34, 0.09, 0.04], [0.08, 1.5, 0.08, 0.04], [-0.06, 1.05, 0.12, 0.045],
];

export const ELEPHANT = {
  id: 'elephant', scale: 1.2,
  fur: 0x9aa5b1, belly: 0xb9c2cc, limb: 0x939eaa, paw: 0x7f8a96,
  head: { y: 1.1, r: 0.26 },
  decorate(add) {
    pair((side) => {
      add(blob(0x9aa5b1, [0.22, 0.24, 0.035], side * 0.3, 1.14, -0.06)).rotation.y = -side * 0.5; // big ear
      add(blob(0xe8a9a5, [0.15, 0.17, 0.035], side * 0.305, 1.14, -0.04)).rotation.y = -side * 0.5;
      add(spike(0xf3ead2, 0.04, 0.17, side * 0.1, 0.93, 0.26, [Math.PI / 2 + 0.5, side * -0.3])); // tusk
    });
    add(tube(0x9aa5b1, [[0, 1.04, 0.2], [0, 0.94, 0.42], [0, 0.78, 0.52], [0, 0.66, 0.5], [0, 0.6, 0.44]], 0.068, 0x8c97a3));
    add(blob(0x9aa5b1, [0.05, 0.05, 0.05], 0, 0.5, -0.25)); // tail
  },
};

export const GIRAFFE = {
  id: 'giraffe', scale: 0.98,
  fur: 0xe8b64f, belly: 0xf3dc9a, limb: 0xe8b64f, paw: 0x7a4a2a,
  head: { y: 1.62, r: 0.19, sz: 1.2 },
  decorate(add) {
    add(stub(0xe8b64f, 0.1, 0.14, 0.78, 0, 1.2, 0.02, [0.12, 0])); // the neck
    for (const [x, y, z, r] of GIRAFFE_SPOTS) add(blob(0xb8793a, [r, r * 0.85, r * 0.45], x, y, z));
    pair((side) => {
      add(blob(0xe8b64f, [0.1, 0.045, 0.05], side * 0.21, 1.68, -0.04)).rotation.z = side * 0.4; // ear
      add(stub(0xe8b64f, 0.022, 0.026, 0.15, side * 0.07, 1.84, -0.02));
      add(blob(0x6a3f22, [0.045, 0.045, 0.045], side * 0.07, 1.93, -0.02)); // ossicone knob
    });
    add(tube(0xe8b64f, [[0, 0.5, -0.24], [0, 0.4, -0.36], [0, 0.22, -0.4]], 0.025, 0x6a3f22)); // thin tail with a tuft
  },
};
