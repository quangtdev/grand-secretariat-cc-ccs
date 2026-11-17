// A petition sent back to the desk holds for that one wait only, and only for waits on the user.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canDefer, setDeferred, withDeferrals } from '../src/ui/deferred-petitions.js';
import { waitsAtThrone, waitingFirst } from '../src/status-vocabulary.js';

const asking = { id: 'a', status: 'asking', statusSince: 100 };
const working = { id: 'b', status: 'working', statusSince: 50 };

test('only asking and done can be sent back to the desk', () => {
  assert.equal(canDefer(asking), true);
  assert.equal(canDefer({ ...asking, status: 'done' }), true);
  assert.equal(canDefer(working), false);
  assert.equal(canDefer({ ...asking, status: 'exited' }), false);
});

test('a deferred petition waits at the desk, then comes back with the next wait', () => {
  setDeferred(asking, true);
  const [shown] = withDeferrals([asking]);
  assert.equal(shown.deferred, true);
  assert.equal(waitsAtThrone(shown), false);
  assert.deepEqual(waitingFirst([shown, working]).map((s) => s.id), ['a', 'b']); // no longer first: not before the throne
  // The agent answered and asked again: a new wait, at the throne again.
  const next = { ...asking, statusSince: 200 };
  assert.equal(withDeferrals([next])[0].deferred, undefined);
  assert.equal(waitsAtThrone(next), true);
});

test('calling it up again puts it before the throne', () => {
  setDeferred(asking, true);
  setDeferred(asking, false);
  assert.equal(withDeferrals([asking])[0].deferred, undefined);
});
