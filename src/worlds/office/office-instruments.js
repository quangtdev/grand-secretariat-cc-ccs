// The office's instruments, synthesized with the Web Audio API (no audio files): a key click, a
// desk-phone trill, an elevator ding, a marimba-ish chime, a desk bell, a whoosh, a stamp, a low
// buzz, a notification pop, a thud, a lo-fi electric piano and a low room hum. Each voice
// schedules itself at an absolute AudioContext time. Holds no state beyond `ctx`: called once per bus.
import { envelope, noise, play } from '../../audio/web-audio-primitives.js';

/** A small, dry meeting room: three damped feedback delays. @returns {GainNode} node to send into */
export function createRoomReverb(ctx, destination) {
  const input = ctx.createGain();
  const tail = ctx.createGain();
  tail.gain.value = 0.3;
  tail.connect(destination);
  for (const seconds of [0.029, 0.043, 0.067]) {
    const delay = ctx.createDelay(0.2);
    delay.delayTime.value = seconds;
    const damp = ctx.createBiquadFilter();
    damp.type = 'lowpass';
    damp.frequency.value = 2400;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.38;
    input.connect(delay);
    delay.connect(damp).connect(feedback).connect(delay);
    damp.connect(tail);
  }
  return input;
}

/** @param {AudioContext} ctx @param {{dry: AudioNode, wet: AudioNode}} out */
export function createOfficeInstruments(ctx, { dry, wet }) {
  const route = (node, wetAmount = 0) => {
    node.connect(dry);
    if (wetAmount > 0) { const send = ctx.createGain(); send.gain.value = wetAmount; node.connect(send).connect(wet); }
    return node;
  };
  const tone = (t, freq, level, decay, wetAmount, type = 'sine') => {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(route(envelope(ctx, t, level, 0.003, decay), wetAmount));
    play(osc, t, decay);
  };
  const burst = (t, { freq, q = 1, level, length, type = 'bandpass', sweepTo = 0 }) => {
    const source = noise(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.Q.value = q;
    filter.frequency.setValueAtTime(freq, t);
    if (sweepTo) filter.frequency.exponentialRampToValueAtTime(sweepTo, t + length);
    source.connect(filter).connect(route(envelope(ctx, t, level, Math.min(0.02, length / 3), length), 0.1));
    play(source, t, length);
  };

  return {
    /** A key click: a tiny filtered noise burst and a faint tick. */
    keyClick(t, level = 0.07) {
      burst(t, { freq: 2600 + Math.random() * 1500, q: 1.4, level, length: 0.025 });
      tone(t, 1200 + Math.random() * 300, level * 0.25, 0.015, 0);
    },
    /** A desk-phone trill: two tones gated at 22 Hz, twice. */
    trill(t, level = 0.07) {
      for (const start of [t, t + 0.55]) {
        const gate = ctx.createGain();
        gate.gain.setValueAtTime(0.0001, start);
        for (let i = 0; i < 9; i++) gate.gain.setValueAtTime(i % 2 ? 0.0001 : level, start + i * 0.022);
        gate.gain.setValueAtTime(0.0001, start + 0.2);
        gate.connect(route(ctx.createGain(), 0.2));
        for (const freq of [1250, 1650]) {
          const osc = ctx.createOscillator();
          osc.type = 'triangle';
          osc.frequency.value = freq;
          osc.connect(gate);
          play(osc, start, 0.2);
        }
      }
    },
    /** An elevator ding: a sine with a bell partial. */
    ding(t, base = 1318, level = 0.13) {
      for (const [ratio, amp, decay] of [[1, 1, 1.4], [2.76, 0.3, 0.7], [5.4, 0.1, 0.3]]) tone(t, base * ratio, level * amp, decay, 0.35);
    },
    /** A marimba-ish chime: a warm sine with a quick woody overtone. */
    chime(t, freq, level = 0.14) {
      tone(t, freq, level, 0.6, 0.3);
      tone(t, freq * 4, level * 0.25, 0.06, 0.1);
    },
    /** A desk bell: one bright, short ring. */
    deskBell(t, level = 0.14) {
      for (const [ratio, amp] of [[1, 1], [2.4, 0.4], [3.9, 0.2]]) tone(t, 1760 * ratio, level * amp, 0.9 / ratio, 0.3);
    },
    whoosh(t, level = 0.12) { burst(t, { freq: 400, q: 1, level, length: 0.35, sweepTo: 2400 }); },
    /** A rubber stamp on paper: a short low knock and a papery slap. */
    stamp(t, level = 0.22) {
      tone(t, 110, level, 0.09, 0.1);
      burst(t, { freq: 1500, level: level * 0.6, length: 0.05, type: 'lowpass' });
    },
    /** A low buzzer: a filtered square, short. */
    buzz(t, level = 0.12) {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = 98;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 600;
      osc.connect(filter).connect(route(envelope(ctx, t, level, 0.01, 0.38), 0.1));
      play(osc, t, 0.4);
    },
    /** A notification pop: a short rising blip. */
    pop(t, level = 0.05) {
      const osc = ctx.createOscillator();
      osc.frequency.setValueAtTime(620, t);
      osc.frequency.exponentialRampToValueAtTime(1000, t + 0.05);
      osc.connect(route(envelope(ctx, t, level, 0.004, 0.08), 0.15));
      play(osc, t, 0.1);
    },
    /** A desk set down: a low thud. */
    thud(t, level = 0.3) {
      const osc = ctx.createOscillator();
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(55, t + 0.14);
      osc.connect(route(envelope(ctx, t, level, 0.004, 0.2), 0.1));
      play(osc, t, 0.25);
      burst(t, { freq: 700, level: level * 0.4, length: 0.05, type: 'lowpass' });
    },
    /** A lo-fi electric piano note: a sine pair with a decaying FM bite and a soft tremolo. */
    epiano(t, freq, level = 0.04, length = 2.4) {
      const carrier = ctx.createOscillator();
      carrier.frequency.value = freq;
      const mod = ctx.createOscillator();
      mod.frequency.value = freq * 2;
      const index = ctx.createGain();
      index.gain.setValueAtTime(freq * 1.2, t);
      index.gain.exponentialRampToValueAtTime(freq * 0.05, t + 0.5);
      mod.connect(index).connect(carrier.frequency);
      const tremolo = ctx.createGain();
      carrier.connect(tremolo);
      tremolo.connect(route(envelope(ctx, t, level, 0.012, length), 0.45));
      play(carrier, t, length);
      play(mod, t, length);
    },
    /** The room tone: a low hum and filtered air; returns stop(). */
    hum(level = 0.03) {
      const source = noise(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 220;
      const mains = ctx.createOscillator();
      mains.frequency.value = 60;
      const mainsGain = ctx.createGain();
      mainsGain.gain.value = 0.25;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(level, ctx.currentTime + 3);
      source.connect(filter).connect(gain);
      mains.connect(mainsGain).connect(gain);
      gain.connect(dry);
      source.start();
      mains.start();
      return () => {
        const now = ctx.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
        source.stop(now + 1.6);
        mains.stop(now + 1.6);
      };
    },
  };
}
