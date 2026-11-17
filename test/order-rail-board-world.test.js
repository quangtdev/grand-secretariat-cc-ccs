// The order-rail world is a board pack (no scene): it must pass the pack check, and index.html's
// pre-paint world list must stay in sync with the registry so its colours never flash Huế's.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { assertWorldPack } from '../src/worlds/world-pack-contract.js';
import { WORLDS } from '../src/worlds/world-registry.js';
import orderRail from '../src/worlds/order-rail/order-rail-world-pack.js';

test('order-rail is a complete board world pack', () => {
  assert.equal(orderRail.kind, 'board');
  assert.doesNotThrow(() => assertWorldPack(orderRail));
  for (const key of ['stationPass', 'stationLine', 'stationReady', 'order', 'oldest']) assert.ok(orderRail.board[key], key);
});

test('a board pack missing its vocabulary is refused', () => {
  assert.throws(() => assertWorldPack({ ...orderRail, vocabulary: undefined }), /vocabulary/);
});

test('a board pack missing a board word, or with an unknown kind, is refused', () => {
  assert.throws(() => assertWorldPack({ ...orderRail, board: { ...orderRail.board, passEmpty: '' } }), /board\.passEmpty/);
  assert.throws(() => assertWorldPack({ ...orderRail, kind: 'bord' }), /kind/);
});

test('index.html lists every registered world before first paint', () => {
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const ids = JSON.parse(/var ids = (\[[^\]]+\])/.exec(html)[1].replaceAll("'", '"'));
  assert.deepEqual(ids, WORLDS.map((w) => w.id));
});
