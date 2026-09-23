// Parental gate for leaving Child Mode and for adult-only actions. Implements REQ-SAF-08.
// The challenge is written in words, so pre-readers cannot solve it. It uses multiplication plus addition.
export const GATE = Object.freeze({ holdMs: 2000, maxAttempts: 3, lockoutMs: 60_000 });

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'] as const;

export interface GateChallenge {
  readonly a: number;
  readonly b: number;
  readonly c: number;
  readonly prompt: string;
  readonly answer: number;
}

export interface GateState {
  readonly failures: number;
  readonly lockedUntil: number | null;
}

export const INITIAL_GATE: GateState = Object.freeze({ failures: 0, lockedUntil: null });

/** `rng` returns values in [0, 1). Injected so tests are deterministic. */
export function makeChallenge(rng: () => number): GateChallenge {
  const pick = (lo: number, hi: number) => lo + Math.min(hi - lo, Math.floor(rng() * (hi - lo + 1)));
  const a = pick(6, 9), b = pick(6, 9), c = pick(2, 9);
  return {
    a, b, c,
    prompt: `What is ${WORDS[a]} times ${WORDS[b]}, plus ${WORDS[c]}?`,
    answer: a * b + c,
  };
}

/** Whether a press-and-hold lasted long enough. */
export function holdComplete(pressedAt: number, releasedAt: number): boolean {
  return releasedAt - pressedAt >= GATE.holdMs;
}

export function isGateLocked(state: GateState, now: number): boolean {
  return state.lockedUntil !== null && now < state.lockedUntil;
}

export type GateResult = { passed: boolean; state: GateState; locked: boolean };

export function checkAnswer(challenge: GateChallenge, input: string, state: GateState, now: number): GateResult {
  if (isGateLocked(state, now)) return { passed: false, state, locked: true };
  const trimmed = input.trim();
  const value = /^\d{1,3}$/.test(trimmed) ? Number(trimmed) : NaN;
  if (value === challenge.answer) return { passed: true, state: INITIAL_GATE, locked: false };
  const failures = state.failures + 1;
  if (failures >= GATE.maxAttempts) {
    return { passed: false, state: { failures: 0, lockedUntil: now + GATE.lockoutMs }, locked: true };
  }
  return { passed: false, state: { failures, lockedUntil: null }, locked: false };
}
