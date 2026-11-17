// The Huế court's sound, in the shape every world pack's `audio` takes (see
// ../world-audio-and-vocabulary-contract.js, WorldAudio): the instruments, the hall reverb, one score per
// cue, the background music and the typing whisper. The shared engine (audio/court-audio.js)
// decides *when* things sound; this file decides *what* they sound like.
import { CourtAmbience } from './court-ambience.js';
import { createCourtInstruments, createHallReverb } from './court-sound-synth.js';

/** Each cue is a short score: instruments struck at offsets from `t` (an AudioContext time). */
const cues = {
  // The drum pavilion is struck: two beats call the court to attention.
  call: (play, t) => {
    play.drum(t, 0.75);
    play.drum(t + 0.42, 0.9);
  },
  // Trống: the drum pavilion beats the summons, quickening, the last beat strongest.
  summon: (play, t) => {
    [0, 0.5, 0.88, 1.16, 1.38].forEach((offset, i, all) => play.drum(t + offset, i === all.length - 1 ? 1 : 0.7));
  },
  // Tâu sớ: a gong announces a petition at the throne, a bell asks for the king's ear.
  petition: (play, t) => {
    play.gong(t, 150, 4.5, 0.3);
    play.bell(t + 0.45, 1175, 0.12);
  },
  // A report on a jade tablet: two knocks of the mõ, then a clear bell.
  report: (play, t) => {
    play.woodblock(t, 820);
    play.woodblock(t + 0.18, 820, 0.3);
    play.bell(t + 0.42, 1568, 0.1);
  },
  // A scribe who could not start: a low, dull gong.
  failed: (play, t) => play.gong(t, 92, 5, 0.32),
  // Soldiers (sub-agents) mustered: a quick double beat and a rattle of the mõ.
  muster: (play, t) => {
    play.drum(t, 0.55);
    play.drum(t + 0.14, 0.75);
    [0.34, 0.42, 0.5].forEach((offset, i) => play.woodblock(t + offset, 980 + i * 60, 0.16));
  },
  // A soldier reports back: one soft, high bell.
  disband: (play, t) => play.bell(t, 2093, 0.05),
  // The king gives an order: a whispered phrase, sealed with a knock of the mõ and a small bell.
  edict: (play, t) => {
    const end = play.whisper.phrase(t);
    play.woodblock(end + 0.08, 520, 0.35);
    play.bell(end + 0.3, 1318, 0.06);
  },
  // A bird lands on a roof. Ambience, not a call: silent while the tab is hidden.
  chirp: (play, t) => { if (!document.hidden) play.chirp(t); },
  // A desk is set down on the paving: one low wooden knock.
  desk: (play, t) => play.woodblock(t, 420, 0.3),
  // A scribe dismissed from court: knocks falling away.
  depart: (play, t) => [880, 740, 620].forEach((pitch, i) => play.woodblock(t + i * 0.16, pitch, 0.25 - i * 0.05)),
};

/** @type {import('../world-audio-and-vocabulary-contract.js').WorldAudio} */
export const hueCourtAudio = {
  createInstruments: createCourtInstruments,
  createReverb: createHallReverb,
  cues,
  Ambience: CourtAmbience,
  // One whispered syllable for a keystroke in the dock (the engine throttles the calls).
  murmur: (play, t) => play.whisper.syllable(t, 0.15),
};
