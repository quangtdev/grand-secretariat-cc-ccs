// The court's history: scribes that left (dismissed, or ended on their own) with a
// conversation worth going back to. Each can be recalled later with `--resume`.
import fs from 'node:fs';
import path from 'node:path';
import { STATE_DIR } from './config.js';

const HISTORY_FILE = path.join(STATE_DIR, 'history.json');
const MAX_ENTRIES = 50;
// What is needed to reopen a scribe exactly as it was (same fields as sessions.json) plus when it left.
const KEPT_FIELDS = ['id', 'ticket', 'repo', 'profile', 'mode', 'createdAt', 'hasConversation', 'claudeSessionId', 'leftAt'];

const isEntry = (e) => e && ['id', 'ticket', 'repo'].every((k) => typeof e[k] === 'string' && e[k]) && typeof e.profile === 'string';
/** The Claude conversation an entry reopens; two entries for the same one are the same scribe. */
const conversationOf = (e) => e.claudeSessionId || e.id;

export class DismissedScribeHistory {
  constructor() {
    this.entries = []; // newest first
    try {
      const saved = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
      if (Array.isArray(saved)) this.entries = saved.filter(isEntry).slice(0, MAX_ENTRIES);
    } catch (err) {
      // A damaged file is set aside, not overwritten, so it can be recovered by hand.
      if (err.code !== 'ENOENT') try { fs.renameSync(HISTORY_FILE, `${HISTORY_FILE}.bad`); } catch { /* ignore */ }
    }
  }

  /** Public view, newest first. */
  list() {
    return this.entries.map(({ id, ticket, repo, profile, createdAt, leftAt }) => ({
      id, ticket, repo, repoName: path.basename(repo), profile, createdAt, leftAt,
    }));
  }

  get(id) { return this.entries.find((e) => e.id === id) || null; }

  /**
   * Remember a scribe that just left. Only one with a conversation is kept:
   * without one there is nothing to resume, and summoning anew is the same thing.
   */
  record(session) {
    if (!session.hasConversation) return;
    const entry = Object.fromEntries(KEPT_FIELDS.map((k) => [k, session[k]]));
    entry.leftAt = Date.now();
    const conversation = conversationOf(entry);
    this.entries = [entry, ...this.entries.filter((e) => e.id !== entry.id && conversationOf(e) !== conversation)]
      .slice(0, MAX_ENTRIES);
    this.#save();
  }

  /** Drop an entry (recalled, or forgotten by the user). */
  remove(id) {
    const before = this.entries.length;
    this.entries = this.entries.filter((e) => e.id !== id);
    if (this.entries.length === before) return false;
    this.#save();
    return true;
  }

  /** Atomic write (temp file + rename), like sessions.json. */
  #save() {
    try {
      fs.mkdirSync(STATE_DIR, { recursive: true, mode: 0o700 });
      const temp = `${HISTORY_FILE}.tmp`;
      fs.writeFileSync(temp, JSON.stringify(this.entries, null, 2), { mode: 0o600 });
      fs.renameSync(temp, HISTORY_FILE);
    } catch (err) {
      console.error('[history] could not save:', err.message);
    }
  }
}
