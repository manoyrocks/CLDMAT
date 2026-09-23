// Live-chain audio safety: measures REAL output after all safety layers via the engine's output meter,
// plus recording flows (AS-09, L-03), the exposure time limit and Stop-during-decode (DEF-008).
import { expect, test, type Page } from '@playwright/test';
import { enterChildMode, onboard } from './helpers';

const lin = (db: number) => Math.pow(10, db / 20);

/** Polls the output meter for `ms` and returns the highest peak seen. */
const watchPeak = (page: Page, ms: number) => page.evaluate(async (dur) => {
  const e = window.__harmonyAudio!.engine;
  let max = 0;
  const t0 = performance.now();
  while (performance.now() - t0 < dur) { max = Math.max(max, e.outputPeak()); await new Promise((r) => setTimeout(r, 15)); }
  return max;
}, ms);

/** Builds a loud (full-scale) mono WAV in the page, so recording paths can be tested without a microphone. */
const LOUD_WAV = `(() => {
  const sr = 48000, n = sr, data = new DataView(new ArrayBuffer(44 + n * 2));
  const w = (o, s) => [...s].forEach((c, i) => data.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF'); data.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); data.setUint32(16, 16, true);
  data.setUint16(20, 1, true); data.setUint16(22, 1, true); data.setUint32(24, sr, true); data.setUint32(28, sr * 2, true);
  data.setUint16(32, 2, true); data.setUint16(34, 16, true); w(36, 'data'); data.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) data.setInt16(44 + i * 2, Math.round(32767 * Math.sin(2 * Math.PI * 300 * i / sr)), true);
  return new Blob([data.buffer], { type: 'audio/wav' });
})()`;

