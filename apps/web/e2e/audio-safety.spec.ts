import { expect, test, type Page } from '@playwright/test';
import { enterChildMode, onboard } from './helpers';

const lin = (db: number) => Math.pow(10, db / 20);
const gain = (page: Page) => page.evaluate(() => window.__harmonyAudio!.engine.gainValue());
const engineState = (page: Page) => page.evaluate(() => { const e = window.__harmonyAudio!.engine; return { started: e.started, mode: e.mode, volume: e.volume, ceiling: e.ceilingDb, playing: e.playing }; });

test.describe('audio safety (AS-01..09); any failure is Critical', () => {
  test('AS-01 REQ-SAF-01 offline render: an overdriven source never exceeds the Child Mode ceiling, and output is mono', async ({ page }) => {
    await page.goto('./');
    const r = await page.evaluate(async () => {
      const { buildSafetyChain, policyFor } = window.__harmonyAudio!;
      const out: Record<string, { peak: number; mono: boolean }> = {};
      for (const mode of ['child', 'parent'] as const) {
        const ctx = new OfflineAudioContext(2, 48000, 48000);
        const chain = buildSafetyChain(ctx, policyFor(mode));
        chain.session.gain.value = 10; // simulate a bug requesting +20 dB
        const osc = ctx.createOscillator();
        osc.frequency.value = 440;
        const pre = ctx.createGain();
        pre.gain.value = 4; // and an over-loud source (+12 dB)
        const osc2 = ctx.createOscillator();
        osc2.type = 'square';
        osc2.frequency.value = 97;
        osc2.connect(pre);
        osc.connect(pre).connect(chain.input);
        osc.start(); osc2.start();
        const buf = await ctx.startRendering();
        let peak = 0, mono = true;
        const l = buf.getChannelData(0), rr = buf.getChannelData(1);
        for (let i = 0; i < buf.length; i++) { peak = Math.max(peak, Math.abs(l[i]!), Math.abs(rr[i]!)); if (Math.abs(l[i]! - rr[i]!) > 1e-6) mono = false; }
        out[mode] = { peak, mono };
      }
      return out;
    });
    expect(r.child!.peak).toBeLessThanOrEqual(lin(-12) + 1e-4);
    expect(r.child!.peak).toBeGreaterThan(lin(-12) * 0.9); // the test really drove the chain to the ceiling
    expect(r.child!.mono).toBe(true);
    expect(r.parent!.peak).toBeLessThanOrEqual(lin(-6) + 1e-4);
  });

  test('AS-02 REQ-SAF-02 no audio context exists before a tap, on any screen', async ({ page }) => {
    await onboard(page);
    for (const route of ['today', 'activities/act-drum-conversation', 'routines/rt-teeth', 'sound/exposure', 'learn', 'coach', 'goals', 'session']) {
      await page.evaluate((r) => { location.hash = `#/${r}`; }, route);
      await page.waitForTimeout(150);
      expect((await engineState(page)).started, route).toBe(false);
    }
    await page.goto('./#/today');
    await enterChildMode(page);
    for (const v of ['home', 'drum', 'songs', 'calm', 'day']) {
      await page.evaluate((x) => { location.hash = `#/child/${x}`; }, v);
      await page.waitForTimeout(150);
      expect((await engineState(page)).started, v).toBe(false);
    }
  });

  test('AS-03 REQ-SAF-03 sound from silence fades in over at least 500 ms in Child Mode', async ({ page }) => {
    await onboard(page);
    await enterChildMode(page);
    await page.getByRole('button', { name: 'Drum' }).click();
    await expect(page.getByTestId('pad')).toBeVisible();
    const samples = await page.evaluate(async () => {
      const e = window.__harmonyAudio!.engine;
      (document.querySelector('[data-testid="pad"]') as HTMLElement).dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      const s: [number, number][] = [];
      const t0 = performance.now();
      while (performance.now() - t0 < 800) { s.push([performance.now() - t0, e.gainValue()]); await new Promise((r) => setTimeout(r, 20)); }
      return s;
    });
    const target = lin(-20);
    const at = (ms: number) => samples.find(([t]) => t >= ms)![1];
    expect(samples[0]![1]).toBeLessThan(target * 0.3);
    expect(at(150)).toBeLessThan(target * 0.6);
    expect(at(750)).toBeGreaterThan(target * 0.95);
    expect(Math.max(...samples.map(([, g]) => g))).toBeLessThanOrEqual(target + 1e-6);
    expect((await engineState(page)).mode).toBe('child');
  });

  test('AS-04 REQ-SAF-04 Stop silences all audio in under 200 ms', async ({ page }) => {
    await onboard(page);
    await enterChildMode(page);
    await page.getByRole('button', { name: 'Songs' }).click();
    await page.getByRole('button', { name: /Twinkle star/ }).click();
    await page.waitForTimeout(900);
    expect(await gain(page)).toBeGreaterThan(0.05);
    const results: number[] = [];
    for (let i = 0; i < 5; i++) {
      if (i > 0) { await page.getByRole('button', { name: 'Home' }).click(); await page.getByRole('button', { name: 'Songs' }).click(); await page.getByRole('button', { name: /Row the boat/ }).click(); await page.waitForTimeout(900); }
      const ms = await page.evaluate(async () => {
        const e = window.__harmonyAudio!.engine;
        const bar = document.querySelector('[data-testid="stopbar"]') as HTMLElement;
        const t0 = performance.now();
        bar.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        while (e.gainValue() > 0.001) { if (performance.now() - t0 > 1000) return 9999; await new Promise((r) => setTimeout(r, 2)); }
        return performance.now() - t0;
      });
      results.push(ms);
    }
    test.info().annotations.push({ type: 'stop-latency-ms', description: results.map((x) => x.toFixed(1)).join(', ') });
    for (const ms of results) expect(ms).toBeLessThan(200);
    await expect(page.getByRole('heading', { name: 'Quiet now' })).toBeVisible();
  });

  test('AS-05 AS-06 REQ-SAF-01 REQ-SAF-07 REQ-M4-03 repeated volume-up stops at the ceiling and rises gradually', async ({ page }) => {
    await onboard(page);
    await enterChildMode(page);
    await page.getByRole('button', { name: 'Calm' }).click();
    await page.getByRole('button', { name: /Play, plays a sound/ }).click();
    await page.waitForTimeout(700);
    // Four quick presses inside the page: -20 → -8 requested, clamped to -12. The 8 dB rise must take ~1.3 s.
    const early = await page.evaluate(async () => {
      const b = [...document.querySelectorAll('button')].find((x) => x.getAttribute('aria-label') === 'Louder')!;
      for (let i = 0; i < 4; i++) b.click();
      await new Promise((r) => setTimeout(r, 100));
      return window.__harmonyAudio!.engine.gainValue();
    });
    expect(early).toBeLessThan(lin(-12) * 0.9);
    for (let i = 0; i < 16; i++) await page.getByRole('button', { name: 'Louder' }).click();
    const s = await engineState(page);
    expect(s.volume).toBe(-12);
    expect(s.ceiling).toBe(-12);
    await page.waitForTimeout(1600);
    const late = await gain(page);
    expect(late).toBeLessThanOrEqual(lin(-12) + 1e-6);
    expect(late).toBeGreaterThan(lin(-12) * 0.95);
    await expect(page.getByRole('img', { name: 'Volume level 5 of 5' })).toBeVisible();
  });

  test('AS-07 AS-08 REQ-M5-05 REQ-SAF-05 REQ-SAF-06 graded exposure: quiet start, caregiver present, child stop, lockout', async ({ page }) => {
    await onboard(page);
    await page.goto('./#/sound/exposure');
    await expect(page.getByTestId('exposure-level')).toContainText('-45 dBFS');
    await expect(page.getByRole('button', { name: 'Play very softly' })).toBeDisabled();
    await page.getByLabel(/I'm with my child now/).check();
    await page.getByRole('button', { name: 'Play very softly' }).click();
    await page.waitForTimeout(800);
    const st = await engineState(page);
    expect(st.mode).toBe('child');
    expect(await gain(page)).toBeLessThanOrEqual(lin(-45) + 1e-6);
    expect(await gain(page)).toBeGreaterThan(lin(-45) * 0.9);
    // Step up is not offered before a calm check-in.
    await expect(page.getByRole('button', { name: /one small step louder/ })).toBeDisabled();
    await page.getByTestId('stopbar').dispatchEvent('pointerdown');
    await expect(page.getByText(/Next time will start quieter/)).toBeVisible();
    await expect(page.getByTestId('exposure-level')).toContainText('-49 dBFS');
    // Second consecutive stop (distress 3) locks the plan.
    await page.getByLabel(/I'm with my child now/).check();
    await page.getByRole('button', { name: 'Play very softly' }).click();
    await page.getByRole('button', { name: /^3/ }).click();
    await expect(page.getByText(/Stopped because your child was upset/)).toBeVisible();
    await expect(page.getByRole('alert')).toContainText('paused for 24 hours');
    await expect(page.getByRole('button', { name: 'Play very softly' })).toBeDisabled();
    expect(await gain(page)).toBeLessThan(0.001);
  });

  test('AS-07 REQ-SAF-05 a calm check-in allows exactly one small step for next time', async ({ page }) => {
    await onboard(page);
    await page.goto('./#/sound/exposure');
    await page.getByLabel(/I'm with my child now/).check();
    await page.getByRole('button', { name: 'Play very softly' }).click();
    await page.getByRole('button', { name: /^0/ }).click();
    await page.getByRole('button', { name: /one small step louder/ }).click();
    await expect(page.getByText('Well done. Next time will be one small step louder.')).toBeVisible();
    await expect(page.getByTestId('exposure-level')).toContainText('-43 dBFS');
    await page.getByLabel(/I'm with my child now/).check();
    await page.getByRole('button', { name: 'Play very softly' }).click();
    await page.getByRole('button', { name: /^0/ }).click();
    await expect(page.getByRole('button', { name: /one small step louder/ })).toBeDisabled();
    await expect(page.getByText('Only one step up per day.')).toBeVisible();
  });

  test('REQ-NFR-06 drum hits are scheduled with low latency', async ({ page }) => {
    await onboard(page);
    await enterChildMode(page);
    await page.getByRole('button', { name: 'Drum' }).click();
    await page.getByTestId('pad').dispatchEvent('pointerdown');
    const ms = await page.evaluate(() => window.__harmonyAudio!.engine.hit('drum'));
    test.info().annotations.push({ type: 'drum-scheduling-latency-ms', description: ms.toFixed(1) });
    expect(ms).toBeLessThan(50);
  });
});
