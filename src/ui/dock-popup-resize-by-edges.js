// Popup mode only: resize the panel by dragging any of its edges or corners. The opposite edge
// stays where it is (the popup is centred, so its offset moves by half the change). The size is
// remembered per browser; double-click an edge to return to the default size.
// No handle elements: the panels replace the dock's content on every open, so the edges are
// found from the pointer position against the dock's box instead.

const SIZE_KEY = 'grand-secretariat.popup-size';
const EDGE_PX = 7; // how close to an edge counts as grabbing it
const MIN_WIDTH = 420;
const MIN_HEIGHT = 300;
const WINDOW_MARGIN = 16;
const CURSORS = { '-1,-1': 'nwse', '1,1': 'nwse', '1,-1': 'nesw', '-1,1': 'nesw', '-1,0': 'ew', '1,0': 'ew', '0,-1': 'ns', '0,1': 'ns' };

const load = () => {
  try {
    const { w, h } = JSON.parse(localStorage.getItem(SIZE_KEY)) || {};
    return Number.isFinite(w) && Number.isFinite(h) ? { w, h } : null;
  } catch { return null; }
};
const save = (size) => {
  try { size ? localStorage.setItem(SIZE_KEY, JSON.stringify(size)) : localStorage.removeItem(SIZE_KEY); } catch { /* storage blocked */ }
};

/**
 * @param {{shell: HTMLElement, dock: HTMLElement, isPopup: () => boolean,
 *   drag: {offset: () => {x: number, y: number}, moveTo: (o: {x: number, y: number}, opts?: {persist?: boolean}) => void}}} options
 */
export function attachPopupResizeByEdges({ shell, dock, isPopup, drag }) {
  let size = load(); // null: the stylesheet's default size

  const clampSize = ({ w, h }) => ({
    w: Math.round(Math.min(window.innerWidth - WINDOW_MARGIN, Math.max(MIN_WIDTH, w))),
    h: Math.round(Math.min(window.innerHeight - WINDOW_MARGIN, Math.max(MIN_HEIGHT, h))),
  });

  function apply(next, { persist = false } = {}) {
    size = next && clampSize(next);
    if (size) {
      shell.style.setProperty('--popup-w', `${size.w}px`);
      shell.style.setProperty('--popup-h', `${size.h}px`);
    } else {
      shell.style.removeProperty('--popup-w');
      shell.style.removeProperty('--popup-h');
    }
    if (persist) save(size);
  }

  /** Which edge the pointer is on, as [x, y] in -1..1, or null away from the edges. */
  function edgeAt(event) {
    if (!isPopup() || dock.hidden) return null;
    const r = dock.getBoundingClientRect();
    const x = event.clientX - r.left < EDGE_PX ? -1 : r.right - event.clientX < EDGE_PX ? 1 : 0;
    const y = event.clientY - r.top < EDGE_PX ? -1 : r.bottom - event.clientY < EDGE_PX ? 1 : 0;
    return x || y ? [x, y] : null;
  }

  // The edge cursor must win over the terminal's own text cursor: set it on the body.
  let shownCursor = null;
  const showCursor = (edge) => {
    const cursor = edge ? `${CURSORS[edge.join(',')]}-resize` : null;
    if (cursor === shownCursor) return;
    shownCursor = cursor;
    document.body.classList.toggle('is-on-popup-edge', Boolean(cursor));
    document.body.style.setProperty('--popup-edge-cursor', cursor || 'auto');
  };
  dock.addEventListener('pointermove', (event) => { if (!event.buttons) showCursor(edgeAt(event)); });
  dock.addEventListener('pointerleave', () => { if (!document.body.classList.contains('is-resizing-popup')) showCursor(null); });

  // Capture phase: an edge press must not reach the terminal or start a header drag.
  dock.addEventListener('pointerdown', (event) => {
    const edge = event.button === 0 && edgeAt(event);
    if (!edge) return;
    event.preventDefault();
    event.stopPropagation();
    dock.setPointerCapture(event.pointerId);
    const rect = dock.getBoundingClientRect();
    const start = { px: event.clientX, py: event.clientY, w: rect.width, h: rect.height, ...drag.offset() };
    const [ex, ey] = edge;
    document.body.classList.add('is-resizing-popup');
    showCursor(edge);
    const move = (e) => {
      apply({ w: start.w + ex * (e.clientX - start.px), h: start.h + ey * (e.clientY - start.py) });
      // Keep the opposite edge still: the centre moves by half of the growth, toward the dragged edge.
      drag.moveTo({ x: start.x + ex * (size.w - start.w) / 2, y: start.y + ey * (size.h - start.h) / 2 });
    };
    const end = () => {
      dock.removeEventListener('pointermove', move);
      dock.removeEventListener('pointerup', end);
      dock.removeEventListener('pointercancel', end);
      document.body.classList.remove('is-resizing-popup');
      showCursor(null);
      apply(size, { persist: true });
      drag.moveTo(drag.offset(), { persist: true });
    };
    dock.addEventListener('pointermove', move);
    dock.addEventListener('pointerup', end);
    dock.addEventListener('pointercancel', end);
  }, true);
  dock.addEventListener('dblclick', (event) => {
    if (!edgeAt(event)) return;
    event.stopPropagation(); // not also the header's "centre it again"
    apply(null, { persist: true });
    drag.moveTo(drag.offset(), { persist: true });
  }, true);
  window.addEventListener('resize', () => apply(size));

  apply(size);
}
