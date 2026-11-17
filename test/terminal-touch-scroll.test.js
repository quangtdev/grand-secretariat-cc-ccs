// A finger drag on the dock's terminal scrolls it: xterm.js itself ignores touch.
import test from 'node:test';
import assert from 'node:assert/strict';
import { enableTerminalTouchScroll } from '../src/ui/terminal-touch-scroll.js';

globalThis.requestAnimationFrame ??= () => 0; // no glide frames run in these tests
globalThis.cancelAnimationFrame ??= () => {};
globalThis.document ??= { body: { classList: { contains: () => false } } };
// Node has no WheelEvent: the little of it the code uses.
globalThis.WheelEvent ??= class WheelEvent extends Event {
  static DOM_DELTA_PIXEL = 0;
  constructor(type, init) { super(type, init); this.deltaY = init.deltaY; }
};

const LINE = 16;
function fakeTerminal({ type = 'normal', mouseTrackingMode = 'none' } = {}) {
  const term = {
    rows: 10, scrolled: 0, wheels: [],
    buffer: { active: { type } }, modes: { mouseTrackingMode },
    scrollLines(lines) { term.scrolled += lines; },
  };
  const screen = { clientHeight: LINE * term.rows, dispatchEvent: (event) => term.wheels.push(event.deltaY) };
  term.element = { querySelector: () => screen };
  return term;
}
const touch = (type, y, timeStamp, x = 50) => {
  const event = new Event(type, { cancelable: true });
  Object.defineProperty(event, 'timeStamp', { value: timeStamp });
  event.touches = type === 'touchend' ? [] : [{ clientX: x, clientY: y }];
  return event;
};

test('dragging the finger down shows earlier lines, dragging up later ones', () => {
  const host = new EventTarget();
  const term = fakeTerminal();
  enableTerminalTouchScroll(host, term);
  host.dispatchEvent(touch('touchstart', 100, 0));
  host.dispatchEvent(touch('touchmove', 100 + LINE * 4, 100));
  assert.equal(term.scrolled, -4);
  host.dispatchEvent(touch('touchmove', 100 + LINE * 3, 200));
  assert.equal(term.scrolled, -3);
});

test('small moves add up to whole lines, and the drag is kept from the page', () => {
  const host = new EventTarget();
  const term = fakeTerminal();
  enableTerminalTouchScroll(host, term);
  host.dispatchEvent(touch('touchstart', 100, 0));
  const moves = [0, 1, 2, 3].map((i) => touch('touchmove', 100 - (LINE / 2) * (i + 1), 20 * (i + 1)));
  for (const move of moves) host.dispatchEvent(move);
  assert.equal(term.scrolled, 2);
  assert.ok(moves.every((move) => move.defaultPrevented));
});

test('a full-screen program gets wheel events instead of scrollback', () => {
  const host = new EventTarget();
  const term = fakeTerminal({ type: 'alternate' });
  enableTerminalTouchScroll(host, term);
  host.dispatchEvent(touch('touchstart', 100, 0));
  host.dispatchEvent(touch('touchmove', 100 - LINE * 3, 100));
  assert.equal(term.scrolled, 0);
  assert.deepEqual(term.wheels, [1, 1, 1]); // one wheel step per line
});

test('a sideways drag is left to the browser, even if it later drifts up or down', () => {
  const host = new EventTarget();
  const term = fakeTerminal();
  enableTerminalTouchScroll(host, term);
  host.dispatchEvent(touch('touchstart', 100, 0));
  const moves = [touch('touchmove', 103, 20, 90), touch('touchmove', 100 + LINE * 4, 40, 130)];
  for (const move of moves) host.dispatchEvent(move);
  assert.equal(term.scrolled, 0);
  assert.ok(moves.every((move) => !move.defaultPrevented));
});

test('after it is switched off, drags do nothing', () => {
  const host = new EventTarget();
  const term = fakeTerminal();
  enableTerminalTouchScroll(host, term)();
  host.dispatchEvent(touch('touchstart', 100, 0));
  host.dispatchEvent(touch('touchmove', 200, 100));
  assert.equal(term.scrolled, 0);
});
