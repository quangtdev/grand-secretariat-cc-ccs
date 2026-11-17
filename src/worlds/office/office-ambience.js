// Background music for the office: slow lo-fi electric-piano seventh chords over a soft room
// tone, with an occasional single high note. Same scheduling pattern as the Huế court's: a timer
// keeps about two seconds of notes ahead of the audio clock. Quiet under the cues.
const ROOT = 130.81; // C3
const MAJ7 = [0, 4, 7, 11];
const MIN7 = [0, 3, 7, 10];
const DOM7 = [0, 4, 7, 10];
// A loop of gentle changes: [root semitone above C3, chord shape]. Each round picks one of them.
const PROGRESSIONS = [
  [[0, MAJ7], [-3, MIN7], [5, MAJ7], [7, DOM7]], // Cmaj7 Am7 Fmaj7 G7
  [[5, MAJ7], [4, MIN7], [2, MIN7], [7, DOM7]], // Fmaj7 Em7 Dm7 G7
  [[-3, MIN7], [2, MIN7], [7, DOM7], [0, MAJ7]], // Am7 Dm7 G7 Cmaj7
];
const LOOKAHEAD = 2;
const at = (semitones) => ROOT * 2 ** (semitones / 12);

export class OfficeAmbience {
  /** @param {AudioContext} ctx @param {ReturnType<import('./office-instruments.js').createOfficeInstruments>} instruments */
  constructor(ctx, instruments) {
    this.ctx = ctx;
    this.instruments = instruments;
    this.timer = null;
    this.stopHum = null;
    this.nextAt = 0;
    this.progression = PROGRESSIONS[0];
    this.step = 0;
  }

  get playing() { return this.timer !== null; }

  start() {
    if (this.playing) return;
    this.stopHum = this.instruments.hum();
    this.nextAt = this.ctx.currentTime + 1.2;
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

  /** One chord, strummed low to high a little late; maybe a high note over it. Returns when the next may start. */
  #chord(t) {
    const { epiano } = this.instruments;
    if (this.step % 4 === 0) this.progression = PROGRESSIONS[Math.floor(Math.random() * PROGRESSIONS.length)];
    const [root, shape] = this.progression[this.step % 4];
    this.step += 1;
    shape.forEach((interval, i) => epiano(t + i * 0.045 + Math.random() * 0.02, at(root + interval + (i === 0 ? 0 : 12)), i === 0 ? 0.03 : 0.02, 3.2));
    if (Math.random() < 0.55) {
      const top = shape[Math.floor(Math.random() * shape.length)];
      epiano(t + 1.3 + Math.random() * 0.8, at(root + top + 24), 0.018, 2);
    }
    return t + 3.4 + Math.random() * 1.2;
  }
}
