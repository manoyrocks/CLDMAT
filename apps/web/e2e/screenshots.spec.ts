// High-fidelity reference screens for design/ (UX deliverable). Not an assertion suite.
import { test } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { enterChildMode, onboard } from './helpers';

const out = (n: string) => fileURLToPath(new URL(`../../../design/screenshots/${n}.png`, import.meta.url));

test('capture reference screens', async ({ page }) => {
  await page.goto('./');
  await page.screenshot({ path: out('01-welcome'), fullPage: true });
  await onboard(page, { goals: ['Takes turns in music play', 'Uses calm music to settle'] });
  const shots: [string, string][] = [
    ['02-today', 'today'], ['03-activity', 'activities/act-drum-conversation'], ['04-routine', 'routines/rt-teeth'], ['05-sound', 'sound'],
    ['06-exposure', 'sound/exposure'], ['07-goals', 'goals'], ['08-learn', 'learn'], ['09-redflags', 'learn/check'], ['10-coach', 'coach'], ['11-settings', 'settings'],
  ];
  for (const [n, r] of shots) {
    await page.evaluate((x) => { location.hash = `#/${x}`; }, r);
    await page.waitForTimeout(150);
    await page.screenshot({ path: out(n), fullPage: true });
  }
  await enterChildMode(page);
  await page.screenshot({ path: out('12-child-home') });
  await page.getByRole('button', { name: 'Calm' }).click();
  await page.screenshot({ path: out('13-child-calm') });
  await page.getByTestId('stopbar').dispatchEvent('pointerdown');
  await page.screenshot({ path: out('14-child-quiet') });
});
