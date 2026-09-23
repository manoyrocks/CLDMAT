// Graded sound-exposure rules. Spec: architecture/audio_safety_subsystem.md §4.
// Implements REQ-M5-05, REQ-SAF-05, REQ-SAF-06. Deterministic; the clock is injected.
import { CHILD_POLICY } from '../audio/policy';

export const EXPOSURE = Object.freeze({
  startDb: -45,
  maxStartDb: -40,
  minLevelDb: -60,
  defaultStepDb: 2,
  maxStepDb: 3,
  /** Exposure ceiling sits 6 dB below the Child Mode ceiling. */
  ceilingDb: CHILD_POLICY.ceilingDb - 6,
  minHoursBetweenStepUps: 20,
  lockoutHours: 24,
  stopsBeforeLockout: 2,
  distressStopThreshold: 3,
  maxDistressForStepUp: 1,
  maxSessionMs: 5 * 60 * 1000,
  stepsDownAfterStop: 2,
});

const HOUR = 3600_000;

export interface ExposurePlan {
  readonly id: string;
  readonly soundId: string;
  readonly currentLevelDb: number;
  readonly stepDb: number;
  readonly lastStepUpAt: number | null;
  readonly consecutiveStops: number;
  readonly lockedUntil: number | null;
}

export type SessionOutcome = 'completed' | 'stopped-child' | 'stopped-distress';

export interface ExposureSession {
  readonly planId: string;
  readonly startedAt: number;
  readonly levelDb: number;
  readonly caregiverPresent: true;
  readonly distress: readonly number[];
  readonly steppedUp: boolean;
  readonly ended: SessionOutcome | null;
}

export type StartResult =
  | { ok: true; session: ExposureSession }
  | { ok: false; reason: 'caregiver-not-present' | 'locked' | 'no-consent' };

function clampLevel(db: number): number {
  if (!Number.isFinite(db)) return EXPOSURE.minLevelDb;
  return Math.min(EXPOSURE.ceilingDb, Math.max(EXPOSURE.minLevelDb, db));
}

function clampStep(step: number): number {
  if (!Number.isFinite(step) || step <= 0) return EXPOSURE.defaultStepDb;
  return Math.min(EXPOSURE.maxStepDb, step);
}

/** REQ-SAF-05 new plans start quiet (≤ -40 dBFS) with a step of at most 3 dB. */
export function createPlan(id: string, soundId: string, stepDb: number = EXPOSURE.defaultStepDb): ExposurePlan {
  return {
    id, soundId,
    currentLevelDb: EXPOSURE.startDb,
    stepDb: clampStep(stepDb),
    lastStepUpAt: null,
    consecutiveStops: 0,
    lockedUntil: null,
  };
}

/** Re-validates a plan loaded from storage (guards against tampering, threat T-03). */
export function sanitisePlan(plan: ExposurePlan): ExposurePlan {
  return {
    ...plan,
    currentLevelDb: clampLevel(plan.currentLevelDb),
    stepDb: clampStep(plan.stepDb),
    consecutiveStops: Math.max(0, Math.floor(Number(plan.consecutiveStops) || 0)),
  };
}

export function isLocked(plan: ExposurePlan, now: number): boolean {
  return plan.lockedUntil !== null && now < plan.lockedUntil;
}

/** REQ-M5-05 an exposure session may start only with a caregiver present, consent, and no lock. */
export function startSession(
  plan: ExposurePlan,
  opts: { caregiverPresent: boolean; consentGranted: boolean; now: number },
): StartResult {
  if (!opts.consentGranted) return { ok: false, reason: 'no-consent' };
  if (!opts.caregiverPresent) return { ok: false, reason: 'caregiver-not-present' };
  if (isLocked(plan, opts.now)) return { ok: false, reason: 'locked' };
  const safe = sanitisePlan(plan);
  return {
    ok: true,
    session: {
      planId: safe.id,
      startedAt: opts.now,
      levelDb: safe.currentLevelDb,
      caregiverPresent: true,
      distress: [],
      steppedUp: false,
      ended: null,
    },
  };
}

