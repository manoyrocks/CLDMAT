# QA Report: Phase 3 (updated after round 2)

Owner: Testers (QA) · Build: commit after Gate 2 · Date: 2026-09-23 · Environment: Linux container, Node 22, headless Chromium 141 (Playwright 1.56.1, Pixel 7 profile)

## 1. Summary

| Suite | Tests | Result |
| --- | --- | --- |
| Unit: `packages/core` (safety core) | 47 | ✅ pass; **100% statements, branches, functions and lines** (enforced threshold) |
| Unit: `packages/content` | 19 | ✅ pass; 100% coverage |
| Unit: `packages/ai` (incl. classifier tests with benign decoys, safety screen) | 87 | ✅ pass |
| Unit: `apps/web/src/lib` (repository, i18n, feature flags) | 12 | ✅ pass; 92.6% statements, 98.1% branches |
| E2E: journeys | 10 | ✅ pass |
| E2E: Child Mode escape resistance | 8 | ✅ pass |
| E2E: audio safety | 8 | ✅ pass (see `audio_safety_report.md`) |
| E2E: live-chain audio (real output meter, fake mic, time limit, cold start) | 8 | ✅ pass |
| E2E: accessibility (axe + targets + motion + keyboard) | 6 | ✅ pass |
| E2E: privacy and consent | 5 | ✅ pass |
| E2E: offline | 1 | ✅ pass |
| E2E: reference screenshots | 1 | ✅ (captures `design/screenshots/`) |
| AI evaluation (`npm run eval`) | Tuning set + 2 development sets (regression guards) | ✅ gating targets met |
| AI blind final test (v3, 170 q, untouched) | Report only | ❌ **crisis escalation 48.6%, refusal 80%**. Coach is off in pilot builds (ADR-0007) |
| Traceability (`npm run trace:strict`) | 63 MVP requirements | ✅ 63/63 trace to code and tests |

The e2e suite (47 tests) passed on every run in round 2; the original 39 were also run twice in round 1 with no flakes.

**How to reproduce:** `npm install && npm run check` (typecheck, unit tests, eval, e2e and strict traceability).

## 2. Specialised suites (test strategy §Specialised suites)

| Suite | Case IDs | Status |
| --- | --- | --- |
| Audio safety | AS-01 to AS-08 | ✅ automated. AS-09 (recording normalisation) is covered by a unit test of the gain maths only; AS-10 (routes) is **OUTSTANDING (human device lab)** |
| Accessibility | A11Y-01 (axe on 15 parent and 6 child screens), A11Y-02 (keyboard session log), A11Y-03 (targets ≥ 48 px, child cards ≥ 120 px), A11Y-04 (reduced motion by default) | ✅. A11Y-05 (VoiceOver and TalkBack) **OUTSTANDING (human)** |
| Privacy and consent | PRV-T1 no child data before consent; PRV-T2 withdraw; PRV-T3 delete-all; PRV-T4 no third-party requests; PRV-T5 export; PRV-T6 retention purge (unit) | ✅ |
| Offline | OFF-01 reload offline; OFF-02 Child Mode audio offline; OFF-03 coach offline | ✅ |
| Child Mode escape resistance | ESC-01 Back, Escape, hash and reload; ESC-02 wrong answer; ESC-03 lockout after 3; ESC-04 correct answer exits; ESC-05 Stop bar on every child screen, no external links | ✅. OS-level escapes (home button, app switcher) are outside app control; guidance points to Guided Access or Screen Pinning |
| Regression and device matrix | Chromium mobile profile only | ⚠️ **OUTSTANDING**: iOS Safari/WebKit, Android WebView (Capacitor) and low-end Android devices |

## 3. Defects

