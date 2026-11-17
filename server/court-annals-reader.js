// Reads one day of the court annals and answers GET /api/annals?day=YYYY-MM-DD.
import fs from 'node:fs';
import path from 'node:path';
import { STATE_DIR } from './config.js';
import { dayKey } from './court-annals-log.js';
import { summariseAnnalsDay } from './court-annals-summary.js';

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const DAY_FILE = /^(\d{4}-\d{2}-\d{2})\.jsonl$/;
export const MAX_DAY_BYTES = 5_000_000; // about 25k records; parsing more would stall the server

/** Local midnight that ends `day` (ms), or null when `day` is not a real calendar date. */
export function endOfDay(day) {
  if (!DAY.test(day)) return null;
  const [y, m, d] = day.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  if (dayKey(start.getTime()) !== day) return null; // 2026-02-31 and the like
  return new Date(y, m - 1, d + 1).getTime();
}

async function availableDays(dir) {
  try {
    return (await fs.promises.readdir(dir)).map((n) => DAY_FILE.exec(n)?.[1]).filter(Boolean).sort();
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function readLines(file) {
  try {
    if ((await fs.promises.stat(file)).size > MAX_DAY_BYTES) return null;
    return (await fs.promises.readFile(file, 'utf8')).split('\n');
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

/**
 * Without `day`: today, or, when today has nothing yet, the latest earlier day with records (the morning view).
 * @returns {Promise<{code: number, body: object}>}
 */
export async function annalsResponse(requestedDay, { dir = path.join(STATE_DIR, 'annals'), now = Date.now() } = {}) {
  const today = dayKey(now);
  if (requestedDay != null && endOfDay(requestedDay) === null) return { code: 400, body: { error: 'day must be a date like 2026-11-14' } };
  const days = await availableDays(dir);
  const day = requestedDay ?? (days.includes(today) ? today : days.filter((d) => d < today).at(-1) ?? today);
  const lines = await readLines(path.join(dir, `${day}.jsonl`));
  if (lines === null) return { code: 413, body: { error: 'That day is too large to read.' } };
  const earlier = days.filter((d) => d < day).at(-1) ?? null;
  const later = days.find((d) => d > day) ?? (day < today ? today : null);
  return { code: 200, body: { day, today, prevDay: earlier, nextDay: later, scribes: summariseAnnalsDay(lines, endOfDay(day), now) } };
}
