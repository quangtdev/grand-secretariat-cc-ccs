// The Huế king's costume: long yellow bào with clouds, a dragon and a red hem, crown, beard.
// Movement lives in scene/ruler-figure-motion.js; this file dresses him and eases his body.
//   seated   -> on the throne, hands on knees (the court's resting look)
//   standing -> upright, hands folded in front
//   gazing   -> upright, hands behind the back, head turning slowly over the view
//   walking  -> arms swing, faster when he runs
import * as THREE from 'three';
import { PALETTE } from '../../scene/court-layout.js';
import { beard, belt, boots, dragonRobeMaterial, kingCrown, sleevedArm } from '../../scene/court-costume-parts.js';
import { bakeRigid, faceMaterial, part, toon } from '../../scene/figure-toon-style.js';

const SEATED_TORSO_Y = 0.48; // local units: the torso rests on the throne seat
const STANDING_TORSO_Y = 0.6; // local units: the torso stands on the lower robe
const ARMS = { seated: -1.1, standing: -0.55, gazing: 0.55, walking: -0.2 };
const POINT_ARM = -2.3; // right arm raised towards a scribe

/** @returns {import('../world-pack-contract.js').RulerBody} */
export function buildHueRulerBody() {
  const robe = dragonRobeMaterial();

  // The lower robe shows only when he stands; seated, the throne seat hides his legs.
  const skirt = new THREE.Group();
  skirt.add(part(new THREE.CylinderGeometry(0.4, 0.47, 0.6, 16), robe, 0, 0.3, 0), boots(0.12));

  const torso = new THREE.Group();
  torso.add(part(new THREE.CylinderGeometry(0.2, 0.42, 0.8, 16), robe, 0, 0.4, 0));
  torso.add(belt(0.32, 0.3, PALETTE.lacquer));
  const collar = part(new THREE.TorusGeometry(0.17, 0.035, 6, 16), toon(PALETTE.lacquer), 0, 0.79, 0);
  collar.rotation.x = Math.PI / 2;
  torso.add(collar);
  const head = new THREE.Group();
  head.position.y = 0.95;
  head.add(part(new THREE.SphereGeometry(0.17, 16, 12), faceMaterial({ brows: 1.5, skin: PALETTE.skin })), beard());
  const crown = kingCrown();
  crown.position.y = 0.1;
  head.add(crown);
  torso.add(head);
  // Arms in wide yellow sleeves with red cuffs pivot at the shoulder.
  const arms = [-1, 1].map((side) => {
    const arm = sleevedArm(toon(PALETTE.glaze), { length: 0.32, cuff: 0.1, cuffMat: toon(PALETTE.lacquer) });
    arm.position.set(side * 0.27, 0.68, 0.04);
    torso.add(arm);
    return arm;
  });
  // Few draw calls: skirt, torso, head and each arm are one baked mesh each (plus textured ones).
  bakeRigid(skirt);
  arms.forEach((arm) => bakeRigid(arm));
  bakeRigid(head);
  bakeRigid(torso, [head, ...arms]);
  torso.position.y = SEATED_TORSO_Y;
  const root = new THREE.Group();
  root.add(skirt, torso);

  const setPose = (pose) => { skirt.visible = pose !== 'seated'; };
  setPose('seated');
  arms.forEach((arm) => { arm.rotation.x = ARMS.seated; }); // starts seated, without easing in

  return {
    root,
    setPose,

    animate({ pose, moving, running, pointing, time, ease, still, bob }) {
      torso.position.y += ((pose === 'seated' ? SEATED_TORSO_Y : STANDING_TORSO_Y) + bob - torso.position.y) * ease;
      torso.rotation.x += ((moving ? (running ? 0.18 : 0.06) : 0) - torso.rotation.x) * ease;

      // Gazing: the head turns slowly across the view.
      const headYaw = pose === 'gazing' && !still ? Math.sin(time * 0.5) * 0.35 : 0;
      head.rotation.y += (headYaw - head.rotation.y) * ease;

      arms.forEach((arm, i) => {
        let target = ARMS[pose];
        if (moving) target += Math.sin(time * (running ? 13 : 8) + i * Math.PI) * (running ? 0.6 : 0.3);
        if (pointing && i === 1) target = POINT_ARM;
        arm.rotation.x += (target - arm.rotation.x) * ease;
      });
    },

    /** World position of the right hand, where an edict leaves from. */
    handPosition: (target) => arms[1].localToWorld(target.set(0, -0.38, 0)),

    dispose() { root.traverse((child) => { if (child.isMesh) child.geometry.dispose(); }); },
  };
}
