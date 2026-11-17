// Paints one frame of a person into a 24 x 32 cell, in the pixel Huế court's costumes: the mandarin's
// winged cap and robe, the guard's conical hat and tunic, the king's crown and dragon robe all share
// this skeleton and differ by `spec`. The figure is drawn facing the viewer's left (`view` 'f': seen
// from the front, 'b': from behind); the engine mirrors it for the other side. A one-pixel outline
// is added last, which is most of what makes small sprites read.
//
//   spec  { robe, hem, trim, sleeve, skin, hair, hat: 'wing'|'cone'|'crown', hatColor, boots, trousers?, legRows?, drop?, beard?, badge? }
//   pose  { kind: 'stand'|'walk'|'sit'|'kneel'|'bow', step?, arms?: 'down'|'write'|'raise'|'tablet'|'carry'|'point'|'lap',
//           alt?: boolean (the second frame of a loop), spear?: 'up'|'thrust', scroll?: boolean }
import { shade } from './hue-pixel-sprite-painter.js';

export const CELL = { w: 24, h: 32 };
const CX = 12;
const FEET = 30; // last row of the boots
const OUTLINE = 0x2a1d16;

/** Robe rows from `top`, `rows` tall, half-width widening from hw0 to hw1; right edge in shadow, hem darker. */
function robe(c, spec, top, rows, hw0, hw1) {
  for (let r = 0; r < rows; r++) {
    const hw = Math.round(hw0 + ((hw1 - hw0) * r) / Math.max(rows - 1, 1));
    const last = r === rows - 1;
    c.rect(CX - hw, top + r, hw * 2, 1, last ? spec.hem : spec.robe);
    c.rect(CX + hw - 2, top + r, 2, 1, last ? shade(spec.hem, 0.8) : shade(spec.robe, 0.78));
    c.dot(CX - hw, top + r, last ? spec.hem : shade(spec.robe, 1.18));
  }
}

function head(c, spec, view, y) {
  const { skin, hair } = spec;
  c.rect(CX - 2, y, 4, 1, skin); // rounded top corners
  c.rect(CX - 3, y + 1, 6, 4, skin);
  c.rect(CX - 2, y - 1, 4, 1, hair);
  if (view === 'f') {
    c.rect(CX - 2, y, 4, 1, hair);
    c.dot(CX - 2, y + 2, OUTLINE); c.dot(CX + 1, y + 2, OUTLINE); // eyes
    c.dot(CX - 1, y + 4, shade(skin, 0.8));
    if (spec.beard) c.rect(CX - 1, y + 4, 2, 3, spec.beard);
  } else {
    c.rect(CX - 3, y, 6, 4, hair);
    if (spec.beard) c.rect(CX - 2, y + 4, 4, 1, spec.beard);
  }
}

function hat(c, spec, y) {
  const { hatColor: color } = spec;
  if (spec.hat === 'cone') { // nón dấu: a wide cone with a red cord
    c.rect(CX - 1, y - 4, 2, 1, color);
    c.rect(CX - 3, y - 3, 6, 1, color);
    c.rect(CX - 5, y - 2, 10, 1, shade(color, 0.9));
    c.rect(CX - 6, y - 1, 12, 1, shade(color, 0.75));
    c.rect(CX - 3, y - 1, 6, 1, spec.trim);
    return;
  }
  c.rect(CX - 2, y - 4, 4, 1, color);
  c.rect(CX - 3, y - 3, 6, 3, color);
  c.rect(CX - 3, y - 1, 6, 1, spec.trim);
  if (spec.hat === 'wing') { // mũ cánh chuồn: two long wings
    c.rect(CX - 9, y - 3, 6, 1, shade(color, 1.5));
    c.rect(CX + 3, y - 3, 6, 1, shade(color, 1.5));
  } else { // crown: gold finials either side
    c.rect(CX - 5, y - 3, 2, 2, spec.trim);
    c.rect(CX + 3, y - 3, 2, 2, spec.trim);
    c.dot(CX - 1, y - 5, spec.trim); c.dot(CX, y - 5, spec.trim);
  }
}

/** A sleeve hanging from the shoulder (x, y) `len` rows, with a hand at the bottom. */
function sleeve(c, spec, x, y, len, hand = true) {
  c.rect(x, y, 3, len, spec.sleeve);
  c.rect(x, y + len - 1, 3, 1, spec.cuff ?? shade(spec.sleeve, 0.8));
  if (hand) c.rect(x + 1, y + len, 2, 1, spec.skin);
}

function legs(c, spec, step, y = FEET - 1) {
  const lift = step % 4 === 0 ? 1 : 0; // a boot rises on the first and third frames of a walk
  const lift2 = step % 4 === 2 ? 1 : 0;
  const trousers = spec.trousers;
  if (trousers) { const n = spec.legRows ?? 3; c.rect(CX - 3, y - n, 2, n - lift, trousers); c.rect(CX + 1, y - n, 2, n - lift2, trousers); }
  c.rect(CX - 3, y - lift, 3, 2, spec.boots);
  c.rect(CX + 1, y - lift2, 3, 2, spec.boots);
}

