# Gate 3: Test, Safety & Clinical Review

- **Date:** 2026-09-23 · **Decision:** APPROVED for the automated criteria (pre-approved by the product owner, ADR-0001). **Not cleared for the Phase 4 pilot** until the OUTSTANDING items below are closed (risk R-20).

| Gate criterion | Result | Evidence |
| --- | --- | --- |
| QA report | Done | `tests/qa_report.md` |
| Audio-safety test report | Done: AS-01 to AS-08 pass; Stop 26–42 ms; ceiling holds under +32 dB overdrive | `tests/audio_safety_report.md` |
| AI evaluation report | Done | `evals/ai_evaluation_report.md` |
| Zero safety failures | Met (automated). One Critical defect (DEF-001) was found and fixed; 0 open | QA report §3 |
| AI refusal and grounding targets met | Met: refusal 100%, escalation 100%, grounded 100% (optimistic, see caveat), 0 cure claims | AI report |
| Clinical and content review by a credentialed music therapist | **OUTSTANDING (human):** packet prepared | `evidence/clinical_review_packet.md` |

## OUTSTANDING items (all human-only). They block the Gate 4 pilot.
1. Music therapist content review (OQ-02) and audiologist sign-off on the audio levels and exposure rules (OQ-01).
2. Real-device audio-route SPL measurements (AS-10) and a WebKit / Android WebView run.
3. Manual screen-reader testing (A11Y-05), plus prototype testing with caregivers and autistic adult advisers.
4. Independent held-out AI eval set; a live LLM-mode eval if that mode is to be enabled.
5. Safeguarding review of the crisis lexicon and numbers (OQ-12); primary-source verification of citations (OQ-09).
6. Legal and privacy review for SG and PH (OQ-04 to OQ-06); ethics route for the pilot (OQ-08).

**Next phase:** Phase 4 pilot (≥ 20 families, ≥ 3 therapists), per `evals/evaluation_plan.md` §3, once the items above close.

## Addendum: round 2–3 re-evaluation (2026-09-23)

| Criterion | Revised result |
| --- | --- |
| Zero safety failures | Two further **Critical** defects found by stronger tests and **fixed**: DEF-009 (the compressor's make-up gain made quiet audio +8.5 dB), verified by a real-output calibration test; DEF-010 (coach crisis detection). Audio safety: **met**, measured at the real output |
| AI refusal and grounding targets met | **NOT MET** on blind held-out sets: crisis escalation 48.6%, refusal 80% (v3, untouched). See `evals/ai_evaluation_report.md` |
| Mitigation in place | The coach is behind a feature flag and is **off in pilot builds**; the emergency number is always shown on the coach screen; an optional model-based safety screen is implemented but not live-evaluated (ADR-0007) |

**Pilot decision input:** the Phase 4 pilot may proceed **without the coach** once the human-only items above close. Enabling the coach requires the ADR-0007 conditions.
