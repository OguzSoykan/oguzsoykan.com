// Viewport screenshots of each section for design review.
import { chromium } from '@playwright/test';
const [origin, out, scheme = 'light', width = '1440', height = '900', locale = 'tr-TR'] =
  process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: +width, height: +height },
  colorScheme: scheme,
  locale,
  reducedMotion: 'reduce',
});
await page.goto(origin, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
for (const id of ['main', 'workflow-builder', 'cuzdan', 'experience', 'about', 'contact']) {
  await page.evaluate((id) => {
    const el = document.getElementById(id);
    window.scrollTo(0, id === 'main' ? 0 : el.getBoundingClientRect().top + scrollY - 70);
  }, id);
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${out}/${scheme}-${width}-${id}.png` });
}
await browser.close();
