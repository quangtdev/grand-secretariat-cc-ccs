// Turns hook events into the words shown in an agent's toast, so the court can be read
// at a glance: the order the agent is carrying out, and the step it is on right now.
import path from 'node:path';

const STEP_MAX = 48;
const ORDER_MAX = 56;
const DELEGATE_PREFIX = 'Sending a soldier: '; // the Huế wording of `activity`; other worlds word it themselves
const BLOCKING_TOOLS = /^(AskUserQuestion|ExitPlanMode)$/;

const clip = (text, max) => {
  const flat = String(text || '').replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
};
const firstLine = (text) => String(text || '').split('\n').find((line) => line.trim()) || '';
const base = (file) => path.basename(String(file));
const host = (url) => { try { return new URL(url).host; } catch { return String(url || ''); } };

const delegateTask = (input) => input.description || input.subagent_type || '';
const isDelegate = (event) => event.hook_event_name === 'PreToolUse' && /^(Agent|Task)$/.test(String(event.tool_name || ''));

/** One tool call as a short phrase: "Editing app.js", "$ npm test", "Searching "foo"". */
function describeTool(tool, input) {
  const file = input.file_path || input.notebook_path;
  switch (tool) {
    case 'Read': return `Reading ${base(file)}`;
    case 'Edit': case 'MultiEdit': case 'NotebookEdit': return `Editing ${base(file)}`;
    case 'Write': return `Writing ${base(file)}`;
    case 'Bash': return `$ ${firstLine(input.command)}`;
    case 'Grep': return `Searching "${input.pattern}"${input.path ? ` in ${base(input.path)}` : ''}`;
    case 'Glob': return `Finding ${input.pattern}`;
    case 'WebSearch': return `Searching web: ${input.query}`;
    case 'WebFetch': return `Reading ${host(input.url)}`;
    case 'Agent': case 'Task': return `${DELEGATE_PREFIX}${delegateTask(input)}`;
    case 'Skill': return `Using skill ${input.skill || input.command || ''}`;
    case 'TodoWrite': {
      // The plan item now in progress says best what the agent is about to do.
      const current = (input.todos || []).find((todo) => todo.status === 'in_progress');
      return current ? (current.activeForm || current.content) : 'Updating the plan';
    }
    default: {
      const mcp = tool.match(/^mcp__(.+?)__(.+)$/);
      const name = mcp ? `${mcp[1].replace(/^claude_ai_/, '')} ${mcp[2]}` : tool;
      const detail = input.description || input.query || input.url || input.path || '';
      return `${name.replace(/_/g, ' ')} ${firstLine(detail)}`;
    }
  }
}

/**
 * The step a working agent is on, for its toast.
 * Returns a string to show, null to clear, or undefined to keep the current one.
 */
export function activityFromHookEvent(event) {
  switch (event.hook_event_name) {
    case 'UserPromptSubmit': return 'Reading the order';
    case 'PreToolUse': {
      const tool = String(event.tool_name || '');
      if (BLOCKING_TOOLS.test(tool)) return null;
      return clip(describeTool(tool, event.tool_input || {}), STEP_MAX);
    }
    // Between tools the agent thinks or writes; the last step stays up so the toast keeps meaning something.
    case 'PostToolUse': return undefined;
    default: return null; // Stop, SessionStart, Notification: nothing in progress
  }
}

/**
 * The task of a delegation step ("scout files" of "Sending a soldier: scout files"), so a world can word
 * the step itself (`words.delegating`). Clipped so that Huế's wording matches `activity` exactly.
 * String for a delegation, null when the step is something else, undefined to keep the current one
 * (same cases as activityFromHookEvent).
 */
export function delegateTaskFromHookEvent(event) {
  if (activityFromHookEvent(event) === undefined) return undefined;
  return isDelegate(event) ? clip(delegateTask(event.tool_input || {}), STEP_MAX - DELEGATE_PREFIX.length) : null;
}

/** The order an agent is carrying out (first line of the user's prompt), or undefined to keep it. */
export function orderFromHookEvent(event) {
  if (event.hook_event_name !== 'UserPromptSubmit') return undefined;
  // Background-task notifications (<task-notification>…) arrive as prompts too; they are not orders.
  if (/^\s*<[a-z-]+>/i.test(String(event.prompt || ''))) return undefined;
  return clip(firstLine(event.prompt), ORDER_MAX) || null;
}

const QUESTION_MAX = 80;

/**
 * What an agent is asking the user, in a few words, when the hook event says so:
 * the first question of AskUserQuestion, a plan waiting for approval, or the text of a
 * permission notification. Undefined when the event carries no question.
 */
export function questionFromHookEvent(event) {
  const tool = String(event.tool_name || '');
  if (event.hook_event_name === 'PreToolUse' && tool === 'AskUserQuestion') {
    const first = event.tool_input?.questions?.[0];
    return clip(firstLine(first?.question || first?.header), QUESTION_MAX) || undefined;
  }
  if (event.hook_event_name === 'PreToolUse' && tool === 'ExitPlanMode') return 'Plan ready for your approval';
  // Only notifications that are themselves a request; an idle reminder is not a question.
  if (event.hook_event_name === 'Notification' && typeof event.message === 'string'
    && ['permission_prompt', 'elicitation_dialog'].includes(event.notification_type)) {
    return clip(firstLine(event.message), QUESTION_MAX) || undefined;
  }
  return undefined;
}
