// Records the promo takes for one language: node record-promo-takes.js <vi|en> [take ...]
//   A  the Huế court story (summon, petition, order, soldiers, report) with its sound
//   B1..B4  one short shot of each other world
//   C  end card over the court
const fs = require('fs');
const path = require('path');
const L = require('./promo-recording-lib.js');

const lang = process.argv[2] || 'vi';
const only = process.argv.slice(3);
const wants = (take) => !only.length || only.includes(take);
const OUT = path.join(L.ROOT, 'out', lang);
fs.mkdirSync(OUT, { recursive: true });

const TEXT = {
  vi: {
    hook: 'AI agent của tôi<br>làm việc trong <b>triều đình Huế</b>',
    summon: 'Gõ trống<br><b>triệu thêm một agent</b>',
    petition: 'Cần bạn quyết?<br>Agent chạy lên <b>quỳ dâng sớ</b>',
    answer: 'Trả lời ngay<br>trong <b>terminal</b> của nó',
    soldiers: 'Sub-agent là <b>lính</b><br>đứng sau lưng chủ',
    report: 'Xong việc<br>thì lên <b>báo cáo</b>',
    worlds: 'Chán triều đình?<br><b>Đổi thế giới</b>',
    worldNames: { 'hue-pixel': 'Huế pixel 2D', zoo: 'Sở thú', office: 'Văn phòng', 'space-station': 'Trạm vũ trụ' },
    endTitle: 'Grand Secretariat', endLine: 'Xem mọi agent Claude Code<br>trong một triều đình', endCta: 'Mã nguồn mở · Link ở bio',
  },
  en: {
    hook: 'My AI agents work<br>in a <b>royal court</b>',
    summon: 'Beat the drum<br><b>summon another agent</b>',
    petition: 'Needs your call?<br>It <b>kneels with a petition</b>',
    answer: 'Answer right<br>in its <b>terminal</b>',
    soldiers: 'Sub-agents are <b>soldiers</b><br>behind their master',
    report: 'Work done?<br>It comes to <b>report</b>',
    worlds: 'Bored of the court?<br><b>Switch worlds</b>',
    worldNames: { 'hue-pixel': 'Pixel 2D court', zoo: 'Zoo', office: 'Office', 'space-station': 'Space station' },
    endTitle: 'Grand Secretariat', endLine: 'Watch every Claude Code agent<br>in one royal court', endCta: 'Open source · Link in bio',
  },
}[lang];

// Only for the recording: no stray buttons over the picture, the terminal as a bottom sheet so the court stays visible.
const RECORDING_CSS = `
  #rail-expand, .chip-summon, .stage-hint, #dock-meta, .dock-tabs { display: none !important; }
  .dock { inset: auto 0 0 0 !important; width: 100vw !important; height: 372px !important; border-radius: 18px 18px 0 0; overflow: hidden;
    box-shadow: 0 -10px 30px rgba(20,6,4,.5) !important; }
  body.promo-no-dock .dock { visibility: hidden !important; }
  body::before { content: ""; position: fixed; inset: 0 0 auto 0; height: 320px; z-index: 99990; pointer-events: none;
    background: linear-gradient(rgba(44,10,6,.62), rgba(44,10,6,.38) 55%, rgba(44,10,6,0)); }
  #promo-end { position: fixed; inset: 0; z-index: 99998; display: grid; place-content: center; gap: 18px; text-align: center; padding: 0 36px;
    background: radial-gradient(120% 80% at 50% 40%, rgba(122,24,16,.86), rgba(48,10,6,.95)); backdrop-filter: blur(7px);
    font-family: "Be Vietnam Pro", system-ui, sans-serif; color: #fff8e7; opacity: 0; transition: opacity .5s ease; }
  #promo-end.on { opacity: 1; }
  #promo-end h1 { font-size: 50px; line-height: 1.05; font-weight: 600; letter-spacing: -0.02em; margin: 0; color: #f4c542; }
  #promo-end p { font-size: 25px; line-height: 1.3; font-weight: 500; margin: 0; }
  #promo-end .cta { justify-self: center; margin-top: 18px; padding: 13px 26px; border-radius: 999px; background: #f4c542; color: #3d0d08; font-size: 23px; font-weight: 600; }
  #promo-end > * { transform: translateY(14px); opacity: 0; transition: transform .6s cubic-bezier(.2,.8,.2,1), opacity .6s ease; }
  #promo-end.on > * { transform: none; opacity: 1; }
  #promo-end.on > :nth-child(2) { transition-delay: .25s; } #promo-end.on > :nth-child(3) { transition-delay: .5s; }
`;

