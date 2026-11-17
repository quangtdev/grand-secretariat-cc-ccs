import test from 'node:test';
import assert from 'node:assert/strict';
import { inkLeftSteps } from '../src/scene/ink-left-steps.js';

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

test('no reading means a full gauge', () => {
  for (const ink of [undefined, null, {}, { pct: null }, { pct: NaN }, { pct: '40' }]) assert.equal(inkLeftSteps(ink), 1);
});

test('left is 100 - pct, in 5 % steps', () => {
  near(inkLeftSteps({ pct: 0 }), 1);
  near(inkLeftSteps({ pct: 62 }), 0.4); // 38 -> 40
  near(inkLeftSteps({ pct: 50 }), 0.5);
  near(inkLeftSteps({ pct: 90 }), 0.1);
  near(inkLeftSteps({ pct: 100 }), 0);
});

test('out-of-range pct is clamped', () => {
  near(inkLeftSteps({ pct: 140 }), 0);
  near(inkLeftSteps({ pct: -5 }), 1);
});

test('neighbouring pct values within a step give the same level (no churn)', () => {
  assert.equal(inkLeftSteps({ pct: 61 }), inkLeftSteps({ pct: 62 }));
});
