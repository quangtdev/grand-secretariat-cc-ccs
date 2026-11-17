import test from 'node:test';
import assert from 'node:assert/strict';
import { annalsEntriesFromHook } from '../server/court-annals-events.js';

const bash = (command, tool_response) => ({ hook_event_name: 'PostToolUse', tool_name: 'Bash', tool_input: { command }, tool_response });
const entries = (event, before = 'working', after = 'working') => annalsEntriesFromHook(event, before, after, '/repo');

test('order: first 200 flattened chars of a real prompt; task notifications and soldiers are not orders', () => {
  const prompt = `fix\n${'x'.repeat(300)}`;
  const [order] = entries({ hook_event_name: 'UserPromptSubmit', prompt });
  assert.equal(order.kind, 'order');
  assert.equal(order.text.length, 200);
  assert.ok(order.text.startsWith('fix xxx'));
  assert.deepEqual(entries({ hook_event_name: 'UserPromptSubmit', prompt: '<task-notification>done</task-notification>' }), []);
  assert.deepEqual(entries({ hook_event_name: 'UserPromptSubmit', prompt: 'hi', agent_id: 'a1' }), []);
});

test('file: edit tools only, relative to the repo when inside it', () => {
  const edit = (tool_name, tool_input) => ({ hook_event_name: 'PostToolUse', tool_name, tool_input });
  assert.deepEqual(entries(edit('Edit', { file_path: '/repo/src/a.js' })), [{ kind: 'file', path: 'src/a.js' }]);
  assert.deepEqual(entries(edit('Write', { file_path: '/elsewhere/b.js' })), [{ kind: 'file', path: '/elsewhere/b.js' }]);
  assert.deepEqual(entries(edit('NotebookEdit', { notebook_path: '/repo/n.ipynb' })), [{ kind: 'file', path: 'n.ipynb' }]);
  assert.deepEqual(entries(edit('Read', { file_path: '/repo/a.js' })), []);
  assert.deepEqual(entries({ hook_event_name: 'PreToolUse', tool_name: 'Edit', tool_input: { file_path: '/repo/a.js' } }), []);
});

test('commit: -m message, -C form, stdout summary preferred, heredoc falls back to stdout', () => {
  assert.deepEqual(entries(bash('git commit -m "feat: add x"', { stdout: '' })), [{ kind: 'commit', msg: 'feat: add x' }]);
  assert.deepEqual(entries(bash("git add . && git -C /repo commit -m 'fix y'")), [{ kind: 'commit', msg: 'fix y' }]);
  const heredoc = 'git commit -m "$(cat <<\'EOF\'\nfeat: big change\nEOF\n)"';
  assert.deepEqual(entries(bash(heredoc, { stdout: '[main 1a2b3c4] feat: big change\n 1 file changed' })), [{ kind: 'commit', msg: 'feat: big change' }]);
  assert.deepEqual(entries(bash(heredoc, { stdout: '' })), []); // unreadable message, nothing to say
});

test('commit: dry runs, failures, other git commands and lookalikes are skipped', () => {
  assert.deepEqual(entries(bash('git commit --dry-run -m "x"')), []);
  assert.deepEqual(entries(bash('git commit -m "x"', { stdout: 'nothing to commit, working tree clean' })), []);
  assert.deepEqual(entries(bash('git commit -m "x"', { stderr: 'fatal: not a git repository' })), []);
  assert.deepEqual(entries(bash('git commit-tree abc -m "x"')), []);
  assert.deepEqual(entries(bash('git log --oneline')), []);
});

test('throne: entering and leaving asking/done, not working-to-working', () => {
  const stop = { hook_event_name: 'Stop' };
  assert.deepEqual(entries(stop, 'working', 'done'), [{ kind: 'throne', status: 'done', enter: true }]);
  assert.deepEqual(entries({ hook_event_name: 'UserPromptSubmit', prompt: 'next' }, 'done', 'working').slice(-1),
    [{ kind: 'throne', status: 'done', leave: true }]);
  assert.deepEqual(entries(stop, 'asking', 'done').slice(-2),
    [{ kind: 'throne', status: 'asking', leave: true }, { kind: 'throne', status: 'done', enter: true }]);
  assert.deepEqual(entries(stop, 'idle', 'working'), []);
});

test('commit: a hook that prints an error line does not hide a commit that was made', () => {
  const out = { stdout: 'error: lint warning treated as note\n[main 9f8e7d6] feat: kept\n 1 file changed' };
  assert.deepEqual(entries(bash('git commit -m "feat: kept"', out)), [{ kind: 'commit', msg: 'feat: kept' }]);
  assert.deepEqual(entries(bash('git commit -m "feat: x"', { stdout: 'error: pre-commit hook failed' })), []);
});
