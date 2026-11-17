// Words for the annals panel, built in one place so every world shares the sentences
// (the world only supplies the panel's name, lead and empty text). Pure.
import { formatTokens } from './ink-level-text.js';

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const pad = (n) => String(n).padStart(2, '0');

/** 0 -> "", 40s -> "<1m", 12m -> "12m", 65m -> "1h 05m". */
export function formatWaited(ms) {
  if (!(ms > 0)) return '';
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return '<1m';
  return minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h ${pad(minutes % 60)}m`;
}

/** "3 orders · 12 files · 2 commits · waited 1h 05m · 1.4M tokens"; parts that are zero are left out. */
export function annalsCounts(scribe) {
  const waited = formatWaited((scribe.waitedMs?.asking || 0) + (scribe.waitedMs?.done || 0));
  const tokens = (scribe.tokens?.input || 0) + (scribe.tokens?.output || 0);
  return [
    scribe.orderCount && plural(scribe.orderCount, 'order'),
    scribe.fileCount && plural(scribe.fileCount, 'file'),
    scribe.commitCount && plural(scribe.commitCount, 'commit'),
    waited && `waited ${waited}`,
    tokens && `${formatTokens(tokens)} tokens`,
  ].filter(Boolean).join(' · ');
}

/** Local clock time of a timestamp: "09:05". */
export const clockTime = (ms) => { const d = new Date(ms); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };

/** "Today · Sat 14 Nov", "Yesterday · Fri 13 Nov", else "Thu 12 Nov". `day` and `today` are YYYY-MM-DD. */
export function dayLabel(day, today) {
  const at = (key) => { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d); };
  const date = at(day).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).replace(',', '');
  const gap = Math.round((at(today) - at(day)) / 86_400_000);
  if (gap === 0) return `Today · ${date}`;
  if (gap === 1) return `Yesterday · ${date}`;
  return date;
}
