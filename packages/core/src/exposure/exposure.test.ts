import { describe, expect, it } from 'vitest';
import {
  EXPOSURE, acceptStepUp, canStepUp, childStop, completeSession, createPlan, isLocked,
  playbackLevelDb, recordDistress, sanitisePlan, sessionExpired, startSession,
  type ExposurePlan, type ExposureSession,
} from './exposure';
import { CHILD_POLICY } from '../audio/policy';

const H = 3600_000;
const T0 = 1_700_000_000_000;
const ok = { caregiverPresent: true, consentGranted: true, now: T0 };

function start(plan: ExposurePlan, now = T0): ExposureSession {
  const r = startSession(plan, { ...ok, now });
  if (!r.ok) throw new Error(r.reason);
  return r.session;
}

describe('graded exposure', () => {
  it('REQ-SAF-05 limits: start <= -40, step <= 3, ceiling 6 dB under the child ceiling', () => {
    expect(EXPOSURE.startDb).toBeLessThanOrEqual(-40);
    expect(EXPOSURE.maxStartDb).toBe(-40);
    expect(EXPOSURE.maxStepDb).toBeLessThanOrEqual(3);
    expect(EXPOSURE.ceilingDb).toBe(CHILD_POLICY.ceilingDb - 6);
    const p = createPlan('p', 's');
    expect(p.currentLevelDb).toBe(-45);
    expect(p.stepDb).toBe(2);
    expect(createPlan('p', 's', 10).stepDb).toBe(3);
    expect(createPlan('p', 's', -1).stepDb).toBe(2);
    expect(createPlan('p', 's', NaN).stepDb).toBe(2);
  });

  it('REQ-M5-05 refuses without a caregiver present, without consent, or while locked', () => {
    const p = createPlan('p', 's');
    expect(startSession(p, { ...ok, caregiverPresent: false })).toEqual({ ok: false, reason: 'caregiver-not-present' });
    expect(startSession(p, { ...ok, consentGranted: false })).toEqual({ ok: false, reason: 'no-consent' });
    const locked = { ...p, lockedUntil: T0 + H };
    expect(startSession(locked, ok)).toEqual({ ok: false, reason: 'locked' });
    expect(startSession(locked, { ...ok, now: T0 + H })).toMatchObject({ ok: true });
  });

  it('REQ-SAF-05 tampered stored levels are clamped (threat T-03)', () => {
    const bad = { ...createPlan('p', 's'), currentLevelDb: 0, stepDb: 12, consecutiveStops: -3 };
    const safe = sanitisePlan(bad);
    expect(safe.currentLevelDb).toBe(EXPOSURE.ceilingDb);
    expect(safe.stepDb).toBe(3);
    expect(safe.consecutiveStops).toBe(0);
    expect(sanitisePlan({ ...bad, currentLevelDb: NaN }).currentLevelDb).toBe(EXPOSURE.minLevelDb);
    expect(sanitisePlan({ ...bad, consecutiveStops: NaN as unknown as number }).consecutiveStops).toBe(0);
    const s = start(bad);
    expect(s.levelDb).toBe(EXPOSURE.ceilingDb);
    expect(playbackLevelDb({ ...s, levelDb: 40 })).toBe(EXPOSURE.ceilingDb);
  });

  it('REQ-SAF-06 distress rating >= 3 stops the session and lowers the next start by two steps', () => {
    const p = createPlan('p', 's');
    const s = start(p);
    const calm = recordDistress(p, s, 1, T0);
    expect(calm.mustStop).toBe(false);
    const r = recordDistress(calm.plan, calm.session, 3, T0);
    expect(r.mustStop).toBe(true);
    expect(r.session.ended).toBe('stopped-distress');
    expect(r.plan.currentLevelDb).toBe(-49);
    expect(r.plan.consecutiveStops).toBe(1);
    expect(r.plan.lockedUntil).toBeNull();
    // Further input after the session ended changes nothing.
    const again = recordDistress(r.plan, r.session, 0, T0);
    expect(again).toEqual({ plan: r.plan, session: r.session, mustStop: true });
  });

  it('REQ-SAF-06 invalid distress ratings are treated as maximum distress (fail safe)', () => {
    const p = createPlan('p', 's');
    const r = recordDistress(p, start(p), NaN, T0);
    expect(r.mustStop).toBe(true);
    expect(r.session.distress).toEqual([4]);
    const r2 = recordDistress(p, start(p), -5, T0);
    expect(r2.session.distress).toEqual([0]);
  });

  it('REQ-SAF-06 child stop ends at once; two consecutive stops lock the plan for 24 h', () => {
    let p = createPlan('p', 's');
    let r = childStop(p, start(p), T0);
    expect(r.session.ended).toBe('stopped-child');
    expect(isLocked(r.plan, T0)).toBe(false);
    p = r.plan;
    r = childStop(p, start(p, T0 + H), T0 + H);
    expect(r.plan.consecutiveStops).toBe(2);
    expect(isLocked(r.plan, T0 + H)).toBe(true);
    expect(isLocked(r.plan, T0 + 25 * H)).toBe(false);
    expect(r.plan.currentLevelDb).toBe(-53);
    // Stopping an ended session is a no-op.
    expect(childStop(r.plan, r.session, T0)).toEqual({ plan: r.plan, session: r.session });
  });

  it('REQ-SAF-06 lowered level never goes below the minimum', () => {
    const p = { ...createPlan('p', 's'), currentLevelDb: -59 };
    expect(childStop(p, start(p), T0).plan.currentLevelDb).toBe(EXPOSURE.minLevelDb);
  });

  it('REQ-SAF-05 step-up needs a calm check-in, at most once per session, 20 h apart', () => {
    const p = createPlan('p', 's');
    const s = start(p);
    expect(canStepUp(p, s, T0)).toEqual({ allowed: false, reason: 'needs-checkin' });
    const mid = recordDistress(p, s, 2, T0);
    expect(canStepUp(mid.plan, mid.session, T0)).toEqual({ allowed: false, reason: 'distress' });
    const calm = recordDistress(p, s, 0, T0);
    expect(canStepUp(calm.plan, calm.session, T0)).toEqual({ allowed: true, nextLevelDb: -43 });
    const up = acceptStepUp(calm.plan, calm.session, T0);
    expect(up.applied).toBe(true);
    expect(up.plan.currentLevelDb).toBe(-43);
    expect(up.session.levelDb).toBe(-45); // current session volume does not jump
    expect(canStepUp(up.plan, up.session, T0)).toEqual({ allowed: false, reason: 'already-stepped' });
    const again = acceptStepUp(up.plan, up.session, T0);
    expect(again.applied).toBe(false);
    // Next session, too soon.
    const s2 = recordDistress(up.plan, start(up.plan, T0 + 2 * H), 0, T0 + 2 * H);
    expect(canStepUp(s2.plan, s2.session, T0 + 2 * H)).toEqual({ allowed: false, reason: 'too-soon' });
    expect(canStepUp(s2.plan, s2.session, T0 + 20 * H)).toMatchObject({ allowed: true });
  });

  it('REQ-SAF-05 step-up never exceeds the exposure ceiling', () => {
    const p = { ...createPlan('p', 's', 3), currentLevelDb: EXPOSURE.ceilingDb - 1 };
    const s = recordDistress(p, start(p), 0, T0);
    expect(canStepUp(s.plan, s.session, T0)).toEqual({ allowed: true, nextLevelDb: EXPOSURE.ceilingDb });
    const top = { ...p, currentLevelDb: EXPOSURE.ceilingDb };
    const s2 = recordDistress(top, start(top), 0, T0);
    expect(canStepUp(s2.plan, s2.session, T0)).toEqual({ allowed: false, reason: 'at-ceiling' });
  });

  it('REQ-SAF-06 completing a session resets the stop counter; ended sessions cannot step up', () => {
    const p = { ...createPlan('p', 's'), consecutiveStops: 1 };
    const s = start(p);
    const done = completeSession(p, s);
    expect(done.plan.consecutiveStops).toBe(0);
    expect(done.session.ended).toBe('completed');
    expect(completeSession(done.plan, done.session)).toEqual(done);
    expect(canStepUp(done.plan, done.session, T0)).toEqual({ allowed: false, reason: 'ended' });
  });

  it('REQ-SAF-05 sessions expire after 5 minutes', () => {
    const p = createPlan('p', 's');
    const s = start(p);
    expect(sessionExpired(s, T0 + 4 * 60_000)).toBe(false);
    expect(sessionExpired(s, T0 + 5 * 60_000)).toBe(true);
  });
});
