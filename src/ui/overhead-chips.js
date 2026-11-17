// Name chips that float over each figure (and the drum pavilion). They are real
// buttons, so every agent in the scene is reachable by keyboard and screen reader.
import * as THREE from 'three';
import { words } from '../worlds/world-vocabulary.js';
import { activityText } from './activity-text.js';
import { ICONS, escapeHtml, statusOf } from '../status-vocabulary.js';

// Placement order when chips collide: whoever needs the user most keeps its place.
const PRIORITY = ['asking', 'exited', 'done', 'working', 'idle', 'starting'];

export class OverheadChips {
  constructor(container, { onOpen, onSummon, onHover }) {
    this.container = container;
    this.onOpen = onOpen;
    this.onHover = onHover;
    this.chips = new Map(); // session id -> button
    this.anchor = new THREE.Vector3();
    this.sizes = new Map(); // chip -> { width, height, toast }, see #measure
    this.sizesStale = true;
    this.stageWidth = 0;
    new ResizeObserver(() => { this.sizesStale = true; }).observe(container);

    this.summonChip = document.createElement('button');
    this.summonChip.type = 'button';
    this.summonChip.className = 'chip chip-summon';
    this.summonChip.innerHTML = `${ICONS.plus}<span>${words.summonAction}</span>`;
    this.summonChip.addEventListener('click', onSummon);
    container.append(this.summonChip);
  }

  sync(sessions) {
    const live = new Set(sessions.map((s) => s.id));
    for (const [id, chip] of this.chips) {
      if (!live.has(id)) { chip.remove(); this.chips.delete(id); this.sizes.delete(chip); }
    }
    for (const session of sessions) {
      let chip = this.chips.get(session.id);
      if (!chip) {
        chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'chip';
        chip.style.visibility = 'hidden'; // until place() has put it over its figure
        chip.addEventListener('click', () => this.onOpen(session.id));
        chip.addEventListener('pointerenter', () => { this.sizesStale = true; this.onHover(session.id); });
        chip.addEventListener('pointerleave', () => { this.sizesStale = true; this.onHover(null); });
        chip.addEventListener('focus', () => this.onHover(session.id));
        chip.addEventListener('blur', () => this.onHover(null));
        this.chips.set(session.id, chip);
        this.container.append(chip);
        this.sizesStale = true;
      }
      const status = statusOf(session);
      const activity = activityText(session);
      const order = session.order || '';
      const question = session.question || '';
      const troops = session.soldiers || [];
      const soldiers = String(troops.length);
      const roll = JSON.stringify(troops.map((s) => [s.task, s.kind, activityText(s)]));
      if (chip.dataset.status !== session.status || chip.dataset.ticket !== session.ticket || chip.dataset.activity !== activity
        || chip.dataset.roll !== roll || chip.dataset.order !== order || chip.dataset.question !== question) {
        chip.dataset.question = question;
        this.sizesStale = true; // its text is about to change
        chip.dataset.order = order;
        chip.dataset.roll = roll;
        chip.dataset.status = session.status;
        chip.dataset.ticket = session.ticket;
        chip.dataset.activity = activity;
        chip.dataset.soldiers = soldiers;
        // A toast above the chip says what the agent is doing right now (the step) or, when
        // it asks, what it asks. The order it was given and its soldiers (one line each) show
        // only while the chip is hovered or open, so the yard stays calm.
        const orderLine = order ? `<span class="toast-order">${escapeHtml(order)}</span>` : '';
        const stepLine = activity
          ? `<span class="toast-step"><i class="toast-dots" aria-hidden="true"><i></i><i></i><i></i></i>${escapeHtml(activity)}</span>` : '';
        const rollLines = troops.map((s) => {
          const name = s.task || s.kind;
          const kind = s.kind && s.kind !== 'general-purpose' ? `<em>${escapeHtml(s.kind)}</em> ` : '';
          const doing = s.activity ? ` <span class="toast-soldier-step">${escapeHtml(activityText(s))}</span>` : '';
          return `<span class="toast-soldier">${ICONS[words.helperIcon]}${kind}<b>${escapeHtml(name)}</b>${doing}</span>`;
        }).join('');
        const askLine = question ? `<span class="toast-question">${escapeHtml(question)}</span>` : '';
        const toast = activity || troops.length || question ? `<span class="chip-toast">${orderLine}${stepLine}${askLine}${rollLines}</span>` : '';
        // Sub-agents out on errands: a spear and their count.
        const band = soldiers !== '0' ? `<b class="chip-soldiers">${ICONS[words.helperIcon]}${soldiers}</b>` : '';
        const troop = soldiers !== '0' ? ` ${words.helpersOut(troops.length)}` : '';
        chip.innerHTML = `${toast}${ICONS[status.icon]}${band}<span>${escapeHtml(session.ticket)}</span>`;
        const asked = order ? ` Order: ${order}.` : '';
        chip.setAttribute('aria-label', `${session.ticket}: ${question || activity || status.label}.${asked}${troop} Open terminal.`);
      }
    }
  }

