// Generates the Claude Code settings file passed to every agent with `--settings`.
// Its hooks POST each lifecycle event back to this server, which is how the scene
// knows whether an agent is working, asking for a ruling, or done.
import { createHmac } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { PORT, STATE_DIR, TOKEN_HEADER } from './config.js';

// Tools that stop the agent until the user answers.
const BLOCKING_TOOLS = /^(AskUserQuestion|ExitPlanMode)$/;

/**
 * The token an agent sends with its hooks. It is derived from the access token and the
 * agent's own id, so it opens nothing but that agent's /api/hook/<id>: an agent cannot
 * use it to summon, dismiss or type into other agents.
 */
export function hookTokenFor(accessToken, agentId) {
  return createHmac('sha256', accessToken).update(String(agentId)).digest('hex');
}

export function writeHooksSettingsFile() {
  // $GRAND_SECRETARIAT_ID and $GRAND_SECRETARIAT_TOKEN are set in each agent's environment by the session store.
  const command =
    `curl -s -m 2 -X POST -H 'content-type: application/json' -H "${TOKEN_HEADER}: $GRAND_SECRETARIAT_TOKEN" --data-binary @- ` +
    `"http://127.0.0.1:${PORT}/api/hook/$GRAND_SECRETARIAT_ID" >/dev/null 2>&1 || true`;
  const hook = { hooks: [{ type: 'command', command }] };
  const settings = {
    hooks: {
      SessionStart: [hook],
      UserPromptSubmit: [hook],
      PreToolUse: [hook],
      PostToolUse: [hook],
      Notification: [hook],
      Stop: [hook],
      // Sub-agents: each one is shown as a soldier beside its agent (see subagent-soldier-tracker.js).
      SubagentStart: [hook],
      SubagentStop: [hook],
    },
  };
  fs.mkdirSync(STATE_DIR, { recursive: true, mode: 0o700 });
  const file = path.join(STATE_DIR, 'agent-hooks-settings.json');
  fs.writeFileSync(file, JSON.stringify(settings, null, 2), { mode: 0o600 });
  return file;
}

/**
 * Maps a hook payload to the agent status it implies, or null to keep `current`.
 * Statuses: idle (no order yet), working, asking (blocked on the user), done (turn finished).
 *
 * `fromSoldier`: the event was fired inside a sub-agent (it carries agent_id). A soldier's
 * steps are not its master's: they may only raise a petition, never move the master.
 * `soldiersOut`: sub-agents still out after this event. A master whose turn ends while
 * background soldiers are out is waiting on them, not done: it stays at its desk.
 */
export function statusFromHookEvent(event, current, { fromSoldier = false, soldiersOut = 0 } = {}) {
  const status = rawStatusFromHookEvent(event, current);
  if (fromSoldier) return status === 'asking' ? status : null;
  if (status === 'done' && soldiersOut > 0) return current === 'working' ? null : 'working';
  return status;
}

function rawStatusFromHookEvent(event, current) {
  switch (event.hook_event_name) {
    // SessionStart also fires on compaction mid-turn; only a real (re)start means "no order yet".
    case 'SessionStart': return ['startup', 'resume', 'clear'].includes(event.source) ? 'idle' : null;
    case 'UserPromptSubmit': return 'working';
    case 'PreToolUse': return BLOCKING_TOOLS.test(event.tool_name || '') ? 'asking' : 'working';
    case 'PostToolUse': return 'working';
    case 'Stop': return 'done';
    case 'Notification': {
      const kind = event.notification_type || '';
      const text = event.message || '';
      // Idle reminder. A turn interrupted with Esc fires no Stop, so this is what ends "working".
      if (kind === 'idle_prompt') return current === 'working' ? 'done' : null;
      if (kind === 'permission_prompt' || kind === 'elicitation_dialog') return 'asking';
      return /permission|approval|needs your/i.test(text) ? 'asking' : null;
    }
    default: return null;
  }
}
