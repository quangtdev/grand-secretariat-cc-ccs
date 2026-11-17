// Pure: which annals entries a hook event (and the status change it caused) is worth.
// An entry is {kind, ...data}; court-annals-log.js adds time, scribe and repository.
import path from 'node:path';
import { orderFromHookEvent } from './hook-activity-description.js';

export const ORDER_MAX = 200;
const THRONE = new Set(['asking', 'done']);
const FILE_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit']);
const COMMIT_CMD = /\bgit\s+(?:-C\s+\S+\s+)?commit(?![\w-])/;
const COMMIT_FAILED = /nothing (?:added )?to commit|no changes added|^(?:error|fatal):/im;
const COMMIT_SUMMARY = /^\[[^\]]+\s[0-9a-f]{7,}\]\s*(.+)$/m; // "[main 1a2b3c4] message"

const flat = (text, max) => String(text || '').replace(/\s+/g, ' ').trim().slice(0, max);

/** A path inside the repository is stored relative to it. */
function relativeToRepo(file, repo) {
  if (!repo || !path.isAbsolute(file)) return file;
  const rel = path.relative(repo, file);
  return rel && !rel.startsWith('..') && !path.isAbsolute(rel) ? rel : file;
}

/** `-m "msg"` or `-m 'msg'` (first one); a heredoc or `$(...)` message is not readable here. */
function messageFromCommand(command) {
  const m = /(?:^|\s)-m\s*(?:"([^"$`]*)"|'([^']*)')/.exec(command);
  return m ? flat(m[1] ?? m[2], ORDER_MAX) : '';
}

function responseText(response) {
  if (typeof response === 'string') return response;
  return [response?.stdout, response?.stderr].filter((s) => typeof s === 'string').join('\n');
}

function commitEntry(event) {
  const command = String(event.tool_input?.command || '');
  if (!COMMIT_CMD.test(command) || /--dry-run/.test(command)) return null;
  const text = responseText(event.tool_response);
  // The "[branch sha] message" summary means the commit was made, whatever a hook printed.
  const summary = COMMIT_SUMMARY.exec(text)?.[1];
  if (!summary && COMMIT_FAILED.test(text)) return null;
  const msg = flat(summary, ORDER_MAX) || messageFromCommand(command);
  return msg ? { kind: 'commit', msg } : null;
}

/** `before` / `after`: the scribe's status around this event; `repo`: its working folder. */
export function annalsEntriesFromHook(event, before, after, repo) {
  const entries = [];
  const name = event.hook_event_name;
  if (!event.agent_id) { // a soldier's prompt is not the user's order
    const order = orderFromHookEvent(event);
    if (order !== undefined) {
      const text = flat(event.prompt, ORDER_MAX);
      if (text) entries.push({ kind: 'order', text });
    }
  }
  if (name === 'PostToolUse' && FILE_TOOLS.has(event.tool_name)) {
    const file = event.tool_input?.file_path || event.tool_input?.notebook_path;
    if (typeof file === 'string' && file) entries.push({ kind: 'file', path: relativeToRepo(file, repo) });
  }
  if (name === 'PostToolUse' && event.tool_name === 'Bash') {
    const commit = commitEntry(event);
    if (commit) entries.push(commit);
  }
  if (before !== after) {
    if (THRONE.has(before)) entries.push({ kind: 'throne', status: before, leave: true });
    if (THRONE.has(after)) entries.push({ kind: 'throne', status: after, enter: true });
  }
  return entries;
}
