// The station's sound in the shape every world's `audio` takes (../world-audio-and-vocabulary-contract.js):
// instruments, reverb, eleven cue scores, the music and the typing murmur.
import { StationAmbience } from './space-station-ambience.js';
import { createStationInstruments, createStationReverb } from './space-station-instruments.js';

// A minor pentatonic over A: soft and open, no leading tone.
const A5 = 880;
const SCALE = [0, 3, 5, 7, 10, 12].map((s) => A5 * 2 ** (s / 12));

/** @type {Record<string, (play: object, t: number) => void>} */
const cues = {
  call: (play, t) => { play.beep(t, 880, 0.12); play.beep(t + 0.15, 1175, 0.12); }, // a two-tone comm beep
  summon: (play, t) => { // the teleporter: a rising sweep, then a sparkle of bells
    play.sweep(t, 200, 1800, 0.75, 0.1);
    [SCALE[2], SCALE[4], SCALE[5]].forEach((freq, i) => play.bell(t + 0.7 + i * 0.07, freq, 0.07, 1));
  },
  petition: (play, t) => { play.bell(t, 988, 0.1); play.bell(t + 0.3, 740, 0.1); play.beep(t + 0.8, 1320, 0.08); }, // soft two-note alert, then a comm beep
  report: (play, t) => [660, 880, 1175].forEach((freq, i) => { play.beep(t + i * 0.1, freq, 0.12); play.bell(t + i * 0.1, freq, 0.04, 0.6); }), // ascending three-note confirm
  failed: (play, t) => play.buzz(t),
  muster: (play, t) => { play.sweep(t, 180, 760, 0.35, 0.09, 'sawtooth'); play.chirp(t + 0.36, 1500, 0.06); }, // a drone spins up
  disband: (play, t) => play.beep(t, 1568, 0.07, 'sine', 0.1),
  edict: (play, t) => [0, 1, 2, 3].forEach((i) => play.chirp(t + i * 0.05, 1700 + i * 330, 0.07)), // a burst of data
  chirp: (play, t) => { if (!document.hidden) play.chirp(t, 2600, 0.025, 0.05); }, // a tiny telemetry blip
  desk: (play, t) => play.clunk(t),
  depart: (play, t) => { play.sweep(t, 1400, 220, 0.55, 0.09); play.hiss(t + 0.45, 0.25, 0.04); },
};

/** @type {import('../world-audio-and-vocabulary-contract.js').WorldAudio} */
export const spaceStationAudio = {
  createInstruments: createStationInstruments,
  createReverb: createStationReverb,
  cues,
  Ambience: StationAmbience,
  murmur: (play, t) => play.keypad(t, 0.05),
};
