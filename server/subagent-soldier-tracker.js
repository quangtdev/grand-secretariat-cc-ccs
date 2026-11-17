// Tracks the sub-agents an agent has sent out, from its hook events. Each one is a
// soldier in the court: mustered when the agent calls the Agent (formerly Task) tool,
// dismissed when that sub-agent reports back.
//
//   PreToolUse Agent      -> a soldier is mustered (keyed by tool_use_id, with its task)
//   SubagentStart         -> that soldier learns its agent_id
//   hook with agent_id    -> what that soldier is doing right now
//   PostToolUse Agent     -> a foreground soldier has reported back
//   SubagentStop          -> any soldier (background ones included) has reported back
//   unknown agent_id      -> a sub-agent we never saw sent out (resumed with SendMessage, or
//                            its PreToolUse missed): it is enlisted on the spot, as a background
//                            soldier, so its master stays at the desk until it reports back
import { activityFromHookEvent, delegateTaskFromHookEvent } from './hook-activity-description.js';

const SPAWN_TOOLS = /^(Agent|Task)$/;
const MAX_SOLDIERS = 12; // more than this would crowd the yard; the rest go unseen
const TASK_MAX = 40;

const clip = (text, max) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

/** A soldier for a sub-agent first seen by its own events (no Agent tool call was seen for it). */
function enlistUnseen(soldiers, event, activity = null, activityTask = null) {
  if (soldiers.length >= MAX_SOLDIERS) return soldiers;
  const agentId = String(event.agent_id);
  return [...soldiers, {
    id: `agent:${agentId}`,
    kind: clip(String(event.agent_type || 'sub-agent'), 24),
    task: '',
    background: true, // no tool call of the master's turn waits for it: only SubagentStop ends it
    agentId,
    activity,
    activityTask,
  }];
}

/**
 * Applies one hook event to an agent's soldier list.
 * Returns a new array when something changed, otherwise the same `soldiers` reference.
 */
export function applySubagentHook(soldiers, event) {
  const name = event.hook_event_name;
  const tool = String(event.tool_name || '');

  if (SPAWN_TOOLS.test(tool) && !event.agent_id && (name === 'PreToolUse' || name === 'PostToolUse')) {
    const key = event.tool_use_id;
    if (!key) return soldiers;
    if (name === 'PostToolUse') {
      // An async (background) sub-agent has only been sent off: the tool returns at launch and
      // the sub-agent reports back later with SubagentStop. Recent Claude Code launches agents
      // async by default, without run_in_background in the input, so read the tool response too.
      const launchedAsync = /async|background/i.test(JSON.stringify(event.tool_response ?? '').slice(0, 400));
      if (launchedAsync) {
        // Still out on its errand: mark it so the end of the master's turn does not dismiss it.
        const target = soldiers.find((s) => s.id === key);
        return target && !target.background ? soldiers.map((s) => (s === target ? { ...s, background: true } : s)) : soldiers;
      }
      const next = soldiers.filter((s) => s.id !== key || s.background || s.agentId);
      return next.length === soldiers.length ? soldiers : next;
    }
    if (soldiers.length >= MAX_SOLDIERS || soldiers.some((s) => s.id === key)) return soldiers;
    const input = event.tool_input || {};
    return [...soldiers, {
      id: String(key),
      kind: clip(String(input.subagent_type || 'general-purpose'), 24),
      task: clip(String(input.description || '').split('\n')[0], TASK_MAX),
      background: Boolean(input.run_in_background),
      agentId: null,
      activity: null,
      activityTask: null,
    }];
  }

  switch (name) {
    case 'SubagentStart': {
      // Link the oldest unlinked soldier of that kind (or any unlinked one) to its agent_id.
      const unlinked = soldiers.filter((s) => !s.agentId);
      if (!event.agent_id || soldiers.some((s) => s.agentId === String(event.agent_id))) return soldiers;
      const match = unlinked.find((s) => s.kind === event.agent_type) || unlinked[0];
      if (!match) return enlistUnseen(soldiers, event);
      return soldiers.map((s) => (s === match ? { ...s, agentId: String(event.agent_id) } : s));
    }
    case 'SubagentStop': {
      let gone = soldiers.find((s) => s.agentId && s.agentId === event.agent_id);
      // Never linked (SubagentStart missed): the oldest soldier of that kind is the one back.
      gone ||= soldiers.find((s) => !s.agentId && s.kind === event.agent_type);
      return gone ? soldiers.filter((s) => s !== gone) : soldiers;
    }
    case 'SessionStart':
      return ['startup', 'resume', 'clear'].includes(event.source) && soldiers.length ? [] : soldiers;
    case 'UserPromptSubmit':
    case 'Stop': {
      // A turn interrupted with Esc can leave foreground soldiers without a PostToolUse.
      const next = soldiers.filter((s) => s.background);
      return next.length === soldiers.length ? soldiers : next;
    }
    default: {
      // Tool events fired inside a sub-agent carry its agent_id: that soldier's current step.
      if (!event.agent_id || name !== 'PreToolUse') return soldiers;
      const activity = activityFromHookEvent(event);
      const activityTask = delegateTaskFromHookEvent(event) ?? null;
      const target = soldiers.find((s) => s.agentId === String(event.agent_id));
      if (!target) return enlistUnseen(soldiers, event, activity, activityTask);
      if (target.activity === activity && target.activityTask === activityTask) return soldiers;
      return soldiers.map((s) => (s === target ? { ...s, activity, activityTask } : s));
    }
  }
}

/** Public view of the soldiers, for the session feed. */
export const publicSoldiers = (soldiers = []) => soldiers.map(({ id, kind, task, activity, activityTask }) => ({
  id, kind, task, activity, ...(activity && activityTask != null && { activityKind: 'delegate', activityTask }),
}));
