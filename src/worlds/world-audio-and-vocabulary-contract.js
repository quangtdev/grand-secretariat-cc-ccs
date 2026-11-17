// Part of the world-pack contract (world-pack-contract.js): what a pack supplies for SOUND
// (`audio`) and WORDS (`vocabulary`), and the dev-time check of both.

import { ICONS } from '../status-vocabulary.js';

/**
 * A world's sound. The engine (audio/court-audio.js) owns the AudioContext, master chain,
 * the Sounds/Music preferences, the unlock on first gesture, the cue gap, resting the engine
 * and which status change calls which cue; the pack owns what everything sounds like. Every
 * voice schedules itself at an absolute AudioContext time. Shared building blocks (noise,
 * envelope, play) are in audio/web-audio-primitives.js.
 * @typedef {object} WorldAudio
 * @property {(ctx: AudioContext, bus: {dry: AudioNode, wet: AudioNode}) => object} createInstruments
 *           the voices ("play" object the cues call), routed to `dry` and, through the reverb, `wet`.
 *           Called twice (effects bus, music bus), so it must hold no shared state
 * @property {(ctx: AudioContext, destination: AudioNode) => AudioNode} createReverb  returns the node to send into; its tail goes to `destination`
 * @property {Record<'call'|'summon'|'petition'|'report'|'failed'|'muster'|'disband'|'edict'|'chirp'|'desk'|'depart', (play: object, t: number) => void>} cues
 *           one short score each, notes struck at `t` + offsets. call: the summon button was pressed; summon: an agent was
 *           summoned or recalled; petition: an agent asks; report: an agent is done (also the Sounds-on preview);
 *           failed: could not start; muster / disband: a sub-agent joined / left; edict: an order was sent;
 *           chirp: ambient wildlife (call `document.hidden` guard yourself); desk: a desk set down; depart: an agent dismissed
 * @property {new (ctx: AudioContext, instruments: object) => {start: () => void, stop: () => void, readonly playing: boolean}} Ambience
 *           background music, built on its own instruments; start() / stop() are idempotent
 * @property {(play: object, t: number) => void} murmur  one soft sound per keystroke in the dock (the engine throttles to 70 ms)
 */

/**
 * The words of the shell. Everything a user can read that names a thing of the world. Plurals
 * use `{ one, many }` or a function; there is no i18n library. See hue-court/hue-court-vocabulary.js
 * for the Huế values of every key.
 * @typedef {object} WorldVocabulary
 * @property {string} appName
 * @property {{one: string, many: string}} agent    a session as a person of this world (scribe)
 * @property {{one: string, many: string}} helper   a sub-agent (soldier)
 * @property {Record<'starting'|'idle'|'working'|'asking'|'done'|'exited', string>} status  state labels
 * @property {Partial<Record<'starting'|'idle'|'working'|'asking'|'done'|'exited', string>>} [icons]  override of a state's icon (a name in ICONS, status-vocabulary.js)
 * @property {string} helperIcon      ICONS name marking sub-agents
 * @property {string} railLabel @property {string} stageLabel @property {string} hintFlat @property {string} hintOrbit
 * @property {string} railHide @property {string} railShow
 * @property {string} tallyEmpty @property {(count: number, waiting: number) => string} tally
 * @property {string} groupWaiting @property {string} groupWorking @property {string} rosterEmpty
 * @property {string} summonAction @property {string} summonLead @property {string} summonSubmit @property {string} summonBusy
 * @property {(reason: string) => string} summonFailed @property {string} ticketHint
 * @property {string} historyTitle @property {string} historyLead @property {string} historyEmpty @property {string} historyLeft
 * @property {string} recall @property {string} recalling
 * @property {string} tabsLabel @property {string} shortcutHint @property {string} renameTitle @property {string} renameLabel
 * @property {string} sessionEnded @property {string} dismiss @property {string} dismissConfirm
 * @property {string} helpersTitle @property {string} helperFallback @property {(count: number) => string} helpersOut
 * @property {(task: string) => string} delegating  the step "sending a helper off with this task" (the server sends `activityKind: 'delegate'` + `activityTask`)
 * @property {string} inkWord @property {string} inkLowWord @property {string} inkLabel  context used: "~62% ink", "~91% ink low" (from 85%), tooltip lead "Ink ~128k of 200k used"
 * @property {string} annalsTitle @property {string} annalsTip @property {string} annalsLead @property {string} annalsEmpty  the per-day chronicle panel
 * @property {string} saverOn @property {(busy: number) => string} restartWarn @property {string} restartNote
 */

const CUE_NAMES = ['call', 'summon', 'petition', 'report', 'failed', 'muster', 'disband', 'edict', 'chirp', 'desk', 'depart'];
const STATUS_NAMES = ['starting', 'idle', 'working', 'asking', 'done', 'exited'];
const VOCAB_TEXT = ['appName', 'helperIcon', 'railLabel', 'stageLabel', 'hintFlat', 'hintOrbit', 'railHide', 'railShow', 'tallyEmpty',
  'groupWaiting', 'groupWorking', 'rosterEmpty', 'summonAction', 'summonLead', 'summonSubmit', 'summonBusy', 'ticketHint',
  'historyTitle', 'historyLead', 'historyEmpty', 'historyLeft', 'recall', 'recalling', 'tabsLabel', 'shortcutHint', 'renameTitle',
  'renameLabel', 'sessionEnded', 'dismiss', 'dismissConfirm', 'helpersTitle', 'helperFallback', 'inkWord', 'inkLowWord', 'inkLabel', 'annalsTitle', 'annalsTip', 'annalsLead', 'annalsEmpty', 'saverOn', 'restartNote'];
const VOCAB_FUNCTIONS = ['tally', 'summonFailed', 'helpersOut', 'restartWarn', 'delegating'];

/** Adds to `need` (the caller's problem collector) one entry per missing audio or vocabulary member. */
export function checkAudioAndVocabulary(pack, need) {
  const audio = pack.audio;
  need(audio && typeof audio === 'object', 'audio');
  if (audio) {
    for (const name of ['createInstruments', 'createReverb', 'murmur']) need(typeof audio[name] === 'function', `audio.${name}()`);
    need(typeof audio.Ambience === 'function', 'audio.Ambience (class)');
    for (const name of CUE_NAMES) need(typeof audio.cues?.[name] === 'function', `audio.cues.${name}(play, t)`);
  }
  const words = pack.vocabulary;
  need(words && typeof words === 'object', 'vocabulary');
  if (words) {
    for (const key of VOCAB_TEXT) need(typeof words[key] === 'string' && words[key], `vocabulary.${key}`);
    for (const key of VOCAB_FUNCTIONS) need(typeof words[key] === 'function', `vocabulary.${key}()`);
    for (const key of ['agent', 'helper']) need(typeof words[key]?.one === 'string' && typeof words[key]?.many === 'string', `vocabulary.${key} {one, many}`);
    need(words.helperIcon in ICONS, `vocabulary.helperIcon (unknown icon "${words.helperIcon}")`);
    for (const [key, icon] of Object.entries(words.icons ?? {})) need(STATUS_NAMES.includes(key) && icon in ICONS, `vocabulary.icons.${key} (unknown status or icon "${icon}")`);
    for (const key of STATUS_NAMES) need(typeof words.status?.[key] === 'string' && words.status[key], `vocabulary.status.${key}`);
  }
}
