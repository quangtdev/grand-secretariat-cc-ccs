// The station's instruments, synthesized with the Web Audio API (no audio files): sine and square
// beeps, FM chirps and bells, sweeps, a low buzz, a magnetic clunk, keypad blips, a filtered-noise
// airlock hiss, a sub hum and a glassy pad (detuned saws through a lowpass). Each voice schedules itself
// at an absolute AudioContext time. Holds no state beyond `ctx`: called once per bus.
import { envelope, noise, play } from '../../audio/web-audio-primitives.js';

/** A cold metal room: four damped feedback delays, long and glassy. @returns {GainNode} node to send into */
export function createStationReverb(ctx, destination) {
  const input = ctx.createGain();
  const tail = ctx.createGain();
  tail.gain.value = 0.42;
  tail.connect(destination);
  for (const seconds of [0.041, 0.067, 0.097, 0.131]) {
    const delay = ctx.createDelay(0.3);
    delay.delayTime.value = seconds;
    const damp = ctx.createBiquadFilter();
    damp.type = 'lowpass';
    damp.frequency.value = 2600;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.58;
    input.connect(delay);
    delay.connect(damp).connect(feedback).connect(delay);
    damp.connect(tail);
  }
  return input;
}

/** @param {AudioContext} ctx @param {{dry: AudioNode, wet: AudioNode}} out */
export function createStationInstruments(ctx, { dry, wet }) {
  const route = (node, wetAmount = 0) => {
    node.connect(dry);
    if (wetAmount > 0) { const send = ctx.createGain(); send.gain.value = wetAmount; node.connect(send).connect(wet); }
    return node;
  };
  const osc = (type, freq) => { const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq; return o; };
  const filter = (type, freq, q = 0.7) => { const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; return f; };
  /** A gain that rises over `attack` and falls to silence at `length`: for the long, soft voices. */
  const swell = (t, level, attack, length) => {
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(level, t + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
    return gain;
  };

  /** Filtered noise: the airlock hiss (a highpass by default; a lowpass makes a dull click). */
  const hiss = (t, length = 0.4, level = 0.1, freq = 5000, type = 'highpass') => {
    const source = noise(ctx);
    source.connect(filter(type, freq)).connect(route(envelope(ctx, t, level, Math.min(0.03, length / 3), length), 0.1));
    play(source, t, length);
  };

  return {
    /** A plain beep: sine or square, quick attack, short decay. */
    beep(t, freq, level = 0.12, type = 'sine', decay = 0.14) {
      const o = osc(type, freq);
      o.connect(route(envelope(ctx, t, type === 'square' ? level * 0.5 : level, 0.004, decay), 0.25));
      play(o, t, decay + 0.01);
    },
    /** An FM chirp: a carrier whose pitch is bent by a modulator that fades quickly. */
    chirp(t, freq = 1800, level = 0.08, length = 0.09) {
      const carrier = osc('sine', freq);
      const mod = osc('sine', freq * 2.5);
      const depth = ctx.createGain();
      depth.gain.setValueAtTime(freq * 1.2, t);
      depth.gain.exponentialRampToValueAtTime(1, t + length);
      mod.connect(depth).connect(carrier.frequency);
      carrier.frequency.setValueAtTime(freq, t);
      carrier.frequency.exponentialRampToValueAtTime(freq * 1.6, t + length);
      carrier.connect(route(envelope(ctx, t, level, 0.004, length), 0.2));
      play(carrier, t, length);
      play(mod, t, length);
    },
    /** A glassy FM bell: soft, with a long tail. */
    bell(t, freq = 988, level = 0.1, decay = 1.4) {
      const carrier = osc('sine', freq);
      const mod = osc('sine', freq * 3.5);
      const depth = ctx.createGain();
      depth.gain.setValueAtTime(freq * 0.9, t);
      depth.gain.exponentialRampToValueAtTime(1, t + decay * 0.5);
      mod.connect(depth).connect(carrier.frequency);
      carrier.connect(route(envelope(ctx, t, level, 0.005, decay), 0.55));
      play(carrier, t, decay);
      play(mod, t, decay);
    },
    /** A sweep from one pitch to another (teleporter rising, departure falling): two detuned layers. */
    sweep(t, from, to, length = 0.6, level = 0.1, type = 'sine') {
      for (const [ratio, amount] of [[1, 1], [2.01, 0.35]]) {
        const o = osc(type, from * ratio);
        o.frequency.setValueAtTime(from * ratio, t);
        o.frequency.exponentialRampToValueAtTime(to * ratio, t + length);
        o.connect(route(envelope(ctx, t, level * amount, Math.min(0.08, length / 3), length), 0.4));
        play(o, t, length);
      }
    },
    /** A low descending buzz: something failed to beam in. */
    buzz(t, level = 0.22) {
      for (const ratio of [1, 1.015]) {
        const o = osc('sawtooth', 150 * ratio);
        o.frequency.setValueAtTime(150 * ratio, t);
        o.frequency.exponentialRampToValueAtTime(48 * ratio, t + 0.5);
        o.connect(filter('lowpass', 520)).connect(route(envelope(ctx, t, level * 0.6, 0.01, 0.55), 0.15));
        play(o, t, 0.6);
      }
    },
    /** A magnetic clunk: a short low drop and a dull click. */
    clunk(t, level = 0.3) {
      const o = osc('sine', 170);
      o.frequency.setValueAtTime(170, t);
      o.frequency.exponentialRampToValueAtTime(55, t + 0.1);
      o.connect(route(envelope(ctx, t, level, 0.003, 0.16), 0.15));
      play(o, t, 0.2);
      hiss(t, 0.05, level * 0.5, 900, 'lowpass');
    },
    hiss,
    /** One soft keypad blip, its pitch picked from a small set so typing sounds like keys. */
    keypad(t, level = 0.05) {
      const o = osc('square', 1500 + Math.floor(Math.random() * 5) * 220);
      o.connect(filter('lowpass', 3200)).connect(route(envelope(ctx, t, level * 0.5, 0.002, 0.035), 0.05));
      play(o, t, 0.04);
    },
    /** A glassy pad note: three detuned saws through a lowpass, a slow swell. */
    pad(t, freq, length = 6, level = 0.035) {
      const lowpass = filter('lowpass', 800, 0.4);
      lowpass.frequency.setValueAtTime(500, t);
      lowpass.frequency.linearRampToValueAtTime(1200, t + length * 0.5);
      lowpass.connect(route(swell(t, level, length * 0.4, length), 0.6));
      for (const cents of [-9, 0, 9]) {
        const o = osc('sawtooth', freq);
        o.detune.value = cents;
        o.connect(lowpass);
        play(o, t, length);
      }
    },
    /** The ship's hum: a sub sine with its octave, breathing slowly; returns stop(). */
    hum(level = 0.05) {
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(level, ctx.currentTime + 3);
      const low = osc('sine', 49);
      const octave = osc('sine', 98.4);
      const lfo = osc('sine', 0.12);
      const depth = ctx.createGain();
      depth.gain.value = level * 0.3;
      lfo.connect(depth).connect(gain.gain);
      const upper = ctx.createGain();
      upper.gain.value = 0.35;
      low.connect(gain);
      octave.connect(upper).connect(gain);
      gain.connect(dry);
      for (const source of [low, octave, lfo]) source.start();
      return () => {
        const now = ctx.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
        for (const source of [low, octave, lfo]) source.stop(now + 1.6);
      };
    },
  };
}
