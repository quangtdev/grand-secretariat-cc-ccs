// A strip of tabs at the top of the dock: every agent, waiting ones first, so switching
// terminals never means going back to the rail or the scene.
import { words } from '../worlds/world-vocabulary.js';
import { ICONS, escapeHtml, statusOf, waitingFirst } from '../status-vocabulary.js';

export class DockAgentTabs {
  /** @param {HTMLElement} container  @param {{onOpen: (id: string) => void}} handlers */
  constructor(container, { onOpen }) {
    this.container = container;
    this.rendered = '';
    container.setAttribute('role', 'navigation');
    container.setAttribute('aria-label', words.tabsLabel);
    this.selectedId = null;
    container.title = words.shortcutHint;
    container.addEventListener('click', (event) => {
      const tab = event.target.closest('[data-id]');
      if (tab) onOpen(tab.dataset.id);
    });
  }

  update(sessions, selectedId) {
    const html = waitingFirst(sessions).map((s) => {
      const status = statusOf(s);
      const selected = s.id === selectedId;
      return `<button type="button" class="dock-tab" data-id="${s.id}" data-status="${s.status}"${selected ? ' aria-current="true"' : ''}
        aria-label="${escapeHtml(s.ticket)}: ${escapeHtml(status.label)}">${ICONS[status.icon]}<span>${escapeHtml(s.ticket)}</span></button>`;
    }).join('');
    if (html === this.rendered) return;
    this.rendered = html;
    this.container.innerHTML = html;
    // Bring the open agent's tab into view when the selection changes, not on every status update.
    if (selectedId !== this.selectedId) this.container.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    this.selectedId = selectedId;
  }
}
