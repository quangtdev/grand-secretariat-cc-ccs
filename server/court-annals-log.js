// Append-only chronicle of the court: one JSONL file per local day, <state>/annals/YYYY-MM-DD.jsonl.
// Record: {"t":<ms>,"id":..,"ticket":..,"repo":..,"kind":..,...data}. Summaries are computed on read.
import fs from 'node:fs';
import path from 'node:path';
import { ANNALS_DAYS, STATE_DIR } from './config.js';

const DAY_FILE = /^(\d{4}-\d{2}-\d{2})\.jsonl$/;
const DAY_MS = 86_400_000;

/** Local calendar day (server time zone) as YYYY-MM-DD. */
export function dayKey(ms = Date.now()) {
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export class CourtAnnalsLog {
  constructor(dir = path.join(STATE_DIR, 'annals'), keepDays = ANNALS_DAYS) {
    this.dir = dir;
    this.keepDays = keepDays;
    this.queue = Promise.resolve(); // writes happen one after another, in order
    this.reportedFailure = false;
  }

  /** Add one record for `scribe` ({id, ticket, repo}); never throws, never blocks the caller. */
  append(kind, scribe, data = {}) {
    const now = Date.now();
    const line = `${JSON.stringify({ ...data, t: now, id: scribe.id, ticket: scribe.ticket, repo: scribe.repo, kind })}\n`;
    this.queue = this.queue.then(async () => {
      await fs.promises.mkdir(this.dir, { recursive: true, mode: 0o700 });
      await fs.promises.appendFile(path.join(this.dir, `${dayKey(now)}.jsonl`), line, { mode: 0o600 });
      this.reportedFailure = false; // writing works again: the next failure is worth a line
    }).catch((err) => this.#fail('write', err));
  }

  /** Delete day files older than `keepDays` days (today counts as one). */
  async prune() {
    try {
      const limit = new Date();
      limit.setDate(limit.getDate() - this.keepDays);
      const oldest = dayKey(limit.getTime()); // this day and older go
      for (const name of await fs.promises.readdir(this.dir)) {
        const day = DAY_FILE.exec(name)?.[1];
        if (day && day <= oldest) await fs.promises.unlink(path.join(this.dir, name));
      }
    } catch (err) {
      if (err.code !== 'ENOENT') this.#fail('prune', err);
    }
  }

  /** Prune now and once a day; the timer does not keep the process alive. */
  startPruning() {
    this.prune();
    this.timer = setInterval(() => this.prune(), DAY_MS);
    this.timer.unref();
  }

  /** Wait for queued writes (tests, shutdown). */
  flush() { return this.queue; }

  #fail(what, err) {
    if (this.reportedFailure) return; // one line is enough, not one per hook
    this.reportedFailure = true;
    console.error(`[annals] ${what} failed:`, err.message);
  }
}
