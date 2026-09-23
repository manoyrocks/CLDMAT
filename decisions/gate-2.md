# Gate 2: Build (MVP: M1–M8)

- **Date:** 2026-09-23 · **Decision:** APPROVED (pre-approved by the product owner, ADR-0001)

| Gate criterion | Result | Evidence |
| --- | --- | --- |
| Working MVP | Met: React PWA covering M1–M8 plus the M9 checklist; Parent Mode and Child Mode; offline | `apps/web`, `design/screenshots/` |
| Unit and integration tests pass | Met: 105 unit tests; 39 Playwright e2e tests, run twice with no flakes | `npm test`, `npm run e2e` |
| All safety tests pass | Met: safety core has 100% statement, branch, function and line coverage; audio-safety e2e suite AS-01..08 green | `tests/audio_safety_report.md` |
| No open critical defects | Met: DEF-001 (Critical, exposure level clamp) found by AS-07 and fixed before this gate | `tests/qa_report.md` |
| Content library v1 | Met: 14 activities, 6 routines, 7 songs and calm tracks, 19 education entries, 40 coach passages. The compliance checker passes the whole library | `packages/content`, `npm run eval` |
| Traceability | Met: all 63 MVP requirements trace to code **and** tests (`npm run trace:strict`) | `evidence/traceability_matrix.md` |

**Scope notes:** REQ-M9-02 (therapist portal) and REQ-M10-01 are LATER by design. Graded exposure uses the built-in practice sounds; recording the child's own difficult sound is deferred (QA report, known limitation L-03).

**OUTSTANDING (human-only):** real-device audio-route SPL measurement; clinical review of the content (OQ-02).
