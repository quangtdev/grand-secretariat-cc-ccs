// The Huế court world: the throne hall of Huế in morning haze, mandarins in dyed robes, palace
// guards, a king in a dragon robe. The default world. Its buildings and costumes stay in
// scene/ (court-architecture, court-costume-parts ...); this file is the one place that wires
// them into the world-pack contract (../world-pack-contract.js).
import { PALETTE } from '../../scene/court-layout.js';
import { WritingDesk } from '../../scene/writing-desk.js';
import { buildHueAgentBody } from './hue-agent-body.js';
import { buildHueRulerBody } from './hue-ruler-body.js';
import { buildHueEdictProjectile, buildHueHelperBody, buildHuePorterBody } from './hue-helper-porter-and-edict-bodies.js';
import { buildHueCourtStage } from './hue-court-stage.js';
import { hueCourtAudio } from './hue-court-audio.js';
import { hueCourtVocabulary } from './hue-court-vocabulary.js';

/** @type {import('../world-pack-contract.js').WorldPack} */
export const world = {
  id: 'hue-court',
  label: 'Huế court',
  environment: {
    background: PALETTE.mist, // Huế morning haze: far ground melts into the sky's horizon (sky-dome-and-clouds.js)
    fog: [44, 115],
    hemi: { sky: 0xf6f1e4, ground: 0x8a8468, intensity: 1.45 },
    sun: { color: 0xfff0d6, intensity: 2.3, position: [-14, 22, 10] },
    // Low and warm from behind the hall: picks out the figures' outlines against the paving.
    rim: { color: 0xffe0b0, intensity: 0.9, position: [8, 9, -24] },
    shadows: true,
    camera: { type: 'perspective' },
  },
  palette: {
    ring: PALETTE.glaze,
    pool: 0xffc46a,
    portalSummon: PALETTE.glaze,
    portalDismiss: PALETTE.jade,
    edictTrail: PALETTE.gold,
  },
  audio: hueCourtAudio,
  vocabulary: hueCourtVocabulary,
  buildStage: buildHueCourtStage,
  bodies: {
    agent: buildHueAgentBody,
    ruler: buildHueRulerBody,
    helper: buildHueHelperBody,
    porter: buildHuePorterBody,
    workplace: (slot) => new WritingDesk(slot),
    edictProjectile: buildHueEdictProjectile,
  },
};

export default world;
