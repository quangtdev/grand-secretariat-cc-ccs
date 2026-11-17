// The Huế court in pixel art, seen from above at an angle: the same hall, yard, drum pavilion,
// mandarins, guards and king as the 3D Huế world, drawn as sprites and flat-shaded blocks.
// Its words and sounds are the Huế court's (imported from hue-court/); the shell's colours are the base theme.
// Everything is painted in code at boot; nothing is loaded from image files.
import { PALETTE, ROBE_DYES } from '../../scene/court-layout.js';
import { hashIndex } from '../../scene/agent-figure-motion.js';
import { spriteAgentBody, spriteHelperBody, spritePorterBody, spriteRulerBody } from '../../scene/sprite-body-animators.js';
import { HUE_PIXEL_DESKS } from './hue-pixel-desk-layout.js';
import { buildHueDeskSprite, buildHueEdictSprite } from './hue-pixel-desk-and-edict-sprites.js';
import { kingSheet, porterSheet, scribeSheet, soldierSheet } from './hue-pixel-figure-sheets.js';
import { ART_PIXEL } from './hue-pixel-iso-mesh-builder.js';
import { buildHuePixelStage } from './hue-pixel-stage.js';
import { hueCourtAudio } from '../hue-court/hue-court-audio.js';
import { hueCourtVocabulary } from '../hue-court/hue-court-vocabulary.js';

const pixel = ART_PIXEL;
// Art rows from the feet to the top of the figure, per posture: where the name chip floats.
const SCRIBE_CHIP = { asking: 32, upright: 27, low: 24 };

/** @type {import('../world-pack-contract.js').WorldPack} */
export const world = {
  id: 'hue-pixel',
  label: 'Huế court (pixel 2D)',
  environment: {
    background: 0x6f7f5a, // the grass beyond the painted ground
    fog: [900, 1000], // none: pixels keep their colours at any distance
    hemi: { sky: 0xffffff, ground: 0xffffff, intensity: 1 }, // unlit materials: lights are only needed to satisfy the engine
    sun: { color: 0xffffff, intensity: 0, position: [0, 10, 0] },
    rim: { color: 0xffffff, intensity: 0, position: [0, 10, 0] },
    shadows: false,
    camera: { type: 'orthographic', view: 'isometric', zoom: [0.8, 2.6], pixelScale: 3, fps: { active: 30, moving: 12, ambient: 8, petition: 6 } },
  },
  palette: {
    ring: PALETTE.glaze,
    pool: 0xffc46a,
    portalSummon: PALETTE.glaze,
    portalDismiss: PALETTE.jade,
    edictTrail: PALETTE.gold,
  },
  desks: HUE_PIXEL_DESKS, // spread out: the shared grid collapses in the isometric view
  petitionSpacing: 3, // a kneeling scribe with the scroll raised is 16 art pixels wide (9 per world unit, seen at 45 degrees): neighbours must not touch
  audio: hueCourtAudio, // the Huế court's own sound, shared with the 3D world
  vocabulary: hueCourtVocabulary, // and its words
  buildStage: buildHuePixelStage,
  bodies: {
    agent: (session) => spriteAgentBody(scribeSheet(ROBE_DYES[hashIndex(session.id, ROBE_DYES.length)]), { pixel, chip: SCRIBE_CHIP }),
    ruler: () => spriteRulerBody(kingSheet(), { pixel, handRows: 22 }),
    helper: () => spriteHelperBody(soldierSheet(), { pixel }),
    porter: () => spritePorterBody(porterSheet(), { pixel }),
    workplace: buildHueDeskSprite,
    edictProjectile: buildHueEdictSprite,
  },
};

export default world;
