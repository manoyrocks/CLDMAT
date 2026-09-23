import { describe, expect, it } from 'vitest';
import { coachEnabled } from './features';

describe('feature flags', () => {
  it('REQ-AI-02 the coach can be switched off for pilot builds (ADR-0007)', () => {
    expect(coachEnabled({})).toBe(true);
    expect(coachEnabled({ VITE_FEATURE_COACH: 'true' })).toBe(true);
    expect(coachEnabled({ VITE_FEATURE_COACH: 'false' })).toBe(false);
    expect(coachEnabled({ VITE_FEATURE_COACH: false })).toBe(false);
  });
});
