import test from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedTailnetCaller } from '../server/tailnet-serve-access-guard.js';

const on = { host: 'box.tail1234.ts.net:4780', login: 'me@example.com' };
const off = { host: '', login: '' };
const req = (headers) => ({ headers });
const served = (login, host = on.host) => req({ host, 'x-forwarded-for': '100.64.0.2', ...(login ? { 'tailscale-user-login': login } : {}) });

test('direct local requests pass, configured or not', () => {
  assert.equal(isAllowedTailnetCaller(req({ host: '127.0.0.1:4780' }), on), true);
  assert.equal(isAllowedTailnetCaller(req({ host: 'localhost:4780' }), off), true);
});

test('the allowed login passes under the tailnet host, in any letter case', () => {
  assert.equal(isAllowedTailnetCaller(served('me@example.com'), on), true);
  assert.equal(isAllowedTailnetCaller(served('Me@Example.com'), on), true);
});

test('another login, or no login (tagged node), is refused', () => {
  assert.equal(isAllowedTailnetCaller(served('other@example.com'), on), false);
  assert.equal(isAllowedTailnetCaller(served(''), on), false);
  assert.equal(isAllowedTailnetCaller(req({ host: on.host }), on), false);
});

test('a proxied request under a local name is refused even from the allowed login', () => {
  assert.equal(isAllowedTailnetCaller(served('me@example.com', '127.0.0.1:4780'), on), false);
  assert.equal(isAllowedTailnetCaller(req({ host: 'localhost:4780', 'tailscale-user-login': 'me@example.com' }), on), false);
});

test('every proxied request is refused when tailnet access is not configured', () => {
  assert.equal(isAllowedTailnetCaller(served('me@example.com'), off), false);
  assert.equal(isAllowedTailnetCaller(req({ host: '127.0.0.1:4780', 'x-forwarded-for': '10.0.0.1' }), off), false);
});
