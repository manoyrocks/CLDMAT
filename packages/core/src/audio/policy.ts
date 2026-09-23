// Audio-safety policy. The single source of truth for every loudness number in the app.
// Spec: architecture/audio_safety_subsystem.md. Implements REQ-SAF-01, REQ-SAF-03, REQ-SAF-07,
// REQ-M4-03. Pure functions only; no Web Audio, no AI, no network (REQ-SAF-09).

export type AudioMode = 'child' | 'parent';

export interface AudioPolicy {
  readonly mode: AudioMode;
  /** Hard peak ceiling at the destination, dBFS. */
  readonly ceilingDb: number;
  readonly defaultDb: number;
  /** Quietest selectable level, dBFS. */
  readonly floorDb: number;
  readonly minFadeInMs: number;
  /** Maximum rate of user-requested volume increase, dB per second. */
  readonly maxRiseDbPerSec: number;
  /** Volume button step, dB. */
  readonly stepDb: number;
  /** Ramp used for Stop / Too Loud. Must stay far below the 200 ms budget. */
  readonly stopRampMs: number;
  readonly mono: boolean;
}

export const STOP_BUDGET_MS = 200;

export const CHILD_POLICY: AudioPolicy = Object.freeze({
  mode: 'child',
  ceilingDb: -12,
  defaultDb: -20,
  floorDb: -36,
  minFadeInMs: 500,
  maxRiseDbPerSec: 6,
  stepDb: 3,
  stopRampMs: 30,
  mono: true,
});

export const PARENT_POLICY: AudioPolicy = Object.freeze({
  mode: 'parent',
  ceilingDb: -6,
  defaultDb: -14,
  floorDb: -36,
  minFadeInMs: 250,
  maxRiseDbPerSec: 12,
  stepDb: 3,
  stopRampMs: 30,
  mono: false,
});

export function policyFor(mode: AudioMode): AudioPolicy {
  return mode === 'child' ? CHILD_POLICY : PARENT_POLICY;
}

export function dbToLinear(db: number): number {
  return Math.pow(10, db / 20);
}

export function linearToDb(linear: number): number {
  if (!(linear > 0)) return -Infinity;
  return 20 * Math.log10(linear);
}

/** Clamp a requested level into [floor, ceiling]. Non-finite input fails quiet (floor). REQ-SAF-01 */
export function clampDb(requestedDb: number, policy: AudioPolicy): number {
  if (!Number.isFinite(requestedDb)) return policy.floorDb;
  return Math.min(policy.ceilingDb, Math.max(policy.floorDb, requestedDb));
}

/** Linear gain for a requested level; never above the ceiling. REQ-SAF-01 */
export function safeGain(requestedDb: number, policy: AudioPolicy): number {
  return dbToLinear(clampDb(requestedDb, policy));
}

/** One volume button press. REQ-M4-03 */
export function stepVolume(currentDb: number, direction: 'up' | 'down', policy: AudioPolicy): number {
  const delta = direction === 'up' ? policy.stepDb : -policy.stepDb;
  return clampDb(clampDb(currentDb, policy) + delta, policy);
}

/**
 * Duration of the ramp needed to move from `fromDb` to `toDb` without breaking the rise limit.
 * Decreases are fast (20 ms). REQ-SAF-07
 */
export function rampDurationMs(fromDb: number, toDb: number, policy: AudioPolicy): number {
  const from = clampDb(fromDb, policy);
  const to = clampDb(toDb, policy);
  if (to <= from) return 20;
  return Math.ceil(((to - from) / policy.maxRiseDbPerSec) * 1000);
}

/** Effective fade-in: callers may ask for longer, never shorter. REQ-SAF-03 */
export function fadeInMs(requestedMs: number | undefined, policy: AudioPolicy): number {
  if (requestedMs === undefined || !Number.isFinite(requestedMs)) return policy.minFadeInMs;
  return Math.max(policy.minFadeInMs, requestedMs);
}

/** Level (0–1) for a 1–5 dot display. The top dot equals the ceiling. */
export function levelDots(currentDb: number, policy: AudioPolicy, dots = 5): number {
  const c = clampDb(currentDb, policy);
  const frac = (c - policy.floorDb) / (policy.ceilingDb - policy.floorDb);
  return Math.max(1, Math.round(frac * (dots - 1)) + 1);
}

/** Peak normalisation gain for a recorded buffer so its peak lands at targetDb (REQ-M3-03). */
export function normalisationGain(peakLinear: number, targetDb = -6): number {
  if (!(peakLinear > 0) || !Number.isFinite(peakLinear)) return 0;
  return dbToLinear(targetDb) / peakLinear;
}

/** Hard-clipper transfer curve used by the final WaveShaper stage (layer L4). */
export function clipperCurve(ceilingDb: number, samples = 2049): Float32Array {
  const c = dbToLinear(ceilingDb);
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / (samples - 1) - 1;
    curve[i] = Math.max(-c, Math.min(c, x));
  }
  return curve;
}
