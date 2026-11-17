// Petitions the user has sent back to the desk: "not now". An agent that asks (or reports) runs to
// the ruler; when the user is busy they can send it back to sit at its desk while it keeps waiting,
// marked by a bubble over its head, and call it up again later. A deferral holds for one wait
// only: it is keyed by the agent's status and when that status began, so the next question or
// report brings the agent to the ruler again. Kept per browser (localStorage); the server never
// knows, the agent itself is not touched.
const KEY = 'grand-secretariat:deferred';
const DEFERRABLE = new Set(['asking', 'done']);

const keyOf = (session) => `${session.id}:${session.status}:${session.statusSince}`;

function load() {
  try { return new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch { return new Set(); }
}

const deferred = load();

function save() {
  try { localStorage.setItem(KEY, JSON.stringify([...deferred])); } catch { /* storage blocked: holds for this page only */ }
}

/** Can this agent be sent back to its desk right now? */
export const canDefer = (session) => DEFERRABLE.has(session?.status);

/** Sends a waiting agent back to its desk (true) or calls it to the ruler again (false). */
export function setDeferred(session, on) {
  if (!canDefer(session)) return;
  if (on) deferred.add(keyOf(session)); else deferred.delete(keyOf(session));
  save();
}

/**
 * The feed as the page shows it: each agent sent back to its desk carries `deferred: true`.
 * Keys of waits that are over (answered, dismissed) are forgotten.
 */
export function withDeferrals(sessions) {
  const live = new Set(sessions.filter(canDefer).map(keyOf));
  let pruned = false;
  for (const key of deferred) if (!live.has(key)) { deferred.delete(key); pruned = true; }
  if (pruned) save();
  return sessions.map((s) => (deferred.has(keyOf(s)) ? { ...s, deferred: true } : s));
}
