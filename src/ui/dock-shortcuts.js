// Keys that switch agents without leaving the terminal. One place, so they are easy to change.
//   Alt+Down / Alt+Up   next / previous agent (waiting ones first)
//   Alt+W               the agent that has waited on you longest
//   Alt+`               close the dock, or reopen the last agent
const ACTIONS = { ArrowDown: 'next', ArrowUp: 'previous', KeyW: 'waiting', Backquote: 'toggle' };

/** @returns {'next'|'previous'|'waiting'|'toggle'|null} the action a keydown asks for, if any */
export function dockShortcut(event) {
  if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.isComposing) return null;
  // Typing in a form field (summon form, rename) keeps its own keys; the terminal's hidden
  // textarea does not count, the shortcuts are meant to work from inside it.
  const target = event.target;
  if (target instanceof Element && target.closest('input, textarea, select, [contenteditable]') && !target.closest('.xterm')) return null;
  return ACTIONS[event.code] || null;
}

/**
 * Listens on the window in the capture phase, so the keys work wherever focus is and
 * never reach the terminal (and so never the agent).
 */
export function attachDockShortcuts(onAction) {
  window.addEventListener('keydown', (event) => {
    const action = dockShortcut(event);
    if (!action) return;
    event.preventDefault();
    event.stopPropagation();
    if (!event.repeat) onAction(action); // a held key would open a terminal per repeat
  }, true);
}
