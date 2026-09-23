# HarmonyPath (working title)

HarmonyPath is a music and sound companion app for parents, guardians and credentialed music therapists of autistic children aged 2–12. It is built from *Music and Sound Therapy for Children with Autism: A Sub-Study* (`evidence/source_sub-study.md`), following the team brief in `decisions/team_prompt.md`.

> This app supports, and does not replace, professional assessment and therapy. Music activities may help engagement and wellbeing. They do not cure autism. Stop any activity that causes distress, and talk to your child's clinicians about concerns.

## Repository map

| Folder | Contents |
| --- | --- |
| `evidence/` | Claims register, traceability, risk register, regulatory map, research plan, open questions |
| `specs/` | Requirements catalogue (REQ IDs) |
| `architecture/` | System architecture, audio-safety subsystem, agent contracts, data model, threat model, stack |
| `design/` | Journeys, information architecture, wireframes, design system, microcopy, accessibility |
| `packages/core` | Deterministic safety core: audio limits, exposure rules, consent, retention, roles, audit, parental gate |
| `packages/content` | Governed content store: activities, routines, education, knowledge passages |
| `packages/ai` | Governed AI layer: recommender, coach, summariser, compliance checker |
| `apps/web` | Cross-platform app (React PWA; Capacitor-ready for iOS and Android) |
| `tests/` | Test strategy and QA / audio-safety reports |
| `evals/` | AI evaluation sets, runner output and report |
| `decisions/` | ADRs and gate records |

## Commands

```bash
npm install
npm test             # unit tests for all packages, with coverage gates
npm run eval         # AI evaluation suite
npm run e2e          # Playwright end-to-end tests (builds the app)
npm run trace        # regenerate the claims register and traceability matrix
npm run dev          # run the app locally
```

## Status

Phases 0–3 are complete, with pre-approved gates (see `decisions/gate-*.md`).

| Check | Result |
| --- | --- |
| Unit tests | 105 pass; safety core 100% statement, branch, function and line coverage |
| E2E (Playwright) | 39 pass: journeys, Child Mode escape resistance, audio safety, axe accessibility, privacy, offline |
| Audio safety | Ceiling holds under +32 dB overdrive; Stop to silence in 26–42 ms (budget 200 ms) |
| AI eval | All targets met: refusal 100%, crisis escalation 100%, 0 cure claims |
| Traceability | 63/63 MVP requirements trace to code and tests |

**Not cleared for the pilot yet.** Clinical review, audiologist sign-off, real-device SPL tests, screen-reader testing, legal review and an independent AI eval set are human-only items. They are listed as OUTSTANDING in `decisions/gate-3.md`. Start with `tests/qa_report.md`, `tests/audio_safety_report.md` and `evals/ai_evaluation_report.md`.
