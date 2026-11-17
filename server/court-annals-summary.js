// Turns one day of annals lines into a per-scribe chronicle. Pure: no fs, no clock (`now` is passed in).
// Lines are the raw JSONL strings of court-annals-log.js; broken ones are skipped.
import path from 'node:path';

export const MAX_FILES = 50;
export const MAX_ORDERS = 200;
export const MAX_COMMITS = 100;

function blankScribe(rec) {
  return {
    id: rec.id, ticket: rec.ticket, repo: rec.repo, repoName: path.basename(String(rec.repo || '')) || String(rec.repo || ''),
    firstT: rec.t,
    orders: [], orderCount: 0, files: [], fileCount: 0, commits: [], commitCount: 0,
    waitedMs: { asking: 0, done: 0 }, tokens: { input: 0, output: 0 }, left: null,
  };
}

const isRecord = (r) => r && typeof r === 'object' && typeof r.id === 'string' && typeof r.kind === 'string' && Number.isFinite(r.t);

/**
 * @param {string[]} lines  JSONL lines of one day
 * @param {number} dayEnd   ms: when the day ends (a throne wait still open closes here at the latest)
 * @param {number} now      ms: ...or now, for today
 * @returns {object[]} scribes sorted by first activity
 */
export function summariseAnnalsDay(lines, dayEnd, now) {
  const scribes = new Map();
  const seenFiles = new Map(); // id -> Set of paths
  const open = new Map(); // id -> {status, t}: a wait at the throne that has begun and not ended
  const close = (id, at) => {
    const wait = open.get(id);
    if (!wait) return;
    open.delete(id);
    const scribe = scribes.get(id);
    if (scribe && scribe.waitedMs[wait.status] !== undefined) scribe.waitedMs[wait.status] += Math.max(0, at - wait.t);
  };

  for (const line of lines) {
    if (!line) continue;
    let rec;
    try { rec = JSON.parse(line); } catch { continue; }
    if (!isRecord(rec)) continue;
    let scribe = scribes.get(rec.id);
    if (!scribe) { scribe = blankScribe(rec); scribes.set(rec.id, scribe); seenFiles.set(rec.id, new Set()); }
    if (rec.ticket) scribe.ticket = rec.ticket; // the latest name wins (rename)
    if (rec.kind !== 'left') scribe.left = null; // back after a recall

    if (rec.kind === 'order') {
      scribe.orderCount += 1;
      if (scribe.orders.length < MAX_ORDERS) scribe.orders.push({ t: rec.t, text: String(rec.text || '') });
    } else if (rec.kind === 'file') {
      const files = seenFiles.get(rec.id);
      const file = String(rec.path || '');
      if (file && !files.has(file)) {
        files.add(file);
        scribe.fileCount += 1;
        if (scribe.files.length < MAX_FILES) scribe.files.push(file);
      }
    } else if (rec.kind === 'commit') {
      scribe.commitCount += 1;
      if (scribe.commits.length < MAX_COMMITS) scribe.commits.push({ t: rec.t, msg: String(rec.msg || '') });
    } else if (rec.kind === 'throne') {
      if (rec.enter) { close(rec.id, rec.t); open.set(rec.id, { status: rec.status, t: rec.t }); }
      else if (rec.leave) close(rec.id, rec.t);
    } else if (rec.kind === 'tokens') {
      scribe.tokens.input += (Number(rec.input) || 0) + (Number(rec.cacheRead) || 0) + (Number(rec.cacheWrite) || 0);
      scribe.tokens.output += Number(rec.output) || 0;
    } else if (rec.kind === 'left') {
      close(rec.id, rec.t);
      scribe.left = rec.t;
    }
  }
  const stop = Math.min(dayEnd, now);
  for (const id of [...open.keys()]) close(id, stop);
  return [...scribes.values()].sort((a, b) => a.firstT - b.firstT);
}
