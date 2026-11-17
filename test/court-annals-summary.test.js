import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { summariseAnnalsDay, MAX_FILES } from '../server/court-annals-summary.js';
import { annalsResponse, endOfDay } from '../server/court-annals-reader.js';

const rec = (t, id, kind, data = {}) => JSON.stringify({ t, id, ticket: `T-${id}`, repo: '/home/u/work/api', kind, ...data });
const END = 1_000_000;

test('counts orders, unique files, commits; tokens sum with cache counted as read', () => {
  const [s] = summariseAnnalsDay([
    rec(10, 'a', 'order', { text: 'do x' }), rec(11, 'a', 'file', { path: 'a.js' }), rec(12, 'a', 'file', { path: 'a.js' }),
    rec(13, 'a', 'file', { path: 'b.js' }), rec(14, 'a', 'commit', { msg: 'feat: x' }),
    rec(15, 'a', 'tokens', { input: 5, output: 7, cacheRead: 100, cacheWrite: 10 }), rec(16, 'a', 'tokens', { input: 1, output: 1, cacheRead: 0, cacheWrite: 0 }),
  ], END, END);
  assert.equal(s.orderCount, 1);
  assert.deepEqual(s.files, ['a.js', 'b.js']);
  assert.equal(s.fileCount, 2);
  assert.equal(s.commits[0].msg, 'feat: x');
  assert.deepEqual(s.tokens, { input: 116, output: 8 });
  assert.equal(s.repoName, 'api');
});

test('throne waits: paired, asking->done, and an open wait closes at min(day end, now)', () => {
  const lines = [
    rec(100, 'a', 'throne', { status: 'asking', enter: true }), rec(160, 'a', 'throne', { status: 'asking', leave: true }),
    rec(160, 'a', 'throne', { status: 'done', enter: true }), rec(200, 'a', 'throne', { status: 'done', leave: true }),
    rec(300, 'a', 'throne', { status: 'asking', enter: true }),
  ];
  assert.deepEqual(summariseAnnalsDay(lines, END, 350)[0].waitedMs, { asking: 110, done: 40 }); // still open today: until now
  assert.deepEqual(summariseAnnalsDay(lines, 320, 5000)[0].waitedMs, { asking: 80, done: 40 }); // open at midnight: until day end
});

test('a leave without an enter (wait began yesterday) adds nothing', () => {
  const [s] = summariseAnnalsDay([rec(5, 'a', 'throne', { status: 'asking', leave: true })], END, END);
  assert.deepEqual(s.waitedMs, { asking: 0, done: 0 });
});

test('rename keeps one scribe with the latest ticket; recall clears left; dismissed shows left time', () => {
  const rows = summariseAnnalsDay([
    rec(1, 'a', 'order', { text: 'x' }), JSON.stringify({ t: 2, id: 'a', ticket: 'New', repo: '/r', kind: 'order', text: 'y' }),
    JSON.stringify({ t: 3, id: 'a', ticket: 'New', repo: '/r', kind: 'left' }), rec(4, 'b', 'order', { text: 'z' }), rec(5, 'b', 'left'), rec(6, 'b', 'order', { text: 'back' }),
  ], END, END);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].ticket, 'New');
  assert.equal(rows[0].left, 3);
  assert.equal(rows[1].left, null);
});

test('a left scribe with an open wait stops waiting when it left', () => {
  const [s] = summariseAnnalsDay([rec(10, 'a', 'throne', { status: 'asking', enter: true }), rec(40, 'a', 'left')], END, END);
  assert.equal(s.waitedMs.asking, 30);
});

test('broken lines are skipped, order of scribes is first activity, file list is capped with full count', () => {
  const files = Array.from({ length: MAX_FILES + 5 }, (_, i) => rec(20 + i, 'b', 'file', { path: `f${i}.js` }));
  const rows = summariseAnnalsDay(['{oops', '', '"str"', rec(30, 'a', 'order', { text: 'x' }), rec(10, 'b', 'order', { text: 'y' }), ...files], END, END);
  assert.deepEqual(rows.map((r) => r.id), ['b', 'a']);
  assert.equal(rows[0].files.length, MAX_FILES);
  assert.equal(rows[0].fileCount, MAX_FILES + 5);
});

test('endOfDay validates strictly', () => {
  assert.equal(endOfDay('../../etc'), null);
  assert.equal(endOfDay('2026-02-31'), null);
  assert.equal(endOfDay('2026-11-14x'), null);
  assert.ok(endOfDay('2026-11-14') > new Date(2026, 10, 14).getTime());
});

test('annalsResponse: 400 on bad day, empty for a missing day, morning view and prev/next', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'annals-'));
  try {
    const now = new Date(2026, 10, 14, 8).getTime();
    assert.equal((await annalsResponse('../../etc', { dir, now })).code, 400);
    assert.deepEqual((await annalsResponse(null, { dir: path.join(dir, 'none'), now })).body.scribes, []);
    fs.writeFileSync(path.join(dir, '2026-11-13.jsonl'), `${rec(new Date(2026, 10, 13, 9).getTime(), 'a', 'order', { text: 'x' })}\n`);
    fs.writeFileSync(path.join(dir, '2026-11-10.jsonl'), '');
    const morning = (await annalsResponse(null, { dir, now })).body;
    assert.equal(morning.day, '2026-11-13');
    assert.equal(morning.prevDay, '2026-11-10');
    assert.equal(morning.nextDay, '2026-11-14'); // today, even without a file
    assert.equal(morning.scribes.length, 1);
    fs.writeFileSync(path.join(dir, '2026-11-14.jsonl'), `${rec(now, 'b', 'order', { text: 'y' })}\n`);
    const today = (await annalsResponse(null, { dir, now })).body;
    assert.equal(today.day, '2026-11-14');
    assert.equal(today.nextDay, null);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
