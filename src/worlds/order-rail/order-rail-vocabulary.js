// The order rail's words: a restaurant pass. Every agent is a cook working one ticket, sub-agents
// are prep cooks, the user is the chef calling the pass. Same keys as hue-court/hue-court-vocabulary.js;
// status colours and meanings are unchanged (DESIGN.md, The Same Signal Rule): only the words differ.
import { counted } from '../world-vocabulary.js';

/** @type {import('../world-audio-and-vocabulary-contract.js').WorldVocabulary} */
export const orderRailVocabulary = {
  appName: 'The Pass',
  agent: { one: 'cook', many: 'cooks' },
  helper: { one: 'prep cook', many: 'prep cooks' },
  status: {
    starting: 'Clocking in',
    idle: 'Station ready',
    working: 'Cooking',
    asking: 'Needs the chef',
    done: 'Order up',
    exited: 'Failed to clock in',
  },
  icons: { working: 'flame', asking: 'ticket', done: 'bell', idle: 'wait' },
  helperIcon: 'knife',

  railLabel: 'Kitchen roster',
  stageLabel: 'The pass: every docket is one agent session',
  hintFlat: 'Click a docket to open its terminal.',
  hintOrbit: 'Click a docket to open its terminal.',
  railHide: 'Hide the roster',
  railShow: 'Show the roster',

  tallyEmpty: 'The kitchen is empty.',
  tally: (count, waiting) => {
    const total = counted(orderRailVocabulary.agent, count);
    return waiting ? `${total}, ${waiting} at the pass` : `${total}, none waiting on you`;
  },
  groupWaiting: 'At the pass',
  groupWorking: 'On the line',
  rosterEmpty: 'Fire a ticket to start your first cook. Each one is a Claude Code session working in a repository of yours.',

  summonAction: 'Fire a ticket',
  summonLead: 'Starts a Claude Code session in the repository you pick.',
  summonSubmit: 'Fire',
  summonBusy: 'Firing',
  summonFailed: (reason) => `The ticket could not be fired: ${reason}`,
  ticketHint: 'Printed on the docket. Left empty, the repository name is used.',

  historyTitle: 'History: bring back a cook you sent home',
  historyLead: 'Cooks you sent home. Bring one back to resume its conversation.',
  historyEmpty: 'No one has gone home yet. A cook you send home after it has worked appears here, ready to come back.',
  historyLeft: 'went home',
  recall: 'Call back',
  recalling: 'Calling back',

  tabsLabel: 'Cooks',
  shortcutHint: 'Alt+↓ / Alt+↑ switch cook · Alt+W next one at the pass · Alt+` close or reopen',
  renameTitle: 'Rename this ticket',
  renameLabel: 'Ticket name',
  sessionEnded: 'This cook has gone home. Its session ended.',
  dismiss: 'Send home',
  dismissConfirm: 'End this session?',
  deferAction: 'Park the ticket', // send a waiting agent back to sit at its desk, still waiting (ui/deferred-petitions.js)
  recallToRuler: 'Back to the pass', // and call it up again
  deferredNote: 'Parked', // shown beside it while it waits there
  helpersTitle: 'Prep cooks (sub-agents) on the line',
  inkWord: 'context', // "~62% context": context used by a cook
  inkLowWord: 'context full', // from 85%: the wording changes, never the colour
  inkLabel: 'Context', // lead of the tooltip with absolute tokens
  annalsTitle: 'Service log',
  annalsTip: 'Service log: what every cook did, day by day',
  annalsLead: 'What every cook was asked, changed and committed on this day, those sent home included.',
  annalsEmpty: 'Nothing was logged on this day.',
  helperFallback: 'Prep cook',
  delegating: (task) => `Handing prep to a cook: ${task}`.trim(),
  helpersOut: (count) => `${counted(orderRailVocabulary.helper, count)} on the line.`,

  saverOn: 'Power saver is on: dockets move without swinging',
  restartWarn: (busy) => `${counted({ one: 'busy cook', many: 'busy cooks' }, busy)} will be cut off mid-ticket. `,
  restartNote: 'Every cook comes back with its conversation.',
};

/** The board's own words: the three stations and the empty slot. */
export const orderRailBoardWords = {
  stationPass: 'At the pass',
  stationLine: 'On the line',
  stationReady: 'Standing by',
  passEmpty: 'Nothing waiting on you.',
  lineEmpty: 'No one is cooking.',
  readyEmpty: 'No cook is idle.',
  oldest: 'oldest',
  order: 'Order',
};
