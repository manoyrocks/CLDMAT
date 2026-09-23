import { describe, expect, it } from 'vitest';
import {
  CHILD_POLICY, PARENT_POLICY, STOP_BUDGET_MS, clampDb, clipperCurve, dbToLinear, fadeInMs,
  levelDots, linearToDb, normalisationGain, policyFor, rampDurationMs, safeGain, stepVolume,
} from './policy';

describe('audio policy', () => {
  it('REQ-SAF-01 child ceiling is -12 dBFS and below parent ceiling', () => {
    expect(CHILD_POLICY.ceilingDb).toBe(-12);
    expect(CHILD_POLICY.ceilingDb).toBeLessThan(PARENT_POLICY.ceilingDb);
    expect(policyFor('child')).toBe(CHILD_POLICY);
    expect(policyFor('parent')).toBe(PARENT_POLICY);
    expect(Object.isFrozen(CHILD_POLICY)).toBe(true);
  });

  it('REQ-SAF-01 clampDb never exceeds the ceiling or goes below the floor', () => {
    for (const db of [-200, -36, -20, -12, -11.99, 0, 6, 120]) {
      const c = clampDb(db, CHILD_POLICY);
      expect(c).toBeLessThanOrEqual(CHILD_POLICY.ceilingDb);
      expect(c).toBeGreaterThanOrEqual(CHILD_POLICY.floorDb);
    }
    expect(clampDb(0, CHILD_POLICY)).toBe(-12);
    expect(clampDb(-20, CHILD_POLICY)).toBe(-20);
  });

  it('REQ-SAF-01 non-finite requests fail quiet', () => {
    expect(clampDb(NaN, CHILD_POLICY)).toBe(CHILD_POLICY.floorDb);
    expect(clampDb(Infinity, CHILD_POLICY)).toBe(CHILD_POLICY.floorDb);
  });

  it('REQ-SAF-01 safeGain linear value is at most the ceiling', () => {
    expect(safeGain(40, CHILD_POLICY)).toBeCloseTo(dbToLinear(-12), 10);
    expect(safeGain(-20, CHILD_POLICY)).toBeCloseTo(0.1, 10);
  });

  it('dB conversions round-trip', () => {
    expect(linearToDb(dbToLinear(-17))).toBeCloseTo(-17, 10);
    expect(linearToDb(0)).toBe(-Infinity);
    expect(linearToDb(NaN)).toBe(-Infinity);
  });

  it('REQ-M4-03 repeated volume-up presses stop at the ceiling', () => {
    let db = CHILD_POLICY.defaultDb;
    for (let i = 0; i < 50; i++) db = stepVolume(db, 'up', CHILD_POLICY);
    expect(db).toBe(CHILD_POLICY.ceilingDb);
    for (let i = 0; i < 50; i++) db = stepVolume(db, 'down', CHILD_POLICY);
    expect(db).toBe(CHILD_POLICY.floorDb);
    expect(stepVolume(99, 'down', CHILD_POLICY)).toBe(-15);
  });

  it('REQ-SAF-07 volume rises no faster than the slew limit; decreases are fast', () => {
    expect(rampDurationMs(-24, -12, CHILD_POLICY)).toBe(2000); // 12 dB at 6 dB/s
    expect(rampDurationMs(-24, -12, PARENT_POLICY)).toBe(1000);
    expect(rampDurationMs(-12, -30, CHILD_POLICY)).toBe(20);
    expect(rampDurationMs(-20, -20, CHILD_POLICY)).toBe(20);
    // A request above the ceiling is measured to the ceiling only.
    expect(rampDurationMs(-18, 30, CHILD_POLICY)).toBe(1000);
  });

  it('REQ-SAF-03 fade-in is never shorter than the mode minimum', () => {
    expect(fadeInMs(undefined, CHILD_POLICY)).toBe(500);
    expect(fadeInMs(10, CHILD_POLICY)).toBe(500);
    expect(fadeInMs(1200, CHILD_POLICY)).toBe(1200);
    expect(fadeInMs(NaN, PARENT_POLICY)).toBe(250);
  });

  it('REQ-SAF-04 stop ramp is well inside the 200 ms budget', () => {
    expect(CHILD_POLICY.stopRampMs).toBeLessThan(STOP_BUDGET_MS / 4);
    expect(PARENT_POLICY.stopRampMs).toBeLessThan(STOP_BUDGET_MS / 4);
  });

  it('level dots map floor to 1 and ceiling to 5', () => {
    expect(levelDots(CHILD_POLICY.floorDb, CHILD_POLICY)).toBe(1);
    expect(levelDots(CHILD_POLICY.ceilingDb, CHILD_POLICY)).toBe(5);
    expect(levelDots(100, CHILD_POLICY)).toBe(5);
    expect(levelDots(-24, CHILD_POLICY, 5)).toBe(3);
  });

  it('REQ-M3-03 recordings are normalised to -6 dBFS peak; silence gives zero gain', () => {
    expect(normalisationGain(1)).toBeCloseTo(dbToLinear(-6), 10);
    expect(normalisationGain(0.25, -12)).toBeCloseTo(dbToLinear(-12) / 0.25, 10);
    expect(normalisationGain(0)).toBe(0);
    expect(normalisationGain(Infinity)).toBe(0);
    expect(normalisationGain(NaN)).toBe(0);
  });

  it('REQ-SAF-01 clipper curve clamps every sample to the ceiling', () => {
    const curve = clipperCurve(-12, 101);
    const c = dbToLinear(-12);
    expect(curve.length).toBe(101);
    expect(Math.max(...curve)).toBeCloseTo(c, 6);
    expect(Math.min(...curve)).toBeCloseTo(-c, 6);
    expect(curve[50]).toBeCloseTo(0, 6);
    expect(clipperCurve(-6).length).toBe(2049);
  });
});
