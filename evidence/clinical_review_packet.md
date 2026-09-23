# Clinical and Content Review Packet (for a credentialed music therapist and an audiologist or OT)

Owner: Evaluators · Status: **prepared; review not yet performed (OUTSTANDING, human)**
Every content item carries `clinicalReview: 'pending'` until this review is recorded. The compliance checker lists it as a warning on each item.

## A. For the credentialed music therapist (MT-BC / HCPC / equivalent)
Please review and mark each item Approve / Revise / Remove:

1. **Activities** (`packages/content/src/activities.ts`, 14 items): steps, pause cues, cue cards, tips, age bands, minutes, and the "Emerging · low risk" labelling.
2. **Routine songs** (`library.ts`, 6): lyrics, tunes (public domain) and picture steps.
3. **Goal templates** (10): are they measurable, affirming and free of normalising aims? Is the 0–4 scale anchor wording clear?
4. **Session design:** 10–15 minutes, 2–4 activities, ending on a calm activity.
5. **Education Hub** (`education.ts`, 19): accuracy of the tier explanations and intervention descriptions, including NMT and AMMT.
6. **Coach knowledge passages** (`knowledge.ts`, 40): each one is the *only* text the coach can return.
7. **Therapist checklist and credential bodies** (M9): please confirm the registers for SG and PH.

## B. For the audiologist or OT consultant
1. Output levels (spec §3): Child Mode ceiling −12 dBFS, default −20 dBFS; the plan for per-device SPL calibration.
2. Graded exposure (spec §4): start −45 dBFS, step ≤ +3 dB, one step per session, ≥ 20 h apart, ceiling −18 dBFS, stop rules, 24 h lockout. Should practice be limited by age or by profile?
3. The ear-defender guidance wording (C-023).
4. The sound-diary fields and the pattern summary.

## C. For a safeguarding lead
1. The crisis lexicon (`packages/ai/src/coach.ts`) and the escalation copy.
2. Regional emergency and crisis numbers (`library.ts`, CRISIS_LINES; OQ-12).

## D. Primary-source verification (OQ-09)
Check every citation in `evidence/claims_register.json` against its full text. Correct the claim wording or tier where needed, then run `npm run trace && npm run eval`.

## How to record a decision
Set `clinicalReview: 'approved'` (and bump `version`) on the item. Add an ADR in `/decisions` for any change to safety parameters.
