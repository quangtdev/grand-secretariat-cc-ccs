// One line under the dock header that says what this agent is doing right now:
//   working -> the order it was given › its current step, its soldiers, how long
//   asking  -> what it needs from you; done / failed / idle -> the status in words
// It is always one line tall, so the terminal never jumps when the status changes.
import { words } from '../worlds/world-vocabulary.js';
import { activityText } from './activity-text.js';
import { inkText, inkDetail, LOW_AT } from './ink-level-text.js';
import { ICONS, escapeHtml, formatElapsed, statusOf } from '../status-vocabulary.js';

export class DockActivityStrip {
  /** @param {HTMLElement} container */
  constructor(container) {
    this.container = container;
    this.rendered = '';
    this.rollOpen = false;
    container.addEventListener('click', (event) => {
      if (!event.target.closest('.activity-soldiers')) return;
      this.rollOpen = !this.rollOpen;
      this.rendered = ''; // force a redraw with the roll open or closed
      this.update(this.session);
    });
  }

  update(session) {
    if (!session) return;
    this.session = session;
    const status = statusOf(session);
    const troops = session.soldiers || [];
    if (!troops.length) this.rollOpen = false;

    let line;
    if (session.status === 'working') {
      const order = session.order ? `<span class="activity-order">${escapeHtml(session.order)}</span><span class="activity-sep" aria-hidden="true">›</span>` : '';
      line = `${order}<span class="activity-step">${escapeHtml(activityText(session) || 'Thinking')}</span>`;
    } else {
      // An asking agent says what it asks, when the server could tell (see hook-activity-description.js).
      line = `<span class="activity-step">${escapeHtml(session.question || status.label)}</span>`;
    }
    const soldiers = troops.length
      ? `<button type="button" class="activity-soldiers" aria-expanded="${this.rollOpen}" title="${escapeHtml(words.helpersTitle)}">${ICONS[words.helperIcon]}${troops.length}</button>` : '';
    const roll = this.rollOpen ? `<ul class="activity-roll">${troops.map((s) => {
      const kind = s.kind && s.kind !== 'general-purpose' ? `<em>${escapeHtml(s.kind)}</em> ` : '';
      const doing = s.activity ? `<span class="activity-roll-step">${escapeHtml(activityText(s))}</span>` : '';
      return `<li>${ICONS[words.helperIcon]}<span>${kind}<b>${escapeHtml(s.task || s.kind || words.helperFallback)}</b></span>${doing}</li>`;
    }).join('')}</ul>` : '';

    // Compact "~62%" (the word is in the tooltip); once low, the full phrase so the change is readable.
    const ink = session.ink ? `<span class="activity-ink" title="${escapeHtml(inkDetail(session.ink, words))}">${escapeHtml(session.ink.pct >= LOW_AT ? inkText(session.ink, words) : inkText(session.ink, words).split(' ')[0])}</span>` : '';
    const html = `${ICONS[status.icon]}${line}${soldiers}${ink}<span class="activity-time">${formatElapsed(session.statusSince)}</span>${roll}`;
    this.container.dataset.status = session.status;
    if (html === this.rendered) return;
    this.rendered = html;
    this.container.innerHTML = html;
    this.container.title = session.status === 'working' && session.order ? `Order: ${session.order}` : '';
  }
}
