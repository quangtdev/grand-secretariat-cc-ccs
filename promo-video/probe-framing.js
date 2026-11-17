// Probe: try a zoom + pan framing on the current court and screenshot it.
const path = require('path'); const L = require('./promo-recording-lib.js');
const [notches, panY] = [Number(process.argv[2] || 6), Number(process.argv[3] || 150)];
(async () => {
  const browser = await L.launch();
  const page = await L.openCourt(browser, process.argv[4] || 'hue-court');
  await page.click('#rail-collapse'); await L.sleep(4000);
  await page.mouse.move(270, 470);
  for (let i = 0; i < notches; i++) { await page.mouse.wheel({ deltaY: -100 }); await L.sleep(60); }
  await L.sleep(500);
  await page.mouse.move(270, 420); await page.mouse.down();
  for (let i = 1; i <= 20; i++) { await page.mouse.move(270, 420 + (panY * i) / 20); await L.sleep(20); }
  await page.mouse.up(); await L.sleep(1200);
  await page.evaluate(() => window.__promo.caption('AI agent của tôi<br>làm việc trong <b>triều đình Huế</b>'));
  await L.sleep(500);
  await page.screenshot({ path: path.join(L.ROOT, 'out', `framing-${notches}-${panY}.jpg`), type: 'jpeg', quality: 80 });
  await browser.close();
})();
