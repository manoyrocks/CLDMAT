import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { enterChildMode, onboard } from './helpers';

const PARENT = ['today', 'activities', 'activities/act-drum-conversation', 'routines/rt-teeth', 'session', 'sound', 'sound/diary', 'sound/exposure',
  'goals', 'goals/review', 'learn', 'learn/check', 'learn/therapist', 'coach', 'settings'];

test.describe('accessibility (A11Y-01, A11Y-03, A11Y-04)', () => {
  test('REQ-NFR-01 axe: no serious or critical WCAG 2.2 AA violations on parent screens', async ({ page }) => {
    await page.goto('./');
    const onboardingScan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(onboardingScan.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))).toEqual([]);
    await onboard(page, { goals: ['Takes turns in music play'] });
    for (const r of PARENT) {
      await page.evaluate((x) => { location.hash = `#/${x}`; }, r);
      await page.waitForTimeout(100);
      const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      const bad = res.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')).map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
      expect(bad, r).toEqual([]);
    }
  });

  test('REQ-NFR-01 axe: Child Mode screens', async ({ page }) => {
    await onboard(page);
    await enterChildMode(page);
    for (const v of ['home', 'drum', 'songs', 'calm', 'day', 'countdown']) {
      await page.evaluate((x) => { location.hash = `#/child/${x}`; }, v);
      await page.waitForTimeout(100);
      const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      expect(res.violations.filter((x) => ['serious', 'critical'].includes(x.impact ?? '')).map((x) => x.id), v).toEqual([]);
    }
  });

  test('REQ-NFR-01 touch targets are at least 48 px (child cards at least 120 px)', async ({ page }) => {
    await onboard(page);
    for (const r of ['today', 'activities/act-drum-conversation', 'sound/diary', 'goals', 'settings']) {
      await page.evaluate((x) => { location.hash = `#/${x}`; }, r);
      await page.waitForTimeout(100);
      const small = await page.locator('button:visible, input[type=checkbox]:visible').evaluateAll((els) =>
        els.map((e) => { const b = e.getBoundingClientRect(); const target = e.tagName === 'INPUT' ? e.closest('label')!.getBoundingClientRect() : b; return { t: (e as HTMLElement).innerText || e.getAttribute('aria-label') || e.tagName, w: target.width, h: target.height }; })
          .filter((x) => x.w < 48 || x.h < 48));
      expect(small, r).toEqual([]);
    }
    await enterChildMode(page);
    const cards = await page.locator('.picture').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
    for (const h of cards) expect(h).toBeGreaterThanOrEqual(120);
  });

  test('REQ-NFR-02 reduced motion is on by default and nothing animates', async ({ page }) => {
    await onboard(page);
    await expect(page.locator('body')).toHaveClass(/reduced-motion/);
    const animated = await page.evaluate(() => [...document.querySelectorAll('*')].filter((e) => getComputedStyle(e).animationName !== 'none').length);
    expect(animated).toBe(0);
  });

  test('REQ-NFR-01 keyboard-only: a caregiver can log a session', async ({ page }) => {
    await onboard(page);
    await page.goto('./#/session');
    await page.getByRole('button', { name: 'End session now' }).focus();
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Yes' }).focus();
    await page.keyboard.press('Space');
    await page.getByRole('button', { name: 'Some' }).focus();
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Save' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { level: 1 })).toContainText("Today's plan");
  });

  test('REQ-NFR-01 dyslexia font and text size settings apply', async ({ page }) => {
    await onboard(page);
    await page.goto('./#/settings');
    await page.getByLabel('Dyslexia-friendly font').check();
    await page.getByRole('button', { name: '130%' }).click();
    await expect(page.locator('body')).toHaveClass(/dyslexia/);
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).fontSize)).toBe('22.1px');
  });
});
