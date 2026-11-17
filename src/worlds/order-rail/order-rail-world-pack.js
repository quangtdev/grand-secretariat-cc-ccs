// The order rail: a plain web board instead of a 3D court. Every agent is an order docket
// clipped to a kitchen rail; the stations are columns by what the agent needs (at the pass,
// on the line, standing by). A board pack draws no scene (kind 'board',
// ../world-pack-contract.js): it brings words and sound, and main.js loads its driver,
// board/order-rail-board.js. Sound borrows the office's synthesized instruments, rescored
// for a kitchen: the pass bell calls and reports, a ticket stamp sends an order.
import { officeAudio } from '../office/office-audio-cues.js';
import { orderRailBoardWords, orderRailVocabulary } from './order-rail-vocabulary.js';

const cues = {
  ...officeAudio.cues,
  call: (play, t) => play.deskBell(t), // a ticket is fired: one tap of the bell
  report: (play, t) => { play.deskBell(t); play.deskBell(t + 0.22, 0.12); }, // "order up": the pass bell, twice
  edict: (play, t) => play.stamp(t), // the docket is stamped
};

/** @type {import('../world-pack-contract.js').BoardWorldPack} */
export const world = {
  kind: 'board',
  id: 'order-rail',
  label: 'Order rail (web board)',
  audio: { ...officeAudio, cues },
  vocabulary: orderRailVocabulary,
  board: orderRailBoardWords,
};

export default world;
