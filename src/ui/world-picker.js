// World picker: an icon button in the rail foot that opens a small popover listing the worlds
// (radio options with a one-line description). Arrow keys move through them; clicking one, or Enter / Space
// on it, chooses it: choosing another world reloads the page into it
// (worlds/world-registry.js); choosing the current one just closes. Escape or a click outside
// closes it and focus returns to the button.
import { ICONS, escapeHtml } from '../status-vocabulary.js';
import { chooseWorld, WORLDS } from '../worlds/world-registry.js';

export class WorldPicker {
  /** @param {HTMLElement} container  the group in the rail foot  @param {string} currentId */
  constructor(container, currentId) {
    this.currentId = currentId;
    this.button = document.createElement('button');
    this.button.type = 'button';
    this.button.className = 'button button-quiet sound-toggle world-toggle';
    this.button.title = 'Choose the world';
    this.button.setAttribute('aria-label', 'Choose the world');
    this.button.setAttribute('aria-haspopup', 'dialog');
    this.button.setAttribute('aria-expanded', 'false');
    this.button.innerHTML = ICONS.world;
    this.button.addEventListener('click', () => (this.popover ? this.close() : this.open()));
    container.append(this.button);
    this.onKey = (event) => { if (event.key === 'Escape') { event.stopPropagation(); this.close(); } };
    this.onOutside = (event) => { if (!this.popover.contains(event.target) && !this.button.contains(event.target)) this.close(false); };
  }

  open() {
    const popover = document.createElement('div');
    popover.className = 'world-popover';
    popover.setAttribute('role', 'dialog');
    popover.setAttribute('aria-label', 'Choose the world');
    popover.innerHTML = `<div class="world-options" role="radiogroup" aria-label="World">${WORLDS.map((world) => `
      <label class="world-option">
        <input type="radio" name="world" value="${escapeHtml(world.id)}"${world.id === this.currentId ? ' checked' : ''}>
        <span class="world-option-label">${escapeHtml(world.label)}</span>
        <span class="world-option-note">${escapeHtml(world.description)}</span>
      </label>`).join('')}</div>`;
    // Arrow keys only move the selection through the group; the world changes on a mouse click,
    // or Enter / Space (a keyboard-made click has detail 0), never on the first arrow press.
    popover.addEventListener('click', (event) => {
      if (event.detail > 0) this.#commit(event.target.closest('.world-option')?.querySelector('input'));
    });
    popover.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      this.#commit(document.activeElement?.closest?.('.world-popover') ? document.activeElement : null);
    });
    document.body.append(popover);
    this.popover = popover;
    this.#place();
    this.button.setAttribute('aria-expanded', 'true');
    document.addEventListener('keydown', this.onKey, true);
    document.addEventListener('pointerdown', this.onOutside, true);
    (popover.querySelector('input:checked') ?? popover.querySelector('input'))?.focus();
  }

  #commit(input) {
    if (!input?.value) return;
    if (input.value === this.currentId) this.close();
    else chooseWorld(input.value);
  }

  close(returnFocus = true) {
    if (!this.popover) return;
    this.popover.remove();
    this.popover = null;
    this.button.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', this.onKey, true);
    document.removeEventListener('pointerdown', this.onOutside, true);
    if (returnFocus) this.button.focus();
  }

  /** Above the button, left edges aligned, kept inside the window. */
  #place() {
    const anchor = this.button.getBoundingClientRect();
    const { style } = this.popover;
    style.left = `${Math.max(8, Math.min(anchor.left, window.innerWidth - this.popover.offsetWidth - 8))}px`;
    style.bottom = `${window.innerHeight - anchor.top + 6}px`;
  }
}
