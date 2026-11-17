// The office's words: employees at their desks, a manager's glass office, contractors on
// errands. Same keys as hue-court/hue-court-vocabulary.js; tone is plain and workplace. Status
// colours and meanings are unchanged (DESIGN.md, The Same Signal Rule): only the words differ.
import { counted } from '../world-vocabulary.js';

/** @type {import('../world-audio-and-vocabulary-contract.js').WorldVocabulary} */
export const officeVocabulary = {
  appName: 'Head Office',
  agent: { one: 'employee', many: 'employees' },
  helper: { one: 'contractor', many: 'contractors' },
  status: {
    starting: 'Arriving',
    idle: 'Waiting for a task',
    working: 'Working',
    asking: 'Needs your decision',
    done: 'Reporting back',
    exited: 'Failed to start',
  },
  icons: { working: 'keyboard', asking: 'ticket', done: 'laptop' },
  helperIcon: 'laptop',

  railLabel: 'Staff roster',
  stageLabel: 'Head Office: every employee is one agent session',
  hintFlat: 'Drag to move. Scroll or right-drag to zoom.',
  hintOrbit: 'Drag to move. Scroll or right-drag to move closer. Middle-drag to turn.',
  railHide: 'Hide the roster',
  railShow: 'Show the roster',

  tallyEmpty: 'The office is empty.',
  tally: (count, waiting) => {
    const total = counted(officeVocabulary.agent, count);
    return waiting ? `${total}, ${waiting} at the manager's door` : `${total}, none waiting on you`;
  },
  groupWaiting: "At the manager's door",
  groupWorking: 'At their desks',
  rosterEmpty: 'Press the reception bell to hire your first employee. Each one is a Claude Code session working in a repository of yours.',

  summonAction: 'Hire an employee',
  summonLead: 'Starts a Claude Code session in the repository you pick.',
  summonSubmit: 'Hire',
  summonBusy: 'Hiring',
  summonFailed: (reason) => `The employee could not be hired: ${reason}`,
  ticketHint: "Shown over the employee's head. Left empty, the repository name is used.",

  historyTitle: 'History: bring back an employee you let go',
  historyLead: 'Employees you let go. Bring one back to resume its conversation.',
  historyEmpty: 'No one has left the office yet. An employee you let go after it has worked appears here, ready to come back.',
  historyLeft: 'left',
  recall: 'Rehire',
  recalling: 'Rehiring',

  tabsLabel: 'Employees',
  shortcutHint: 'Alt+↓ / Alt+↑ switch employee · Alt+W next one waiting · Alt+` close or reopen',
  renameTitle: 'Rename this employee',
  renameLabel: 'Employee name',
  sessionEnded: 'This employee has left the office. Its session ended.',
  dismiss: 'Let go',
  dismissConfirm: 'End this session?',
  helpersTitle: 'Contractors (sub-agents) on site',
  inkWord: 'context', // "~62% context" in the rail and dock: context used by a scribe
  inkLowWord: 'context full', // from 85%: the wording changes, never the colour
  inkLabel: 'Context', // lead of the tooltip with absolute tokens
  annalsTitle: "Daily log", // panel name, rail book button and tooltip
  annalsTip: "Daily log: what every employee did, day by day",
  annalsLead: "What every employee was asked, changed and committed on this day, those let go included.",
  annalsEmpty: "Nothing was logged on this day.", // a day with no records
  helperFallback: 'Contractor',
  delegating: (task) => `Briefing a contractor: ${task}`.trim(), // a delegation step of the feed
  helpersOut: (count) => `${counted(officeVocabulary.helper, count)} on site.`,

  saverOn: 'Power saver is on: the office moves less and draws less often',
  restartWarn: (busy) => `${counted({ one: 'busy employee', many: 'busy employees' }, busy)} will be cut off mid-task. `,
  restartNote: 'Every employee reopens with its conversation.',
};
