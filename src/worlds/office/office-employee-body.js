// An employee: shirt or hoodie (colour by session id), trousers, trainers. The shared humanoid
// pose maths (scene/humanoid-pose-animator.js) eases the torso; the arms and legs are eased here
// because an office has its own poses:
//   seated (idle, working) -> on the desk's chair, hands on the keyboard; while working the fingers type
//   kneeling (asking)      -> stands holding a yellow ticket overhead, lifted again and again
//   standing (done)        -> stands holding up a laptop with a jade screen
//   walking                -> arms and legs swing
// Draw calls: body, face, two arms, four leg parts, chair, ticket, laptop = 11 built; 9 are drawn at once.
import { hashIndex } from '../../scene/agent-figure-motion.js';
import { easeArms, easeTorso } from '../../scene/humanoid-pose-animator.js';
import * as THREE from 'three';
import { buildEmployeeChair } from './office-employee-chair.js';
import { buildLaptop, buildTicket, TICKET_HEIGHT } from './office-employee-held-props.js';
import { OFFICE } from './office-palette.js';
import { blob, buildPerson, disposeFigure, HEAD_TOP, HIP, SEATED_DROP, slab } from './office-person-parts.js';

const SCALE = 1.4;
// Reused every frame for the arms' targets (no new objects in the frame loop).
const armPose = {};
const armState = {};
const POSES = {
  seated: { drop: SEATED_DROP, lean: 0.1, arms: -1.15 },
  kneeling: { drop: 0, lean: 0, arms: -2.65 },
  standing: { drop: 0, lean: -0.02, arms: -2.65 },
  walking: { drop: 0, lean: 0.08, arms: -0.35 },
};
const SIT = 1.45; // hip angle (thigh forward) and the knee bend that puts the shin straight down
const TICKET_BOTTOM = HEAD_TOP + 0.02;


/** @returns {import('../world-pack-contract.js').AgentBody} */
export function buildOfficeEmployeeBody(session) {
  const n = hashIndex(session.id, 1000);
  const top = OFFICE.shirts[n % OFFICE.shirts.length];
  const person = buildPerson({
    top,
    bottom: [0x3a4150, 0x5b5f66, 0x2f3a46, 0x4a4338][(n >> 3) % 4],
    hair: OFFICE.hair[(n >> 2) % OFFICE.hair.length],
    extras: (torso) => {
      torso.add(slab(0xf3f1ec, 0.1, 0.05, 0.02, 0, HIP + 0.4, 0.125)); // collar
      if (n % 2) torso.add(blob(top, [0.11, 0.07, 0.06], 0, HIP + 0.43, -0.12)); // hood bunched at the nape
    },
  });
  const { torso, arms, legs } = person;
  const ticket = buildTicket();
  const laptop = buildLaptop();
  laptop.position.set(0, 1.09, 0.2);
  ticket.position.set(0, TICKET_BOTTOM, 0.12);
  torso.add(ticket, laptop);
  person.finish([ticket, laptop]);
  const chair = buildEmployeeChair(SCALE);
  const root = new THREE.Group().add(torso, chair); // the chair stays put while the body eases down onto it
  const swing = (t, running, i) => Math.sin(t * (running ? 15 : 10) + i * Math.PI);

  return {
    root,
    scale: SCALE,
    chipHeight: (status) => (status === 'asking' ? TICKET_BOTTOM + TICKET_HEIGHT + 0.1 : HEAD_TOP + 0.12) + torso.position.y,

    animate(state) {
      const pose = POSES[state.pose];
      const atRest = !state.moving;
      const typing = state.working && atRest && state.pose === 'seated' && !state.still;
      const lift = state.status === 'asking' && atRest && !state.still ? Math.max(0, Math.sin(state.t * 3.2)) : 0;
      easeTorso(torso, pose, state);
      if (typing) {
        arms.forEach((arm, i) => { // fast, small, uneven: fingers on keys
          const target = pose.arms + Math.sin(state.t * 17 + i * 2.1) * 0.05 + Math.sin(state.t * 5.3 + i) * 0.04;
          arm.rotation.x += (target - arm.rotation.x) * state.ease;
        });
      } else {
        Object.assign(armPose, pose).arms = pose.arms - lift * 0.4;
        Object.assign(armState, state).working = false;
        easeArms(arms, armPose, armState);
      }
      legs.forEach(({ hip, knee }, i) => {
        const s = state.pose === 'walking' ? swing(state.t, state.running, i) : 0;
        const sitting = state.pose === 'seated';
        hip.rotation.x += ((sitting ? -SIT : s * 0.6) - hip.rotation.x) * state.ease;
        knee.rotation.x += ((sitting ? SIT : Math.max(0, -s) * 0.7) - knee.rotation.x) * state.ease;
      });
      chair.visible = state.pose === 'seated';
      ticket.visible = state.status === 'asking';
      laptop.visible = state.status === 'done' && atRest;
      ticket.position.y = TICKET_BOTTOM + lift * 0.06;
    },

    dispose: () => disposeFigure(root),
  };
}