/** Playback level for the engine: always re-clamped. REQ-SAF-05 */
export function playbackLevelDb(session: ExposureSession): number {
  return clampLevel(session.levelDb);
}

/** Whether the session has run out of time and must fade out. */
export function sessionExpired(session: ExposureSession, now: number): boolean {
  return now - session.startedAt >= EXPOSURE.maxSessionMs;
}

function stopPlan(plan: ExposurePlan, now: number): ExposurePlan {
  const stops = plan.consecutiveStops + 1;
  const lowered = clampLevel(plan.currentLevelDb - EXPOSURE.stepsDownAfterStop * plan.stepDb);
  return {
    ...plan,
    currentLevelDb: lowered,
    consecutiveStops: stops,
    lockedUntil: stops >= EXPOSURE.stopsBeforeLockout ? now + EXPOSURE.lockoutHours * HOUR : plan.lockedUntil,
  };
}

/**
 * REQ-SAF-06 distress check-in (0 calm – 4 very distressed). A rating of 3 or more ends the
 * session at once.
 */
export function recordDistress(
  plan: ExposurePlan,
  session: ExposureSession,
  rating: number,
  now: number,
): { plan: ExposurePlan; session: ExposureSession; mustStop: boolean } {
  if (session.ended) return { plan, session, mustStop: true };
  const r = Number.isFinite(rating) ? Math.min(4, Math.max(0, Math.round(rating))) : 4;
  const next = { ...session, distress: [...session.distress, r] };
  if (r >= EXPOSURE.distressStopThreshold) {
    return { plan: stopPlan(plan, now), session: { ...next, ended: 'stopped-distress' }, mustStop: true };
  }
  return { plan, session: next, mustStop: false };
}

/** REQ-SAF-06 the child pressed Stop / Too Loud. */
export function childStop(plan: ExposurePlan, session: ExposureSession, now: number) {
  if (session.ended) return { plan, session };
  return { plan: stopPlan(plan, now), session: { ...session, ended: 'stopped-child' as const } };
}

export type StepUpCheck =
  | { allowed: true; nextLevelDb: number }
  | { allowed: false; reason: 'already-stepped' | 'needs-checkin' | 'distress' | 'too-soon' | 'at-ceiling' | 'ended' };

/** REQ-SAF-05 at most one step up per session, after a calm check-in, 20 h apart, never above the ceiling. */
export function canStepUp(plan: ExposurePlan, session: ExposureSession, now: number): StepUpCheck {
  if (session.ended) return { allowed: false, reason: 'ended' };
  if (session.steppedUp) return { allowed: false, reason: 'already-stepped' };
  const last = session.distress[session.distress.length - 1];
  if (last === undefined) return { allowed: false, reason: 'needs-checkin' };
  if (last > EXPOSURE.maxDistressForStepUp) return { allowed: false, reason: 'distress' };
  if (plan.lastStepUpAt !== null && now - plan.lastStepUpAt < EXPOSURE.minHoursBetweenStepUps * HOUR) {
    return { allowed: false, reason: 'too-soon' };
  }
  const safe = sanitisePlan(plan);
  if (safe.currentLevelDb >= EXPOSURE.ceilingDb) return { allowed: false, reason: 'at-ceiling' };
  return { allowed: true, nextLevelDb: clampLevel(safe.currentLevelDb + safe.stepDb) };
}

/**
 * Caregiver accepts one small step. The new level applies to the NEXT session. The current
 * session keeps its level, so the volume never jumps while the child is listening.
 */
export function acceptStepUp(plan: ExposurePlan, session: ExposureSession, now: number) {
  const check = canStepUp(plan, session, now);
  if (!check.allowed) return { plan, session, applied: false as const };
  return {
    plan: { ...plan, currentLevelDb: check.nextLevelDb, lastStepUpAt: now },
    session: { ...session, steppedUp: true },
    applied: true as const,
  };
}

/** Session completed without a stop: clears the consecutive-stop counter. */
export function completeSession(plan: ExposurePlan, session: ExposureSession) {
  if (session.ended) return { plan, session };
  return { plan: { ...plan, consecutiveStops: 0 }, session: { ...session, ended: 'completed' as const } };
}
