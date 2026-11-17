// Keeps each scribe's ink level (context used, token totals) from its Claude Code transcript.
// The path comes from the scribe's own hook payloads. Reads are async, from the last offset,
// in 1 MB chunks that yield to the event loop; a resumed scribe's old transcript is read once.
import fs from 'node:fs';
import { StringDecoder } from 'node:string_decoder';
import { contextLimitFor, newUsageState, parseUsageLines } from './transcript-usage-parse.js';
import { allowedTranscriptPath, claudeProjectsGuard } from './transcript-path-guard.js';

const CHUNK_BYTES = 1_048_576;
const THROTTLE_MS = 2000;
const yieldToLoop = () => new Promise((resolve) => setImmediate(resolve));

export class TranscriptUsageReader {
  /**
   * `onTokens(id, delta)`: tokens spent since the last report, called after the read that follows a Stop.
   * `contextLimit`: env override of the window size (0 = automatic).
   * `isAllowedTranscript(realPath)`: which folders may be read (default: Claude Code `projects` folders).
   */
  constructor(store, { onTokens, contextLimit = 0, throttleMs = THROTTLE_MS, isAllowedTranscript = claudeProjectsGuard() } = {}) {
    this.isAllowedTranscript = isAllowedTranscript;
    this.store = store;
    this.onTokens = onTokens;
    this.contextLimit = contextLimit;
    this.throttleMs = throttleMs;
    this.scribes = new Map(); // id -> { state, decoder, lastPath, timer, lastRead, reading, again, logged }
  }

  /** A hook event arrived: remember its transcript, read soon (immediately on Stop). Returns the pending read. */
  onHook(id, event) {
    if (event.agent_id) return Promise.resolve(); // a soldier's events: master context only
    const scribe = this.#scribe(id);
    if (typeof event.transcript_path === 'string' && event.transcript_path) scribe.lastPath = event.transcript_path;
    // A new conversation (not a resume or compaction): every token in its transcript is new spend.
    if (event.hook_event_name === 'SessionStart' && ['startup', 'clear'].includes(event.source)) scribe.countFromStart = true;
    if (!scribe.lastPath) return Promise.resolve();
    if (event.hook_event_name === 'Stop') return this.#read(id, true);
    if (scribe.timer) return Promise.resolve(); // a trailing read is already due
    const wait = scribe.lastRead + this.throttleMs - Date.now();
    if (wait <= 0) return this.#read(id, false);
    scribe.timer = setTimeout(() => {
      scribe.timer = null;
      this.#read(id, false).catch((err) => console.error('[ink] read failed:', err.message));
    }, wait);
    scribe.timer.unref();
    return Promise.resolve();
  }

  forget(id) {
    clearTimeout(this.scribes.get(id)?.timer);
    this.scribes.delete(id);
  }

  #scribe(id) {
    if (!this.scribes.has(id)) this.scribes.set(id, { state: null, lastPath: null, timer: null, lastRead: 0, reading: null, again: false, atStop: false, logged: null });
    return this.scribes.get(id);
  }

  /** One read at a time per scribe; an event during a read asks for one more afterwards. */
  async #read(id, atStop) {
    const scribe = this.scribes.get(id);
    if (!scribe) return;
    if (scribe.reading) { scribe.again = true; scribe.atStop ||= atStop; return scribe.reading; }
    scribe.lastRead = Date.now();
    scribe.reading = this.#readTail(id, scribe).catch((err) => console.error('[ink] read failed:', err.message));
    await scribe.reading;
    scribe.reading = null;
    if (this.scribes.get(id) !== scribe) return; // forgotten meanwhile
    const stop = atStop || scribe.atStop;
    scribe.atStop = false;
    if (scribe.again) { scribe.again = false; return this.#read(id, stop); } // report after the newest read
    if (stop) this.#reportTokens(id, scribe);
  }

  async #readTail(id, scribe) {
    const file = scribe.lastPath;
    if (scribe.state?.path !== file) { // first read, or /clear moved the conversation to a new file
      const real = await allowedTranscriptPath(file, this.isAllowedTranscript);
      if (!real) return;
      if (scribe.state) this.store.annotate(id, { ink: null }); // the old conversation's level is gone
      scribe.state = newUsageState(file);
      scribe.realPath = real; // opened from now on: the checked file, not whatever the link points to later
      scribe.decoder = new StringDecoder('utf8');
      scribe.logged = null;
    }
    const { state } = scribe;
    const handle = await fs.promises.open(scribe.realPath, 'r');
    try {
      const { size } = await handle.stat();
      if (size < state.offset) { // rewritten (compaction rewrite): start over
        Object.assign(state, newUsageState(file));
        scribe.decoder = new StringDecoder('utf8');
        scribe.logged = null;
      }
      const buffer = Buffer.allocUnsafe(Math.min(CHUNK_BYTES, Math.max(size - state.offset, 0)));
      while (state.offset < size) {
        const { bytesRead } = await handle.read(buffer, 0, Math.min(buffer.length, size - state.offset), state.offset);
        if (!bytesRead) break;
        state.offset += bytesRead;
        parseUsageLines(scribe.decoder.write(buffer.subarray(0, bytesRead)), state);
        if (state.offset < size) await yieldToLoop();
      }
    } finally {
      await handle.close();
    }
    // Tokens already in a transcript when we first look (a resume) are history, not spend: baseline them.
    // A conversation seen from its SessionStart (new or /clear) counts from zero instead.
    if (!scribe.logged) {
      scribe.logged = scribe.countFromStart ? Object.fromEntries(Object.keys(state.totals).map((k) => [k, 0])) : { ...state.totals };
      scribe.countFromStart = false;
    }
    this.#publish(id, state);
  }

  #publish(id, state) {
    if (!state.contextTokens) return; // no assistant turn yet
    const limit = contextLimitFor(state.contextTokens, state.latched, this.contextLimit);
    const pct = Math.min(100, Math.round((state.contextTokens / limit) * 100));
    this.store.annotate(id, { ink: { used: state.contextTokens, limit, pct, totals: { ...state.totals } } });
  }

  #reportTokens(id, scribe) {
    const totals = scribe.state?.totals;
    if (!totals || !scribe.logged || !this.onTokens) return;
    const delta = Object.fromEntries(Object.keys(totals).map((k) => [k, totals[k] - scribe.logged[k]]));
    scribe.logged = { ...totals };
    if (Object.values(delta).some((v) => v < 0)) return; // totals went backwards: just re-baselined
    if (Object.values(delta).some((v) => v > 0)) this.onTokens(id, delta);
  }
}
