// The zoo world: a friendly menagerie in 3D. Every agent is an upright cartoon animal at its
// feeding trough (elephant, giraffe, lion, panda, penguin or monkey by its session id), the
// sub-agents are cubs, the head zookeeper watches from a lookout hut, porters are keepers.
// Wires the world's pieces into the contract (../world-pack-contract.js).
import { ZOO } from './zoo-palette.js';
import { buildZooAgentBody, buildZooCubBody } from './zoo-animal-body-factory.js';
import { buildZooHeadZookeeperBody } from './zoo-head-zookeeper-body.js';
import { buildZooPorterBody } from './zoo-keeper-bodies.js';
import { FeedingTrough } from './zoo-feeding-trough-workplace.js';
import { buildZooTreat } from './zoo-thrown-treat.js';
import { buildZooStage } from './zoo-stage.js';
import { zooAudio } from './zoo-audio-cues.js';
import { zooVocabulary } from './zoo-vocabulary.js';

/** @type {import('../world-pack-contract.js').WorldPack} */
export const world = {
  id: 'zoo',
  label: 'Zoo',
  environment: {
    background: ZOO.sky,
    fog: [46, 120],
    hemi: { sky: 0xe6f4ff, ground: 0x8aa860, intensity: 1.5 },
    sun: { color: 0xfff1d0, intensity: 2.3, position: [-14, 22, 10] },
    rim: { color: 0xffe9c0, intensity: 0.7, position: [8, 9, -24] },
    shadows: true,
    camera: { type: 'perspective' },
  },
  palette: { ring: ZOO.petitionSign, pool: 0xffd98a, portalSummon: ZOO.petitionSign, portalDismiss: ZOO.reportRibbon, edictTrail: ZOO.medalGold },
  audio: zooAudio,
  vocabulary: zooVocabulary,
  buildStage: buildZooStage,
  bodies: {
    agent: buildZooAgentBody,
    ruler: buildZooHeadZookeeperBody,
    helper: (_cub, masterId) => buildZooCubBody(masterId),
    porter: buildZooPorterBody,
    workplace: (slot) => new FeedingTrough(slot),
    edictProjectile: buildZooTreat,
  },
};

export default world;
