import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { onboard, solveGate, storage } from './helpers';

test.describe('privacy and consent (PRV-T1..T6)', () => {
  test('REQ-PRV-02 no request ever leaves the app origin (no trackers, no analytics, no CDN)', async ({ page }) => {
    const origins = new Set<string>();
    page.on('request', (r) => origins.add(new URL(r.url()).origin));
    await onboard(page, { goals: ['Takes turns in music play'] });
    for (const r of ['activities', 'sound', 'goals/review', 'learn', 'coach', 'settings']) await page.evaluate((x) => { location.hash = `#/${x}`; }, r);
    await page.goto('./#/coach');
    await page.getByLabel('Your question').fill('How do I do a drum conversation?');
    await page.getByRole('button', { name: 'Ask', exact: true }).click();
    expect([...origins].filter((o) => o !== 'http://localhost:4173' && !o.startsWith('data:') && !o.startsWith('blob:'))).toEqual([]);
  });

  test('REQ-PRV-08 export downloads every entity', async ({ page }) => {
    await onboard(page);
    await page.goto('./#/settings');
    const dl = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download my data' }).click();
    const file = await (await dl).path();
    const json = JSON.parse(readFileSync(file, 'utf8'));
    expect(json.format).toBe('harmonypath-export-v1');
    expect(Object.keys(json.data)).toEqual(expect.arrayContaining(['consent', 'profile', 'goals', 'goalLogs', 'sessions', 'diary', 'plans', 'exposureSessions', 'audit']));
  });

  test('REQ-PRV-05 withdrawing consent stops collection', async ({ page }) => {
    await onboard(page);
    await page.goto('./#/settings');
    await page.getByRole('button', { name: 'Withdraw consent' }).click();
    await solveGate(page);
    await expect(page.getByTestId('consent-status')).toContainText('withdrawn');
    await page.goto('./#/sound/exposure');
    await page.getByLabel(/I'm with my child now/).check();
    await page.getByRole('button', { name: 'Play very softly' }).click();
    await expect(page.getByText('Please give consent in Settings first.')).toBeVisible();
    expect(await page.evaluate(() => window.__harmonyAudio!.engine.started)).toBe(false);
  });

  test('REQ-PRV-04 delete all wipes the device and restarts onboarding', async ({ page }) => {
    await onboard(page);
    await page.goto('./#/settings');
    page.on('dialog', (d) => d.accept());
    await page.getByRole('button', { name: 'Delete all data' }).click();
    await solveGate(page);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome');
    const s = await storage(page);
    expect(s.profile).toBeNull();
    expect(s.consent.status).toBe('none');
    expect(s.audit.map((a: { type: string }) => a.type)).toEqual(['data.deleted']);
  });

  test('REQ-PRV-07 the audit log holds no personal data', async ({ page }) => {
    await onboard(page);
    const s = await storage(page);
    expect(JSON.stringify(s.audit)).not.toContain('Sam');
  });
});
