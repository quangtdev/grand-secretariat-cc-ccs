import test from 'node:test';
import assert from 'node:assert/strict';
import { annalsCounts, dayLabel, formatWaited } from '../src/ui/court-annals-text.js';

test('formatWaited', () => {
  assert.equal(formatWaited(0), '');
  assert.equal(formatWaited(40_000), '<1m');
  assert.equal(formatWaited(12 * 60_000), '12m');
  assert.equal(formatWaited(65 * 60_000), '1h 05m');
});

test('annalsCounts leaves zero parts out and pluralises', () => {
  const full = { orderCount: 3, fileCount: 12, commitCount: 1, waitedMs: { asking: 3_000_000, done: 900_000 }, tokens: { input: 1_300_000, output: 100_000 } };
  assert.equal(annalsCounts(full), '3 orders · 12 files · 1 commit · waited 1h 05m · 1.4M tokens');
  assert.equal(annalsCounts({ orderCount: 1, fileCount: 0, commitCount: 0, waitedMs: { asking: 0, done: 0 }, tokens: { input: 0, output: 0 } }), '1 order');
});

test('dayLabel', () => {
  assert.match(dayLabel('2026-11-14', '2026-11-14'), /^Today · Sat 14 Nov$/);
  assert.match(dayLabel('2026-11-13', '2026-11-14'), /^Yesterday · Fri 13 Nov$/);
  assert.equal(dayLabel('2026-11-12', '2026-11-14'), 'Thu 12 Nov');
});
