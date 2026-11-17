// Words and numbers for a scribe's ink level (context used, tokens). Pure: the server sends
// `ink = {used, limit, pct, totals}` (transcript-usage-reader.js); the world supplies the words.
// Not a status, so it never changes colour: past LOW_AT only the wording changes.
export const LOW_AT = 85;

/** 950 -> "950", 12400 -> "12k", 1_400_000 -> "1.4M". */
export function formatTokens(n) {
  const value = Number.isFinite(n) && n > 0 ? n : 0;
  if (value < 1000) return String(Math.round(value));
  if (value < 1_000_000) return `${Math.round(value / 1000)}k`;
  const millions = Math.round(value / 100_000) / 10;
  return `${millions}M`;
}

const percentOf = (ink) => Math.max(0, Math.min(100, Math.round(Number(ink.pct) || 0)));

/** "~62% ink", or "~91% ink low" from LOW_AT up. Empty when there is no ink yet. */
export function inkText(ink, words) {
  if (!ink) return '';
  const pct = percentOf(ink);
  return `~${pct}% ${pct >= LOW_AT ? words.inkLowWord : words.inkWord}`;
}

/** Tooltip: "Ink ~128k of 200k used. This session: 1.4M tokens read, 38k written." */
export function inkDetail(ink, words) {
  if (!ink) return '';
  const totals = ink.totals || {};
  const read = (totals.input || 0) + (totals.cacheRead || 0) + (totals.cacheWrite || 0);
  return `${words.inkLabel} ~${formatTokens(ink.used)} of ${formatTokens(ink.limit)} used. This session: ${formatTokens(read)} tokens read, ${formatTokens(totals.output)} written.`;
}
