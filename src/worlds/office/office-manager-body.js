// The manager (the ruler): navy blazer over a white shirt and teal tie, a lanyard with a badge,
// silver at the temples. Sits in the glass office's chair, strolls out to the coffee machine,
// the window wall and the plant corner, and points a hand at an employee to send a paper plane.
// Movement lives in scene/ruler-figure-motion.js; this file eases his body.
//   seated   -> hands on the armrests        standing -> hands in front
//   gazing   -> hands behind the back, head turning slowly       walking -> legs and arms swing
import { buildPerson, disposeFigure, HIP, SEATED_DROP, slab } from './office-person-parts.js';
import { OFFICE } from './office-palette.js';

const ARMS = { seated: -0.75, standing: -0.5, gazing: 0.5, walking: -0.2 };
const POINT_ARM = -2.3; // right arm raised towards an employee
const SIT = 1.45; // thigh forward / shin down, as for the employees

/** @returns {import('../world-pack-contract.js').RulerBody} */
export function buildOfficeManagerBody() {
  const { torso, arms, legs, finish } = buildPerson({
    top: 0x2f3b52, bottom: 0x2a3140, hair: 0xb9b4aa, shoe: 0x1c1d20,
    extras: (body) => {
      body.add(slab(0xf3f1ec, 0.1, 0.26, 0.012, 0, HIP + 0.27, 0.134)); // shirt front
      body.add(slab(OFFICE.teal, 0.032, 0.2, 0.012, 0, HIP + 0.24, 0.14)); // tie
      for (const side of [-1, 1]) { // lanyard: a V of teal strap to a white badge
        const strap = slab(OFFICE.teal, 0.016, 0.22, 0.01, side * 0.045, HIP + 0.27, 0.142);
        strap.rotation.z = side * -0.3;
        body.add(strap);
      }
      body.add(slab(0xf3f1ec, 0.06, 0.08, 0.012, 0, HIP + 0.1, 0.15)); // badge
    },
  });
  torso.position.y = SEATED_DROP;
  arms.forEach((arm) => { arm.rotation.x = ARMS.seated; });
  legs.forEach(({ hip, knee }) => { hip.rotation.x = -SIT; knee.rotation.x = SIT; });
  finish();

  return {
    root: torso,
    scale: 1.25,
    setPose() {}, // the pose arrives again through animate()

    animate({ pose, moving, running, pointing, time, ease, still, bob }) {
      const sitting = pose === 'seated';
      torso.position.y += ((sitting ? SEATED_DROP : 0) + bob - torso.position.y) * ease;
      torso.rotation.x += ((moving ? (running ? 0.16 : 0.05) : 0) - torso.rotation.x) * ease;
      torso.rotation.y += ((pose === 'gazing' && !still ? Math.sin(time * 0.5) * 0.35 : 0) - torso.rotation.y) * ease;
      legs.forEach(({ hip, knee }, i) => {
        const swing = moving ? Math.sin(time * (running ? 13 : 8) + i * Math.PI) : 0;
        hip.rotation.x += ((sitting ? -SIT : swing * 0.55) - hip.rotation.x) * ease;
        knee.rotation.x += ((sitting ? SIT : Math.max(0, -swing) * 0.7) - knee.rotation.x) * ease;
      });
      arms.forEach((arm, i) => {
        let goal = ARMS[pose];
        if (moving) goal += Math.sin(time * (running ? 13 : 8) + i * Math.PI) * (running ? 0.6 : 0.3);
        if (pointing && i === 1) goal = POINT_ARM;
        arm.rotation.x += (goal - arm.rotation.x) * ease;
      });
    },

    /** World position of the right hand, where a paper plane leaves from. */
    handPosition: (out) => arms[1].localToWorld(out.set(0, -0.28, 0)),

    dispose: () => disposeFigure(torso),
  };
}