const caption = (page, html, where) => page.evaluate((h, w) => window.__promo.caption(h, w), html, where);
const clickChip = (page, ticket) => page.evaluate((t) => document.querySelector(`#chips .chip[data-ticket="${t}"]`).click(), ticket);

async function stagePage(page) {
  await page.addStyleTag({ content: RECORDING_CSS });
  await page.keyboard.press('Shift'); // a key press lets the court's sound start
  // The collapsed rail is remembered by the browser: only collapse it when it is still open.
  await page.evaluate(() => { if (!document.getElementById('shell').classList.contains('is-rail-collapsed')) document.getElementById('rail-collapse').click(); });
  await page.mouse.move(270, 620); // pointer over the court keeps its background life moving
}

/** Slow drag over exactly `ms`: the middle button turns a 3D view, the left one slides it. */
async function drag(page, ms, dx, { button = 'middle', y = 640 } = {}) {
  const began = Date.now();
  await page.mouse.move(270, y);
  await page.mouse.down({ button });
  for (;;) {
    const k = Math.min(1, (Date.now() - began) / ms);
    await page.mouse.move(270 + dx * k, y);
    if (k >= 1) break;
    await L.sleep(16);
  }
  await page.mouse.up({ button });
}
const zoom = async (page, notches, x = 270, y = 470) => {
  await page.mouse.move(x, y);
  for (let i = 0; i < Math.abs(notches); i++) { await page.mouse.wheel({ deltaY: notches > 0 ? -100 : 100 }); await L.sleep(60); }
};

/** Closer than the default view: the hall and the desks fill a phone screen. */
async function frameCourt(page) {
  await zoom(page, 4);
  await L.sleep(400);
  await page.mouse.move(270, 420); await page.mouse.down();
  for (let i = 1; i <= 20; i++) { await page.mouse.move(270, 420 + (115 * i) / 20); await L.sleep(20); }
  await page.mouse.up();
  await page.mouse.move(270, 620);
}

