// Which worlds exist, which one is chosen, and how to load it. A world's code is a separate
// chunk, loaded only when chosen. The choice: `?world=<id>` in the URL (for a visit),
// else the one remembered in this browser, else the default. Unknown ids fall back to the default.

/** @type {{id: string, label: string, description: string, load: () => Promise<{default: import('./world-pack-contract.js').WorldPack}>}[]} */
export const WORLDS = [
  {
    id: 'hue-court',
    label: 'Huế court',
    description: 'The throne hall of Huế in 3D: mandarins, guards and a king in a dragon robe.',
    load: () => import('./hue-court/hue-court-world-pack.js'),
  },
  {
    id: 'hue-pixel',
    label: 'Huế court (pixel 2D)',
    description: 'The same court in isometric pixel art: light on the machine, drawn as sprites.',
    load: () => import('./hue-pixel/hue-pixel-world-pack.js'),
  },
  {
    id: 'zoo',
    label: 'Zoo',
    description: 'A friendly menagerie in 3D: every agent is an animal at its feeding trough, with a head zookeeper on the lookout.',
    load: () => import('./zoo/zoo-world-pack.js'),
  },
  {
    id: 'office',
    label: 'Modern office',
    description: 'A glass-walled head office in 3D: every agent is an employee at a desk, with a manager in the corner office.',
    load: () => import('./office/office-world-pack.js'),
  },
  {
    id: 'space-station',
    label: 'Space station',
    description: 'A command bridge above a planet in 3D: every agent is a crew member at a console, with a captain on the bridge.',
    load: () => import('./space-station/space-station-world-pack.js'),
  },
  {
    id: 'order-rail',
    label: 'Order rail (web board)',
    description: 'A plain web board, no 3D: every agent is an order docket on a kitchen rail, sorted into stations by what it needs.',
    load: () => import('./order-rail/order-rail-world-pack.js'),
  },
];

export const DEFAULT_WORLD = 'hue-court';
const KEY = 'grand-secretariat:world';
const known = (id) => WORLDS.some((world) => world.id === id);

export function selectedWorldId() {
  const fromUrl = new URLSearchParams(location.search).get('world');
  if (known(fromUrl)) return fromUrl;
  try {
    const saved = localStorage.getItem(KEY);
    if (known(saved)) return saved;
  } catch { /* storage blocked: the default */ }
  return DEFAULT_WORLD;
}

/** Remembers `id` and reloads the page into it. A `?world=` in the URL would win, so it is dropped. */
export function chooseWorld(id) {
  if (!known(id)) return;
  try { localStorage.setItem(KEY, id); } catch { /* storage blocked: only the URL can choose */ }
  const url = new URL(location.href);
  url.searchParams.delete('world');
  if (!storageWorks()) url.searchParams.set('world', id);
  location.replace(url);
}

function storageWorks() {
  try { return localStorage.getItem(KEY) !== null; } catch { return false; }
}

/** Drops the remembered choice (a world that cannot start must not be chosen again on every load). */
export function forgetWorld() {
  try { localStorage.removeItem(KEY); } catch { /* storage blocked: nothing remembered */ }
}

/** Forgets the choice and reloads into the default world; `?world=` is dropped too, it would win. */
export function resetToDefaultWorld() {
  forgetWorld();
  const url = new URL(location.href);
  url.searchParams.delete('world');
  location.replace(url);
}

/** Loads a world pack; on failure logs, forgets the choice and falls back to the default world. */
export async function loadWorld(id) {
  const entry = WORLDS.find((world) => world.id === id) ?? WORLDS.find((world) => world.id === DEFAULT_WORLD);
  try {
    return (await entry.load()).default;
  } catch (error) {
    console.error(`Could not load world "${entry.id}"`, error);
    if (entry.id === DEFAULT_WORLD) throw error;
    forgetWorld();
    return (await WORLDS.find((world) => world.id === DEFAULT_WORLD).load()).default;
  }
}
