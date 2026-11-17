// The scribe's desk and the flying edict of the pixel Huế court, as sprites. The desk has one
// frame per height of the pile of finished sheets and per level of the ink pot beside it (the
// ink gauge: 4 levels, full / two thirds / a third / dregs); it always shows the same side (the mat on the
// outside of its flank), whatever turning the porters give it on the way.
import * as THREE from 'three';
import { PALETTE } from '../../scene/court-layout.js';
import { createSpriteSheet, layoutClips, SpriteFigure, clipFrame } from '../../scene/sprite-figure-body.js';
import { ART_PIXEL } from './hue-pixel-iso-mesh-builder.js';
import { createPixelCanvas, pixelCell } from './hue-pixel-sprite-painter.js';

const MAX_SHEETS = 6;
const INK_POT_LEVELS = [4, 3, 1, 0]; // rows of ink in the pot, per gauge frame
const DESK_CELL = { w: 24, h: 16 };
const EDICT_CELL = { w: 12, h: 8 };
const INK = 0x2a1d16;

function paintDesk(c, sheets, inkRows) {
  c.rect(0, 12, 9, 3, PALETTE.straw); // the sitting mat
  c.rect(0, 14, 9, 1, 0xb59a5a);
  c.rect(7, 6, 15, 4, 0x8a6240); // table top
  c.rect(7, 6, 15, 1, 0xa97c52);
  c.rect(7, 10, 15, 2, PALETTE.wood);
  c.rect(8, 12, 2, 3, PALETTE.wood); c.rect(19, 12, 2, 3, PALETTE.wood);
  // The ink pot (the gauge): a pale glass jar, ink in it from the bottom up.
  c.rect(17, 0, 5, 6, 0xcfd6d6); // jar
  c.rect(18, 1, 3, 4, 0x8c9a9c); // its hollow
  if (inkRows) c.rect(18, 5 - inkRows, 3, inkRows, 0x0f0d14); // ink
  c.rect(17, 0, 5, 1, 0xf2f5f2); // rim
  c.rect(10, 6 - sheets, 6, sheets, PALETTE.paper); // finished work piles up
  c.rect(10, 6 - sheets, 6, 1, 0xffffff);
  c.outline(INK);
}

let deskSheetCache;
function deskSheet() {
  if (deskSheetCache) return deskSheetCache;
  const frames = MAX_SHEETS * INK_POT_LEVELS.length; // frame = inkFrame * MAX_SHEETS + sheets - 1
  const { canvas, ctx } = createPixelCanvas(frames * DESK_CELL.w, 2 * DESK_CELL.h);
  for (let i = 0; i < frames; i++) {
    paintDesk(pixelCell(ctx, i * DESK_CELL.w, 0, DESK_CELL.w, DESK_CELL.h), (i % MAX_SHEETS) + 1, INK_POT_LEVELS[Math.floor(i / MAX_SHEETS)]);
  }
  deskSheetCache = createSpriteSheet(canvas, DESK_CELL.w, DESK_CELL.h, layoutClips([['pile', frames, 1]]));
  return deskSheetCache;
}

/** @param {{west: boolean}} slot  @returns {import('../world-pack-contract.js').Workplace} */
export function buildHueDeskSprite(slot) {
  const sprite = new SpriteFigure(deskSheet(), ART_PIXEL, { mirror: !slot.west }); // drawn with the mat on the left
  const group = new THREE.Group();
  group.position.copy(slot.desk);
  group.add(sprite.mesh);
  let sheets = 1;
  let inkFrame = 0;
  const show = () => sprite.play('pile', inkFrame * MAX_SHEETS + sheets - 1);
  return {
    group,
    restRotation: slot.west ? 0 : Math.PI,
    setSheets: (count) => { sheets = Math.min(Math.max(count, 1), MAX_SHEETS); show(); },
    setInk: (left) => { inkFrame = left >= 0.8 ? 0 : left >= 0.4 ? 1 : left > 0.15 ? 2 : 3; show(); },
    dispose() { group.removeFromParent(); sprite.dispose(); },
  };
}

let edictSheetCache;
/** The glaze scroll in flight: two frames, lengthways and end-on, so it seems to tumble. */
export function buildHueEdictSprite() {
  if (!edictSheetCache) {
    const { canvas, ctx } = createPixelCanvas(2 * EDICT_CELL.w, 2 * EDICT_CELL.h);
    const a = pixelCell(ctx, 0, 0, EDICT_CELL.w, EDICT_CELL.h);
    a.rect(1, 2, 10, 3, 0xe3a72b); a.rect(1, 2, 10, 1, 0xf3d27a); a.rect(0, 1, 2, 5, 0xc23a22); a.rect(10, 1, 2, 5, 0xc23a22); a.outline(INK);
    const b = pixelCell(ctx, EDICT_CELL.w, 0, EDICT_CELL.w, EDICT_CELL.h);
    b.rect(4, 1, 4, 5, 0xe3a72b); b.rect(3, 1, 1, 5, 0xc23a22); b.rect(8, 1, 1, 5, 0xc23a22); b.outline(INK);
    edictSheetCache = createSpriteSheet(canvas, EDICT_CELL.w, EDICT_CELL.h, layoutClips([['fly', 2, 8]]));
  }
  const sprite = new SpriteFigure(edictSheetCache, ART_PIXEL, { anchor: 0.5 });
  const group = new THREE.Group();
  group.add(sprite.mesh);
  group.userData.dispose = () => sprite.dispose(); // each flight has its own sprite geometry
  sprite.mesh.onAfterRender = () => sprite.play('fly', clipFrame(edictSheetCache.clips.fly));
  return group;
}
