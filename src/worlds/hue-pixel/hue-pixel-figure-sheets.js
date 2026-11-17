// The people of the pixel Huế court as sprite sheets, painted at boot: the scribe (one sheet per
// robe dye, painted once and kept), the king, and the guard (a soldier with a spear, a porter
// without). Clips and what they show: see scene/sprite-body-animators.js.
import { PALETTE } from '../../scene/court-layout.js';
import { createSpriteSheet, layoutClips } from '../../scene/sprite-figure-body.js';
import { createPixelCanvas, pixelCell, shade } from './hue-pixel-sprite-painter.js';
import { CELL, paintHumanoid } from './hue-pixel-humanoid-painter.js';

const INK = 0x1d1a22;

/** Paints every frame of every clip (front row, then back row) and returns the sheet. */
function paintSheet(spec, clipList, poseOf) {
  const clips = layoutClips(clipList);
  const columns = Math.max(...clipList.map(([, frames]) => frames));
  const { canvas, ctx } = createPixelCanvas(columns * CELL.w, clipList.length * 2 * CELL.h);
  for (const [name, frames] of clipList) {
    for (let frame = 0; frame < frames; frame++) {
      ['f', 'b'].forEach((view, v) => {
        paintHumanoid(pixelCell(ctx, frame * CELL.w, (clips[name].row + v) * CELL.h, CELL.w, CELL.h), spec, view, poseOf(name, frame));
      });
    }
  }
  return createSpriteSheet(canvas, CELL.w, CELL.h, clips);
}

const scribeSheets = new Map();
/** The scribe in a robe of `dye`: winged cap, crossed collar, rank badge. Cached per dye. */
export function scribeSheet(dye) {
  if (scribeSheets.has(dye)) return scribeSheets.get(dye);
  const spec = {
    robe: dye, hem: shade(dye, 0.68), trim: PALETTE.gold, sleeve: shade(dye, 1.08), cuff: PALETTE.paper, skin: PALETTE.skin,
    hair: INK, hat: 'wing', hatColor: INK, boots: INK, badge: PALETTE.gold,
  };
  const sheet = paintSheet(spec, [['walk', 4, 8], ['walkask', 4, 8], ['sit', 2, 4], ['kneel', 2, 2.5], ['stand', 1, 1], ['bow', 1, 1]], (name, frame) => ({
    walk: { kind: 'walk', step: frame },
    walkask: { kind: 'walk', step: frame, arms: 'raise', scroll: true },
    sit: { kind: 'sit', arms: 'write', alt: frame === 1 },
    kneel: { kind: 'kneel', arms: 'raise', scroll: true, alt: frame === 1 },
    stand: { kind: 'stand', arms: 'tablet' },
    bow: { kind: 'bow', arms: 'tablet' },
  })[name]);
  scribeSheets.set(dye, sheet);
  return sheet;
}

let kingSheetCache;
/** The king: crown, beard, yellow dragon robe with a red hem. */
export function kingSheet() {
  kingSheetCache ??= paintSheet({
    robe: PALETTE.glaze, hem: PALETTE.lacquer, trim: PALETTE.lacquer, sleeve: PALETTE.glaze, cuff: PALETTE.lacquer, skin: PALETTE.skin,
    hair: INK, hat: 'crown', hatColor: PALETTE.gold, boots: INK, beard: 0x3b3330, collar: PALETTE.lacquer,
  }, [['sit', 1, 1], ['stand', 1, 1], ['walk', 4, 8], ['point', 1, 1]], (name, frame) => ({
    sit: { kind: 'sit', arms: 'lap' },
    stand: { kind: 'stand', arms: 'tablet' },
    walk: { kind: 'walk', step: frame },
    point: { kind: 'stand', arms: 'point' },
  })[name]);
  return kingSheetCache;
}

const GUARD = {
  robe: PALETTE.lacquer, hem: PALETTE.lacquerDark, trim: PALETTE.glaze, sleeve: PALETTE.lacquer, cuff: PALETTE.lacquerDark, skin: PALETTE.skin,
  hair: INK, hat: 'cone', hatColor: PALETTE.straw, boots: 0x231d19, trousers: 0x231d19, legRows: 4, drop: 3, badge: PALETTE.glaze,
};
let soldierSheetCache;
let porterSheetCache;
/** The guard with a spear: a sub-agent's soldier. */
export function soldierSheet() {
  soldierSheetCache ??= paintSheet(GUARD, [['stand', 1, 1], ['walk', 2, 8], ['thrust', 1, 1], ['bow', 1, 1]], (name, frame) => ({
    stand: { kind: 'stand', spear: 'up' },
    walk: { kind: 'walk', step: frame * 2, spear: 'up' },
    thrust: { kind: 'stand', spear: 'thrust' },
    bow: { kind: 'bow', spear: 'up' },
  })[name]);
  return soldierSheetCache;
}

/** The same guard without a spear, arms out to carry a desk. */
export function porterSheet() {
  porterSheetCache ??= paintSheet(GUARD, [['walk', 2, 8], ['bow', 1, 1]], (name, frame) => ({
    walk: { kind: 'walk', step: frame * 2, arms: 'carry' },
    bow: { kind: 'bow', arms: 'carry' },
  })[name]);
  return porterSheetCache;
}

