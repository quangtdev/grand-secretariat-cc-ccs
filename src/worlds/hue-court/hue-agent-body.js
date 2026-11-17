// The Huế scribe's costume: a mandarin in winged cap and dyed robe (scene/court-costume-parts.js),
// toon-shaded. Motion, pose choice and the walk live in scene/agent-figure-motion.js; this file
// only dresses the figure and shows each status's props.
//   working -> brush in the right hand      asking -> yellow petition scroll held overhead
//   done    -> jade tablet
import * as THREE from 'three';
import { PALETTE, ROBE_DYES } from '../../scene/court-layout.js';
import { belt, boots, crossedCollar, mandarinHat, rankBadge, sleevedArm } from '../../scene/court-costume-parts.js';
import { hashIndex } from '../../scene/agent-figure-motion.js';
import { bakeRigid, faceMaterial, part, toon } from '../../scene/figure-toon-style.js';
import { easeArms, easeTorso, POSES } from '../../scene/humanoid-pose-animator.js';

const SCROLL_HEIGHT = 1.26; // held clear above the hat so the petition reads from afar

/** @returns {import('../world-pack-contract.js').AgentBody} */
export function buildHueAgentBody(session) {
  const dye = ROBE_DYES[hashIndex(session.id, ROBE_DYES.length)];
  const robe = toon(dye);

  const torso = new THREE.Group();
  // Robe (áo giao lĩnh), widening to the hem, with belt, crossed collar and rank badge.
  torso.add(part(new THREE.CylinderGeometry(0.13, 0.31, 0.72, 14), robe, 0, 0.36, 0));
  torso.add(belt(0.225, 0.35), crossedCollar(0.66, 0.15), boots());
  const badge = rankBadge(dye);
  badge.position.set(0, 0.48, 0.196);
  badge.rotation.x = -0.245; // lies on the robe's taper
  torso.add(badge);
  // Head with a painted face, a topknot under the winged cap.
  const head = part(new THREE.SphereGeometry(0.13, 16, 12), faceMaterial({ skin: PALETTE.skin }), 0, 0.83, 0);
  const topknot = part(new THREE.SphereGeometry(0.05, 8, 6), toon(0x2a1d16), 0, 0.86, -0.11);
  topknot.castShadow = false;
  torso.add(head, topknot);
  const hat = mandarinHat();
  hat.position.y = 0.88;
  torso.add(hat);

  // Arms in wide sleeves pivot at the shoulder; the sleeve hangs below the pivot.
  const arms = [-1, 1].map((side) => {
    const arm = sleevedArm(robe);
    arm.position.set(side * 0.17, 0.64, 0.02);
    torso.add(arm);
    return arm;
  });

  // Props shown only in the throne poses, held at the hands (arm length forward/up).
  const scroll = part(new THREE.CylinderGeometry(0.085, 0.085, 0.74, 10), toon(PALETTE.glaze), 0, SCROLL_HEIGHT, 0.06);
  scroll.rotation.z = Math.PI / 2;
  const tablet = part(new THREE.BoxGeometry(0.1, 0.36, 0.03), toon(PALETTE.jade), 0, 0.62, 0.36);
  tablet.rotation.x = -0.25;
  torso.add(scroll, tablet);
  // Few draw calls per figure: the body is one mesh, each arm another; props stay their own.
  arms.forEach((arm) => bakeRigid(arm));
  // The writing brush, in the right hand while the scribe works.
  const brush = new THREE.Group();
  brush.add(part(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 5), toon(PALETTE.wood), 0, 0, 0));
  brush.add(part(new THREE.ConeGeometry(0.018, 0.06, 5).rotateX(Math.PI), toon(0x1d1a22), 0, -0.13, 0));
  brush.position.set(0, -0.38, 0.03);
  brush.rotation.x = 0.9;
  arms[1].add(brush);
  bakeRigid(brush);
  bakeRigid(torso, [...arms, scroll, tablet]);

  return {
    root: torso,
    chipHeight: (status) => (status === 'asking' ? 1.62 : 1.32) + torso.position.y,

    animate(state) {
      const pose = POSES[state.pose];
      easeTorso(torso, pose, state);
      easeArms(arms, pose, state);
      const atRest = !state.moving;
      brush.visible = state.working && atRest;
      scroll.visible = state.status === 'asking';
      tablet.visible = state.status === 'done' && atRest;
      // The petition is held high and lifted a little, again and again, until it is answered.
      if (scroll.visible) scroll.position.y = SCROLL_HEIGHT + (atRest && !state.still ? Math.max(0, Math.sin(state.t * 3.2)) * 0.14 : 0);
    },

    dispose() {
      // Materials are shared (figure-toon-style.js); geometries are this figure's own.
      torso.traverse((child) => { if (child.isMesh) child.geometry.dispose(); });
    },
  };
}
