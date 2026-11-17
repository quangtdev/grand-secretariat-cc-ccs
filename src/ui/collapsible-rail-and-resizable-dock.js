// Shell layout controls: hide/show the left rail, and drag the dock's left edge to resize it.
// Both choices are remembered per browser (localStorage, best effort).
import { words } from '../worlds/world-vocabulary.js';
import { ICONS } from '../status-vocabulary.js';

const RAIL_KEY = 'grand-secretariat.rail-collapsed';
const DOCK_KEY = 'grand-secretariat.dock-width';
const DOCK_MIN_PX = 360; // the terminal stays usable
const STAGE_MIN_PX = 240; // the court never disappears entirely
const KEY_STEP_PX = 32;

const load = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
const save = (key, value) => {
  try { value === null ? localStorage.removeItem(key) : localStorage.setItem(key, value); } catch { /* storage blocked */ }
};

/**
 * @param {{shell: HTMLElement, rail: HTMLElement, collapseButton: HTMLButtonElement,
 *   expandButton: HTMLButtonElement, resizer: HTMLElement, dock: HTMLElement}} elements
 */
export function attachShellLayoutControls({ shell, rail, collapseButton, expandButton, resizer, dock }) {
  // --- Rail: collapse to nothing, a small button on the stage brings it back -------------
  collapseButton.innerHTML = ICONS.sidebar;
  collapseButton.title = words.railHide;
  collapseButton.setAttribute('aria-label', words.railHide);
  expandButton.innerHTML = ICONS.sidebar;
  expandButton.title = words.railShow;
  expandButton.setAttribute('aria-label', words.railShow);

  const setRailCollapsed = (collapsed, { focus = false } = {}) => {
    shell.classList.toggle('is-rail-collapsed', collapsed);
    rail.hidden = collapsed;
    expandButton.hidden = !collapsed;
    save(RAIL_KEY, collapsed ? '1' : null);
    if (focus) (collapsed ? expandButton : collapseButton).focus();
    clampDock(); // the stage just gained or lost the rail's width
  };
  collapseButton.addEventListener('click', () => setRailCollapsed(true, { focus: true }));
  expandButton.addEventListener('click', () => setRailCollapsed(false, { focus: true }));

  // --- Dock: drag (or arrow keys on) the separator; double-click returns to the default ----
  const maxDockWidth = () => {
    const railWidth = rail.hidden ? 0 : rail.getBoundingClientRect().width;
    return Math.max(DOCK_MIN_PX, shell.clientWidth - railWidth - STAGE_MIN_PX);
  };
  let dockWidth = Number(load(DOCK_KEY)) || null; // null: the stylesheet's default width

  function applyDockWidth(width, { persist = false } = {}) {
    dockWidth = width === null ? null : Math.round(Math.min(maxDockWidth(), Math.max(DOCK_MIN_PX, width)));
    if (dockWidth === null) shell.style.removeProperty('--dock-width');
    else shell.style.setProperty('--dock-width', `${dockWidth}px`);
    resizer.setAttribute('aria-valuenow', String(dockWidth ?? Math.round(dock.getBoundingClientRect().width)));
    if (persist) save(DOCK_KEY, dockWidth === null ? null : String(dockWidth));
  }
  function clampDock() {
    if (dockWidth !== null) applyDockWidth(dockWidth);
  }

  resizer.setAttribute('role', 'separator');
  resizer.setAttribute('aria-orientation', 'vertical');
  resizer.setAttribute('aria-label', 'Resize the panel');
  resizer.setAttribute('aria-valuemin', String(DOCK_MIN_PX));
  resizer.tabIndex = 0;
  resizer.title = 'Drag to resize. Double-click to reset.';

  resizer.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    resizer.setPointerCapture(event.pointerId);
    const startX = event.clientX;
    const startWidth = dock.getBoundingClientRect().width;
    document.body.classList.add('is-resizing-dock');
    const move = (e) => applyDockWidth(startWidth + (startX - e.clientX));
    const end = () => {
      resizer.removeEventListener('pointermove', move);
      resizer.removeEventListener('pointerup', end);
      resizer.removeEventListener('pointercancel', end);
      document.body.classList.remove('is-resizing-dock');
      applyDockWidth(dockWidth, { persist: true });
    };
    resizer.addEventListener('pointermove', move);
    resizer.addEventListener('pointerup', end);
    resizer.addEventListener('pointercancel', end);
  });
  resizer.addEventListener('dblclick', () => applyDockWidth(null, { persist: true }));
  resizer.addEventListener('keydown', (event) => {
    const step = event.key === 'ArrowLeft' ? KEY_STEP_PX : event.key === 'ArrowRight' ? -KEY_STEP_PX : 0;
    if (!step) return;
    event.preventDefault();
    applyDockWidth(dock.getBoundingClientRect().width + step, { persist: true });
  });
  window.addEventListener('resize', clampDock);

  setRailCollapsed(load(RAIL_KEY) === '1');
  applyDockWidth(dockWidth);
}
