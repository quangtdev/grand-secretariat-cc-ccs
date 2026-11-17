// One order docket: the card of one agent on the order-rail board. A real <button>, so every
// agent is reachable by keyboard and screen reader. Built once per agent and patched in place
// on every render, so the motion layer (order-rail-docket-motion.js) can keep animating it.
import { words, counted } from '../worlds/world-vocabulary.js';
import { activityText } from '../ui/activity-text.js';
import { inkDetail, inkText, LOW_AT } from '../ui/ink-level-text.js';
import { ICONS, escapeHtml, formatElapsed, statusOf } from '../status-vocabulary.js';

// Six muted dyes, one per agent by a hash of its id: the clip colour tells neighbours apart.
// Identity only, never status (DESIGN.md, the robe dyes).
const DYES = ['oklch(0.52 0.08 255)', 'oklch(0.5 0.07 60)', 'oklch(0.52 0.08 140)', 'oklch(0.48 0.08 330)', 'oklch(0.52 0.06 200)', 'oklch(0.5 0.1 25)'];

function dyeOf(id) {
  let hash = 0;
  for (const char of String(id)) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return DYES[hash % DYES.length];
}

/** The line that matters now: the live step or what is asked. The band already says the status. */
export function stepLine(session) {
  if (session.status === 'working') return activityText(session) || 'Thinking';
  if (session.status === 'asking') return session.question || '';
  return '';
}

/** @returns {HTMLButtonElement} an empty docket for this agent; fill it with patchDocket */
export function createDocket(session) {
  const docket = document.createElement('button');
  docket.type = 'button';
  docket.className = 'docket';
  docket.dataset.id = session.id;
  docket.style.setProperty('--dye', dyeOf(session.id));
  docket.innerHTML = `
    <span class="docket-clip" aria-hidden="true"></span>
    <span class="docket-band"><span class="docket-icon"></span><span class="docket-status"></span><span class="docket-time"></span></span>
    <span class="docket-body">
      <span class="docket-ticket"></span>
      <span class="docket-repo"></span>
      <span class="docket-step"><span class="docket-step-text"></span></span>
      <span class="docket-order"></span>
      <span class="docket-preps"></span>
    </span>
    <span class="docket-foot"><span class="docket-gauge" aria-hidden="true"><span class="docket-gauge-fill"></span></span><span class="docket-ink"></span></span>`;
  return docket;
}

const part = (docket, name) => docket.querySelector(`.docket-${name}`);
/** Sets text only when it changed; returns true if it did. */
function setText(element, text) {
  if (element.textContent === text) return false;
  element.textContent = text;
  return true;
}

/**
 * Brings a docket up to date with its session.
 * @returns {{stepChanged: boolean}} what the motion layer may want to show
 */
export function patchDocket(docket, session, boardWords) {
  const status = statusOf(session);
  if (docket.dataset.status !== session.status) {
    docket.dataset.status = session.status;
    part(docket, 'icon').innerHTML = ICONS[status.icon];
  }
  setText(part(docket, 'status'), status.label);
  setText(part(docket, 'time'), formatElapsed(session.statusSince));
  setText(part(docket, 'ticket'), session.ticket ?? '');
  setText(part(docket, 'repo'), [session.repoName, session.profile].filter(Boolean).join(' · '));

  const step = stepLine(session);
  part(docket, 'step').hidden = !step;
  const stepChanged = setText(part(docket, 'step-text'), step) && Boolean(step);

  const order = part(docket, 'order');
  order.hidden = !session.order;
  if (session.order && order.dataset.text !== session.order) {
    order.dataset.text = session.order;
    order.innerHTML = `<span class="docket-order-label">${escapeHtml(boardWords.order)}</span> ${escapeHtml(session.order)}`;
  }

  // Prep cooks (sub-agents): one slip each, keyed so a new one can print in.
  const preps = part(docket, 'preps');
  const troop = session.soldiers || [];
  preps.hidden = !troop.length;
  const roll = JSON.stringify(troop.map((s) => [s.id, s.task, activityText(s)]));
  if (preps.dataset.roll !== roll) {
    const known = new Set([...preps.children].map((slip) => slip.dataset.id));
    preps.dataset.roll = roll;
    preps.setAttribute('aria-label', counted(words.helper, troop.length));
    preps.innerHTML = troop.map((s) => {
      const text = activityText(s) || s.task || words.helperFallback;
      const fresh = known.has(s.id) ? '' : ' is-fresh';
      return `<span class="prep${fresh}" data-id="${escapeHtml(s.id)}" title="${escapeHtml(s.task || '')}">${ICONS[words.helperIcon]}<span class="prep-text">${escapeHtml(text)}</span></span>`;
    }).join('');
  }

  const ink = session.ink;
  const foot = part(docket, 'foot');
  foot.hidden = !ink;
  if (ink) {
    const pct = Math.max(0, Math.min(100, Math.round(Number(ink.pct) || 0)));
    part(docket, 'gauge-fill').style.transform = `scaleX(${pct / 100})`;
    foot.classList.toggle('is-full', pct >= LOW_AT);
    setText(part(docket, 'ink'), inkText(ink, words));
  }

  const hint = [session.order && `${boardWords.order}: ${session.order}`, step, session.repo, inkDetail(ink, words)].filter(Boolean).join('\n');
  if (docket.title !== hint) docket.title = hint;
  return { stepChanged };
}
