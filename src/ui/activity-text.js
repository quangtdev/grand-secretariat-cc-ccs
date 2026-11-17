// The step an agent or helper is on, worded by the current world. The server sends the Huế text in
// `activity` and, for a delegation, also `activityKind: 'delegate'` + `activityTask` so each world can word it.
import { words } from '../worlds/world-vocabulary.js';

/** @param {{activity?: string|null, activityKind?: string, activityTask?: string}} entry a session or a helper of the feed */
export const activityText = (entry) => (entry.activityKind === 'delegate' ? words.delegating(entry.activityTask) : entry.activity || '');
