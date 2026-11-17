// The zoo's stage: lawn, sand paths and fence, the keeper's lookout on the dais, the entrance
// arch and ticket booth (the summon point), a duck pond, trees, rocks, and life in the
// background (ducks, butterflies, balloons, birds) that holds still while a petition waits.
import * as THREE from 'three';
import { DRUM_PAVILION } from '../../scene/court-layout.js';
import { buildButterflies, buildBalloons } from './zoo-butterflies-and-balloons.js';
import { buildDuckPond } from './zoo-duck-pond.js';
import { buildEntranceGateAndBooth } from './zoo-entrance-gate-and-booth.js';
import { buildZooGrounds } from './zoo-grounds-paths-and-fences.js';
import { buildLookoutHut } from './zoo-keeper-lookout-hut.js';
import { buildPerchingBirds } from './zoo-perching-birds.js';
import { buildTreesAndRocks } from './zoo-trees-and-rocks.js';

/** @returns {import('../world-pack-contract.js').WorldStage} */
export function buildZooStage(scene, { onChirp = () => {} } = {}) {
  scene.add(buildZooGrounds(), buildLookoutHut(), buildTreesAndRocks());
  const { target } = buildEntranceGateAndBooth();
  scene.add(target);
  return {
    summonTarget: target,
    summonAnchor: DRUM_PAVILION.clone().setY(4.6),
    ambient: [buildDuckPond(scene), buildButterflies(scene), buildBalloons(scene), buildPerchingBirds(scene, { onChirp })],
  };
}
