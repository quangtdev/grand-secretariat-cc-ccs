import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { TranscriptUsageReader } from '../server/transcript-usage-reader.js';

const msg = (id, usage) => `${JSON.stringify({ type: 'assistant', message: { id, model: 'm', usage } })}\n`;
const usage = (input, output) => ({ input_tokens: input, output_tokens: output });

function setup() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gs-ink-'));
  const projects = path.join(dir, 'projects', 'p');
  fs.mkdirSync(projects, { recursive: true });
  const file = path.join(projects, 's.jsonl');
  const annotations = [];
  const store = { annotate: (id, patch) => annotations.push(patch.ink) };
  const spent = [];
  const isAllowedTranscript = async (real) => real.startsWith(`${fs.realpathSync(path.join(dir, 'projects'))}${path.sep}`);
  const reader = new TranscriptUsageReader(store, { onTokens: (id, d) => spent.push(d), throttleMs: 0, isAllowedTranscript });
  return { dir, file, annotations, spent, reader };
}

test('resume baselines old history; only tokens spent while observed are reported, once per Stop', async () => {
  const { dir, file, annotations, spent, reader } = setup();
  try {
    fs.writeFileSync(file, msg('a', usage(1000, 10)) + msg('b', usage(2000, 20)));
    await reader.onHook('s', { hook_event_name: 'SessionStart', transcript_path: file });
    assert.equal(annotations.at(-1).used, 2000);
    assert.equal(annotations.at(-1).pct, 1);
    await reader.onHook('s', { hook_event_name: 'Stop', transcript_path: file });
    assert.deepEqual(spent, []); // nothing new yet
    fs.appendFileSync(file, msg('c', usage(3000, 30)));
    await reader.onHook('s', { hook_event_name: 'Stop' }); // no path in payload: last seen one is used
    assert.deepEqual(spent, [{ input: 3000, output: 30, cacheRead: 0, cacheWrite: 0 }]);
    assert.equal(annotations.at(-1).used, 3000);
    await reader.onHook('s', { hook_event_name: 'Stop' });
    assert.equal(spent.length, 1);
  } finally { reader.forget('s'); fs.rmSync(dir, { recursive: true, force: true }); }
});

test('paths outside a projects folder, non-jsonl files and sub-agent events are ignored', async () => {
  const { dir, annotations, reader } = setup();
  try {
    const stray = path.join(dir, 'stray.jsonl');
    fs.writeFileSync(stray, msg('a', usage(5, 5)));
    await reader.onHook('s', { hook_event_name: 'Stop', transcript_path: stray });
    await reader.onHook('s', { hook_event_name: 'Stop', transcript_path: 'relative/projects/x.jsonl' });
    assert.deepEqual(annotations, []);
  } finally { reader.forget('s'); fs.rmSync(dir, { recursive: true, force: true }); }
});

test('a transcript rewritten smaller is read again from the start', async () => {
  const { dir, file, annotations, reader } = setup();
  try {
    fs.writeFileSync(file, msg('a', usage(9000, 1)) + msg('b', usage(9500, 1)));
    await reader.onHook('s', { hook_event_name: 'Stop', transcript_path: file });
    fs.writeFileSync(file, msg('z', usage(100, 1)));
    await reader.onHook('s', { hook_event_name: 'Stop' });
    assert.equal(annotations.at(-1).used, 100);
  } finally { reader.forget('s'); fs.rmSync(dir, { recursive: true, force: true }); }
});

test('a new conversation counts every token from its SessionStart, even if first read at Stop', async () => {
  const { dir, file, spent, reader } = setup();
  try {
    await reader.onHook('s', { hook_event_name: 'SessionStart', source: 'startup', transcript_path: file }); // file not there yet
    fs.writeFileSync(file, msg('a', usage(1000, 10)));
    await reader.onHook('s', { hook_event_name: 'Stop', transcript_path: file });
    assert.deepEqual(spent, [{ input: 1000, output: 10, cacheRead: 0, cacheWrite: 0 }]);
  } finally { reader.forget('s'); fs.rmSync(dir, { recursive: true, force: true }); }
});

test('/clear (new transcript path) drops the old ink level until the new conversation has a turn', async () => {
  const { dir, file, annotations, reader } = setup();
  try {
    fs.writeFileSync(file, msg('a', usage(150000, 10)));
    await reader.onHook('s', { hook_event_name: 'Stop', transcript_path: file });
    const next = path.join(path.dirname(file), 't.jsonl');
    fs.writeFileSync(next, '');
    await reader.onHook('s', { hook_event_name: 'Stop', transcript_path: next });
    assert.equal(annotations.at(-1), null);
  } finally { reader.forget('s'); fs.rmSync(dir, { recursive: true, force: true }); }
});
