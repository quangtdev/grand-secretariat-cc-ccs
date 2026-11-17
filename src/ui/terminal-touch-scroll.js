// Touch scrolling for the dock's terminal. xterm.js 6 scrolls with the wheel and its scrollbar
// only, so on a phone a finger drag did nothing and earlier output could not be read.
// A one-finger vertical drag is turned into scrolling here, with a short glide after a flick.

const GLIDE_FRICTION = 0.94; // share of the speed kept per 16 ms of glide
const GLIDE_STOP = 0.02; // px/ms: below this the glide ends
const FLICK_MAX_PAUSE_MS = 80; // a finger that rested this long before lifting does not flick
const AXIS_LOCK_PX = 6; // travel before a drag is read as up-down (ours) or sideways (the browser's)

/**
 * @param {HTMLElement} host   the element the terminal was opened in
 * @param {import('@xterm/xterm').Terminal} term
 * @returns {() => void} removes the listeners and stops any glide
 */
export function enableTerminalTouchScroll(host, term) {
  let lastY = 0;
  let lastX = 0;
  let lastAt = 0;
  let speed = 0; // px/ms, positive = towards later output
  let pending = 0; // pixels not yet turned into whole lines
  let glide = 0; // requestAnimationFrame id while gliding
  let dragging = false;
  let vertical = false; // this drag has been read as up-down
  let startX = 0;
  let startY = 0;
  let finger = null; // the element the finger landed on: its touch events are the ones to follow

  const stopGlide = () => { cancelAnimationFrame(glide); glide = 0; };

  /** Scroll by a pixel distance; positive moves towards later output, like a wheel's deltaY. */
  const scrollBy = (pixels) => {
    const plainScrollback = term.buffer.active.type === 'normal' && term.modes.mouseTrackingMode === 'none';
    const lineHeight = (term.element?.querySelector('.xterm-screen')?.clientHeight || 0) / term.rows || 16;
    pending += pixels;
    const lines = Math.trunc(pending / lineHeight);
    if (!lines) return;
    pending -= lines * lineHeight;
    if (plainScrollback) { term.scrollLines(lines); return; }
    // A full-screen program (alternate screen, or one that tracks the mouse) scrolls itself:
    // hand xterm wheel events and it reports them to the program exactly as a real wheel would.
    // One line-mode event per line: xterm slows small pixel deltas down as if from a trackpad.
    const screen = term.element?.querySelector('.xterm-screen');
    for (let line = Math.abs(lines); line > 0 && screen; line--) {
      screen.dispatchEvent(new WheelEvent('wheel', {
        deltaY: Math.sign(lines), deltaMode: WheelEvent.DOM_DELTA_LINE, clientX: lastX, clientY: lastY, bubbles: true, cancelable: true,
      }));
    }
  };

  const release = () => {
    finger?.removeEventListener('touchmove', onMove);
    finger?.removeEventListener('touchend', onEnd);
    finger?.removeEventListener('touchcancel', onEnd);
    finger = null;
  };

  const onStart = (event) => {
    stopGlide();
    release();
    // Not xterm's own scrollbar (it follows the finger itself), nor a popup edge being resized.
    const elsewhere = event.target.closest?.('.scrollbar') || document.body.classList.contains('is-resizing-popup');
    dragging = event.touches.length === 1 && !elsewhere;
    if (!dragging) return;
    // Touch events keep going to the element first touched, even after a redraw takes it out of
    // the page (the DOM renderer replaces its rows); from there they would no longer reach the host.
    finger = event.target;
    finger.addEventListener('touchmove', onMove, { passive: false });
    finger.addEventListener('touchend', onEnd);
    finger.addEventListener('touchcancel', onEnd);
    ({ clientX: lastX, clientY: lastY } = event.touches[0]);
    startX = lastX;
    startY = lastY;
    vertical = false;
    lastAt = event.timeStamp;
    speed = 0;
    pending = 0;
  };

  const onMove = (event) => {
    if (!dragging || event.touches.length !== 1) { dragging = false; return; }
    const { clientX, clientY } = event.touches[0];
    if (!vertical) {
      const acrossX = Math.abs(clientX - startX);
      const acrossY = Math.abs(clientY - startY);
      if (Math.max(acrossX, acrossY) < AXIS_LOCK_PX) return; // too early to tell
      // A sideways drag is left to the browser: it pans a zoomed-in page, or anything wider than the screen.
      if (acrossX > acrossY) { dragging = false; return; }
      vertical = true;
    }
    event.preventDefault(); // the drag belongs to the terminal: no page scroll, no pull-to-refresh
    const pixels = lastY - clientY; // finger up = later output
    const elapsed = Math.max(1, event.timeStamp - lastAt);
    speed = speed * 0.6 + (pixels / elapsed) * 0.4; // smoothed, so one jittery sample does not set the flick
    lastX = clientX;
    lastY = clientY;
    lastAt = event.timeStamp;
    scrollBy(pixels);
  };

  const onEnd = (event) => {
    release();
    if (!dragging) return;
    dragging = false;
    if (event.type === 'touchcancel' || event.timeStamp - lastAt > FLICK_MAX_PAUSE_MS) return;
    let previous = performance.now();
    const step = (now) => {
      const elapsed = Math.min(50, now - previous);
      previous = now;
      speed *= GLIDE_FRICTION ** (elapsed / 16);
      if (Math.abs(speed) < GLIDE_STOP) { glide = 0; return; }
      scrollBy(speed * elapsed);
      glide = requestAnimationFrame(step);
    };
    glide = requestAnimationFrame(step);
  };

  host.addEventListener('touchstart', onStart, { passive: true });
  return () => {
    stopGlide();
    release();
    host.removeEventListener('touchstart', onStart);
  };
}
