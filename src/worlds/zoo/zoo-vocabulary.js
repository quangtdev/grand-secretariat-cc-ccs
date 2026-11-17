// The zoo's words: animals at their troughs, a keeper's hut, cubs on errands. Same keys as
// hue-court/hue-court-vocabulary.js; tone is friendly. Status colours and meanings are
// unchanged (DESIGN.md, The Same Signal Rule): only the words differ.
import { counted } from '../world-vocabulary.js';

/** @type {import('../world-audio-and-vocabulary-contract.js').WorldVocabulary} */
export const zooVocabulary = {
  appName: 'The Menagerie',
  agent: { one: 'animal', many: 'animals' },
  helper: { one: 'cub', many: 'cubs' },
  status: {
    starting: 'Arriving',
    idle: 'Resting',
    working: 'Busy',
    asking: 'Needs the keeper',
    done: 'Showing off',
    exited: 'Failed to arrive',
  },
  icons: { working: 'paw', asking: 'sign', done: 'ribbon' },
  helperIcon: 'paw',

  railLabel: 'Zoo roster',
  stageLabel: 'The zoo: every animal is one agent session',
  hintFlat: 'Drag to move. Scroll or right-drag to zoom.',
  hintOrbit: 'Drag to move. Scroll or right-drag to move closer. Middle-drag to turn.',
  railHide: 'Hide the roster',
  railShow: 'Show the roster',

  tallyEmpty: 'The zoo is empty.',
  tally: (count, waiting) => {
    const total = counted(zooVocabulary.agent, count);
    return waiting ? `${total}, ${waiting} at the keeper's hut` : `${total}, none waiting on you`;
  },
  groupWaiting: "At the keeper's hut",
  groupWorking: 'At their troughs',
  rosterEmpty: 'Ring the gate bell to admit your first animal. Each one is a Claude Code session working in a repository of yours.',

  summonAction: 'Admit an animal',
  summonLead: 'Starts a Claude Code session in the repository you pick.',
  summonSubmit: 'Admit',
  summonBusy: 'Admitting',
  summonFailed: (reason) => `The animal could not be admitted: ${reason}`,
  ticketHint: "Shown over the animal's head. Left empty, the repository name is used.",

  historyTitle: 'History: bring back an animal you released',
  historyLead: 'Animals you released. Bring one back to resume its conversation.',
  historyEmpty: 'No one has left the zoo yet. An animal you release after it has worked appears here, ready to come back.',
  historyLeft: 'left',
  recall: 'Bring back',
  recalling: 'Bringing back',

  tabsLabel: 'Animals',
  shortcutHint: 'Alt+↓ / Alt+↑ switch animal · Alt+W next one waiting · Alt+` close or reopen',
  renameTitle: 'Rename this animal',
  renameLabel: 'Animal name',
  sessionEnded: 'This animal has left the zoo. Its session ended.',
  dismiss: 'Release',
  dismissConfirm: 'End this session?',
  helpersTitle: 'Cubs (sub-agents) out playing',
  inkWord: 'appetite', // "~62% appetite" in the rail and dock: context used by a scribe
  inkLowWord: 'appetite full', // from 85%: the wording changes, never the colour
  inkLabel: 'Appetite', // lead of the tooltip with absolute tokens
  annalsTitle: "Keeper's diary", // panel name, rail book button and tooltip
  annalsTip: "Keeper's diary: what every animal did, day by day",
  annalsLead: "What every animal was asked, changed and committed on this day, released ones included.",
  annalsEmpty: "Nothing was written in the diary on this day.", // a day with no records
  helperFallback: 'Cub',
  delegating: (task) => `Sending a cub: ${task}`.trim(),
  helpersOut: (count) => `${counted(zooVocabulary.helper, count)} out.`,

  saverOn: 'Power saver is on: the zoo moves less and draws less often',
  restartWarn: (busy) => `${counted({ one: 'busy animal', many: 'busy animals' }, busy)} will be cut off mid-turn. `,
  restartNote: 'Every animal reopens with its conversation.',
};
