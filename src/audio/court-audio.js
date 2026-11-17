// The court's sound engine: *when* cues play for what happens in the court (a summons, a
// petition, a report, a failure, a departure) and background music, each switchable from the
// rail and remembered across visits. *What* they sound like is the world pack's `audio`
// (worlds/world-audio-and-vocabulary-contract.js, WorldAudio): instruments, cue scores, music, typing whisper.
// Browsers only allow audio after a user gesture, so the AudioContext is
// created on the first click or key press.
import { ICONS } from '../status-vocabulary.js';

const PREFS_KEY = 'grand-secretariat:sound';
const CUE_GAP_MS = 1500; // one cue of a kind at a time, even if many agents change at once
const REST_AFTER_MS = 8000; // silence this long (music off): suspend the audio engine
const MURMUR_GAP_MS = 70; // keystroke whispers blend into a hush instead of clicking

// Which cue a status change into a state calls for.
const STATUS_CUES = { asking: 'petition', done: 'report', exited: 'failed' };

export class CourtAudio {
  /**
   * @param {HTMLElement} controls  container for the two toggles in the rail
   * @param {import('../worlds/world-audio-and-vocabulary-contract.js').WorldAudio} worldAudio  the world's sound
   */
  constructor(controls, worldAudio) {
    this.worldAudio = worldAudio;
    this.prefs = { effects: true, music: true, ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') };
    this.ctx = null;
    this.lastCueAt = {};
    this.previous = null; // id -> status at the last sync; null until the first one
    this.#renderControls(controls);

    const unlock = () => {
      this.#ensureContext();
      if (!this.ctx) return;
      removeEventListener('pointerdown', unlock, true);
      removeEventListener('keydown', unlock, true);
    };
    addEventListener('pointerdown', unlock, true);
    addEventListener('keydown', unlock, true);
    // Music rests while the tab is hidden; cues keep sounding, since they are how a hidden tab calls you back.
    document.addEventListener('visibilitychange', () => this.#syncMusic());
  }

  /** Play a named cue now, if effects are on and audio is unlocked. */
  cue(name) {
    // A context made by this very click may still be starting; notes queued now play once it runs.
    if (!this.prefs.effects || !this.ctx || this.ctx.state === 'closed') return;
    const now = performance.now();
    if (now - (this.lastCueAt[name] || 0) < CUE_GAP_MS) return;
    this.lastCueAt[name] = now;
    this.#wake();
    this.worldAudio.cues[name]?.(this.instruments, this.ctx.currentTime + 0.03);
  }

  /**
   * The audio engine costs CPU for as long as it runs, even in silence. With the music off
   * it is suspended a few seconds after the last sound and resumed for the next one.
   */
  #wake() {
    if (this.ctx.state === 'suspended') this.ctx.resume();
    clearTimeout(this.restTimer);
    this.restTimer = setTimeout(() => {
      if (!this.ambience?.playing && this.ctx.state === 'running') this.ctx.suspend();
    }, REST_AFTER_MS);
  }

  /** One whispered syllable for a keystroke in the dock, throttled so fast typing is a soft hush. */
  murmur() {
    if (!this.prefs.effects || !this.ctx || this.ctx.state === 'closed') return;
    const now = performance.now();
    if (now - (this.lastMurmurAt || 0) < MURMUR_GAP_MS) return;
    this.lastMurmurAt = now;
    this.#wake();
    this.worldAudio.murmur(this.instruments, this.ctx.currentTime + 0.01);
  }

  /** Compare with the previous feed and sound the changes. The first feed only sets the baseline. */
  observe(sessions) {
    const current = new Map(sessions.map((s) => [s.id, s.status]));
    const soldiers = new Set(sessions.flatMap((s) => (s.soldiers || []).map((soldier) => `${s.id}:${soldier.id}`)));
    if (this.previousSoldiers) {
      if ([...soldiers].some((key) => !this.previousSoldiers.has(key))) this.cue('muster');
      if ([...this.previousSoldiers].some((key) => !soldiers.has(key) && current.has(key.split(':')[0]))) this.cue('disband');
    }
    this.previousSoldiers = soldiers;
    if (this.previous) {
      for (const [id, status] of current) {
        if (this.previous.has(id) && this.previous.get(id) !== status && STATUS_CUES[status]) this.cue(STATUS_CUES[status]);
      }
      for (const id of this.previous.keys()) if (!current.has(id)) this.cue('depart');
    }
    this.previous = current;
  }

  #ensureContext() {
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
      } catch {
        return; // no Web Audio: the court stays silent
      }
      const master = this.ctx.createGain();
      master.gain.value = 0.8;
      // A gentle limiter so several voices at once never clip.
      const limiter = this.ctx.createDynamicsCompressor();
      limiter.threshold.value = -10;
      limiter.ratio.value = 8;
      master.connect(limiter).connect(this.ctx.destination);
      const reverb = this.worldAudio.createReverb(this.ctx, master);

      this.effectsBus = this.ctx.createGain();
      this.effectsBus.connect(master);
      this.instruments = this.worldAudio.createInstruments(this.ctx, { dry: this.effectsBus, wet: reverb });

      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = 0.55; // music sits under the cues
      this.musicBus.connect(master);
      this.ambience = new this.worldAudio.Ambience(this.ctx, this.worldAudio.createInstruments(this.ctx, { dry: this.musicBus, wet: reverb }));
    }
    this.#wake();
    this.#syncMusic();
  }

  #syncMusic() {
    if (!this.ambience) return;
    const wanted = this.prefs.music && !document.hidden;
    if (wanted && !this.ambience.playing) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      clearTimeout(this.restTimer);
      this.ambience.start();
    }
    if (!wanted && this.ambience.playing) {
      this.ambience.stop();
      this.#wake(); // let the music's tail ring out, then rest the engine
    }
  }

  #renderControls(controls) {
    const toggles = [
      { key: 'effects', icon: 'bell', label: 'Sounds' },
      { key: 'music', icon: 'music', label: 'Music' },
    ];
    controls.innerHTML = toggles.map(({ key, icon, label }) =>
      `<button type="button" class="button button-quiet sound-toggle" data-sound="${key}" aria-pressed="${this.prefs[key]}" aria-label="${label}" title="${label}">${ICONS[icon]}</button>`).join('');
    controls.addEventListener('click', (event) => {
      const button = event.target.closest('[data-sound]');
      if (!button) return;
      const key = button.dataset.sound;
      this.prefs[key] = !this.prefs[key];
      button.setAttribute('aria-pressed', String(this.prefs[key]));
      localStorage.setItem(PREFS_KEY, JSON.stringify(this.prefs));
      this.#ensureContext();
      if (key === 'effects' && this.prefs.effects) this.cue('report'); // let the user hear what they turned on
    });
  }
}
