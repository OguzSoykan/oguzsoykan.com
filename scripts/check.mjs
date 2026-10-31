// Renders the site in light/dark, TR/EN, desktop/mobile: axe (WCAG 2.1 AA), overflow, console errors.
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const [origin = 'http://localhost:8811/', shots] = process.argv.slice(2);
const browser = await chromium.launch();
let failed = false;
for (const [name, width, height, colorScheme, locale] of [
  ['desktop-light-tr', 1440, 900, 'light', 'tr-TR'],
  ['desktop-dark-en', 1440, 900, 'dark', 'en-US'],
  ['mobile-light-tr', 390, 844, 'light', 'tr-TR'],
  ['mobile-dark-en', 390, 844, 'dark', 'en-US'],
]) {
  const context = await browser.newContext({
    viewport: { width, height },
    colorScheme,
    locale,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true)));
  const axe = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  const issues = axe.violations.map((v) => `${v.id}×${v.nodes.length} ${v.nodes[0].target}`);
  console.log(
    `${name}: axe ${issues.length ? issues.join(' | ') : 'OK'} · overflow ${overflow}px · errors ${errors.length ? errors.join(' | ') : 0}`,
  );
  if (issues.length || overflow > 0 || errors.length) failed = true;
  if (shots) {
    await page.evaluate(() =>
      document.querySelectorAll('details').forEach((d) => (d.open = false)),
    );
    await page.screenshot({ path: `${shots}/${name}.png`, fullPage: true });
  }
  await context.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
