// Compares the local build with a reference origin pixel by pixel (reduced motion, full page).
import { chromium } from '@playwright/test';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { mkdirSync, writeFileSync } from 'node:fs';

const [local, reference, out = 'visual-diff'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
let failed = false;
for (const [name, width, height, colorScheme, locale] of [
  ['desktop-light-tr', 1440, 900, 'light', 'tr-TR'],
  ['desktop-dark-en', 1440, 900, 'dark', 'en-US'],
  ['mobile-light-tr', 390, 844, 'light', 'tr-TR'],
]) {
  const shots = [];
  for (const origin of [local, reference]) {
    const context = await browser.newContext({
      viewport: { width, height },
      colorScheme,
      locale,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.goto(origin, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);
    shots.push(PNG.sync.read(await page.screenshot({ fullPage: true })));
    await context.close();
  }
  const [a, b] = shots;
  if (a.width !== b.width || a.height !== b.height) {
    console.log(`${name}: size differs ${a.width}x${a.height} vs ${b.width}x${b.height}`);
    failed = true;
    continue;
  }
  const diff = new PNG({ width: a.width, height: a.height });
  const pixels = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 });
  writeFileSync(`${out}/${name}.png`, PNG.sync.write(diff));
  console.log(`${name}: ${pixels} differing pixels`);
  if (pixels > 0) failed = true;
}
await browser.close();
process.exit(failed ? 1 : 0);
