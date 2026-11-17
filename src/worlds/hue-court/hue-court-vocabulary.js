// The Huế court's words: scribes at their desks, petitions before the throne, soldiers on
// errands. These are the shell's original strings, moved here unchanged; index.html carries the
// same text as its pre-boot default. Shared by both Huế worlds (3D and pixel).
import { counted } from '../world-vocabulary.js';

/** @type {import('../world-audio-and-vocabulary-contract.js').WorldVocabulary} */
export const hueCourtVocabulary = {
  appName: 'Grand Secretariat',
  agent: { one: 'scribe', many: 'scribes' },
  helper: { one: 'soldier', many: 'soldiers' },
  // Agent states. Status *colours* are invariant across worlds (see styles/world-themes.css).
  status: {
    starting: 'Arriving',
    idle: 'Awaiting orders',
    working: 'Working',
    asking: 'Needs your ruling',
    done: 'Reporting back',
    exited: 'Failed to start',
  },
  icons: {}, // optional per-status icon override: { asking: 'bell' }; names from status-vocabulary ICONS
  helperIcon: 'spear', // sub-agent marker in chips, strip and roll

  // Static page text (index.html and the shell around the stage).
  railLabel: 'Court roster',
  stageLabel: 'The court: every scribe is one agent session',
  hintFlat: 'Drag to move. Scroll or right-drag to zoom.', // 2D worlds: slide and zoom only
  hintOrbit: 'Drag to move. Scroll or right-drag to move closer. Middle-drag to turn.', // 3D worlds can also turn
  railHide: 'Hide the roster',
  railShow: 'Show the roster',

  // Rail.
  tallyEmpty: 'The court is empty.',
  tally: (count, waiting) => {
    const total = counted(hueCourtVocabulary.agent, count);
    return waiting ? `${total}, ${waiting} before the throne` : `${total}, none waiting on you`;
  },
  groupWaiting: 'Before the throne',
  groupWorking: 'At their desks',
  rosterEmpty: 'Beat the drum to summon your first scribe. Each one is a Claude Code session working in a repository of yours.',

  // Summon.
  summonAction: 'Summon a scribe', // rail button, stage chip, panel title
  summonLead: 'Starts a Claude Code session in the repository you pick.',
  summonSubmit: 'Summon',
  summonBusy: 'Summoning',
  summonFailed: (reason) => `The summons failed: ${reason}`,
  ticketHint: "Shown over the scribe's head. Left empty, the repository name is used.",

  // History.
  historyTitle: 'History: recall a scribe you dismissed', // tooltip of the rail's history button
  historyLead: 'Scribes you dismissed. Recall one to resume its conversation.',
  historyEmpty: 'No one has left the court yet. A scribe you dismiss after it has worked appears here, ready to be recalled.',
  historyLeft: 'left', // "left 3h ago"
  recall: 'Recall',
  recalling: 'Recalling',

  // Dock.
  tabsLabel: 'Scribes',
  shortcutHint: 'Alt+↓ / Alt+↑ switch scribe · Alt+W next one waiting · Alt+` close or reopen',
  renameTitle: 'Rename this scribe',
  renameLabel: 'Scribe name',
  sessionEnded: 'This scribe has left the court. Its session ended.',
  dismiss: 'Dismiss',
  dismissConfirm: 'End this session?',
  deferAction: 'Back to the desk', // send a waiting agent back to sit at its desk, still waiting (ui/deferred-petitions.js)
  recallToRuler: 'Call to the throne', // and call it up again
  deferredNote: 'Waiting at the desk', // shown beside it while it waits there
  helpersTitle: 'Soldiers (sub-agents) out on errands',
  inkWord: 'ink', // "~62% ink" in the rail and dock: context used by a scribe
  inkLowWord: 'ink low', // from 85%: the wording changes, never the colour
  inkLabel: 'Ink', // lead of the tooltip with absolute tokens
  annalsTitle: "Annals", // panel name, rail book button and tooltip
  annalsTip: "Annals: the court's chronicle, day by day",
  annalsLead: "What every scribe was ordered, wrote and committed on this day, dismissed ones included.",
  annalsEmpty: "Nothing was written in the annals on this day.", // a day with no records
  helperFallback: 'Soldier', // name of a sub-agent that has no task or kind
  delegating: (task) => `Sending a soldier: ${task}`.trim(), // a delegation step of the feed
  helpersOut: (count) => `${counted(hueCourtVocabulary.helper, count)} out.`, // chip's accessible label

  // Rail foot.
  saverOn: 'Power saver is on: the court moves less and draws less often',
  restartWarn: (busy) => `${counted({ one: 'working scribe', many: 'working scribes' }, busy)} will be cut off mid-turn. `,
  restartNote: 'Every scribe reopens with its conversation.',
};
