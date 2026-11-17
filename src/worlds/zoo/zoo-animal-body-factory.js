// An animal as a figure: one factory for every species and for cubs. The body is upright on two
// legs, so the shared humanoid pose maths drives it (scene/humanoid-pose-animator.js): walks, sits
// at its trough, kneels holding the sign, stands with a medal, bows. A species supplies only
// proportions, colours and extras (ears, trunk, mane, tail); see zoo-species-*.js.
//   Species fields: id, scale, fur, belly (colour | null), limb, paw, [legColour], [hip], [body {y rx ry rz}],
//   [shoulder], [head {y r sx sy sz}], [flippers], decorate(add).
// Draw calls: one baked body, one head (painted face), two arms, two legs, sign, medal = 8, as the Huế scribe.
import * as THREE from 'three';
import { hashIndex } from '../../scene/agent-figure-motion.js';
import { bakeRigid, part } from '../../scene/figure-toon-style.js';
import { easeArms, easeTorso, POSES } from '../../scene/humanoid-pose-animator.js';
import { animalFaceMaterial } from './zoo-animal-faces.js';
import { blob, pair, stub } from './zoo-animal-parts.js';
import { buildMedal, buildPetitionSign, SIGN_HEIGHT } from './zoo-animal-props.js';
import { ELEPHANT, GIRAFFE } from './zoo-species-elephant-and-giraffe.js';
import { LION, PANDA } from './zoo-species-lion-and-panda.js';
import { MONKEY, PENGUIN } from './zoo-species-penguin-and-monkey.js';

const SPECIES = [ELEPHANT, GIRAFFE, LION, PANDA, PENGUIN, MONKEY];
const DEFAULTS = { hip: 0.38, shoulder: 0.84, shoulderX: 0.3, armLength: 0.3 };
const BODY = { y: 0.64, rx: 0.27, ry: 0.3, rz: 0.24 };
const HEAD = { y: 1.1, r: 0.24, sx: 1, sy: 1, sz: 1 };
const LEGS = { seated: -1.5, kneeling: 1.25, standing: 0 }; // hip angle: legs forward on the ground, folded back, straight
const SIGN_CLEARANCE = 0.1; // between the head's top and the sign's bottom edge
const SIGN_SHEET_OFFSET = 0.12;

/** The species a session is (stable: hash of its id), and the same for its cubs through the master's id. */
const speciesOf = (id) => SPECIES[hashIndex(id, SPECIES.length)];

function resolve(spec) {
  return { ...DEFAULTS, ...spec, body: { ...BODY, ...spec.body }, head: { ...HEAD, ...spec.head } };
}

/** Head, body, legs and arms of one animal. `bakedLegs`: legs stay in the body (a cub does not walk its legs). */
function assemble(k, { bakedLegs }) {
  const torso = new THREE.Group();
  const add = (mesh) => { torso.add(mesh); return mesh; };
  const { body, head } = k;
  add(blob(k.fur, [body.rx, body.ry, body.rz], 0, body.y, 0));
  if (k.belly) add(blob(k.belly, [body.rx * 0.78, body.ry * 0.74, body.rz * 0.5], 0, body.y - 0.03, body.rz * 0.66));
  const face = new THREE.SphereGeometry(head.r, 20, 14).scale(head.sx, head.sy, head.sz);
  add(part(face, animalFaceMaterial(k.id, k.fur), 0, head.y, 0));
  k.decorate(add);

  const legs = pair((side) => {
    const leg = new THREE.Group();
    const length = k.hip - 0.03;
    leg.position.set(side * 0.12, k.hip, 0);
    leg.add(stub(k.legColour ?? k.limb, 0.08, 0.07, length, 0, -length / 2, 0));
    leg.add(blob(k.paw, [0.09, 0.05, 0.13], 0, -k.hip + 0.03, 0.04));
    torso.add(leg);
    return leg;
  });
  const arms = pair((side) => {
    const arm = new THREE.Group();
    arm.position.set(side * k.shoulderX, k.shoulder, 0.02);
    if (k.flippers) arm.add(blob(k.limb, [0.04, 0.19, 0.09], side * 0.03, -0.17, 0));
    else {
      arm.add(stub(k.limb, 0.065, 0.055, k.armLength, 0, -k.armLength / 2, 0));
      arm.add(blob(k.paw, [0.08, 0.08, 0.08], 0, -k.armLength - 0.01, 0));
    }
    torso.add(arm);
    return arm;
  });
  arms.forEach((arm) => bakeRigid(arm));
  if (!bakedLegs) legs.forEach((leg) => bakeRigid(leg));
  return { torso, arms, legs };
}

/** @returns {import('../world-pack-contract.js').AgentBody} */
export function buildZooAgentBody(session) {
  const k = resolve(speciesOf(session.id));
  const { torso, arms, legs } = assemble(k, { bakedLegs: false });
  const headTop = k.head.y + k.head.r * k.head.sy;
  const signBottom = headTop + SIGN_CLEARANCE;
  const handY = k.shoulder + k.armLength + 0.04; // raised paws
  const sign = buildPetitionSign({ postDrop: signBottom - handY, shoulderX: k.shoulderX });
  sign.position.set(0, signBottom, SIGN_SHEET_OFFSET);
  const medal = buildMedal(k.body.rz * 0.92);
  medal.position.set(0, k.shoulder + 0.04, 0);
  torso.add(sign, medal);
  bakeRigid(torso, [...arms, ...legs, sign, medal]);

  return {
    root: torso,
    scale: k.scale,
    chipHeight: (status) => (status === 'asking' ? signBottom + SIGN_HEIGHT + 0.12 : headTop + 0.14) + torso.position.y,

    animate(state) {
      const pose = POSES[state.pose];
      easeTorso(torso, pose, state);
      easeArms(arms, pose, state);
      legs.forEach((leg, i) => {
        const swing = Math.sin(state.t * (state.running ? 15 : 10) + i * Math.PI) * 0.6;
        leg.rotation.x += ((state.pose === 'walking' ? swing : LEGS[state.pose]) - leg.rotation.x) * state.ease;
      });
      const atRest = !state.moving;
      sign.visible = state.status === 'asking';
      medal.visible = state.status === 'done' && atRest;
      // The petition is held high and lifted a little, again and again, until it is answered.
      if (sign.visible) sign.position.y = signBottom + (atRest && !state.still ? Math.max(0, Math.sin(state.t * 3.2)) * 0.14 : 0);
    },

    dispose() { torso.traverse((child) => { if (child.isMesh) child.geometry.dispose(); }); },
  };
}

const CUB_SCALE = 0.5;
/** A cub of the master's species: the same body at half size, legs baked in, arms cheering while it hops. @returns {import('../world-pack-contract.js').HelperBody} */
export function buildZooCubBody(masterId) {
  const k = resolve(speciesOf(masterId));
  const { torso, arms } = assemble(k, { bakedLegs: true });
  bakeRigid(torso, arms);
  return {
    root: torso,
    scale: k.scale * CUB_SCALE,
    // Hops while the master works (thrust pulses 0..0.9); arms go up on each hop; bows when leaving.
    animate({ thrust, bow, bob, ease }) {
      torso.position.y += (bob + thrust * 0.4 - torso.position.y) * ease;
      torso.rotation.x += (bow + 0.1 - torso.rotation.x) * ease;
      arms.forEach((arm) => { arm.rotation.x += (-1 - thrust * 2 - arm.rotation.x) * ease; });
    },
    dispose() { torso.traverse((child) => { if (child.isMesh) child.geometry.dispose(); }); },
  };
}
