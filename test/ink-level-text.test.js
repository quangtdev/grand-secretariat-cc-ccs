import test from 'node:test';
import assert from 'node:assert/strict';
import { formatTokens, inkText, inkDetail } from '../src/ui/ink-level-text.js';

const words = { inkWord: 'ink', inkLowWord: 'ink low', inkLabel: 'Ink' };
const ink = (pct, extra = {}) => ({ used: 128000, limit: 200000, pct, totals: { input: 1000, output: 38000, cacheRead: 1_300_000, cacheWrite: 99_000 }, ...extra });

test('formatTokens scales to k and M', () => {
  assert.equal(formatTokens(950), '950');
  assert.equal(formatTokens(12400), '12k');
  assert.equal(formatTokens(1_400_000), '1.4M');
  assert.equal(formatTokens(200000), '200k');
  assert.equal(formatTokens(undefined), '0');
  assert.equal(formatTokens(-5), '0');
});

test('inkText hides without ink, switches wording at 85%, clamps', () => {
  assert.equal(inkText(undefined, words), '');
  assert.equal(inkText(ink(62), words), '~62% ink');
  assert.equal(inkText(ink(84), words), '~84% ink');
  assert.equal(inkText(ink(85), words), '~85% ink low');
  assert.equal(inkText(ink(140), words), '~100% ink low');
  assert.equal(inkText(ink('x'), words), '~0% ink');
});

test('inkDetail gives absolute numbers and session totals', () => {
  assert.equal(inkDetail(ink(64), words), 'Ink ~128k of 200k used. This session: 1.4M tokens read, 38k written.');
  assert.equal(inkDetail(null, words), '');
  assert.match(inkDetail({ used: 5, limit: 200000, pct: 0 }, words), /0 tokens read, 0 written/);
});
