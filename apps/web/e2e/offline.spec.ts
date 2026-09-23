import { expect, test } from '@playwright/test';
import { enterChildMode, onboard } from './helpers';

test('OFF-01..03 REQ-NFR-03 REQ-SAF-09 REQ-AI-08 the app, Child Mode audio and the coach work offline', async ({ page, context }) => {
  await onboard(page);
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload(); // now controlled by the service worker
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText("Today's plan");
  await page.goto('./#/coach');
  await page.getByLabel('Your question').fill('Is it ok to use ear defenders all day?');
  await page.getByRole('button', { name: 'Ask', exact: true }).click();
  await expect(page.locator('[data-kind="answer"]')).toContainText('[K-23]');
  await page.goto('./#/today');
  await enterChildMode(page);
  await page.getByRole('button', { name: 'Drum' }).click();
  await page.getByTestId('pad').dispatchEvent('pointerdown');
  expect(await page.evaluate(() => window.__harmonyAudio!.engine.started)).toBe(true);
  await page.getByTestId('stopbar').dispatchEvent('pointerdown');
  await expect(page.getByRole('heading', { name: 'Quiet now' })).toBeVisible();
});
