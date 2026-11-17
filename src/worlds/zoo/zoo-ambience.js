// Background music for the zoo: playful marimba phrases on the major pentatonic scale over a
// light breeze, with an occasional bird. Same scheduling pattern as the Huế court's: a timer
// keeps about two seconds of notes ahead of the audio clock. Quiet under the cues.
const ROOT = 261.63; // C4
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21].map((s) => ROOT * 2 ** (s / 12));
const LOOKAHEAD = 2;

export class ZooAmbience {
  /** @param {AudioContext} ctx @param {ReturnType<import('./zoo-instruments.js').createZooInstruments>} instruments */
  constructor(ctx, instruments) {
    this.ctx = ctx;
    this.instruments = instruments;
    this.timer = null;
    this.stopBreeze = null;
    this.nextAt = 0;
    this.note = 4;
  }

  get playing() { return this.timer !== null; }

  start() {
    if (this.playing) return;
    this.stopBreeze = this.instruments.breeze();
    this.nextAt = this.ctx.currentTime + 1.2;
    this.timer = setInterval(() => this.#schedule(), 500);
    this.#schedule();
  }

  stop() {
    clearInterval(this.timer);
    this.timer = null;
    this.stopBreeze?.();
    this.stopBreeze = null;
  }

  #schedule() {
    if (this.nextAt < this.ctx.currentTime) this.nextAt = this.ctx.currentTime + 0.5; // a throttled tab skips, never bursts
    while (this.nextAt < this.ctx.currentTime + LOOKAHEAD) this.nextAt = this.#phrase(this.nextAt);
  }

  /** A bouncy phrase of 3-6 notes moving by step, an answer note, then a rest. */
  #phrase(t) {
    const { marimba, tweet } = this.instruments;
    const notes = 3 + Math.floor(Math.random() * 4);
    let at = t;
    for (let i = 0; i < notes; i++) {
      this.note = Math.min(SCALE.length - 1, Math.max(0, this.note + [-2, -1, 1, 1, 2, 3][Math.floor(Math.random() * 6)]));
      const swing = i % 2 ? 0.14 : 0.2; // long-short, a skipping feel
      marimba(at, SCALE[this.note], i === notes - 1 ? 0.07 : 0.05);
      at += swing + Math.random() * 0.1;
    }
    if (Math.random() < 0.5) marimba(at + 0.12, SCALE[Math.max(0, this.note - 4)], 0.045);
    if (Math.random() < 0.25) tweet(at + 0.8 + Math.random(), 0.02);
    return at + 2.2 + Math.random() * 3;
  }
}
