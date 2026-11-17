// The captain (the ruler): a long navy coat with gold epaulettes and a glowing insignia, a white peaked
// cap. Sits in the command chair, strolls to the viewport, the star-map table and the airlock window,
// and points a hand at a crew member to send an order. Movement lives in scene/ruler-figure-motion.js;
// this file dresses and eases his body.
//   seated   -> thighs forward on the chair, hands on the armrests    standing -> upright, hands in front
//   gazing   -> upright, hands behind, head turning slowly            walking  -> legs and arms swing
import * as THREE from 'three';
import { bakeRigid, faceMaterial, part } from '../../scene/figure-toon-style.js';
import { STATION } from './space-station-palette.js';
import { blob, disposeGeometries, glow, glowMesh, pair, slab, stub } from './space-station-shape-helpers.js';

const STANDING_WAIST = 0.4;
const SEATED_WAIST = 0.2;
const THIGH = 0.2;
const ARMS = { seated: -1.2, standing: -0.5, gazing: 0.5, walking: -0.2 };
const POINT_ARM = -2.3;
const HALF_TURN = Math.PI / 2;

function assemble() {
  const torso = new THREE.Group();
  torso.add(stub(STATION.coat, 0.14, 0.17, 0.44, 0, 0.22, 0)); // coat body
  torso.add(stub(STATION.coatDark, 0.172, 0.172, 0.05, 0, 0.1, 0)); // belt
  torso.add(stub(STATION.white, 0.1, 0.12, 0.05, 0, 0.45, 0)); // collar
  pair((side) => torso.add(slab(STATION.gold, 0.12, 0.03, 0.11, side * 0.15, 0.44, 0))); // epaulettes
  const trims = [
    glow(STATION.gold, new THREE.CylinderGeometry(0.05, 0.05, 0.02, 6).rotateX(Math.PI / 2), 0.07, 0.34, 0.15), // insignia
    glow(STATION.cyan, new THREE.BoxGeometry(0.025, 0.3, 0.02), 0, 0.2, 0.165), // coat seam light
  ];
  torso.add(glowMesh(trims, torso));

  const head = new THREE.Group();
  head.position.y = 0.57;
  head.add(part(new THREE.SphereGeometry(0.115, 16, 12), faceMaterial({ skin: STATION.skin })));
  head.add(stub(STATION.white, 0.125, 0.125, 0.05, 0, 0.09, 0, 14)); // cap band
  head.add(stub(STATION.white, 0.14, 0.12, 0.05, 0, 0.14, 0, 14)); // cap crown
  head.add(slab(STATION.coatDark, 0.17, 0.012, 0.1, 0, 0.075, 0.12)); // peak
  head.add(blob(STATION.gold, [0.04, 0.025, 0.012], 0, 0.1, 0.125)); // badge
  bakeRigid(head);
  torso.add(head);

  const skirt = new THREE.Group(); // the long coat's tails; hidden while seated
  skirt.add(stub(STATION.coat, 0.17, 0.25, 0.3, 0, -0.1, 0, 12));
  skirt.add(stub(STATION.gold, 0.25, 0.25, 0.02, 0, -0.24, 0, 12));
  torso.add(skirt);

  const legs = pair((side) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.075, 0, 0);
    hip.add(stub(STATION.coatDark, 0.065, 0.06, THIGH, 0, -THIGH / 2, 0));
    const knee = new THREE.Group();
    knee.position.y = -THIGH;
    knee.add(stub(STATION.coatDark, 0.06, 0.055, 0.15, 0, -0.075, 0));
    knee.add(slab(STATION.white, 0.09, 0.07, 0.15, 0, -0.165, 0.025)); // boot
    hip.add(knee);
    torso.add(hip);
    bakeRigid(knee);
    bakeRigid(hip, [knee]);
    return { hip, knee };
  });
  const arms = pair((side) => {
    const arm = new THREE.Group();
    arm.position.set(side * 0.19, 0.4, 0);
    arm.add(stub(STATION.coat, 0.055, 0.05, 0.26, 0, -0.13, 0));
    arm.add(stub(STATION.gold, 0.057, 0.057, 0.02, 0, -0.24, 0)); // cuff stripe
    arm.add(blob(STATION.white, [0.045, 0.045, 0.045], 0, -0.28, 0)); // glove
    torso.add(arm);
    bakeRigid(arm);
    return arm;
  });
  bakeRigid(skirt);
  bakeRigid(torso, [head, skirt, ...arms, ...legs.map(({ hip }) => hip)]);
  torso.position.y = STANDING_WAIST;
  const root = new THREE.Group();
  root.add(torso);
  return { root, torso, head, skirt, arms, legs };
}

/** @returns {import('../world-pack-contract.js').RulerBody} */
export function buildCaptainBody() {
  const { root, torso, head, skirt, arms, legs } = assemble();
  torso.position.y = SEATED_WAIST;
  skirt.visible = false;
  for (const arm of arms) arm.rotation.x = ARMS.seated;
  for (const { hip, knee } of legs) { hip.rotation.x = -HALF_TURN; knee.rotation.x = HALF_TURN; }

  return {
    root,
    scale: 1.2,
    setPose(pose) { skirt.visible = pose !== 'seated'; },

    animate({ pose, moving, running, pointing, time, ease, still, bob }) {
      const sitting = pose === 'seated';
      skirt.visible = !sitting;
      torso.position.y += ((sitting ? SEATED_WAIST : STANDING_WAIST) + bob - torso.position.y) * ease;
      torso.rotation.x += ((moving ? (running ? 0.18 : 0.06) : 0) - torso.rotation.x) * ease;
      const headYaw = pose === 'gazing' && !still ? Math.sin(time * 0.5) * 0.4 : 0;
      head.rotation.y += (headYaw - head.rotation.y) * ease;
      for (let i = 0; i < 2; i++) {
        const swing = moving ? Math.sin(time * (running ? 13 : 8) + i * Math.PI) : 0;
        const { hip, knee } = legs[i];
        hip.rotation.x += ((sitting ? -HALF_TURN : swing * 0.55) - hip.rotation.x) * ease;
        knee.rotation.x += ((sitting ? HALF_TURN : Math.max(0, -swing) * 0.7) - knee.rotation.x) * ease;
        let target = ARMS[pose];
        if (moving) target += Math.sin(time * (running ? 13 : 8) + i * Math.PI) * (running ? 0.6 : 0.3);
        if (pointing && i === 1) target = POINT_ARM;
        arms[i].rotation.x += (target - arms[i].rotation.x) * ease;
      }
    },

    /** World position of the right hand, where an order leaves from. */
    handPosition: (target) => arms[1].localToWorld(target.set(0, -0.28, 0)),

    dispose: () => disposeGeometries(root),
  };
}
