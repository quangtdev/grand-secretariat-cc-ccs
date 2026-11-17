// The Petition Holds Rule for the office's ambient life (DESIGN.md): everything that moves in
// the background stands still while a petition waits and under prefers-reduced-motion. The
// reduced-motion setting is read live, on every step, so a change takes effect without a reload.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/** @param {(dt: number, time: number) => void} step  runs only while the office is calm
 *  @returns {import('../world-pack-contract.js').AmbientLife} */
export function gatedAmbient(step) {
  let petition = false;
  return {
    update: (dt, time) => { if (!petition && !reducedMotion.matches) step(dt, time); },
    settle: (value) => { petition = value; },
  };
}
