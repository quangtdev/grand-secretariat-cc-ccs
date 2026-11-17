// The order rail board: the stage driver of a board world (worlds/world-pack-contract.js,
// StageDriver). In place of the 3D court it lays every agent out as an order docket on one of
// three stations: at the pass (waiting on the user: asking, done, failed), on the line (working,
// clocking in) and standing by (idle). Dockets are kept per agent and moved between stations,
// so the motion layer can fly them (order-rail-docket-motion.js).
import { words } from '../worlds/world-vocabulary.js';
import { applyVocabularyToPage } from '../ui/apply-vocabulary-to-page.js';
import { ICONS, escapeHtml, formatElapsed, statusOf, waitingFirst } from '../status-vocabulary.js';
import { createDocket, patchDocket } from './order-rail-docket-card.js';
import { glide, measure, print, rollStep, spike, stamp, still } from './order-rail-docket-motion.js';

const stationOf = (session) => {
  if (statusOf(session).atThrone) return 'pass';
  return session.status === 'idle' ? 'ready' : 'line';
};

/**
 * @param {{world: import('../worlds/world-pack-contract.js').BoardWorldPack, handlers: {onOpen: Function, onSummon: Function, onHover: Function}}} options
 * @returns {import('../worlds/world-pack-contract.js').StageDriver}
 */
