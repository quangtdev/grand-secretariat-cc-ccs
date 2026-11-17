// The poses of a two-armed figure and the maths that eases a torso and its arms into them:
// shared by any body that wants the scribe's look of motion (the 3D courtier; a sprite world
// can read the same numbers). Pure functions over plain objects with position / rotation
// (a Three.js Object3D, or anything shaped like one).

/** Torso drop (local units below standing), lean (radians forward) and arm angle (radians) per pose. */
export const POSES = {
  seated: { drop: -0.36, lean: 0.34, arms: -0.8 },
  kneeling: { drop: -0.3, lean: 0.16, arms: -3.0 },
  standing: { drop: 0, lean: 0, arms: -1.0 },
  walking: { drop: 0, lean: 0.14, arms: -0.35 },
};

/** Writing strokes: small, quick, with a slow drift. */
export const brushStroke = (t) => Math.sin(t * 7) * 0.22 + Math.sin(t * 2.3) * 0.12;

/** Eases the torso to the pose's height (plus walking bob) and lean (plus the bow). `bow` is 0..1. */
export function easeTorso(torso, pose, state) {
  const { bob, bow, ease } = state;
  torso.position.y += (pose.drop + bob - torso.position.y) * ease;
  torso.rotation.x += (pose.lean + bow * 0.55 - torso.rotation.x) * ease;
}

/**
 * Eases both arms: swinging in opposite phase while walking; while working only the right
 * (brush) arm moves, in short strokes.
 */
export function easeArms(arms, pose, state) {
  const { moving, working, still, t, ease } = state;
  arms.forEach((arm, i) => {
    let target = pose.arms;
    if (moving) target += Math.sin(t * 10 + i * Math.PI) * 0.5;
    else if (working && i === 1 && !still) target += brushStroke(t);
    arm.rotation.x += (target - arm.rotation.x) * ease;
  });
}
