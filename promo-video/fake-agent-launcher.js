#!/usr/bin/env node
// Stand-in for the agent CLI while recording: prints a plausible working transcript and echoes typed orders.
const name = process.argv[process.argv.indexOf('--name') + 1] || 'scribe';
const c = (n, s) => `\x1b[${n}m${s}\x1b[0m`;
const lines = [
  c('1;33', `  ✦ ${name}`) + c('2', '   agent session'),
  '',
  c('36', '● ') + 'Reading the repository layout',
  c('2', '  ⎿ 42 files, 3 packages'),
  c('36', '● ') + 'Edit src/routes/checkout.js',
  c('32', '  + validate cart totals before charge'),
  c('31', '  - charge(card, total)'),
  c('36', '● ') + '$ npm test',
  c('32', '  ✓ 128 passed') + c('2', ' (4.2s)'),
  '',
];
let i = 0;
const prompt = () => process.stdout.write(c('1;35', '\r\n❯ '));
const tick = setInterval(() => {
  if (i < lines.length) process.stdout.write(lines[i++] + '\r\n');
  else { clearInterval(tick); prompt(); }
}, 350);
process.stdin.setRawMode?.(true);
process.stdin.on('data', (d) => {
  const s = d.toString();
  if (s === '\r') { process.stdout.write('\r\n' + c('36', '● ') + 'On it.\r\n'); prompt(); }
  else if (s === '\x03') process.exit(0);
  else process.stdout.write(s);
});
