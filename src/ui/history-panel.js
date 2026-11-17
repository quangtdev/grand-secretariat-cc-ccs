// The dock's history: scribes that left the court with a conversation to go back to.
// "Recall" brings one back under the same name, resuming where it stopped.
import { fetchHistory, forgetHistoryEntry, recallAgent } from '../api-client.js';
import { words } from '../worlds/world-vocabulary.js';
import { ICONS, escapeHtml } from '../status-vocabulary.js';
import { dockModeToggleHtml } from './dock-popup-or-docked-presentation.js';

/** "just now", "12m ago", "3h ago", "2d ago". */
function formatAgo(since, now = Date.now()) {
  const minutes = Math.max(0, Math.floor((now - since) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 48 * 60) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
}

export class HistoryPanel {
  /** @param {HTMLElement} dock  @param {{onClose: () => void, onRecalled: (id: string) => void}} handlers */
  constructor(dock, { onClose, onRecalled }) {
    this.dock = dock;
    this.onClose = onClose;
    this.onRecalled = onRecalled;
  }

  async open() {
    this.dock.innerHTML = `
      <header class="dock-header">
        <div class="dock-title">
          <h2>History</h2>
          <p class="dock-meta">${escapeHtml(words.historyLead)}</p>
        </div>
        ${dockModeToggleHtml()}
        <button type="button" class="button button-icon" id="dock-close" aria-label="Close panel">${ICONS.close}</button>
      </header>
      <div class="history" id="history"><p class="form-skeleton">Reading the history.</p></div>
      <p class="dock-note" id="history-note" role="status"></p>`;
    this.dock.querySelector('#dock-close').addEventListener('click', this.onClose);
    const host = this.dock.querySelector('#history');
    host.addEventListener('click', (event) => this.#onClick(event));

    let entries;
    try {
      entries = await fetchHistory();
    } catch (err) {
      host.innerHTML = `<p class="form-error" role="alert">Could not read the history: ${escapeHtml(err.message)}.</p>`;
      return;
    }
    if (!host.isConnected) return; // panel was closed while loading
    this.#render(host, entries);
  }

  #render(host, entries) {
    if (!entries.length) {
      host.innerHTML = `<p class="history-empty">${escapeHtml(words.historyEmpty)}</p>`;
      return;
    }
    host.innerHTML = `<ul class="history-list">${entries.map((e) => `
      <li class="history-row" data-id="${escapeHtml(e.id)}">
        <div class="history-text">
          <span class="history-ticket">${escapeHtml(e.ticket)}</span>
          <span class="history-meta" title="${escapeHtml(e.repo)}">${escapeHtml([e.repoName, e.profile].filter(Boolean).join(' · '))} · ${escapeHtml(words.historyLeft)} ${formatAgo(e.leftAt)}</span>
        </div>
        <button type="button" class="button button-primary history-recall" data-action="recall">${ICONS.arrive}<span>${words.recall}</span></button>
        <button type="button" class="button button-icon" data-action="forget" aria-label="Forget ${escapeHtml(e.ticket)}" title="Forget">${ICONS.close}</button>
      </li>`).join('')}</ul>`;
    host.querySelector('[data-action="recall"]')?.focus();
  }

  async #onClick(event) {
    const button = event.target.closest('[data-action]');
    const row = button?.closest('[data-id]');
    if (!row) return;
    const note = this.dock.querySelector('#history-note');
    const { id } = row.dataset;
    button.disabled = true;
    note.textContent = '';
    try {
      if (button.dataset.action === 'recall') {
        button.querySelector('span').textContent = words.recalling;
        await recallAgent(id);
        this.onRecalled(id);
      } else {
        await forgetHistoryEntry(id);
        const list = row.parentElement;
        row.remove();
        if (!list.children.length) this.#render(this.dock.querySelector('#history'), []);
      }
    } catch (err) {
      if (!button.isConnected) return;
      button.disabled = false;
      if (button.dataset.action === 'recall') button.querySelector('span').textContent = words.recall;
      note.textContent = `Could not ${button.dataset.action}: ${err.message}`;
    }
  }
}