  setActive(ids) {
    for (const [id, chip] of this.chips) chip.classList.toggle('is-active', ids.includes(id));
    this.sizesStale = true; // an active chip shows its order and soldiers
  }

  /**
   * Chip sizes are read from the page only when they may have changed (new text, hover,
   * selection), all at once; placing chips every frame then only writes transforms and never
   * forces a layout.
   */
  #measure() {
    this.stageWidth = this.container.clientWidth;
    for (const chip of [...this.chips.values(), this.summonChip]) {
      const toast = chip.firstElementChild?.classList.contains('chip-toast') ? chip.firstElementChild.offsetHeight + 5 : 0;
      this.sizes.set(chip, { width: chip.offsetWidth, height: chip.offsetHeight, toast });
    }
    this.sizesStale = false;
  }

  /** Re-anchor every chip to its figure; called each frame. */
  place(figures, summonAnchor, toScreen) {
    // Chips never cover one another: petitions are placed first and keep their spot,
    // any chip that would overlap an earlier one is lifted above it.
    if (this.sizesStale) this.#measure();
    const order = [...this.chips].sort(([, a], [, b]) => PRIORITY.indexOf(a.dataset.status) - PRIORITY.indexOf(b.dataset.status));
    const placed = [];
    for (const [id, chip] of order) {
      const figure = figures.get(id);
      const point = figure && toScreen(figure.chipAnchor(this.anchor));
      if (point) {
        const size = this.sizes.get(chip);
        const width = size.width;
        // Keep the chip whole inside the stage when its figure stands near an edge.
        point.x = Math.min(Math.max(point.x, width / 2 + 6), Math.max(this.stageWidth - width / 2 - 6, width / 2 + 6));
        // A working chip also carries its toast, so it claims that extra height.
        const height = size.height + size.toast;
        let moved = true;
        while (moved) {
          moved = false;
          for (const other of placed) {
            const overlaps = Math.abs(point.x - other.x) < (width + other.width) / 2 + 4
              && point.y > other.y - other.height - 4 && point.y - height < other.y + 4;
            if (overlaps) { point.y = other.y - other.height - 4; moved = true; }
          }
        }
        placed.push({ x: point.x, y: point.y, width, height });
      }
      this.#move(chip, point);
    }
    // The summon chip stays fully inside the stage even when its pavilion is partly out of view.
    const point = toScreen(summonAnchor);
    if (point) {
      const size = this.sizes.get(this.summonChip);
      const half = size.width / 2 + 8;
      point.x = Math.min(Math.max(point.x, half), this.stageWidth - half);
      point.y = Math.max(point.y, size.height + 8);
    }
    this.#move(this.summonChip, point);
  }

  #move(chip, point) {
    chip.style.visibility = point ? 'visible' : 'hidden';
    if (point) chip.style.transform = `translate(${point.x.toFixed(1)}px, ${point.y.toFixed(1)}px) translate(-50%, -100%)`;
  }
}