test.describe('live-chain audio safety', () => {
  test('DEF-009 REQ-SAF-01 calibration: real output equals the planned level, with no hidden gain', async ({ page }) => {
    await onboard(page);
    await page.goto('./#/sound/exposure');
    await page.getByLabel(/I'm with my child now/).check();
    await page.getByRole('button', { name: 'Play very softly' }).click(); // built-in hand-dryer hum, normalised to -1 dBFS
    await page.waitForTimeout(800);
    const exposurePeak = await watchPeak(page, 1500);
    await page.getByTestId('stopbar').dispatchEvent('pointerdown');
    await page.goto('./#/today');
    await enterChildMode(page);
    await page.getByRole('button', { name: 'Drum' }).click();
    const drumPeak = await page.evaluate(async () => {
      const e = window.__harmonyAudio!.engine;
      e.hit('drum');
      await new Promise((r) => setTimeout(r, 1200)); // let the fade-in finish
      e.hit('drum');
      let m = 0; const t0 = performance.now();
      while (performance.now() - t0 < 300) { m = Math.max(m, e.outputPeak()); await new Promise((r) => setTimeout(r, 5)); }
      return m;
    });
    test.info().annotations.push({ type: 'calibration', description: `exposure ${(20 * Math.log10(exposurePeak)).toFixed(1)} dBFS (plan -46), drum ${(20 * Math.log10(drumPeak)).toFixed(1)} dBFS (plan <= -26)` });
    expect(exposurePeak).toBeGreaterThan(lin(-46) * 0.85);
    expect(exposurePeak).toBeLessThanOrEqual(lin(-46) * 1.05);
    expect(drumPeak).toBeGreaterThan(lin(-32));
    expect(drumPeak).toBeLessThanOrEqual(lin(-26) * 1.05); // -6 dBFS synth x -20 dBFS child volume
  });

  test('AS-05 REQ-SAF-01 real output never exceeds the Child Mode ceiling under stress (max volume, song + rapid drum)', async ({ page }) => {
    await onboard(page);
    await enterChildMode(page);
    await page.getByRole('button', { name: 'Calm' }).click();
    for (let i = 0; i < 6; i++) await page.getByRole('button', { name: 'Louder' }).click();
    await page.getByRole('button', { name: 'Home' }).click();
    await page.getByRole('button', { name: 'Songs' }).click();
    await page.getByRole('button', { name: /Row the boat/ }).click();
    await page.waitForTimeout(1500); // fade-in and slew complete
    const songPeak = await watchPeak(page, 1500);
    // Hammer the engine with overlapping drum hits on top of the song.
    const stressPeak = await page.evaluate(async () => {
      const e = window.__harmonyAudio!.engine;
      let max = 0;
      for (let i = 0; i < 60; i++) { e.hit('drum'); e.hit('bells'); max = Math.max(max, e.outputPeak()); await new Promise((r) => setTimeout(r, 10)); }
      const t0 = performance.now();
      while (performance.now() - t0 < 800) { max = Math.max(max, e.outputPeak()); await new Promise((r) => setTimeout(r, 10)); }
      return max;
    });
    test.info().annotations.push({ type: 'live-peaks', description: `song ${songPeak.toFixed(4)}, stress ${stressPeak.toFixed(4)}, ceiling ${lin(-12).toFixed(4)}` });
    expect(songPeak).toBeGreaterThan(0.01); // sound really played
    expect(songPeak).toBeLessThanOrEqual(lin(-12) + 1e-4);
    expect(stressPeak).toBeLessThanOrEqual(lin(-12) + 1e-4);
  });

  test('AS-09 REQ-M3-03 caregiver voice recording (fake mic) is saved and plays normalised at the child level', async ({ page }) => {
    await onboard(page);
    await page.goto('./#/routines/rt-teeth');
    await page.getByRole('button', { name: 'Record my voice' }).click();
    await expect(page.getByText('Recording… sing now.')).toBeVisible();
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: 'Stop recording' }).click();
    await expect(page.getByText('Saved on this phone.')).toBeVisible();
    await enterChildMode(page);
    await page.getByRole('button', { name: 'My day' }).click();
    await page.getByRole('button', { name: 'Brushing teeth' }).click();
    await page.getByRole('button', { name: /Sing, plays a sound/ }).click();
    const peak = await watchPeak(page, 1500);
    test.info().annotations.push({ type: 'recording-peak', description: peak.toFixed(4) });
    // Normalised to -6 dBFS, then the -20 dBFS child volume: about -26 dBFS. Never above the ceiling.
    expect(peak).toBeGreaterThan(lin(-40));
    expect(peak).toBeLessThanOrEqual(lin(-26) * 1.12);
    expect(peak).toBeLessThanOrEqual(lin(-12));
  });

  test('L-03 REQ-M5-05 REQ-SAF-05 exposure with the family recording plays at the planned soft level', async ({ page }) => {
    await onboard(page);
    await page.goto('./#/sound/exposure');
    await page.getByText('Use a recording of the real sound').click();
    await page.getByRole('button', { name: 'Record the sound' }).click();
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: 'Stop recording' }).click();
    await expect(page.getByText(/'Our own recording' is now selected/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Our own recording' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('exposure-level')).toContainText('-45 dBFS');
    await page.getByLabel(/I'm with my child now/).check();
    await page.getByRole('button', { name: 'Play very softly' }).click();
    await page.waitForTimeout(800);
    const peak = await watchPeak(page, 1200);
    test.info().annotations.push({ type: 'own-exposure-peak', description: peak.toFixed(5) });
    // Normalised to -1 dBFS then played at -45 dBFS: about -46 dBFS. Must never exceed the planned level.
    expect(peak).toBeGreaterThan(lin(-60));
    expect(peak).toBeLessThanOrEqual(lin(-45) * 1.05);
    await page.getByTestId('stopbar').dispatchEvent('pointerdown');
    await expect(page.getByTestId('exposure-level')).toContainText('-49 dBFS');
  });

  test('REQ-SAF-05 a full-scale recording is normalised for exposure; the level is capped at the exposure ceiling', async ({ page }) => {
    await onboard(page);
    await page.goto('./#/sound/exposure');
    await page.getByLabel(/I'm with my child now/).check(); // any gesture page; engine calls below simulate taps
    const peaks = await page.evaluate(async (wavSrc) => {
      const e = window.__harmonyAudio!.engine;
      // eslint-disable-next-line no-eval
      const wav: Blob = (0, eval)(wavSrc);
      e.setMode('child', -20);
      const measure = async () => { let m = 0; const t0 = performance.now(); while (performance.now() - t0 < 900) { m = Math.max(m, e.outputPeak()); await new Promise((r) => setTimeout(r, 15)); } return m; };
      await e.playExposureRecording(wav, -40);
      await new Promise((r) => setTimeout(r, 700));
      const atMinus40 = await measure();
      e.stopAll('test');
      await new Promise((r) => setTimeout(r, 1200));
      await e.playExposureRecording(wav, +20); // a bug or tampered level asking for +20 dBFS
      await new Promise((r) => setTimeout(r, 700));
      const atTamper = await measure();
      e.stopAll('test');
      return { atMinus40, atTamper };
    }, LOUD_WAV);
    test.info().annotations.push({ type: 'normalisation', description: JSON.stringify(peaks) });
    expect(peaks.atMinus40).toBeLessThanOrEqual(lin(-41) * 1.05); // -1 dBFS normalisation + -40
    expect(peaks.atMinus40).toBeGreaterThan(lin(-41) * 0.8);
    expect(peaks.atTamper).toBeLessThanOrEqual(lin(-18) * 1.05); // exposure ceiling
  });

  test('DEF-008 REQ-SAF-04 Stop pressed while a recording is still decoding prevents it from starting', async ({ page }) => {
    await page.goto('./');
    const r = await page.evaluate(async (wavSrc) => {
      const e = window.__harmonyAudio!.engine;
      // eslint-disable-next-line no-eval
      const wav: Blob = (0, eval)(wavSrc);
      const p1 = e.playRecording(wav);
      e.stopAll('test');
      await p1;
      const p2 = e.playExposureRecording(wav, -45);
      e.stopAll('test');
      const started = await p2;
      await new Promise((res) => setTimeout(res, 300));
      return { playing: e.playing, started, peak: e.outputPeak() };
    }, LOUD_WAV);
    expect(r).toEqual({ playing: false, started: false, peak: 0 });
  });

  test('REQ-SAF-05 exposure sessions end automatically after 5 minutes', async ({ page }) => {
    await page.clock.install();
    await onboard(page);
    await page.goto('./#/sound/exposure');
    await page.getByLabel(/I'm with my child now/).check();
    await page.getByRole('button', { name: 'Play very softly' }).click();
    await expect(page.getByTestId('stopbar')).toBeVisible();
    await page.clock.fastForward('05:01');
    await expect(page.getByText('Well done. Same level next time.')).toBeVisible();
    await expect(page.getByTestId('stopbar')).toHaveCount(0);
    const s = await page.evaluate(() => JSON.parse(localStorage.getItem('harmony.v1')!));
    expect(s.exposureSessions.at(-1).outcome).toBe('completed');
  });
});

test('REQ-NFR-06 cold start: the app is interactive within 2 s with the CPU throttled 4x', async ({ page, context }) => {
  await onboard(page);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const times: number[] = [];
  for (let i = 0; i < 3; i++) {
    const t0 = Date.now();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Start session' })).toBeEnabled();
    times.push(Date.now() - t0);
  }
  test.info().annotations.push({ type: 'cold-start-ms-4x-cpu', description: times.join(', ') });
  for (const t of times) expect(t).toBeLessThan(2000);
});
