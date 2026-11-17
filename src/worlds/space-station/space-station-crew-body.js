// A crew member as a figure: a light flight suit (colour per agent), a round helmet with a glowing
// visor, a backpack and glowing trims. Upright on two legs, so the shared humanoid pose maths drives it
// (scene/humanoid-pose-animator.js): sits at the console tapping the holo-keys, walks, stands holding the
// amber petition tablet overhead (asking) or the green data pad (done).
// Draw calls: baked suit, glow (visor + trims), two arms, two legs and the visible tablet = 7, as the Huế scribe.
import * as THREE from 'three';
import { hashIndex } from '../../scene/agent-figure-motion.js';
import { bakeRigid } from '../../scene/figure-toon-style.js';
import { easeTorso, POSES } from '../../scene/humanoid-pose-animator.js';
import { buildDataPad, buildPetitionTablet, TABLET_HEIGHT } from './space-station-holo-tablets.js';
import { STATION } from './space-station-palette.js';
import { blob, disposeGeometries, glow, glowMesh, pair, slab, stub } from './space-station-shape-helpers.js';

const SCALE = 1.35;
const HIP = 0.38;
const SHOULDER = { x: 0.27, y: 0.84 };
const HEAD = { y: 1.0, r: 0.21 };
const HEAD_TOP = HEAD.y + HEAD.r;
// Torso drop (below standing), lean and arm angle per pose. Seated: on the console's pod seat, hands on the keys.
// "kneeling" is the engine's word for asking: here the crew member stands and holds the tablet up.
const LOOK = {
  seated: { drop: -0.2, lean: 0.3, arms: -0.75 },
  kneeling: { drop: 0, lean: 0, arms: -2.9 },
  standing: POSES.standing,
  walking: POSES.walking,
};
const LEGS = { seated: -1.25, kneeling: 0, standing: 0 }; // hip angle: forward on the seat, straight
const PAD_AT = { x: 0.36, y: 0.62, z: 0.3 }; // the data pad, held out at the side so it shows from behind too
const TABLET_CLEARANCE = 0.12;

const SUITS = STATION.suits;

/** Suit, helmet, backpack and the glow parts; returns the pieces that move. */
function assemble(suit) {
  const torso = new THREE.Group();
  torso.add(blob(suit, [0.2, 0.28, 0.17], 0, 0.66, 0));
  torso.add(blob(STATION.white, [0.21, 0.2, 0.2], 0, HEAD.y, 0)); // helmet
  torso.add(slab(STATION.panelDark, 0.24, 0.32, 0.1, 0, 0.7, -0.2)); // backpack
  torso.add(slab(STATION.panel, 0.1, 0.06, 0.05, 0, 0.5, -0.24)); // its vent
  const trims = [
    glow(STATION.cyan, new THREE.SphereGeometry(1, 12, 8).scale(0.15, 0.09, 0.08), 0, HEAD.y + 0.01, 0.15), // visor
    glow(STATION.cyan, new THREE.BoxGeometry(0.07, 0.07, 0.03), 0, 0.78, 0.165), // chest light
    glow(STATION.cyan, new THREE.CylinderGeometry(0.205, 0.215, 0.025, 12), 0, 0.5, 0), // belt
    glow(STATION.cyan, new THREE.BoxGeometry(0.03, 0.24, 0.03), 0, 0.72, -0.26), // backpack light strip
  ];
  const legs = pair((side) => {
    const leg = new THREE.Group();
    leg.position.set(side * 0.1, HIP, 0);
    leg.add(stub(suit, 0.075, 0.065, HIP - 0.04, 0, -(HIP - 0.04) / 2, 0));
    leg.add(slab(STATION.white, 0.12, 0.07, 0.19, 0, -HIP + 0.04, 0.03)); // boot
    torso.add(leg);
    return leg;
  });
  const arms = pair((side) => {
    const arm = new THREE.Group();
    arm.position.set(side * SHOULDER.x, SHOULDER.y, 0.02);
    arm.add(stub(suit, 0.065, 0.055, 0.28, 0, -0.14, 0));
    arm.add(blob(STATION.white, [0.075, 0.075, 0.075], 0, -0.3, 0)); // glove
    arm.add(stub(STATION.cyan, 0.07, 0.07, 0.03, 0, -0.2, 0)); // cuff, a light colour band
    torso.add(arm);
    return arm;
  });
  return { torso, trims, legs, arms };
}

/** @returns {import('../world-pack-contract.js').AgentBody} */
export function buildCrewBody(session) {
  const { torso, trims, legs, arms } = assemble(SUITS[hashIndex(session.id, SUITS.length)]);
  arms.forEach((arm) => bakeRigid(arm));
  legs.forEach((leg) => bakeRigid(leg));
  torso.add(glowMesh(trims, torso));
  const petition = buildPetitionTablet();
  const pad = buildDataPad();
  const tabletBottom = HEAD_TOP + TABLET_CLEARANCE;
  petition.position.set(0, tabletBottom, 0.05);
  pad.position.set(PAD_AT.x, PAD_AT.y, PAD_AT.z);
  pad.rotation.x = -0.15;
  pad.scale.setScalar(0.85);
  petition.visible = pad.visible = false;
  torso.add(petition, pad);
  bakeRigid(torso, [...arms, ...legs, petition, pad]);

  return {
    root: torso,
    scale: SCALE,
    chipHeight: (status) => (status === 'asking' ? tabletBottom + TABLET_HEIGHT + 0.14 : HEAD_TOP + 0.14) + torso.position.y,

    animate(state) {
      const pose = LOOK[state.pose];
      easeTorso(torso, pose, state);
      const typing = state.working && !state.moving && !state.still;
      for (let i = 0; i < 2; i++) {
        let target = pose.arms;
        if (state.moving) target += Math.sin(state.t * 10 + i * Math.PI) * 0.5;
        else if (typing) target += 0.12 + Math.sin(state.t * 13 + i * 2.1) * 0.14; // fingers drumming the holo-keys
        arms[i].rotation.x += (target - arms[i].rotation.x) * state.ease;
        const swing = Math.sin(state.t * (state.running ? 15 : 10) + i * Math.PI) * 0.6;
        const hip = state.pose === 'walking' ? swing : LEGS[state.pose];
        legs[i].rotation.x += (hip - legs[i].rotation.x) * state.ease;
      }
      const atRest = !state.moving;
      petition.visible = state.status === 'asking';
      pad.visible = state.status === 'done' && atRest;
      // The petition is held high and lifted a little, again and again, until it is answered.
      if (petition.visible) petition.position.y = tabletBottom + (atRest && !state.still ? Math.max(0, Math.sin(state.t * 3.2)) * 0.14 : 0);
    },

    dispose() { disposeGeometries(torso); },
  };
}
