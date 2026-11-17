// Popup mode only: drag the panel by its header (or the tab strip) to move it around the court.
// The offset from the centre is remembered per browser; double-click the header to centre it again.
// Buttons, fields and tabs inside the header keep their own clicks.

const OFFSET_KEY = 'grand-secretariat.popup-offset';
const KEEP_VISIBLE_PX = 96; // this much of the panel always stays on screen, so it can be grabbed back
const HANDLE = '.dock-header, .dock-tabs';
const NOT_A_HANDLE = 'button, input, select, textarea, a, [contenteditable]';

const load = () => {
  try {
    const { x, y } = JSON.parse(localStorage.getItem(OFFSET_KEY)) || {};
    return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : { x: 0, y: 0 };
  } catch { return { x: 0, y: 0 }; }
};
const save = (offset) => {
  try { localStorage.setItem(OFFSET_KEY, JSON.stringify(offset)); } catch { /* storage blocked */ }
};

/**
 * @param {{shell: HTMLElement, dock: HTMLElement, isPopup: () => boolean}} options
 */
export function attachPopupDragToMove({ shell, dock, isPopup }) {
  let offset = load();

  /** Keep enough of the panel on screen, and its header below the top edge. */
  function clamp({ x, y }) {
    const width = dock.offsetWidth;
    const height = dock.offsetHeight;
    if (!width || !height) return { x, y }; // hidden: clamp when it shows
    const maxX = (window.innerWidth + width) / 2 - KEEP_VISIBLE_PX;
    const minY = -(window.innerHeight - height) / 2; // top edge at the top of the window
    const maxY = (window.innerHeight + height) / 2 - KEEP_VISIBLE_PX;
    return {
      x: Math.round(Math.min(maxX, Math.max(-maxX, x))),
      y: Math.round(Math.min(maxY, Math.max(minY, y))),
    };
  }

  function apply(next, { persist = false } = {}) {
    offset = clamp(next);
    shell.style.setProperty('--popup-dx', `${offset.x}px`);
    shell.style.setProperty('--popup-dy', `${offset.y}px`);
    if (persist) save(offset);
  }

  const handleAt = (target) => target instanceof Element && isPopup()
    && target.closest(HANDLE) && !target.closest(NOT_A_HANDLE);

  dock.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || !handleAt(event.target)) return;
    event.preventDefault(); // no text selection while dragging
    const handle = event.target.closest(HANDLE);
    handle.setPointerCapture(event.pointerId);
    const start = { px: event.clientX, py: event.clientY, ...offset };
    document.body.classList.add('is-moving-popup');
    const move = (e) => apply({ x: start.x + e.clientX - start.px, y: start.y + e.clientY - start.py });
    const end = () => {
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', end);
      handle.removeEventListener('pointercancel', end);
      document.body.classList.remove('is-moving-popup');
      apply(offset, { persist: true });
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  });
  dock.addEventListener('dblclick', (event) => {
    if (handleAt(event.target)) apply({ x: 0, y: 0 }, { persist: true });
  });
  window.addEventListener('resize', () => apply(offset));

  apply(offset);
  return { reclamp: () => apply(offset), offset: () => ({ ...offset }), moveTo: apply };
}
