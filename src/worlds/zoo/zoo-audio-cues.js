// The zoo's sound in the shape every world's `audio` takes (../world-audio-and-vocabulary-contract.js):
// instruments, reverb, eleven cue scores, the music and the typing murmur.
import { ZooAmbience } from './zoo-ambience.js';
import { createOpenAirReverb, createZooInstruments } from './zoo-instruments.js';

const C5 = 523.25;
const PENTA = [0, 2, 4, 7, 9, 12].map((s) => C5 * 2 ** (s / 12)); // C D E G A C

/** @type {Record<string, (play: object, t: number) => void>} */
const cues = {
  call: (play, t) => { play.whistle(t, 0.2, 0.1); play.whistle(t + 0.3, 0.32, 0.1, 2500); }, // the keeper whistles
  summon: (play, t) => { // the gate bell, then a marimba run up
    play.bell(t, 1319, 0.12);
    PENTA.forEach((freq, i) => play.marimba(t + 0.25 + i * 0.085, freq, 0.12));
  },
  petition: (play, t) => { play.bell(t, 1175, 0.13); play.trumpet(t + 0.4); }, // keeper's bell, soft trumpet
  report: (play, t) => [PENTA[0], PENTA[2], PENTA[3], PENTA[5]].forEach((freq, i) => play.marimba(t + i * 0.1, freq, 0.15)),
  failed: (play, t) => play.thud(t),
  muster: (play, t) => [1700, 2100, 1900].forEach((freq, i) => play.squeak(t + i * 0.085, freq)),
  disband: (play, t) => play.xylophone(t, PENTA[5] * 1.5, 0.1),
  edict: (play, t) => { play.swoosh(t); play.crunch(t + 0.32); },
  chirp: (play, t) => { if (!document.hidden) play.tweet(t); },
  desk: (play, t) => play.thunk(t),
  depart: (play, t) => [PENTA[3], PENTA[2], PENTA[0]].forEach((freq, i) => play.marimba(t + i * 0.14, freq, 0.13 - i * 0.02)),
};

/** @type {import('../world-audio-and-vocabulary-contract.js').WorldAudio} */
export const zooAudio = {
  createInstruments: createZooInstruments,
  createReverb: createOpenAirReverb,
  cues,
  Ambience: ZooAmbience,
  murmur: (play, t) => play.rustle(t, 0.05),
};