| ID | Severity | Summary | Found by | Status |
| --- | --- | --- | --- | --- |
| DEF-001 | **Critical** (audio safety) | Graded exposure played at −36 dBFS instead of the planned −45 dBFS. The engine clamped explicit exposure levels through the user-volume floor, which raised quiet levels by 9 dB | e2e AS-07 | **Fixed** before Gate 2: explicit levels are now only clamped down (`capDb`); spec §4.2 updated; AS-07 asserts the gain is ≤ the planned level |
| DEF-002 | High (audio safety, latent) | If graded exposure started within 1 s of other audio, it could inherit the Child Mode volume (−20 dBFS) instead of its own level | Code review before the first e2e run | **Fixed:** an explicit level always silences other voices and fades in from zero to that level |
| DEF-003 | Medium | After Stop, a replay within 1 s stayed silent because the gain was held at 0 | Code review | **Fixed** (`stopped` flag forces fade-in) |
| DEF-004 | Medium (audio safety, latent) | The volume buttons could raise the gain while exposure audio was playing | Code review | **Fixed** (`exposureActive` lock) |
| DEF-005 | Medium | Content: the calm-sway activity had no explicit "pause and wait" prompt (REQ-M1-02) | Content unit test | **Fixed** |
| DEF-006 | Medium (AI) | The coach answered off-topic questions ("school district", "insurance") from a single shared word | AI eval `unknown` set | **Fixed:** an IDF-weighted query-coverage threshold |
| DEF-008 | Medium (audio safety) | Pressing Stop while a recording was still decoding did not stop it from starting afterwards | Code review, round 2 | **Fixed:** a start token is invalidated by Stop; e2e DEF-008 |
| DEF-009 | **Critical** (audio safety) | Every quiet level played ~8.5 dB louder than planned. The Web Audio `DynamicsCompressorNode` applies automatic make-up gain (≈ (15 − 15/20) × 0.6 dB for threshold −15 dBFS, ratio 20:1), which cannot be disabled. Exposure at −45 dBFS played at −36.5; the default child volume was pushed up against the ceiling | New live output meter (after the final clipper), round 2. Earlier tests measured the session gain *before* the compressor, so they could not see it | **Fixed:** replaced by a static soft-knee limiter curve (`softLimitCurve`, unity gain below the knee, 100% unit-tested). Calibration e2e now asserts exposure −46.0 dBFS (plan −46) and drum −26.0 dBFS (plan ≤ −26) |
| DEF-010 | **Critical** (AI safety) | The coach escalated only **2 of 30** paraphrased crises in a blind held-out set; refusals were 14/40 and grounding 31/80. The first classifier matched narrow phrases and was evaluated only on sets written by its author | Independent blind Evaluator set, round 2 | **Fixed:** classifier rebuilt by general category, with SG/PH phrasing; a domain gate and an out-of-scope gate; query expansion; a permanent emergency number on the coach screen. Untouched blind re-tests: 46.7% (v2) and 48.6% (v3). The lexicon levels off, so the defect is **mitigated, not resolved**: the coach is feature-flagged off for the pilot and a model-based safety screen has been added (ADR-0007) |
| DEF-007 | Low | The red-flag question about "retrain hearing" claims was falsely blocked by the compliance checker | AI eval (compliance false blocks) | **Fixed:** a term approval scoped to that question |

**Open Critical or High defects: 0.** Two further Critical defects (DEF-009, DEF-010) were found in round 2 by *stronger, independent* tests and fixed. The lesson is recorded in ADR-0006: safety claims need measurement at the real output and blind evaluation sets.

## 4. Known limitations (not defects; tracked for Phase 4)

| ID | Limitation | Mitigation or next step |
| --- | --- | --- |
| L-01 | In-app ceilings are in dBFS. Actual SPL depends on the device, route and system volume (risk R-16) | Headphone notice (REQ-SAF-10); native route and volume plugin; audiologist calibration (OQ-01) |
| L-02 | Tests ran on headless Chromium only; timing figures are not real-device measurements | Device lab (AS-10); WebKit run |
| L-03 | ~~Graded exposure offers built-in sounds only~~ **Closed in round 2:** the family can record the real trigger sound; it is normalised like the built-in sounds and plays at the plan level (e2e L-03) | Clinical review of this feature (packet §B) |
| L-04 | Caregiver recordings are normalised at playback time; decoding very long recordings on low-end devices is untested | Recording limit is 20 s |
| L-05 | The parental gate may be solvable by some 10–12 year olds | Recommend OS Guided Access or Screen Pinning; consider a stronger gate after research |
| L-06 | The therapist portal (REQ-M9-02) and caregiver wellbeing (REQ-M10-01) are not built (LATER scope) | Phase 4+ |
| L-07 | LLM coach mode is implemented and unit-tested with a mocked client, but not evaluated live (no credentials) | Live eval run before enabling (ADR-0005) |

## 5. QA sign-off
Every automated gate criterion for Phase 3 is met. Release to the **pilot** remains blocked on the human-only items in `decisions/gate-3.md`.
