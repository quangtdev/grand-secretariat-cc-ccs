// The office's sound in the shape every world's `audio` takes (../world-audio-and-vocabulary-contract.js):
// instruments, reverb, eleven cue scores, the music and the typing murmur.
import { OfficeAmbience } from './office-ambience.js';
import { createOfficeInstruments, createRoomReverb } from './office-instruments.js';

const A5 = 880;
const note = (semitones) => A5 * 2 ** (semitones / 12);

/** @type {Record<string, (play: object, t: number) => void>} */
const cues = {
  call: (play, t) => { play.deskBell(t); play.deskBell(t + 0.28, 0.1); }, // the reception bell, pressed
  summon: (play, t) => { play.ding(t, 1318); play.ding(t + 0.4, 1046, 0.1); play.whoosh(t + 0.8, 0.09); }, // elevator ding, doors slide
  petition: (play, t) => { play.trill(t); play.chime(t + 1.25, note(3), 0.1); }, // phone rings, then a soft chime
  report: (play, t) => { play.chime(t, note(0), 0.15); play.chime(t + 0.13, note(7), 0.15); }, // two notes rising
  failed: (play, t) => play.buzz(t),
  muster: (play, t) => [0, 0.06, 0.11, 0.19, 0.24].forEach((dt) => play.keyClick(t + dt, 0.09)), // a burst of typing
  disband: (play, t) => play.keyClick(t, 0.12),
  edict: (play, t) => { play.whoosh(t); play.stamp(t + 0.3); },
  chirp: (play, t) => { if (!document.hidden) play.pop(t); },
  desk: (play, t) => play.thud(t),
  depart: (play, t) => [note(7), note(3), note(-2)].forEach((freq, i) => play.chime(t + i * 0.14, freq, 0.13 - i * 0.02)), // descending
};

/** @type {import('../world-audio-and-vocabulary-contract.js').WorldAudio} */
export const officeAudio = {
  createInstruments: createOfficeInstruments,
  createReverb: createRoomReverb,
  cues,
  Ambience: OfficeAmbience,
  murmur: (play, t) => play.keyClick(t, 0.05),
};
