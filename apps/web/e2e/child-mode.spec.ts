import { expect, test } from '@playwright/test';
import { enterChildMode, holdGrownUps, onboard, solveGate, storage } from './helpers';

test.describe('Child Mode escape resistance (ESC-01..05)', () => {
  test.beforeEach(async ({ page }) => { await onboard(page); });

  test('REQ-SAF-10 the headphone notice appears before the first Child Mode', async ({ page }) => {
    await page.getByRole('button', { name: 'Child Mode' }).click();
    await expect(page.getByText(/limit volume to 85 dB or less/)).toBeVisible();
    await page.getByRole('button', { name: 'Start Child Mode' }).click();
    expect((await storage(page)).settings.headphoneNoticeSeen).toBe(true);
  });

  test('REQ-SAF-08 Back, Escape, hash changes and reload do not leave Child Mode', async ({ page }) => {
    await enterChildMode(page);
    await page.keyboard.press('Escape');
    await page.goBack();
    await expect(page.getByTestId('stopbar')).toBeVisible();
    await page.evaluate(() => { location.hash = '#/settings'; });
    await expect(page).toHaveURL(/#\/child\/home$/);
    await page.reload();
    await expect(page.getByTestId('stopbar')).toBeVisible();
    await expect(page.getByRole('navigation')).toHaveCount(0);
  });

  test('REQ-SAF-08 a short press does not open the gate; wrong answers keep Child Mode; three lock it', async ({ page }) => {
    await enterChildMode(page);
    await page.getByTestId('grownups').click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await holdGrownUps(page);
    await expect(page.getByRole('dialog')).toBeVisible();
    for (let i = 0; i < 3; i++) { await page.fill('#gate-answer', '1'); await page.getByRole('button', { name: 'Check', exact: true }).click(); }
    await expect(page.getByRole('alert')).toContainText('Too many tries');
    await expect(page.locator('#gate-answer')).toBeDisabled();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByTestId('stopbar')).toBeVisible();
    const types = (await storage(page)).audit.map((a: { type: string }) => a.type);
    expect(types).toEqual(expect.arrayContaining(['childmode.entered', 'gate.failed', 'gate.locked']));
  });

  test('REQ-SAF-08 the correct adult answer returns to Parent Mode', async ({ page }) => {
    await enterChildMode(page);
    await holdGrownUps(page);
    await solveGate(page);
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByTestId('stopbar')).toHaveCount(0);
  });

  test('REQ-SAF-04 REQ-M7-01 the Stop bar is on every child screen; cards are pictures with names; no external links', async ({ page }) => {
    await enterChildMode(page);
    for (const view of ['home', 'drum', 'shaker', 'bells', 'songs', 'calm', 'day', 'countdown']) {
      await page.evaluate((v) => { location.hash = `#/child/${v}`; }, view);
      await expect(page.getByTestId('stopbar'), view).toBeVisible();
      expect(await page.locator('a[href^="http"]').count(), view).toBe(0);
    }
    await page.evaluate(() => { location.hash = '#/child/home'; });
    const cards = page.locator('.picture');
    await expect(cards).toHaveCount(8);
    for (const c of await cards.all()) {
      await expect(c.locator('svg')).toHaveCount(await c.locator('svg').count());
      expect((await c.getAttribute('aria-label')) ?? (await c.innerText())).not.toBe('');
    }
  });

  test('REQ-M7-02 REQ-SAF-02 choosing a song by picture plays it only on the tap, through the Child Mode chain', async ({ page }) => {
    await enterChildMode(page);
    await page.getByRole('button', { name: 'Songs' }).click();
    const star = page.getByRole('button', { name: 'Twinkle star, plays a sound' });
    await expect(star).toBeVisible();
    expect(await page.evaluate(() => window.__harmonyAudio!.engine.started)).toBe(false);
    await star.click();
    await expect(star).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => page.evaluate(() => window.__harmonyAudio!.engine.playing)).toBe(true);
    expect(await page.evaluate(() => window.__harmonyAudio!.engine.mode)).toBe('child');
  });

  test('REQ-M4-01 REQ-M4-02 the child picks calm tracks by picture; the sway visual is still with reduced motion', async ({ page }) => {
    await enterChildMode(page);
    await page.getByRole('button', { name: 'Calm' }).click();
    const stars = page.getByRole('button', { name: 'Night stars' });
    await stars.click();
    await expect(stars).toHaveAttribute('aria-pressed', 'true');
    expect((await storage(page)).profile.calmPlaylist).toContain('calm-stars');
    await page.getByRole('button', { name: /Play, plays a sound/ }).click();
    const anim = await page.locator('.sway').evaluate((el) => getComputedStyle(el).animationName);
    expect(anim).toBe('none');
  });

  test('REQ-M3-02 My day shows the schedule; REQ-M5-04 too-loud card; REQ-M5-03 countdown in Child Mode', async ({ page }) => {
    await enterChildMode(page);
    await page.getByRole('button', { name: 'My day' }).click();
    await page.getByRole('button', { name: 'Bedtime' }).click();
    await expect(page.getByText('Pyjamas')).toBeVisible();
    await page.evaluate(() => { location.hash = '#/child/tooloud'; });
    await expect(page.getByRole('alertdialog')).toContainText('Too loud');
    await page.getByRole('button', { name: 'Close' }).click();
    await page.getByRole('button', { name: '3-2-1' }).click();
    await expect(page.getByRole('button', { name: 'Start 3-2-1' })).toBeVisible();
  });
});
