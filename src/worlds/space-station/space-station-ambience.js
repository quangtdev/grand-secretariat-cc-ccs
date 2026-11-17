// Background music for the station: slow glassy pad chords, a sparse bell arpeggio over them and a
// low ship hum. Same scheduling pattern as the Huế court's: a timer keeps about two seconds of notes
// ahead of the audio clock (a chord is scheduled whole, a few seconds long). Quiet under the cues.
const ROOT = 110; // A2
const note = (semitones) => ROOT * 2 ** (semitones / 12);
// Chords as semitones over A: Am9, Fmaj7, Cadd9, Em7 (open voicings).
const CHORDS = [[0, 12, 19, 23, 26], [-4, 8, 15, 19], [-9, 3, 10, 14, 19], [-5, 7, 14, 19]].map((c) => c.map(note));
const BELLS = [0, 3, 7, 10, 12, 15, 19].map((s) => note(s + 24));
const LOOKAHEAD = 2;
const CHORD_SECONDS = 9;

export class StationAmbience {
  /** @param {AudioContext} ctx @param {ReturnType<import('./space-station-instruments.js').createStationInstruments>} instruments */
  constructor(ctx, instruments) {
    this.ctx = ctx;
    this.instruments = instruments;
    this.timer = null;
    this.stopHum = null;
    this.nextAt = 0;
    this.chord = 0;
  }

  get playing() { return this.timer !== null; }

  start() {
    if (this.playing) return;
    this.stopHum = this.instruments.hum();
    this.nextAt = this.ctx.currentTime + 1;
    this.timer = setInterval(() => this.#schedule(), 500);
    this.#schedule();
  }

  stop() {
    clearInterval(this.timer);
    this.timer = null;
    this.stopHum?.();
    this.stopHum = null;
  }

  #schedule() {
    if (this.nextAt < this.ctx.currentTime) this.nextAt = this.ctx.currentTime + 0.5; // a throttled tab skips, never bursts
    while (this.nextAt < this.ctx.currentTime + LOOKAHEAD) this.nextAt = this.#chord(this.nextAt);
  }

  /** One chord of pads and a few bells that float over it; returns when the next chord starts. */
  #chord(t) {
    const { pad, bell } = this.instruments;
    const notes = CHORDS[this.chord];
    this.chord = (this.chord + 1) % CHORDS.length;
    notes.forEach((freq, i) => pad(t + i * 0.25, freq, CHORD_SECONDS + 3, 0.03));
    let at = t + 1.5 + Math.random();
    for (let i = 0; i < 3 + Math.floor(Math.random() * 3); i++) {
      bell(at, BELLS[Math.floor(Math.random() * BELLS.length)], 0.035, 2.2);
      at += 1.2 + Math.random() * 1.6;
    }
    return t + CHORD_SECONDS;
  }
}
