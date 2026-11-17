// The left rail: tally, summon and history buttons, and every agent grouped by where it stands.
import { words, counted } from '../worlds/world-vocabulary.js';
import { activityText } from './activity-text.js';
import { inkText, inkDetail } from './ink-level-text.js';
import { ICONS, escapeHtml, formatElapsed, statusOf, waitingFirst } from '../status-vocabulary.js';

export class RosterRail {
  constructor({ tally, roster, summonButton, historyButton, annalsButton }, { onOpen, onSummon, onHistory, onAnnals, onHover }) {
    this.tally = tally;
    this.roster = roster;
    this.sessions = [];
    this.selectedId = null;
    this.connected = true;

    summonButton.innerHTML = `${ICONS.plus}<span>${words.summonAction}</span>`;
    summonButton.addEventListener('click', onSummon);
    // Icon only: the rail is narrow and Summon is the main action.
    historyButton.innerHTML = ICONS.history;
    historyButton.title = words.historyTitle;
    historyButton.setAttribute('aria-label', 'History');
    historyButton.addEventListener('click', onHistory);
    annalsButton.innerHTML = ICONS.annals;
    annalsButton.title = words.annalsTip;
    annalsButton.setAttribute('aria-label', words.annalsTitle);
    annalsButton.addEventListener('click', onAnnals);

    roster.addEventListener('click', (event) => {
      const row = event.target.closest('[data-id]');
      if (row) onOpen(row.dataset.id);
    });
    const hover = (event) => onHover(event.target.closest?.('[data-id]')?.dataset.id || null);
    roster.addEventListener('pointerover', hover);
    roster.addEventListener('pointerleave', () => onHover(null));
    roster.addEventListener('focusin', hover);
    roster.addEventListener('focusout', () => onHover(null));

    setInterval(() => this.render(), 30_000); // keep the elapsed times fresh
  }

  update(sessions, selectedId, connected) {
    this.sessions = sessions;
    this.selectedId = selectedId;
    this.connected = connected;
    this.render();
  }

  render() {
    const ordered = waitingFirst(this.sessions);
    const waiting = ordered.filter((s) => statusOf(s).atThrone);
    const atDesks = ordered.filter((s) => !statusOf(s).atThrone);

    if (this.connected === 'refused') {
      this.tally.textContent = 'The server refused this page. Reload it.';
    } else if (!this.connected) {
      this.tally.textContent = 'Lost the server. Reconnecting.';
    } else if (!this.sessions.length) {
      this.tally.textContent = words.tallyEmpty;
    } else {
      this.tally.textContent = words.tally(this.sessions.length, waiting.length);
    }

    // Keep keyboard focus on the same row across re-renders.
    const focusedId = this.roster.contains(document.activeElement) ? document.activeElement.dataset.id : null;
    this.roster.innerHTML = this.sessions.length
      ? this.#group(words.groupWaiting, waiting) + this.#group(words.groupWorking, atDesks)
      : `<p class="roster-empty">${escapeHtml(words.rosterEmpty)}</p>`;
    if (focusedId) this.roster.querySelector(`[data-id="${focusedId}"]`)?.focus();
  }

  #group(title, sessions) {
    if (!sessions.length) return '';
    const rows = sessions.map((s) => {
      const status = statusOf(s);
      const current = s.id === this.selectedId ? ' aria-current="true"' : '';
      const count = s.soldiers?.length || 0;
      const troop = count ? ` · ${counted(words.helper, count)}` : '';
      // Line two says what matters now: the live step while working, what is asked or the
      // outcome while before the throne. An idle scribe needs no second line.
      let step = '';
      let meta = `${escapeHtml(s.repoName)}${troop}`;
      if (s.status === 'working') step = activityText(s) || 'Thinking';
      else if (status.atThrone) step = s.question || status.label;
      else meta = `${escapeHtml(status.label)} · ${meta}`;
      const ink = inkText(s.ink, words);
      if (ink) meta += ` · ${escapeHtml(ink)}`;
      const hint = [s.order && `Order: ${s.order}`, step, s.repo, inkDetail(s.ink, words)].filter(Boolean).join('\n');
      return `<li><button type="button" class="roster-row" data-id="${s.id}" data-status="${s.status}"${current} title="${escapeHtml(hint)}">
        <span class="roster-icon">${ICONS[status.icon]}</span>
        <span class="roster-ticket">${escapeHtml(s.ticket)}</span>
        <span class="roster-time">${formatElapsed(s.statusSince)}</span>
        ${step ? `<span class="roster-step">${escapeHtml(step)}</span>` : ''}
        <span class="roster-meta">${meta}</span>
      </button></li>`;
    }).join('');
    return `<h2 class="roster-heading">${title} <span class="roster-count">${sessions.length}</span></h2><ul class="roster-list">${rows}</ul>`;
  }
}