function prop(c, spec, view, kind, top) {
  if (kind === 'tablet') { // the jade tablet held before the chest (a sliver beside the body from behind)
    if (view === 'f') c.rect(CX - 1, top + 3, 3, 7, 0x7fc4a4);
    else c.rect(CX + 4, top + 3, 2, 6, 0x7fc4a4);
  }
}

export function paintHumanoid(c, spec, view, pose) {
  const { kind } = pose;
  const bob = kind === 'walk' && pose.step % 2 === 1 ? 1 : 0;
  const seated = kind === 'sit' || kind === 'kneel';
  const headY = (kind === 'bow' ? 13 : kind === 'sit' ? 14 : kind === 'kneel' ? 15 : 9 - bob) + (seated ? 0 : spec.drop ?? 0); // drop: a shorter person, same ground
  const top = headY + 5; // shoulders
  const arms = pose.arms ?? 'down';

  if (seated) {
    robe(c, spec, top, 4, 4, 4);
    robe(c, spec, top + 4, FEET - top - 3, kind === 'sit' ? 5 : 4, kind === 'sit' ? 8 : 6);
    if (kind === 'kneel') c.rect(CX + 2, FEET - 1, 4, 2, spec.boots); // the forward knee's boot
  } else {
    legs(c, spec, kind === 'walk' ? pose.step : 1, FEET - 1);
    robe(c, spec, top - bob, FEET - 2 - (spec.legRows ?? 0) - top + bob, 4, kind === 'bow' ? 5 : 6);
  }
  if (view === 'f') {
    c.rect(CX - 2, top, 4, 2, spec.collar ?? 0xf1e8d2); // crossed collar
    c.dot(CX, top + 2, spec.collar ?? 0xf1e8d2);
    if (spec.badge && !seated) c.rect(CX - 1, top + 5, 2, 2, spec.badge);
  }
  c.rect(CX - 5, top + (seated ? 5 : 7), 10, 1, spec.trim); // belt / sash

  // Arms and what they hold.
  const armY = top + 1;
  if (arms === 'raise') {
    for (const x of [CX - 8, CX + 5]) { c.rect(x, headY - 6, 3, 10, spec.sleeve); c.rect(x + (x < CX ? 1 : 0), headY - 8, 2, 2, spec.skin); }
  } else if (arms === 'write') {
    sleeve(c, spec, CX - 8, armY + 2, 5);
    c.rect(CX + 4, armY + 1, 3, 4, spec.sleeve);
    const lifted = pose.alt ? 2 : 0;
    c.rect(CX + 7, armY + 4 - lifted, 2, 1, spec.skin);
    c.line(CX + 8, armY + 4 - lifted, CX + 9 + (pose.alt ? 1 : 0), armY + 8 - lifted, 0x4a2c1c);
    c.dot(CX + 9 + (pose.alt ? 1 : 0), armY + 8 - lifted, 0x1d1a22);
  } else if (arms === 'tablet' || arms === 'carry') {
    const out = arms === 'carry' ? 3 : 0;
    c.rect(CX - 8 - out, armY + 3, 5 + out, 3, spec.sleeve);
    c.rect(CX + 3, armY + 3, 5 + out, 3, spec.sleeve);
    c.rect(CX - 1, armY + 4, 2, 2, spec.skin);
  } else if (arms === 'lap') {
    sleeve(c, spec, CX - 8, armY + 3, 5);
    sleeve(c, spec, CX + 5, armY + 3, 5);
  } else {
    const swing = kind === 'walk' ? (pose.step % 2 ? 1 : -1) : 0;
    sleeve(c, spec, CX - 8, armY + swing, 7);
    if (arms === 'point') { c.line(CX + 5, armY + 1, CX + 10, armY - 5, spec.sleeve); c.line(CX + 6, armY + 1, CX + 11, armY - 5, spec.sleeve); c.rect(CX + 10, armY - 7, 2, 2, spec.skin); }
    else sleeve(c, spec, CX + 5, armY - swing, 7);
  }
  prop(c, spec, view, arms === 'tablet' ? 'tablet' : '', top);
  if (pose.spear) { // upright at the right hand, or levelled forward (to the left) in a thrust
    if (pose.spear === 'up') { c.rect(CX + 7, 3, 1, 27, 0x4a2c1c); c.rect(CX + 7, 0, 1, 3, 0x9a8a68); c.rect(CX + 6, 3, 3, 2, spec.hem); }
    else { c.line(CX + 6, top + 6, CX - 11, top + 1, 0x4a2c1c); c.rect(CX - 13, top - 1, 3, 2, 0x9a8a68); }
  }

  head(c, spec, view, headY);
  hat(c, spec, headY);
  if (pose.scroll) { // the petition held overhead
    const y = headY - 10 - (pose.alt ? 3 : 0);
    c.rect(CX - 8, y, 16, 3, 0xe3a72b);
    c.rect(CX - 8, y, 16, 1, 0xf3c75a);
    c.rect(CX - 9, y - 1, 2, 5, 0xc23a22);
    c.rect(CX + 7, y - 1, 2, 5, 0xc23a22);
  }
  c.outline(OUTLINE);
}
