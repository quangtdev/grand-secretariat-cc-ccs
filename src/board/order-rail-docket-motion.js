// The order rail's motion, all with the Web Animations API so a new change interrupts the old one
// cleanly. One authored moment, the docket swing: a docket that changes station flies there along
// a short arc (FLIP) and swings from its clip as it lands. The rest is quiet support: a new
// docket prints out of the rail, a dismissed one is spiked, a new step rolls in, a sent order
// stamps the docket. Reduced motion keeps every change as a crossfade, without travel or swing.
const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
// Resting and lifted docket shadows; keep in step with --docket-shadow in styles/order-rail-board.css.
const SHADOW = '0 1px 2px oklch(0.2 0.01 240 / 0.14), 0 2px 6px oklch(0.2 0.01 240 / 0.08)';
const SHADOW_LIFTED = '0 10px 18px oklch(0.2 0.01 240 / 0.18), 0 22px 40px oklch(0.2 0.01 240 / 0.14)';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
/** True when movement should be cut down to crossfades. */
export const still = () => reducedMotion.matches;

/** Records where every docket stands now (the First of FLIP). */
export function measure(dockets) {
  const rects = new Map();
  for (const [id, docket] of dockets) if (docket.isConnected) rects.set(id, docket.getBoundingClientRect());
  return rects;
}

/** Where `rect` (viewport coordinates) sits inside the positioned, possibly scrolled `layer`. */
function placeIn(layer, rect) {
  const box = layer.getBoundingClientRect();
  return { left: rect.left - box.left - layer.clientLeft + layer.scrollLeft, top: rect.top - box.top - layer.clientTop + layer.scrollTop };
}

/**
 * Plays the move from `from` to where the docket stands now (Last, Invert, Play).
 * A move to another station is flown by a stand-in drawn over the whole board (`layer`): the
 * station lists scroll, so they clip anything outside their own column.
 * @param {boolean} changedStation  the authored travel: arc and swing; otherwise a short glide
 * @param {boolean} calm            power saver: a straight flight, no arc or swing
 */
export function glide(docket, from, changedStation, calm, layer) {
  const to = docket.getBoundingClientRect();
  const dx = from.left - to.left;
  const dy = from.top - to.top;
  if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
  // Scripted moves only: the CSS petition call must keep running (a cancelled CSS animation stays dead).
  docket.getAnimations().filter((animation) => !(animation instanceof CSSAnimation)).forEach((animation) => animation.cancel());
  docket.dispatchEvent(new Event('order-rail:cancel-flight'));
  if (still()) {
    docket.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
    return;
  }
  if (!changedStation) {
    docket.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 300, easing: EASE_OUT });
    return;
  }
  const flyer = docket.cloneNode(true);
  flyer.removeAttribute('data-id');
  flyer.removeAttribute('aria-current');
  flyer.setAttribute('aria-hidden', 'true');
  flyer.tabIndex = -1;
  const start = placeIn(layer, from);
  Object.assign(flyer.style, { position: 'absolute', left: `${start.left}px`, top: `${start.top}px`, width: `${to.width}px`, margin: '0', zIndex: '3', pointerEvents: 'none', animation: 'none' });
  layer.append(flyer);
  docket.style.visibility = 'hidden';
  const tx = -dx;
  const ty = -dy;
  // Lifted off the rail, carried across, set down: the arc rises with the distance travelled.
  const lift = calm ? 0 : Math.min(48, 14 + Math.hypot(dx, dy) * 0.08);
  const lean = calm ? 0 : Math.sign(tx || 1) * -3; // trails behind the hand that carries it
  const travel = flyer.animate([
    { transform: 'none', boxShadow: SHADOW },
    { transform: `translate(${tx * 0.5}px, ${ty * 0.5 - lift}px) rotate(${lean}deg) scale(${calm ? 1 : 1.03})`, boxShadow: SHADOW_LIFTED, offset: 0.45 },
    { transform: `translate(${tx}px, ${ty}px)`, boxShadow: SHADOW },
  ], { duration: calm ? 420 : 560, easing: 'cubic-bezier(0.33, 0.9, 0.3, 1)' });
  const land = () => {
    flyer.remove();
    docket.style.visibility = '';
  };
  travel.finished.then(() => {
    land();
    if (!calm) swing(docket, -lean);
  }, land);
  // A newer move of the same docket cancels this flight.
  docket.addEventListener('order-rail:cancel-flight', () => travel.cancel(), { once: true });
}

/** A damped pendulum about the clip: the docket settles on the rail. */
function swing(docket, kick) {
  const angles = [kick * 1.3, kick * -0.7, kick * 0.35, kick * -0.15, 0];
  docket.animate([{ transform: 'rotate(0deg)' }, ...angles.map((a) => ({ transform: `rotate(${a}deg)` }))], { duration: 900, easing: 'ease-out' });
}

/** A new docket feeds out of the rail like a printed ticket. */
export function print(docket) {
  if (still()) {
    docket.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: 'ease-out' });
    return;
  }
  docket.animate([
    { clipPath: 'inset(0 0 100% 0)', transform: 'translateY(-10px)' },
    { clipPath: 'inset(0 0 0 0)', transform: 'none' },
  ], { duration: 620, easing: EASE_OUT });
}

/**
 * A dismissed docket is spiked: it drops away where it stood, then is removed. Held absolutely in
 * `layer` at its last place so the dockets below can close the gap at once.
 */
export function spike(docket, rect, layer) {
  const at = placeIn(layer, rect);
  docket.dispatchEvent(new Event('order-rail:cancel-flight'));
  Object.assign(docket.style, { position: 'absolute', left: `${at.left}px`, top: `${at.top}px`, width: `${rect.width}px`, margin: '0', pointerEvents: 'none' });
  docket.removeAttribute('data-id');
  docket.tabIndex = -1;
  layer.append(docket);
  const frames = still()
    ? [{ opacity: 1 }, { opacity: 0 }]
    : [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(28px) rotate(2deg) scale(0.96)' }];
  docket.animate(frames, { duration: 280, easing: 'cubic-bezier(0.7, 0, 0.84, 0)' }).finished.finally(() => docket.remove());
}

/** The live step changed: the new line rolls up into place. */
export function rollStep(textElement) {
  if (still()) return;
  textElement.animate([{ transform: 'translateY(0.7em)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 240, easing: EASE_OUT });
}

/** An order was sent to this docket: it is pressed under the stamp, its band flashes. */
export function stamp(docket) {
  const band = docket.querySelector('.docket-band');
  band?.animate([{ filter: 'brightness(1.6)' }, { filter: 'none' }], { duration: 420, easing: 'ease-out' });
  if (still()) return;
  docket.animate([{ transform: 'none' }, { transform: 'scale(0.965)', offset: 0.3 }, { transform: 'none' }], { duration: 320, easing: EASE_OUT });
}
