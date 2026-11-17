// Where the dock shows: docked to the right of the court (the default), or as a popup centred
// over it. The choice is remembered per browser. As a popup, the panel grows out of the point
// that opened it (the clicked figure, chip or roster row) and shrinks back when it closes.
import { ICONS } from '../status-vocabulary.js';
import { attachPopupDragToMove } from './dock-popup-drag-to-move.js';
import { attachPopupResizeByEdges } from './dock-popup-resize-by-edges.js';

const MODE_KEY = 'grand-secretariat.dock-mode';
const OPEN_MS = 240;
const CLOSE_MS = 170;
const POINTER_FRESH_MS = 1500; // a click older than this did not open the panel: grow from the centre

const load = () => { try { return localStorage.getItem(MODE_KEY); } catch { return null; } };
const save = (value) => { try { localStorage.setItem(MODE_KEY, value); } catch { /* storage blocked */ } };
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let mode = load() === 'popup' ? 'popup' : 'docked';

const toggleLabel = () => (mode === 'popup' ? 'Dock to the right' : 'Open as a popup');

/** The header button that switches modes. Every dock panel puts it before its close button. */
export function dockModeToggleHtml() {
  const label = toggleLabel();
  return `<button type="button" class="button button-icon" data-dock-mode-toggle aria-label="${label}" title="${label}">${mode === 'popup' ? ICONS.dockRight : ICONS.popup}</button>`;
}

/**
 * @param {{shell: HTMLElement, dock: HTMLElement}} elements
 * @returns {{show: () => void, hide: (cleanup: () => void) => void, isClosing: () => boolean, isPopup: () => boolean}}
 *   show: unhide the dock (grows in as a popup); hide: shrink out, then hide and run cleanup.
 */
export function attachDockPresentation({ shell, dock }) {
  let lastPointer = null; // where the user last pressed, to grow the popup out of
  let closing = null; // the running close animation, cancelled if the dock is shown again
  window.addEventListener('pointerdown', (event) => {
    lastPointer = { x: event.clientX, y: event.clientY, at: performance.now() };
  }, true);

  const animate = () => mode === 'popup' && !reducedMotion.matches;

  /** Grow from the last click if it was just now, otherwise from the centre. */
  function growIn() {
    const rect = dock.getBoundingClientRect();
    const fresh = lastPointer && performance.now() - lastPointer.at < POINTER_FRESH_MS;
    dock.style.transformOrigin = fresh
      ? `${Math.round(lastPointer.x - rect.left)}px ${Math.round(lastPointer.y - rect.top)}px`
      : 'center';
    dock.animate(
      [{ transform: 'scale(0.4)', opacity: 0 }, { transform: 'none', opacity: 1 }],
      { duration: OPEN_MS, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    );
  }

  const isPopup = () => mode === 'popup';
  const drag = attachPopupDragToMove({ shell, dock, isPopup });
  attachPopupResizeByEdges({ shell, dock, isPopup, drag });

  function applyMode() {
    shell.classList.toggle('is-dock-popup', mode === 'popup');
    drag.reclamp(); // the window may have shrunk since the popup was last moved
    for (const button of dock.querySelectorAll('[data-dock-mode-toggle]')) button.outerHTML = dockModeToggleHtml();
  }

  dock.addEventListener('click', (event) => {
    if (!event.target.closest('[data-dock-mode-toggle]')) return;
    mode = mode === 'popup' ? 'docked' : 'popup';
    save(mode);
    applyMode();
    if (animate()) growIn();
    dock.querySelector('[data-dock-mode-toggle]')?.focus(); // the old button was replaced
  });
  applyMode();

  return {
    isPopup,
    isClosing: () => closing !== null,
    show() {
      const wasClosing = closing !== null;
      if (closing) { closing.cancel(); closing = null; }
      const wasHidden = dock.hidden;
      dock.hidden = false;
      if (wasHidden) drag.reclamp();
      if ((wasHidden || wasClosing) && animate()) growIn();
    },
    hide(cleanup) {
      if (closing) return; // already shrinking; its cleanup runs when it ends
      if (dock.hidden || !animate()) { dock.hidden = true; cleanup(); return; }
      closing = dock.animate(
        [{ transform: 'none', opacity: 1 }, { transform: 'scale(0.6)', opacity: 0 }],
        { duration: CLOSE_MS, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' },
      );
      const animation = closing;
      animation.finished.then(() => {
        if (closing !== animation) return; // shown again meanwhile: keep it
        closing = null;
        dock.hidden = true;
        cleanup();
        animation.cancel(); // drop the forwards fill, so the next opening starts clean
      }).catch(() => { /* cancelled by show() */ });
    },
  };
}
