// One vocabulary for agent states and icons, shared by the roster, chips and dock. The state
// *words* (and optionally icons) come from the world pack (worlds/world-vocabulary.js); the
// state logic (`atThrone`: waiting on the user) is the engine's and the same in every world.
import { words } from './worlds/world-vocabulary.js';

const svg = (body) =>
  `<svg class="icon" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const ICONS = {
  brush: svg('<path d="M13.5 2.5 7 9"/><path d="M7 9c-1.6-.3-3 .7-3.2 2.2-.1 1-.6 1.7-1.3 2.1 2.6.6 5.3-.4 5.6-2.6C8.200 10 7.700 9.300 7 9Z"/>'),
  scroll: svg('<path d="M4.500 2.500h7v9.500a1.500 1.500 0 0 0 3 0v-1h-3"/><path d="M4.500 2.500a1.500 1.500 0 0 0-3 0v1h3v8.500a1.500 1.500 0 0 0 1.500 1.500h7"/><path d="M6.500 6h3M6.500 8.500h3"/>'),
  seal: svg('<rect x="2.500" y="2.500" width="11" height="11" rx="2"/><path d="m5.500 8.200 1.800 1.800 3.400-3.800"/>'),
  wait: svg('<circle cx="4" cy="8" r=".6"/><circle cx="8" cy="8" r=".6"/><circle cx="12" cy="8" r=".6"/>'),
  arrive: svg('<path d="M2.500 8h8"/><path d="m7.500 5 3 3-3 3"/><path d="M13.500 3v10"/>'),
  plus: svg('<path d="M8 3v10M3 8h10"/>'),
  close: svg('<path d="m4 4 8 8M12 4l-8 8"/>'),
  bell: svg('<path d="M4 11.500V7.500a4 4 0 0 1 8 0v4"/><path d="M2.500 11.500h11"/><path d="M6.800 13.500a1.300 1.300 0 0 0 2.400 0"/>'),
  music: svg('<path d="M6 12V3.500l7-1.500V10.500"/><circle cx="4.500" cy="12" r="1.500"/><circle cx="11.500" cy="10.500" r="1.500"/>'),
  pencil: svg('<path d="M10.500 2.500 13.500 5.500 5.500 13.500H2.500v-3Z"/><path d="m9 4 3 3"/>'),
  spear: svg('<path d="M3 13 11.500 4.500"/><path d="m10 3 3.500-.500L13 6Z"/><path d="m5 9.500 1.500 1.500"/>'),
  history: svg('<path d="M2.500 8a5.500 5.500 0 1 0 1.600-3.900"/><path d="M2.500 2.500v2.500H5"/><path d="M8 5v3l2 1.500"/>'),
  annals: svg('<path d="M3.500 2.500h8a1 1 0 0 1 1 1v8.500h-8.500a1.500 1.500 0 0 0 0 3h8.500"/><path d="M3.500 2.500v10.500"/><path d="M6.500 5.500h4"/>'),
  chevronLeft: svg('<path d="m10 3.500-4.500 4.500 4.500 4.500"/>'),
  chevronRight: svg('<path d="m6 3.500 4.500 4.500-4.500 4.500"/>'),
  sidebar: svg('<rect x="2" y="2.500" width="12" height="11" rx="1.500"/><path d="M6 2.500v11"/>'),
  popup: svg('<rect x="2" y="2.500" width="12" height="11" rx="1.500"/><rect x="5" y="5.500" width="6" height="5" rx=".800"/>'),
  dockRight: svg('<rect x="2" y="2.500" width="12" height="11" rx="1.500"/><path d="M10 2.500v11"/>'),
  app: svg('<circle cx="8" cy="8" r="2.2"/><path d="M8 1.800v2M8 12.200v2M1.800 8h2M12.200 8h2M3.600 3.600 5 5M11 11l1.400 1.400M3.600 12.400 5 11M11 5l1.400-1.400"/>'),
  leaf: svg('<path d="M3 13c0-6 4-10 10-10 0 6-4 10-10 10Z"/><path d="M3 13 9 7"/>'),
  world: svg('<circle cx="8" cy="8" r="5.500"/><path d="M2.500 8h11"/><path d="M8 2.500c-2.200 2.200-2.200 8.800 0 11M8 2.500c2.200 2.200 2.200 8.800 0 11"/>'),
  paw: svg('<path d="M5.500 10.500c0-1.700 1.100-3 2.500-3s2.500 1.300 2.500 3c0 1.200-.8 2-2.500 2s-2.500-.8-2.500-2Z"/><circle cx="3.500" cy="7" r=".9"/><circle cx="6" cy="4" r=".9"/><circle cx="10" cy="4" r=".9"/><circle cx="12.500" cy="7" r=".9"/>'),
  sign: svg('<rect x="2.500" y="2" width="11" height="7" rx="1"/><path d="M8 9v5"/><path d="M8 4.200v2M8 7.300v.1"/>'),
  ribbon: svg('<circle cx="8" cy="9.500" r="3.500"/><path d="M5.800 6.800 4.200 2h3L8 4.800 8.800 2h3l-1.600 4.800"/>'),
  keyboard: svg('<rect x="1.500" y="4.500" width="13" height="7" rx="1.500"/><path d="M4.500 7.500h1M7.500 7.500h1M10.500 7.500h1M5 9.800h6"/>'),
  ticket: svg('<path d="M2.500 5.500a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v1.200a1.300 1.300 0 0 0 0 2.600v1.200a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V9.300a1.300 1.300 0 0 0 0-2.600Z"/><path d="M9.500 5.500v1M9.500 7.500v1M9.500 9.500v1"/>'),
  laptop: svg('<rect x="3.500" y="3.500" width="9" height="6.500" rx="1"/><path d="M1.500 12.500h13"/>'),
  console: svg('<rect x="2" y="2.5" width="12" height="8" rx="1.5"/><path d="M6 13.5h4M8 10.5v3"/><path d="m4.5 7.5 2-2 1.5 1.500 2-2"/>'),
  comm: svg('<circle cx="8" cy="8" r="1.500"/><path d="M5.200 5.200a3.900 3.900 0 0 0 0 5.600M10.800 5.200a3.900 3.900 0 0 1 0 5.600"/><path d="M3 3a7 7 0 0 0 0 10M13 3a7 7 0 0 1 0 10"/>'),
  check: svg('<circle cx="8" cy="8" r="5.500"/><path d="m5.500 8.200 1.800 1.800 3.200-3.600"/>'),
  drone: svg('<rect x="5" y="6.500" width="6" height="3.500" rx="1.500"/><path d="M2 5h4M10 5h4M4 5v1.500M12 5v1.500"/><path d="M8 10v2.500"/>'),
  leave: svg('<path d="M6.500 2.500h-3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h3"/><path d="M6.500 8h7"/><path d="m10.500 5 3 3-3 3"/>'),
};

const DEFAULT_ICON = { starting: 'arrive', idle: 'wait', working: 'brush', asking: 'scroll', done: 'seal', exited: 'close' };

// `atThrone` states are the ones waiting on the user: the figure walks up to the king (or
// whoever rules the world). `label` and `icon` are read live: they follow the active world.
const state = (key, atThrone) => ({
  get label() { return words.status[key]; },
  get icon() { return words.icons?.[key] ?? DEFAULT_ICON[key]; },
  atThrone,
});

export const STATUS = {
  starting: state('starting', false),
  idle: state('idle', false),
  working: state('working', false),
  asking: state('asking', true),
  done: state('done', true),
  exited: state('exited', true),
};

export const statusOf = (session) => STATUS[session.status] || STATUS.starting;

/** "3m", "2h 05m": how long the agent has been in its current state. */
export function formatElapsed(since, now = Date.now()) {
  const minutes = Math.max(0, Math.floor((now - since) / 60000));
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
}

export function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/**
 * Agents in the order the shell lists them: those waiting on the user first (oldest wait
 * first), then the rest as the feed gives them. Shared by the rail, the dock tabs and the
 * agent-switching shortcuts, so "next" always means the same thing.
 */
export function waitingFirst(sessions) {
  const waiting = sessions.filter((s) => statusOf(s).atThrone).sort((a, b) => a.statusSince - b.statusSince);
  return [...waiting, ...sessions.filter((s) => !statusOf(s).atThrone)];
}

/** Keeps the end of a long path: "/home/me/work/app" -> "…/work/app". */
export function tailOfPath(path, max = 44) {
  if (path.length <= max) return path;
  const parts = path.split('/');
  let tail = parts.pop();
  while (parts.length && tail.length + parts.at(-1).length + 1 <= max - 2) tail = `${parts.pop()}/${tail}`;
  return `…/${tail}`;
}
