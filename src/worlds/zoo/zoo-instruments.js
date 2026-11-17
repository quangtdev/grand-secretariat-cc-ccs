// The zoo's instruments, synthesized with the Web Audio API (no audio files): marimba and
// xylophone, a keeper's whistle and hand bell, a wooden thunk, rustle, swoosh, crunch and thud,
// squeaks, a bird tweet, a soft elephant trumpet and a breeze bed. Each voice schedules itself at
// an absolute AudioContext time. Holds no state beyond `ctx`: called once per bus.
import { envelope, noise, play } from '../../audio/web-audio-primitives.js';

/** A short open-air room: three damped feedback delays. @returns {GainNode} node to send into */
export function createOpenAirReverb(ctx, destination) {
  const input = ctx.createGain();
  const tail = ctx.createGain();
  tail.gain.value = 0.4;
  tail.connect(destination);
  for (const seconds of [0.037, 0.053, 0.079]) {
    const delay = ctx.createDelay(0.2);
    delay.delayTime.value = seconds;
    const damp = ctx.createBiquadFilter();
    damp.type = 'lowpass';
    damp.frequency.value = 3200;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.5;
    input.connect(delay);
    delay.connect(damp).connect(feedback).connect(delay);
    damp.connect(tail);
  }
  return input;
}

/** @param {AudioContext} ctx @param {{dry: AudioNode, wet: AudioNode}} out */
export function createZooInstruments(ctx, { dry, wet }) {
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
    source.connect(filter).connect(route(envelope(ctx, t, level, Math.min(0.02, length / 3), length), 0.15));
    play(source, t, length);
  };

  const voices = {
    /** Marimba: a warm sine with a quick woody 4x overtone. */
    marimba(t, freq, level = 0.16) {
      tone(t, freq, level, 0.55, 0.3);
      tone(t, freq * 4, level * 0.3, 0.07, 0.1);
    },
    /** Xylophone: brighter and shorter. */
    xylophone(t, freq, level = 0.12) {
      tone(t, freq, level, 0.25, 0.25);
      tone(t, freq * 3, level * 0.4, 0.06, 0.1);
    },
    /** The keeper's whistle: a bright sine gliding up, with a breath of noise. */
    whistle(t, length = 0.25, level = 0.1, from = 2300) {
      const osc = ctx.createOscillator();
      osc.frequency.setValueAtTime(from, t);
      osc.frequency.linearRampToValueAtTime(from * 1.3, t + length);
      const vibrato = ctx.createOscillator();
      vibrato.frequency.value = 38;
      const depth = ctx.createGain();
      depth.gain.value = 60;
      vibrato.connect(depth).connect(osc.frequency);
      osc.connect(route(envelope(ctx, t, level, 0.02, length), 0.3));
      play(osc, t, length);
      play(vibrato, t, length);
      burst(t, { freq: 3200, q: 3, level: level * 0.25, length });
    },
    /** A small hand bell. */
    bell(t, base = 1175, level = 0.14) {
      for (const [ratio, amp, decay] of [[1, 1, 1.6], [2.5, 0.35, 0.8], [4.1, 0.2, 0.4]]) tone(t, base * ratio, level * amp, decay, 0.4);
    },
    /** A cart / trough set down: a low wooden thunk. */
    thunk(t, level = 0.3) {
      const osc = ctx.createOscillator();
      osc.frequency.setValueAtTime(190, t);
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.12);
      osc.connect(route(envelope(ctx, t, level, 0.003, 0.18), 0.15));
      play(osc, t, 0.2);
      burst(t, { freq: 900, level: level * 0.5, length: 0.05, type: 'lowpass' });
    },
    /** A low, dull thud: something failed to arrive. */
    thud(t, level = 0.4) {
      const osc = ctx.createOscillator();
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(42, t + 0.4);
      osc.connect(route(envelope(ctx, t, level, 0.005, 0.5), 0.2));
      play(osc, t, 0.55);
    },
    rustle(t, level = 0.06) { burst(t, { freq: 3500, q: 0.8, level, length: 0.09 }); },
    swoosh(t, level = 0.14) { burst(t, { freq: 500, q: 1.2, level, length: 0.28, sweepTo: 2600 }); },
    crunch(t, level = 0.2) { for (const dt of [0, 0.05, 0.1]) burst(t + dt, { freq: 1800 + dt * 4000, q: 1.5, level, length: 0.04 }); },
    /** A cub's squeak: a short rising triangle. */
    squeak(t, freq = 1700, level = 0.08) {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.4, t + 0.06);
      osc.connect(route(envelope(ctx, t, level, 0.005, 0.07), 0.2));
      play(osc, t, 0.09);
    },
    /** A soft elephant trumpet: a sawtooth through a bandpass that sweeps up, short and quiet. */
    trumpet(t, base = 330, level = 0.07) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(base, t);
      osc.frequency.linearRampToValueAtTime(base * 1.5, t + 0.25);
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.value = 2;
      filter.frequency.setValueAtTime(500, t);
      filter.frequency.exponentialRampToValueAtTime(1500, t + 0.3);
      osc.connect(filter).connect(route(envelope(ctx, t, level, 0.05, 0.35), 0.35));
      play(osc, t, 0.4);
    },
    /** A bird's tweet: two or three quick up-chirps. */
    tweet(t, level = 0.035) {
      const pitch = 1 + (Math.random() - 0.5) * 0.25;
      for (let i = 0, at = t; i < 2 + Math.floor(Math.random() * 2); i++) {
        const length = 0.05 + Math.random() * 0.04;
        const osc = ctx.createOscillator();
        osc.frequency.setValueAtTime(2800 * pitch, at);
        osc.frequency.exponentialRampToValueAtTime(4400 * pitch, at + length);
        osc.connect(route(envelope(ctx, at, level, 0.005, length), 0.2));
        play(osc, at, length);
        at += length + 0.06;
      }
    },
    /** A light breeze; returns stop(). */
    breeze(level = 0.035) {
      const source = noise(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 700;
      filter.Q.value = 0.6;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.09;
      const depth = ctx.createGain();
      depth.gain.value = 350;
      lfo.connect(depth).connect(filter.frequency);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(level, ctx.currentTime + 3);
      source.connect(filter).connect(gain).connect(dry);
      source.start();
      lfo.start();
      return () => {
        const now = ctx.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
        source.stop(now + 1.6);
        lfo.stop(now + 1.6);
      };
    },
  };
  return voices;
}
