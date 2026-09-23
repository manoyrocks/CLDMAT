import { describe, expect, it } from 'vitest';
import { GATE, INITIAL_GATE, checkAnswer, holdComplete, isGateLocked, makeChallenge } from './gate';

const seq = (...v: number[]) => { let i = 0; return () => v[i++ % v.length]!; };

describe('parental gate', () => {
  it('REQ-SAF-08 challenge is written in words with a two-step answer', () => {
    const c = makeChallenge(seq(0.2, 0.9, 0.5));
    expect(c.prompt).toBe('What is six times nine, plus six?');
    expect(c.answer).toBe(60);
    expect(c.prompt).not.toMatch(/\d/);
    const hi = makeChallenge(seq(0.9999, 0.9999, 0.9999));
    expect([hi.a, hi.b, hi.c]).toEqual([9, 9, 9]);
    const lo = makeChallenge(seq(0, 0, 0));
    expect([lo.a, lo.b, lo.c]).toEqual([6, 6, 2]);
    // An rng returning exactly 1 (out of contract) is still clamped into range.
    expect(makeChallenge(seq(1, 1, 1)).a).toBe(9);
  });

  it('REQ-SAF-08 hold must last 2 seconds', () => {
    expect(GATE.holdMs).toBe(2000);
    expect(holdComplete(0, 1999)).toBe(false);
    expect(holdComplete(0, 2000)).toBe(true);
  });

  it('REQ-SAF-08 correct answer passes; wrong answers count; 3 failures lock for 60 s', () => {
    const c = makeChallenge(seq(0.2, 0.9, 0.5));
    expect(checkAnswer(c, ' 60 ', INITIAL_GATE, 0)).toEqual({ passed: true, state: INITIAL_GATE, locked: false });
    let r = checkAnswer(c, '59', INITIAL_GATE, 0);
    expect(r).toEqual({ passed: false, state: { failures: 1, lockedUntil: null }, locked: false });
    r = checkAnswer(c, 'sixty', r.state, 0);
    expect(r.state.failures).toBe(2);
    r = checkAnswer(c, '', r.state, 0);
    expect(r.locked).toBe(true);
    expect(r.state.lockedUntil).toBe(GATE.lockoutMs);
    expect(isGateLocked(r.state, 1000)).toBe(true);
    // Even the right answer is refused during lockout.
    expect(checkAnswer(c, '60', r.state, 1000)).toMatchObject({ passed: false, locked: true });
    expect(checkAnswer(c, '60', r.state, GATE.lockoutMs)).toMatchObject({ passed: true });
    expect(isGateLocked(INITIAL_GATE, 0)).toBe(false);
  });

  it('REQ-SAF-08 rejects non-numeric or oversized input', () => {
    const c = makeChallenge(seq(0, 0, 0));
    expect(checkAnswer(c, '38.0', INITIAL_GATE, 0).passed).toBe(false);
    expect(checkAnswer(c, '0038', INITIAL_GATE, 0).passed).toBe(false);
  });
});
