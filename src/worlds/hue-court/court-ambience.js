// Background music for the court: unhurried đàn tranh phrases on the
// northern pentatonic scale (ngũ cung bắc: hò xự xang xê cống) over wind,
// with a soft temple bell now and then.

// Semitones of the scale over two octaves, from D4.
const ROOT = 293.66;
const SCALE = [0, 2, 5, 7, 9, 12, 14, 17, 19, 21].map((s) => ROOT * 2 ** (s / 12));
const LOOKAHEAD = 2; // seconds of music scheduled ahead of the clock

export class CourtAmbience {
  /** @param {AudioContext} ctx @param {ReturnType<import('./court-sound-synth.js').createCourtInstruments>} instruments */
  constructor(ctx, instruments) {
    this.ctx = ctx;
    this.instruments = instruments;
    this.timer = null;
    this.stopWind = null;
    this.nextAt = 0;
    this.note = 4; // index into SCALE; phrases wander from here
  }

  get playing() { return this.timer !== null; }

  start() {
    if (this.playing) return;
    this.stopWind = this.instruments.wind();
    this.nextAt = this.ctx.currentTime + 1.5;
    this.timer = setInterval(() => this.#schedule(), 500);
    this.#schedule();
  }

  stop() {
    clearInterval(this.timer);
    this.timer = null;
    this.stopWind?.();
    this.stopWind = null;
  }

  /** Queue phrases until the lookahead window is full. */
  #schedule() {
    // A throttled background tab may fall behind; skip rather than burst.
    if (this.nextAt < this.ctx.currentTime) this.nextAt = this.ctx.currentTime + 0.5;
    while (this.nextAt < this.ctx.currentTime + LOOKAHEAD) this.nextAt = this.#phrase(this.nextAt);
  }

  /** One phrase of 2-5 notes moving by step, ending on a long note; returns when the next may start. */
  #phrase(t) {
    const { pluck, bell } = this.instruments;
    const notes = 2 + Math.floor(Math.random() * 4);
    let at = t;
    for (let i = 0; i < notes; i++) {
      this.note = Math.min(SCALE.length - 1, Math.max(0, this.note + [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)]));
      const last = i === notes - 1;
      // The last note of a phrase is often bent upward, as a đàn tranh player would.
      pluck(at, SCALE[this.note], last ? 0.09 : 0.07, last && Math.random() < 0.5 ? 1 : 0);
      at += last ? 0 : 0.28 + Math.random() * 0.3;
    }
    if (Math.random() < 0.15) bell(at + 1.2, SCALE[0] * 2, 0.04);
    return at + 2.5 + Math.random() * 3.5; // rest between phrases
  }
}
