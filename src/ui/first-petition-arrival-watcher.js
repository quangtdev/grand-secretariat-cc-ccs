// Spots the moment the throne goes from empty to having a petitioner: an agent comes before
// the ruler (asking, done or exited) while nobody else was already waiting there. The caller
// decides what to do with it (main.js opens that agent's terminal as a popup).
import { statusOf } from '../status-vocabulary.js';

export function createFirstPetitionArrivalWatcher() {
  let before = null; // ids at the throne in the previous feed; null until the first feed

  /**
   * @param {Array<{id: string, status: string, statusSince: number}>} sessions the latest feed
   * @returns {string|null} the agent that just came to an empty throne, or null
   *   (also null on the first feed: agents already waiting when the page loads did not just arrive)
   */
  return function observe(sessions) {
    const waiting = sessions.filter((s) => statusOf(s).atThrone);
    const previous = before;
    before = new Set(waiting.map((s) => s.id));
    if (!previous) return null;
    const arrived = waiting.filter((s) => !previous.has(s.id));
    if (!arrived.length || arrived.length !== waiting.length) return null; // someone was already waiting
    return arrived.sort((a, b) => a.statusSince - b.statusSince)[0].id; // several at once: the first to arrive
  };
}