async function takeA(browser) {
  await L.dismissAll();
  const page = await L.openCourt(browser, 'hue-court');
  await stagePage(page);
  const crew = [
    ['checkout-api', 'Fix the failing checkout tests', ['Edit', { file_path: 'src/routes/checkout.js' }]],
    ['mobile-app', 'Add refunds to the order screen', ['Bash', { command: 'npm test' }]],
    ['billing-service', 'Migrate invoices to the new schema', ['Read', { file_path: 'db/schema.sql' }]],
    ['design-system', 'Ship the new Button variants', ['Edit', { file_path: 'src/Button.tsx' }]],
  ];
  const id = {};
  for (const [name] of crew) id[name] = await L.summon(name);
  await L.sleep(1200);
  for (const [name, prompt, [toolName, input]] of crew) { await L.start(id[name]); await L.order(id[name], prompt); await L.tool(id[name], toolName, input); }
  await L.sleep(9000); // desks carried out, scribes seated
  await frameCourt(page);
  await L.sleep(1500);

  const cap = await L.startCapture(page, path.join(OUT, 'take-A'));
  const t0 = Date.now();
  const at = (s) => L.sleep(Math.max(0, t0 + s * 1000 - Date.now()));
  const marks = {};
  const mark = (name) => { marks[name] = (Date.now() - t0) / 1000; };

  // 0.0 hook: wide shot, slow turn
  await L.sleep(200);
  await caption(page, TEXT.hook, 'top');
  await drag(page, 3000, 26);

  // 3.4 the drum is struck, a new scribe is summoned
  await at(3.4); mark('summon');
  await page.evaluate(() => { document.body.classList.add('promo-no-dock'); document.querySelector('.chip-summon').click(); });
  await caption(page, TEXT.summon, 'top');
  id['data-pipeline'] = await L.summon('data-pipeline');
  await L.sleep(350);
  await page.evaluate(() => document.getElementById('dock-close')?.click());
  await L.sleep(300);
  await page.evaluate(() => document.body.classList.remove('promo-no-dock'));
  await page.mouse.move(270, 620);
  await at(6.2);
  await L.start(id['data-pipeline']); await L.order(id['data-pipeline'], 'Backfill yesterday\'s events'); await L.tool(id['data-pipeline'], 'Bash', { command: 'python backfill.py' });

  // 7.6 a petition: the scribe runs to the throne and kneels
  await at(7.6); mark('petition');
  await L.ask(id['mobile-app'], 'Use Stripe or PayPal for refunds?');
  await caption(page, TEXT.petition, 'top');

  // 11.8 open its terminal, answer, the edict flies
  await at(11.8); mark('answer');
  await clickChip(page, 'mobile-app');
  await caption(page, TEXT.answer, 'top');
  await at(13.2);
  await page.keyboard.type('Stripe. Go ahead', { delay: 70 });
  await at(14.7);
  await page.keyboard.press('Enter');
  await L.sleep(250);
  await L.order(id['mobile-app'], 'Stripe. Go ahead');
  await L.tool(id['mobile-app'], 'Edit', { file_path: 'src/refunds.ts' });
  await at(16.9);
  await page.evaluate(() => document.getElementById('dock-close')?.click());
  await page.mouse.move(270, 620);

  // 17.3 sub-agents rise as soldiers
  await at(17.3); mark('soldiers');
  await caption(page, TEXT.soldiers, 'top');
  const tasks = ['Audit payment flows', 'Find flaky tests', 'Check the API contract'];
  for (let i = 0; i < tasks.length; i++) {
    await L.tool(id['checkout-api'], 'Agent', { description: tasks[i], subagent_type: 'Explore' }, { tool_use_id: `promo-${lang}-${i}` });
    await L.sleep(450);
  }

  // 20.6 a finished scribe reports at the throne
  await at(20.6); mark('report');
  await L.stop(id['billing-service']);
  await caption(page, TEXT.report, 'top');
  await at(23.8); mark('end');
  await caption(page, '');
  await L.sleep(350);
  const meta = await cap.stop(12000); // the music runs on under the next takes
  fs.writeFileSync(path.join(OUT, 'take-A', 'marks.json'), JSON.stringify({ marks, ids: id }));
  console.log('[take A]', JSON.stringify(marks), 'frames', meta.frames.length);
  await page.close();
}

async function takeWorld(browser, world, index) {
  const page = await L.openCourt(browser, world);
  await stagePage(page);
  await L.sleep(6000);
  await zoom(page, world === 'hue-pixel' ? 5 : 3, 270, 560); // the other worlds fill the phone screen too
  await page.mouse.move(270, 620);
  await L.sleep(1200);
  await caption(page, `${TEXT.worlds}<small>${TEXT.worldNames[world]}</small>`, 'top');
  await L.sleep(500);
  const cap = await L.startCapture(page, path.join(OUT, `take-B${index}`));
  // A 2D court slides, it does not turn.
  if (world === 'hue-pixel') await drag(page, 2000, -30, { button: 'left' });
  else await drag(page, 2000, 22);
  await cap.stop();
  await page.close();
}

async function takeEnd(browser) {
  const page = await L.openCourt(browser, 'hue-court');
  await stagePage(page);
  await L.sleep(5000);
  await frameCourt(page);
  await L.sleep(1000);
  await page.evaluate((t) => {
    const el = document.createElement('div'); el.id = 'promo-end';
    el.innerHTML = `<h1>${t.endTitle}</h1><p>${t.endLine}</p><div class="cta">${t.endCta}</div>`;
    document.body.appendChild(el);
  }, TEXT);
  const cap = await L.startCapture(page, path.join(OUT, 'take-C'));
  const spin = drag(page, 4200, 30);
  await L.sleep(150);
  await page.evaluate(() => document.getElementById('promo-end').classList.add('on'));
  await spin;
  await cap.stop();
  await page.close();
}

(async () => {
  const browser = await L.launch();
  try {
    if (wants('A')) await takeA(browser);
    const worlds = ['hue-pixel', 'zoo', 'office', 'space-station'];
    for (let i = 0; i < worlds.length; i++) if (wants(`B${i + 1}`)) await takeWorld(browser, worlds[i], i + 1);
    if (wants('C')) await takeEnd(browser);
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
