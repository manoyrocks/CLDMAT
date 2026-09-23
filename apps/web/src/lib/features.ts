// Feature flags (team prompt §8.3). The Caregiver Coach ships behind a flag: pilot builds set
// VITE_FEATURE_COACH=false until the coach passes a blind held-out evaluation (ADR-0007).
export function coachEnabled(env: Record<string, string | boolean | undefined>): boolean {
  return env.VITE_FEATURE_COACH !== 'false' && env.VITE_FEATURE_COACH !== false;
}

export const FEATURES = {
  coach: coachEnabled(import.meta.env as unknown as Record<string, string | undefined>),
};
