// Court instruments, synthesized with the Web Audio API (no audio files):
// the drum pavilion's drum, a bronze gong, a temple bell, a wooden mõ,
// a plucked đàn tranh string, a wind bed, the king's whisper and a bird's chirp. Each voice schedules itself
// at an absolute AudioContext time and frees its nodes when it fades out.
import { envelope, noise, play } from '../../audio/web-audio-primitives.js';
import { createWhisperVoice } from './court-whisper-voice.js';

/**
 * The hall's reverb: four feedback delays in parallel, each damped by a low-pass filter.
 * It replaces a convolution with a long impulse response, which sounded much the same
 * but cost several percent of a CPU core for as long as the audio ran.
 * @returns {GainNode} the node to send sound into; its tail goes to `destination`
 */
export function createHallReverb(ctx, destination) {
  const input = ctx.createGain();
  const tail = ctx.createGain();
  tail.gain.value = 0.5;
  tail.connect(destination);
  for (const seconds of [0.113, 0.137, 0.171, 0.199]) { // unequal lengths, so echoes do not line up
    const delay = ctx.createDelay(0.25);
    delay.delayTime.value = seconds;
    const damp = ctx.createBiquadFilter();
    damp.type = 'lowpass';
    damp.frequency.value = 2400;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.74;
    input.connect(delay);
    delay.connect(damp).connect(feedback).connect(delay); // the loop
    damp.connect(tail);
  }
  return input;
}

/**
 * @param {AudioContext} ctx
 * @param {{dry: AudioNode, wet: AudioNode}} out  dry bus and reverb send
 */
export function createCourtInstruments(ctx, { dry, wet }) {
  const route = (node, wetAmount) => {
    node.connect(dry);
    if (wetAmount > 0) {
      const send = ctx.createGain();
      send.gain.value = wetAmount;
      node.connect(send).connect(wet);
    }
    return node;
  };

  return {
    /** The king's whisper: syllable(t) for a keystroke, phrase(t) for a whole order. */
    whisper: createWhisperVoice(ctx, route),

    /** Chim: a small bird's "tsip tsip" as it lands, two or three quick upward sweeps. */
    chirp(t, level = 0.04) {
      const pitch = 1 + (Math.random() - 0.5) * 0.2;
      const notes = 2 + Math.floor(Math.random() * 2);
      for (let i = 0, at = t; i < notes; i++) {
        const length = 0.04 + Math.random() * 0.03;
        const osc = ctx.createOscillator();
        osc.frequency.setValueAtTime(2600 * pitch, at);
        osc.frequency.exponentialRampToValueAtTime(4200 * pitch, at + length);
        osc.connect(route(envelope(ctx, at, level, 0.005, length), 0.2));
        play(osc, at, length);
        at += length + 0.05 + Math.random() * 0.04;
      }
    },

    /** Trống: a deep skin hit, pitch falling as the head settles, with a slap of noise. */
    drum(t, strength = 1) {
      const body = ctx.createOscillator();
      body.frequency.setValueAtTime(120, t);
      body.frequency.exponentialRampToValueAtTime(52, t + 0.35);
      const bodyGain = route(envelope(ctx, t, 0.9 * strength, 0.005, 0.9), 0.35);
      body.connect(bodyGain);
      play(body, t, 1);

      const slap = noise(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 900;
      const slapGain = route(envelope(ctx, t, 0.35 * strength, 0.002, 0.12), 0.2);
      slap.connect(filter).connect(slapGain);
      play(slap, t, 0.2);
    },

    /** Cồng/chiêng: inharmonic bronze partials, slightly detuned so they shimmer. */
    gong(t, base = 160, decay = 4, level = 0.35) {
      const partials = [[1, 1], [1.49, 0.6], [2.03, 0.45], [2.68, 0.3], [3.31, 0.18], [4.2, 0.1]];
      for (const [ratio, amp] of partials) {
        const osc = ctx.createOscillator();
        osc.frequency.value = base * ratio * (1 + (Math.random() - 0.5) * 0.004);
        const gain = route(envelope(ctx, t, level * amp, 0.02, decay / (0.6 + ratio * 0.25)), 0.5);
        osc.connect(gain);
        play(osc, t, decay);
      }
    },

    /** Chuông: a small bright bell, struck once. */
    bell(t, base = 880, level = 0.18) {
      for (const [ratio, amp, decay] of [[1, 1, 2.4], [2.76, 0.4, 1.2], [5.4, 0.2, 0.6]]) {
        const osc = ctx.createOscillator();
        osc.frequency.value = base * ratio;
        const gain = route(envelope(ctx, t, level * amp, 0.003, decay), 0.6);
        osc.connect(gain);
        play(osc, t, decay);
      }
    },

    /** Mõ: a hollow wooden knock. */
    woodblock(t, pitch = 760, level = 0.4) {
      const osc = ctx.createOscillator();
      osc.frequency.setValueAtTime(pitch * 1.15, t);
      osc.frequency.exponentialRampToValueAtTime(pitch, t + 0.03);
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = pitch;
      filter.Q.value = 6;
      const gain = route(envelope(ctx, t, level, 0.002, 0.16), 0.25);
      osc.connect(filter).connect(gain);
      play(osc, t, 0.2);
    },

    /** Đàn tranh: a plucked steel string; `bend` slides the pitch up like a nhấn. */
    pluck(t, freq, level = 0.12, bend = 0) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      if (bend) {
        osc.frequency.setValueAtTime(freq, t + 0.12);
        osc.frequency.linearRampToValueAtTime(freq * 2 ** (bend / 12), t + 0.35);
      }
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.Q.value = 1.5;
      filter.frequency.setValueAtTime(freq * 6, t);
      filter.frequency.exponentialRampToValueAtTime(freq * 1.2, t + 0.6);
      const gain = route(envelope(ctx, t, level, 0.004, 2.2), 0.55);
      osc.connect(filter).connect(gain);
      play(osc, t, 2.3);
    },

    /** Gió: filtered noise whose colour drifts slowly. Returns a stop() function. */
    wind(level = 0.05) {
      const source = noise(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 500;
      filter.Q.value = 0.7;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.07;
      const lfoDepth = ctx.createGain();
      lfoDepth.gain.value = 300;
      lfo.connect(lfoDepth).connect(filter.frequency);
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
}
