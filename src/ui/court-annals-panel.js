// The dock's annals: a read-only chronicle of one day, grouped by scribe (dismissed ones included).
// Fetched once per day shown; reopen the panel to refresh. Mirrors the History panel's shape.
import { fetchAnnals } from '../api-client.js';
import { words } from '../worlds/world-vocabulary.js';
import { ICONS, escapeHtml } from '../status-vocabulary.js';
import { dockModeToggleHtml } from './dock-popup-or-docked-presentation.js';
import { annalsCounts, clockTime, dayLabel } from './court-annals-text.js';

const section = (title, rows, cls = '') => (rows ? `<h3 class="annals-heading">${title}</h3><ul class="annals-list ${cls}">${rows}</ul>` : '');

function scribeHtml(s) {
  const orders = s.orders.map((o) => `<li><time>${clockTime(o.t)}</time><span>${escapeHtml(o.text)}</span></li>`).join('');
  const commits = s.commits.map((c) => `<li><time>${clockTime(c.t)}</time><span>${escapeHtml(c.msg)}</span></li>`).join('');
  const files = s.files.map((f) => `<li>${escapeHtml(f)}</li>`).join('');
  const more = s.fileCount - s.files.length;
  const left = s.left ? ` · ${escapeHtml(words.historyLeft)} ${clockTime(s.left)}` : '';
  return `<details class="annals-scribe">
    <summary>
      <span class="annals-name">${escapeHtml(s.ticket)}</span>
      <span class="annals-meta" title="${escapeHtml(s.repo)}">${escapeHtml(s.repoName)}${left}</span>
      <span class="annals-counts">${escapeHtml(annalsCounts(s))}</span>
    </summary>
    ${section('Orders', orders)}${section('Commits', commits)}${section('Files', files + (more > 0 ? `<li>and ${more} more</li>` : ''), 'annals-files')}
  </details>`;
}

export class CourtAnnalsPanel {
  /** @param {HTMLElement} dock  @param {{onClose: () => void}} handlers */
  constructor(dock, { onClose }) {
    this.dock = dock;
    this.onClose = onClose;
  }

  /** Opens on the day the server picks (today, or the latest earlier day when today is still empty). */
  open() {
    this.dock.innerHTML = `
      <header class="dock-header">
        <div class="dock-title">
          <h2>${escapeHtml(words.annalsTitle)}</h2>
          <p class="dock-meta">${escapeHtml(words.annalsLead)}</p>
        </div>
        ${dockModeToggleHtml()}
        <button type="button" class="button button-icon" id="dock-close" aria-label="Close panel">${ICONS.close}</button>
      </header>
      <nav class="annals-days" aria-label="Day">
        <button type="button" class="button button-icon annals-step" data-step="prev" aria-label="Previous day" disabled>${ICONS.chevronLeft}</button>
        <span class="annals-day" id="annals-day" aria-live="polite"></span>
        <button type="button" class="button button-icon annals-step" data-step="next" aria-label="Next day" disabled>${ICONS.chevronRight}</button>
      </nav>
      <div class="annals" id="annals"><p class="form-skeleton">Reading the annals.</p></div>`;
    this.dock.querySelector('#dock-close').addEventListener('click', this.onClose);
    this.dock.querySelector('.annals-days').addEventListener('click', (event) => {
      const day = event.target.closest('[data-step]')?.dataset.day;
      if (day) this.#show(day);
    });
    this.#show();
  }

  async #show(day) {
    const host = this.dock.querySelector('#annals');
    this.dock.querySelectorAll('.annals-step').forEach((b) => { b.disabled = true; });
    let data;
    try {
      data = await fetchAnnals(day);
    } catch (err) {
      if (host.isConnected) host.innerHTML = `<p class="form-error" role="alert">Could not read the annals: ${escapeHtml(err.message)}.</p>`;
      return;
    }
    if (!host.isConnected) return; // panel was closed or replaced while loading
    this.dock.querySelector('#annals-day').textContent = dayLabel(data.day, data.today);
    for (const [step, target] of [['prev', data.prevDay], ['next', data.nextDay]]) {
      const button = this.dock.querySelector(`[data-step="${step}"]`);
      button.disabled = !target;
      button.dataset.day = target || '';
    }
    host.scrollTop = 0;
    host.innerHTML = data.scribes.length
      ? data.scribes.map(scribeHtml).join('')
      : `<p class="annals-empty">${escapeHtml(words.annalsEmpty)}</p>`;
  }
}
