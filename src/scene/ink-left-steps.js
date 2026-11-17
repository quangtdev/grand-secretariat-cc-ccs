// How much ink is LEFT on a scribe's workplace gauge, from the session's context use.
// `ink.pct` (0..100, integer) is how full the context is; the gauge shows the remainder,
// quantised to 5 % steps so a workplace is touched a handful of times per task, never per frame.
export const INK_STEP = 0.05;

/**
 * @param {{pct?: number} | null | undefined} ink  `session.ink`: absent before the first turn, null after /clear
 * @returns {number} ink left, 0..1 in steps of 0.05; 1 (full) when there is no reading
 */
export function inkLeftSteps(ink) {
  const pct = ink?.pct;
  if (typeof pct !== 'number' || !Number.isFinite(pct)) return 1;
  const left = 1 - Math.min(Math.max(pct, 0), 100) / 100;
  return Math.round(left / INK_STEP) * INK_STEP;
}
