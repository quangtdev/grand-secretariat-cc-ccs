// Pure parsing of a Claude Code transcript (JSONL) into context usage and token totals.
// A transcript line of an assistant message carries `message.usage`; one streamed message is
// written as several lines that share `message.id`, so totals count each id once (last usage wins).

export const BASE_CONTEXT_LIMIT = 200_000;
export const WIDE_CONTEXT_LIMIT = 1_000_000;
const ASSISTANT_MARK = '"type":"assistant"'; // cheap prefilter before JSON.parse

const zeroTotals = () => ({ input: 0, output: 0, cacheRead: 0, cacheWrite: 0 });

/** Fresh reader state for one transcript file. */
export function newUsageState(file) {
  return {
    path: file, offset: 0, carry: [], lastMessageId: null, lastContribution: zeroTotals(),
    contextTokens: 0, model: null, totals: zeroTotals(), latched: false,
  };
}

const num = (v) => (Number.isFinite(v) && v > 0 ? v : 0);

/** Context window size: the env override, else 200k, latched to 1M once more than 200k was seen. */
export function contextLimitFor(used, latched, envLimit = 0) {
  if (envLimit > 0) return envLimit;
  return latched || used > BASE_CONTEXT_LIMIT ? WIDE_CONTEXT_LIMIT : BASE_CONTEXT_LIMIT;
}

function applyAssistantLine(state, line) {
  let entry;
  try { entry = JSON.parse(line); } catch { return; } // malformed or half-written: ignore
  const message = entry?.message;
  if (entry?.type !== 'assistant' || entry.isSidechain || !message?.usage) return;
  if (message.model === '<synthetic>') return; // client-made notices, no real usage
  const u = message.usage;
  const mine = {
    input: num(u.input_tokens), output: num(u.output_tokens),
    cacheRead: num(u.cache_read_input_tokens), cacheWrite: num(u.cache_creation_input_tokens),
  };
  const used = mine.input + mine.cacheRead + mine.cacheWrite;
  if (used === 0 && mine.output === 0) return;
  // The same message again (next content block): replace its earlier contribution instead of adding.
  const prev = message.id && message.id === state.lastMessageId ? state.lastContribution : zeroTotals();
  for (const k of Object.keys(mine)) state.totals[k] += mine[k] - prev[k];
  state.lastMessageId = message.id ?? null;
  state.lastContribution = mine;
  state.contextTokens = used; // the last turn's prompt size = what the context holds now (drops after /compact)
  state.model = message.model ?? state.model;
  if (used > BASE_CONTEXT_LIMIT) state.latched = true;
}

/**
 * Feed a chunk of transcript text (any split, even mid-line) into `state`; returns the same state.
 * Only whole lines are parsed: the unfinished last line waits in `state.carry`.
 */
export function parseUsageLines(text, state) {
  // No newline yet (a long line arriving in pieces): keep the piece, do not rescan the whole line.
  if (!text.includes('\n')) { if (text) state.carry.push(text); return state; }
  state.carry.push(text);
  const lines = state.carry.join('').split('\n');
  state.carry = [lines.pop()];
  for (const line of lines) if (line.includes(ASSISTANT_MARK)) applyAssistantLine(state, line);
  return state;
}
