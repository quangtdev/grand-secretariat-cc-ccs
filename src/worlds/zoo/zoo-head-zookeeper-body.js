// The head zookeeper (the ruler): khaki, in a safari hat. Sits on a chair at the lookout hut,
// strolls out to the pond and the big tree, and points a hand at an animal to send it a treat.
// Movement lives in scene/ruler-figure-motion.js; this file eases his body.
//   seated   -> thighs forward on the chair, hands on knees     standing -> upright, hands in front
//   gazing   -> upright, hands behind, head turning slowly      walking  -> legs and arms swing
import { buildKeeperParts, disposeKeeper, SEATED_WAIST, STANDING_WAIST } from './zoo-keeper-bodies.js';

const ARMS = { seated: -1.2, standing: -0.5, gazing: 0.5, walking: -0.2 };
const POINT_ARM = -2.3; // right arm raised towards an animal
const HALF_TURN = Math.PI / 2;

/** @returns {import('../world-pack-contract.js').RulerBody} */
export function buildZooHeadZookeeperBody() {
  const { root, torso, head, arms, legs } = buildKeeperParts({ hat: 'safari' });
  torso.position.y = SEATED_WAIST;
  arms.forEach((arm) => { arm.rotation.x = ARMS.seated; });
  legs.forEach(({ hip, knee }) => { hip.rotation.x = -HALF_TURN; knee.rotation.x = HALF_TURN; });

  return {
    root,
    scale: 1.2,
    setPose() {}, // the pose arrives again through animate()

    animate({ pose, moving, running, pointing, time, ease, still, bob }) {
      const sitting = pose === 'seated';
      torso.position.y += ((sitting ? SEATED_WAIST : STANDING_WAIST) + bob - torso.position.y) * ease;
      torso.rotation.x += ((moving ? (running ? 0.18 : 0.06) : 0) - torso.rotation.x) * ease;
      const headYaw = pose === 'gazing' && !still ? Math.sin(time * 0.5) * 0.4 : 0;
      head.rotation.y += (headYaw - head.rotation.y) * ease;

      legs.forEach(({ hip, knee }, i) => {
        const swing = moving ? Math.sin(time * (running ? 13 : 8) + i * Math.PI) : 0;
        hip.rotation.x += ((sitting ? -HALF_TURN : swing * 0.55) - hip.rotation.x) * ease;
        knee.rotation.x += ((sitting ? HALF_TURN : Math.max(0, -swing) * 0.7) - knee.rotation.x) * ease;
      });
      arms.forEach((arm, i) => {
        let target = ARMS[pose];
        if (moving) target += Math.sin(time * (running ? 13 : 8) + i * Math.PI) * (running ? 0.6 : 0.3);
        if (pointing && i === 1) target = POINT_ARM;
        arm.rotation.x += (target - arm.rotation.x) * ease;
      });
    },

    /** World position of the right hand, where a treat leaves from. */
    handPosition: (target) => arms[1].localToWorld(target.set(0, -0.28, 0)),

    dispose: () => disposeKeeper(root),
  };
}
