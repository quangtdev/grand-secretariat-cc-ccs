// The contractor (a sub-agent): grey jacket, khaki trousers, a visitor lanyard, a laptop held at
// the chest and typed on in the air while the master works. And the two movers (the desk
// porters): orange overalls over a white tee, a cap, hands out in front to carry the desk.
// Their timing and travel live in scene/soldier-figure.js and scene/desk-porter-crew.js.
import { buildLaptop } from './office-employee-held-props.js';
import { OFFICE } from './office-palette.js';
import { blob, buildPerson, disposeFigure, HEAD_TOP, HIP, slab } from './office-person-parts.js';

const TYPE_ARMS = -1.1;

/** @returns {import('../world-pack-contract.js').HelperBody} */
export function buildOfficeContractorBody() {
  const { torso, arms, finish } = buildPerson({
    top: 0x8f98a3, bottom: 0xb5a37a, hair: 0x3a2a30,
    extras: (body) => {
      body.add(slab(OFFICE.teal, 0.03, 0.26, 0.012, 0.05, HIP + 0.26, 0.14)); // lanyard
      body.add(slab(0xf3f1ec, 0.07, 0.09, 0.012, 0.05, HIP + 0.12, 0.15)); // visitor badge
    },
  }, { bakedLegs: true });
  const laptop = buildLaptop({ glow: OFFICE.screen, backGlow: 0xc5ccd2, width: 0.3 });
  laptop.position.set(0, 0.62, 0.36);
  laptop.rotation.y = Math.PI; // screen towards the contractor, the lid's back towards the room
  torso.add(laptop);
  finish([laptop]);
  return {
    root: torso,
    // Types in the air while the master works (thrust pulses 0..0.9); bobs when walking; bows when leaving.
    animate({ thrust, bow, bob, ease }) {
      const clock = performance.now() / 1000;
      torso.position.y += (bob - torso.position.y) * ease;
      torso.rotation.x += (bow + thrust * 0.08 - torso.rotation.x) * ease;
      arms.forEach((arm, i) => {
        const goal = TYPE_ARMS + Math.sin(clock * 16 + i * 2.4) * 0.07 * thrust;
        arm.rotation.x += (goal - arm.rotation.x) * ease;
      });
    },
    dispose: () => disposeFigure(torso),
  };
}

/** Two of these carry the desk. @returns {import('../world-pack-contract.js').PorterBody & {dispose: () => void}} */
export function buildOfficeMoverBody() {
  const orange = 0xd9742f;
  const { torso, arms, finish } = buildPerson({
    top: 0xf3f1ec, bottom: orange, hair: 0x2a1d16, shoe: 0x4a3426,
    extras: (body) => {
      body.add(slab(orange, 0.2, 0.26, 0.02, 0, HIP + 0.19, 0.135)); // bib
      for (const side of [-1, 1]) body.add(slab(orange, 0.035, 0.3, 0.02, side * 0.07, HIP + 0.33, 0.12)); // straps
      body.add(blob(orange, [0.125, 0.07, 0.125], 0, HEAD_TOP - 0.03, 0)); // cap
      body.add(slab(orange, 0.12, 0.012, 0.09, 0, HEAD_TOP - 0.05, 0.13)); // peak
    },
  }, { bakedLegs: true });
  arms.forEach((arm) => { arm.rotation.x = -1.0; });
  finish();
  return {
    root: torso,
    animate({ bow, bob }) {
      torso.rotation.x = bow;
      torso.position.y = bob;
    },
    dispose: () => disposeFigure(torso),
  };
}
