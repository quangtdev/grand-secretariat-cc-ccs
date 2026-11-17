// As a popup, the agent's terminal steps aside when the user clicks anywhere outside it,
// like any popover. Only a real click counts: a press that turns into a drag (panning or
// turning the court, selecting text) leaves the popup open. A click that opens something
// itself (another figure, a chip, a roster row) is left to do that: the popup switches to
// that agent instead of closing.
const CLICK_SLOP_PX = 5; // further than this between press and release is a drag

/**
 * @param {object} options
 * @param {HTMLElement} options.dock  the popup panel
 * @param {() => boolean} options.isOpenPopup  true while an agent's terminal shows as a popup
 * @param {() => unknown} options.openedKey  changes whenever the dock is opened on something (e.g. the selected id)
 * @param {() => void} options.close  closes the dock
 */
export function attachPopupCloseOnOutsideClick({ dock, isOpenPopup, openedKey, close }) {
  let press = null; // { x, y, key } of a press outside the open popup

  window.addEventListener('pointerdown', (event) => {
    press = null;
    if (event.button !== 0 || !isOpenPopup() || dock.contains(event.target)) return;
    press = { x: event.clientX, y: event.clientY, key: openedKey() };
  }, true);

  window.addEventListener('click', (event) => {
    const start = press;
    press = null;
    if (!start || Math.hypot(event.clientX - start.x, event.clientY - start.y) > CLICK_SLOP_PX) return;
    // Let the click reach its own handlers first (this listener runs in the capture phase);
    // close only if it opened nothing.
    setTimeout(() => {
      if (isOpenPopup() && openedKey() === start.key) close();
    }, 0);
  }, true);

  window.addEventListener('pointercancel', () => { press = null; }, true);
}
