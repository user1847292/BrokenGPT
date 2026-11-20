const { chromium } = require('playwright');
const fs = require('node:fs/promises');
const path = require('node:path');

(async () => {
  const output = path.resolve(__dirname, '..', 'screenshots', 'actual');
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto(process.env.BROKENGPT_PREVIEW_URL || 'http://127.0.0.1:3000', { waitUntil: 'networkidle' });
  await page.locator('.brand').waitFor();

  const screens = [
    ['chat', '01-chat.png'],
    ['battle', '02-ai-battle.png'],
    ['studio', '03-creative-studio.png'],
    ['cyber', '04-hacking-center.png'],
    ['characters', '05-character-studio.png'],
    ['settings', '06-settings-and-rgb.png']
  ];

  for (const [view, filename] of screens) {
    const nav = page.locator('[data-view="' + view + '"]');
    if (await nav.count() !== 1) throw new Error('Missing navigation item: ' + view);
    await nav.click();
    await page.locator('#' + view + '.view.active').waitFor();
    await page.screenshot({ path: path.join(output, filename), fullPage: true });
  }

  await browser.close();
  if (pageErrors.length) throw new Error('Browser runtime errors: ' + pageErrors.join(' | '));
  process.stdout.write('Captured ' + screens.length + ' real screenshots in screenshots/actual.\n');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
