import test from 'node:test';
import assert from 'node:assert/strict';
import { contextLimitFor, newUsageState, parseUsageLines } from '../server/transcript-usage-parse.js';

const line = (id, usage, extra = {}) => `${JSON.stringify({
  type: 'assistant', message: { id, model: 'claude-opus-5-5', usage: { input_tokens: 1, cache_read_input_tokens: 0, cache_creation_input_tokens: 0, output_tokens: 0, ...usage } }, ...extra,
})}\n`;

test('context = input + cache read + cache write of the last turn; totals count each message id once', () => {
  const state = newUsageState('/x.jsonl');
  parseUsageLines(line('m1', { input_tokens: 10, cache_read_input_tokens: 1000, output_tokens: 5 })
    + line('m1', { input_tokens: 10, cache_read_input_tokens: 1000, output_tokens: 40 }) // same message, next block
    + line('m2', { input_tokens: 3, cache_read_input_tokens: 1500, cache_creation_input_tokens: 200, output_tokens: 7 }), state);
  assert.equal(state.contextTokens, 1703);
  assert.deepEqual(state.totals, { input: 13, output: 47, cacheRead: 2500, cacheWrite: 200 });
});

test('sidechain, synthetic, non-assistant and malformed lines are ignored', () => {
  const state = newUsageState('/x.jsonl');
  parseUsageLines(line('s', { input_tokens: 999 }, { isSidechain: true })
    + `${JSON.stringify({ type: 'assistant', message: { id: 'y', model: '<synthetic>', usage: { input_tokens: 5 } } })}\n`
    + '{"type":"user","message":{}}\n{"type":"assistant", broken\n', state);
  assert.equal(state.contextTokens, 0);
  assert.deepEqual(state.totals, { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 });
});

test('compaction: context drops with the next turn while totals keep growing', () => {
  const state = newUsageState('/x.jsonl');
  parseUsageLines(line('a', { input_tokens: 150_000, output_tokens: 10 }) + line('b', { input_tokens: 20_000, output_tokens: 10 }), state);
  assert.equal(state.contextTokens, 20_000);
  assert.equal(state.totals.input, 170_000);
});

test('a partial last line is carried and completed by the next chunk, even mid-token', () => {
  const state = newUsageState('/x.jsonl');
  const whole = line('p', { input_tokens: 42 });
  parseUsageLines(whole.slice(0, 30), state);
  assert.equal(state.contextTokens, 0);
  parseUsageLines(whole.slice(30), state);
  assert.equal(state.contextTokens, 42);
});

test('1M latch: above 200k the limit stays 1M; env override wins', () => {
  assert.equal(contextLimitFor(100_000, false), 200_000);
  assert.equal(contextLimitFor(250_000, false), 1_000_000);
  assert.equal(contextLimitFor(50_000, true), 1_000_000);
  assert.equal(contextLimitFor(250_000, true, 400_000), 400_000);
  const state = newUsageState('/x.jsonl');
  parseUsageLines(line('big', { input_tokens: 300_000 }) + line('small', { input_tokens: 5_000 }), state);
  assert.equal(state.latched, true);
});

test('a long line arriving in many newline-free pieces is parsed once it ends', () => {
  const line = JSON.stringify({ type: 'assistant', message: { id: 'x', usage: { input_tokens: 42, output_tokens: 1 } }, pad: 'p'.repeat(5000) });
  const state = newUsageState('/f.jsonl');
  for (let i = 0; i < line.length; i += 700) parseUsageLines(line.slice(i, i + 700), state);
  assert.equal(state.contextTokens, 0);
  parseUsageLines('\n', state);
  assert.equal(state.contextTokens, 42);
});