export function createOrderRailBoard({ world, handlers }) {
  const boardWords = world.board;
  const stageElement = document.getElementById('stage');
  applyVocabularyToPage(true);
  document.getElementById('stage-hint').hidden = true; // the board needs no help to read

  const board = document.createElement('div');
  board.className = 'board';
  board.setAttribute('role', 'region');
  board.setAttribute('aria-label', words.stageLabel);
  const STATIONS = [
    { id: 'pass', name: boardWords.stationPass, empty: boardWords.passEmpty },
    { id: 'line', name: boardWords.stationLine, empty: boardWords.lineEmpty },
    { id: 'ready', name: boardWords.stationReady, empty: boardWords.readyEmpty },
  ];
  board.innerHTML = STATIONS.map((s) => `
    <section class="station" data-station="${s.id}" aria-labelledby="station-${s.id}">
      <header class="station-head">
        <span class="station-rail" aria-hidden="true"></span>
        <h2 class="station-name" id="station-${s.id}">${escapeHtml(s.name)}<span class="station-count">0</span></h2>
        <span class="station-guide"></span>
      </header>
      <div class="station-dockets">
        <p class="station-empty">${escapeHtml(s.empty)}</p>
      </div>
    </section>`).join('');
  stageElement.append(board);

  const lists = Object.fromEntries(STATIONS.map((s) => [s.id, board.querySelector(`[data-station="${s.id}"] .station-dockets`)]));
  // The empty ticket slot ends the idle station: firing a ticket starts a new cook.
  const slot = document.createElement('button');
  slot.type = 'button';
  slot.className = 'docket-slot';
  slot.innerHTML = `${ICONS.plus}<span>${escapeHtml(words.summonAction)}</span>`;
  slot.addEventListener('click', () => handlers.onSummon());
  lists.ready.append(slot);

  /** @type {Map<string, HTMLButtonElement>} */
  const dockets = new Map();
  let sessions = [];
  let layoutSignature = '';
  let calm = false;
  let firstLayout = true;

  board.addEventListener('click', (event) => {
    const docket = event.target.closest('.docket[data-id]');
    if (docket) handlers.onOpen(docket.dataset.id);
  });
  const hover = (event) => handlers.onHover(event.target.closest?.('.docket[data-id]')?.dataset.id || null);
  board.addEventListener('pointerover', hover);
  board.addEventListener('pointerleave', () => handlers.onHover(null));
  board.addEventListener('focusin', hover);
  board.addEventListener('focusout', () => handlers.onHover(null));

  /** Puts every docket in its station, in order, and flies the ones that moved. */
  function layout(next) {
    const before = measure(dockets);
    const stationBefore = new Map([...dockets].map(([id, d]) => [id, d.closest('.station')?.dataset.station]));
    const live = new Set(next.map((s) => s.id));
    for (const [id, docket] of dockets) {
      if (live.has(id)) continue;
      dockets.delete(id);
      // Keyboard focus must not fall to <body>: hand it to a neighbour in the same station.
      if (docket.contains(document.activeElement)) {
        const neighbour = docket.nextElementSibling?.matches('.docket, .docket-slot') ? docket.nextElementSibling : docket.previousElementSibling;
        (neighbour?.matches('.docket, .docket-slot') ? neighbour : slot).focus({ preventScroll: true });
      }
      const rect = before.get(id);
      if (rect) spike(docket, rect, board); else docket.remove();
    }
    const fresh = [];
    const order = { pass: [], line: [], ready: [] };
    for (const session of waitingFirst(next)) order[stationOf(session)].push(session);
    for (const station of STATIONS) {
      const list = lists[station.id];
      const anchor = station.id === 'ready' ? slot : null;
      const wanted = order[station.id].map((session) => {
        let docket = dockets.get(session.id);
        if (!docket) {
          docket = createDocket(session);
          dockets.set(session.id, docket);
          fresh.push(docket);
        }
        patchDocket(docket, session, boardWords);
        return docket;
      });
      // Re-insert only when the order differs: moving a node would drop keyboard focus from it.
      const current = [...list.querySelectorAll(':scope > .docket')];
      if (current.length !== wanted.length || wanted.some((docket, i) => current[i] !== docket)) {
        const focused = list.contains(document.activeElement) || wanted.includes(document.activeElement) ? document.activeElement : null;
        for (const docket of wanted) list.insertBefore(docket, anchor);
        if (focused && !focused.matches(':focus')) focused.focus({ preventScroll: true });
      }
      list.closest('.station').querySelector('.station-empty').hidden = order[station.id].length > 0;
    }
    for (const [id, docket] of dockets) {
      const from = before.get(id);
      if (from) glide(docket, from, stationBefore.get(id) !== docket.closest('.station').dataset.station, calm, board);
    }
    if (!firstLayout) fresh.forEach(print); // the board's first fill appears at once, not as a printing run
    firstLayout = false;
    updateHeads(order);
  }

  /** Station heads: the count, and the oldest wait like the guide words of a page. */
  function updateHeads(order = groups(sessions)) {
    for (const station of STATIONS) {
      const group = order[station.id];
      const head = board.querySelector(`[data-station="${station.id}"] .station-head`);
      head.querySelector('.station-count').textContent = group.length;
      head.classList.toggle('has-waiting', group.some((s) => s.status === 'asking')); // glaze only when someone asks
      const oldest = group.length ? Math.min(...group.map((s) => s.statusSince)) : 0;
      head.querySelector('.station-guide').textContent = group.length ? `${boardWords.oldest} ${formatElapsed(oldest)}` : '';
    }
  }

  function groups(list) {
    const order = { pass: [], line: [], ready: [] };
    for (const session of list) order[stationOf(session)].push(session);
    return order;
  }

  setInterval(() => { // keep the elapsed times fresh
    for (const session of sessions) {
      const docket = dockets.get(session.id);
      if (docket) docket.querySelector('.docket-time').textContent = formatElapsed(session.statusSince);
    }
    updateHeads();
  }, 30_000);

  return {
    sync(next) {
      sessions = next;
      // Only a change of who is here or where they stand moves dockets; text waits for render().
      const signature = waitingFirst(next).map((s) => `${s.id}:${stationOf(s)}`).join('|');
      if (signature !== layoutSignature) {
        layoutSignature = signature;
        layout(next);
      }
    },
    render(next) {
      sessions = next;
      for (const session of next) {
        const docket = dockets.get(session.id);
        if (!docket) continue;
        const { stepChanged } = patchDocket(docket, session, boardWords);
        if (stepChanged) rollStep(docket.querySelector('.docket-step-text'));
      }
      updateHeads();
    },
    highlight(ids, selectedId) {
      for (const [id, docket] of dockets) {
        docket.classList.toggle('is-hovered', ids.includes(id) && id !== selectedId);
        if (id === selectedId) docket.setAttribute('aria-current', 'true'); else docket.removeAttribute('aria-current');
      }
    },
    hovered() {},
    focus(id) {
      dockets.get(id)?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: still() ? 'auto' : 'smooth' });
    },
    release() {},
    setPowerSaver(on) {
      calm = on;
      board.classList.toggle('is-calm', on);
    },
    dictate() {},
    edict(id) {
      const docket = dockets.get(id);
      if (docket) stamp(docket);
    },
    debug: { board, dockets },
  };
}
