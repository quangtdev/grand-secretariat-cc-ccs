// The station's words: crew at their consoles, a captain on the bridge, drones on errands. Same keys as
// hue-court/hue-court-vocabulary.js; the tone is calm and technical. Status colours and meanings
// are unchanged (DESIGN.md, The Same Signal Rule): only the words differ.
import { counted } from '../world-vocabulary.js';

/** @type {import('../world-audio-and-vocabulary-contract.js').WorldVocabulary} */
export const spaceStationVocabulary = {
  appName: 'Mission Control',
  agent: { one: 'crew member', many: 'crew' },
  helper: { one: 'drone', many: 'drones' },
  status: {
    starting: 'Beaming in',
    idle: 'Standing by',
    working: 'On task',
    asking: 'Requests orders',
    done: 'Reporting',
    exited: 'Failed to beam in',
  },
  icons: { working: 'console', asking: 'comm', done: 'check' },
  helperIcon: 'drone',

  railLabel: 'Crew roster',
  stageLabel: 'The station: every crew member is one agent session',
  hintFlat: 'Drag to move. Scroll or right-drag to zoom.',
  hintOrbit: 'Drag to move. Scroll or right-drag to move closer. Middle-drag to turn.',
  railHide: 'Hide the roster',
  railShow: 'Show the roster',

  tallyEmpty: 'The station is quiet.',
  tally: (count, waiting) => {
    const total = counted(spaceStationVocabulary.agent, count);
    return waiting ? `${total}, ${waiting} on the bridge` : `${total}, none waiting on you`;
  },
  groupWaiting: 'On the bridge',
  groupWorking: 'At their consoles',
  rosterEmpty: 'Use the teleporter pad to beam aboard your first crew member. Each one is a Claude Code session working in a repository of yours.',

  summonAction: 'Beam aboard',
  summonLead: 'Starts a Claude Code session in the repository you pick.',
  summonSubmit: 'Beam aboard',
  summonBusy: 'Beaming aboard',
  summonFailed: (reason) => `The transport failed: ${reason}`,
  ticketHint: "Shown over the crew member's head. Left empty, the repository name is used.",

  historyTitle: 'History: call back a crew member you stood down',
  historyLead: 'Crew you stood down. Call one back to resume its conversation.',
  historyEmpty: 'No one has left the station yet. A crew member you stand down after it has worked appears here, ready to be called back.',
  historyLeft: 'left',
  recall: 'Call back',
  recalling: 'Calling back',

  tabsLabel: 'Crew',
  shortcutHint: 'Alt+↓ / Alt+↑ switch crew member · Alt+W next one waiting · Alt+` close or reopen',
  renameTitle: 'Rename this crew member',
  renameLabel: 'Crew member name',
  sessionEnded: 'This crew member has left the station. Its session ended.',
  dismiss: 'Stand down',
  dismissConfirm: 'End this session?',
  helpersTitle: 'Drones (sub-agents) out on tasks',
  inkWord: 'fuel', // "~62% fuel" in the rail and dock: context used by a scribe
  inkLowWord: 'fuel spent', // from 85%: the wording changes, never the colour
  inkLabel: 'Fuel', // lead of the tooltip with absolute tokens
  annalsTitle: "Mission log", // panel name, rail book button and tooltip
  annalsTip: "Mission log: what every crew member did, day by day",
  annalsLead: "What every crew member was tasked with, changed and committed on this day, stood-down ones included.",
  annalsEmpty: "Nothing was logged on this day.", // a day with no records
  helperFallback: 'Drone',
  delegating: (task) => `Launching a drone: ${task}`.trim(),
  helpersOut: (count) => `${counted(spaceStationVocabulary.helper, count)} out.`,

  saverOn: 'Power saver is on: the station moves less and draws less often',
  restartWarn: (busy) => `${counted({ one: 'busy crew member', many: 'busy crew' }, busy)} will be cut off mid-turn. `,
  restartNote: 'Every crew member reopens with its conversation.',
};
