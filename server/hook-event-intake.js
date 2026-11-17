// One hook event from an agent, applied to the store (status, question, activity, soldiers),
// then handed to the two observers: the transcript usage reader (ink) and the annals log.
import { statusFromHookEvent } from './claude-hooks-settings.js';
import { activityFromHookEvent, delegateTaskFromHookEvent, orderFromHookEvent, questionFromHookEvent } from './hook-activity-description.js';
import { annalsEntriesFromHook } from './court-annals-events.js';

/**
 * `observers` = { ink, annals }, both optional. They never throw into the hook path.
 * Their work is fire-and-forget: the agent's hook curl must not wait on a transcript read.
 */
export function handleHookEvent(store, id, event, { ink, annals } = {}) {
  const before = store.statusOf(id);
  store.noteHookEvent(id, event);
  // Soldiers first, so the end of a turn sees which background soldiers are still out.
  store.applySoldierHook(id, event);
  const status = statusFromHookEvent(event, store.statusOf(id), {
    fromSoldier: Boolean(event.agent_id), soldiersOut: store.soldiersOutOf(id),
  });
  if (status) store.setStatus(id, status);
  // Kept only if the agent is (now) asking; setStatus clears it once the petition is answered.
  // A question from the asking tool itself is never replaced by a notification's wording.
  const question = !event.agent_id && questionFromHookEvent(event);
  if (question && store.statusOf(id) === 'asking') {
    store.setQuestion(id, question, { keepExisting: event.hook_event_name === 'Notification' });
  }
  // A step inside a sub-agent belongs to that soldier, not to the agent's own toast.
  if (!event.agent_id) {
    const order = orderFromHookEvent(event);
    store.setActivity(id, activityFromHookEvent(event), order, delegateTaskFromHookEvent(event));
    if (order !== undefined) store.noteOrderSubmitted(id); // a real prompt, not a task notification
  }
  observe(store, id, event, before, { ink, annals });
}

function observe(store, id, event, before, { ink, annals }) {
  try {
    const scribe = store.sessions.get(id);
    if (!scribe) return; // a late hook from a scribe that already left: nothing to record or read
    if (annals) {
      for (const { kind, ...data } of annalsEntriesFromHook(event, before, store.statusOf(id), scribe.repo)) {
        annals.append(kind, scribe, data);
      }
    }
    ink?.onHook(id, event).catch((err) => console.error('[ink] read failed:', err.message));
  } catch (err) {
    console.error('[hook] observer failed:', err.message);
  }
}
