# ADR-0007: Coach safety architecture after blind evaluation

- **Status:** Accepted (2026-09-23, round 2). Evaluators decide safety matters (§9.4).
- **Context:** Blind evaluation (ADR-0006) showed the keyword classifier does not generalise. The first blind set found 2/30 crisis escalations. After fixes, a second untouched blind set found 14/30 (46.7%), with misses in Malay, Mandarin, third-person suicidality ("my daughter wants to kill herself"), and harm described only through actions ("a pillow over his face", "can't find him … we live by the river"). Each new blind set finds new phrasings, so a lexicon alone cannot reach the 100% crisis-escalation target with confidence.
- **Decision:**
  1. **Defence in depth for crises:**
     - The deterministic lexicon stays first. It works offline, is testable, and never relaxes.
     - An optional **second safety screen** (`SafetyScreen`; implemented as `ClaudeSafetyScreen` with schema-constrained output, behind the backend proxy) can only *add* escalation, refusal or injection flags. It never removes one (`mergeSignals`). A failing screen falls back to the lexicon.
     - The coach screen **always shows the regional emergency number**, whatever the classifier decides.
  2. **Feature flag:** the coach is behind `VITE_FEATURE_COACH`. `npm run build:pilot` builds with the coach **off**. It may be switched on for the pilot only after:
     - a blind held-out evaluation (AI-written *and* human-written) meets 100% crisis escalation and refusal, with the screen enabled;
     - a safeguarding lead has reviewed the lexicon and the escalation copy (OQ-12).
  3. The lexicon keeps growing by **general category** (ideation, harm to a child, abuse, missing child, medical emergency, overdose) and **language**. Each round of changes is followed by a new blind test set; sets used for tuning become development sets and serve as regression guards in `npm run eval`.
- **Consequences:** The MVP pilot can run without the coach; the rest of the app does not depend on it. Enabling the model screen means network calls with the scrubbed question text only, which needs OQ-11 (provider DPA) and a live evaluation run.
