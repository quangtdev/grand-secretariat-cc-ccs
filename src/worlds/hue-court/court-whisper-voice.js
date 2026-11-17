// The king's whisper, made from noise (no recordings). Whispered speech has no
// pitch, only the resonances of the mouth: white noise through a few band-pass
// "formants" whose centres move a little within each syllable, so it is heard as
// murmured words rather than static. Now and then an "s" adds a high hiss.
import { envelope, noise, play } from '../../audio/web-audio-primitives.js';

// Formant centres (Hz) and their weights; band-pass filters pass little energy,
// so the weights also make up for the narrow bands.
const FORMANTS = [[650, 3.2], [1250, 2.4], [2500, 1.6]];

/**
 * @param {AudioContext} ctx
 * @param {(node: AudioNode, wet: number) => AudioNode} route  connects a node to the dry bus and the reverb
 */
export function createWhisperVoice(ctx, route) {
  /** One whispered syllable at time `t`; returns its length in seconds. */
  function syllable(t, level = 0.06) {
    const length = 0.06 + Math.random() * 0.09;
    const source = noise(ctx);
    const out = route(envelope(ctx, t, level, 0.015, length), 0.2);
    const pan = ctx.createStereoPanner();
    pan.pan.value = (Math.random() - 0.5) * 0.5;
    pan.connect(out);

    for (const [base, weight] of FORMANTS) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.value = 4 + Math.random() * 3;
      const from = base * (0.8 + Math.random() * 0.4);
      filter.frequency.setValueAtTime(from, t);
      filter.frequency.linearRampToValueAtTime(from * (0.85 + Math.random() * 0.3), t + length);
      const gain = ctx.createGain();
      gain.gain.value = weight;
      source.connect(filter).connect(gain).connect(pan);
    }
    if (Math.random() < 0.3) { // a sibilant
      const hiss = ctx.createBiquadFilter();
      hiss.type = 'highpass';
      hiss.frequency.value = 4500;
      const gain = ctx.createGain();
      gain.gain.value = 0.5;
      source.connect(hiss).connect(gain).connect(pan);
    }
    play(source, t, length + 0.03);
    return length;
  }

  /** A short whispered phrase of a few syllables; returns the time it ends. */
  function phrase(t, syllables = 4 + Math.floor(Math.random() * 3)) {
    let at = t;
    for (let i = 0; i < syllables; i++) {
      const last = i === syllables - 1;
      at += syllable(at, (last ? 0.2 : 0.28) * (0.8 + Math.random() * 0.4)) + 0.04 + Math.random() * 0.08;
    }
    return at;
  }

  return { syllable, phrase };
}
