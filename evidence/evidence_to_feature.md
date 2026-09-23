# Evidence-to-Feature Traceability (Phase 0)

Owner: Evaluators · Status: Gate 0 approved (see `decisions/gate-0.md`)

This document maps each module to the sub-study evidence behind it and records the scope audit. The full matrix covers requirement → claim → design → code → test → eval. It is **generated** from `specs/requirements.json` and a scan of the repository into `evidence/traceability_matrix.md` (`npm run trace`).

## 1. Module → evidence

| Module | Sub-study basis | Key claims | Tier of underlying practice | Why it is in scope |
| --- | --- | --- | --- | --- |
| M1 Activity Library | §7.1 home activities table; §4 mechanisms | C-005, C-010, C-014, C-018 | Emerging (low risk) | The sub-study's own parent guide: interactive, goal-directed shared music |
| M2 Guided Session Player | §7, §7.2 | C-011, C-012 | Emerging | Turns "10–15 minutes a day together" into a habit |
| M3 Routine Songs | §7.1 transitions row | C-015, C-017 | Emerging | "The same song every time makes the routine predictable" |
| M4 Calm Corner | §7.1 regulation row; §6.2 sound anchors | C-016, C-025, C-027 | Emerging / Verified (consensus) | Child-chosen calm playlist, child volume control |
| M5 Sound Toolkit | §6.1 assessment; §6.2 strategies | C-020–C-030 | Verified (clinical consensus) | Protection, predictability, control, graded tolerance |
| M6 Goals & Progress | §2 (written goals), §3.1 (where benefits show), §7.3 | C-002, C-039, C-041 | Verified (practice) | Measurable goals and 8–12 week review; honest about outcomes |
| M7 Picture Choice | §7.2 "Use visuals" | C-017 | Emerging | Minimally verbal children take part |
| M8 Education Hub | §3, §5, §8 | C-001–C-004, C-032–C-038 | Mixed; explains tiers | Honest education; protects families from unproven products |
| M9 Therapist checklist | §7.3 | C-039, C-040, C-041 | Verified | Directs families to credentialed care (portal is LATER) |
| M10 Wellbeing | Parent paper §11.6 (not in this sub-study) | — | Not assessed | LATER; the evidence source must be supplied (open question OQ-07) |

## 2. Scope audit: excluded features (principle 2.3)

The principle text in the team prompt is garbled ("May Build these Auditory Integration only as experimental/education and unveried…"). ADR-0002 reads it as: **these therapies may appear only as education content labelled Unverified. No functional feature may deliver them.**

| Excluded item | Present as a feature? | Present as education? | Guard |
| --- | --- | --- | --- |
| Auditory Integration Training (Berard) | No | Yes, M8 (C-032) | Compliance checker banned terms; no filter/modulation DSP in the audio engine |
| Tomatis-style filtering | No | Yes (C-033) | Audio engine exposes no filter or EQ node types to content |
| Samonas, Therapeutic Listening, iLs | No | Yes (C-035) | — |
| Safe and Sound Protocol | No | Yes (C-034) | — |
| Binaural beats | No | Yes (C-036) | Engine is mono-summed in Child Mode, so no per-ear frequency offsets are possible |
| 432 Hz / Solfeggio tuning | No | Yes (C-036) | Content schema rejects `tuningHz` fields; all synthesis uses A4 = 440 Hz |
| Sound baths / "healing" sounds | No | Yes (C-037) | Banned term "healing" |

**Result:** no excluded feature is in MVP scope. ✅

## 3. Findings: every MVP feature traces to evidence

- All MVP functional requirements (M1–M9-01) cite at least one claim. Safety, privacy, AI and NFR requirements come from the team prompt (§2, §5, §6), not from clinical claims, and cite none by design.
- `scripts/traceability.mjs` fails the build if an MVP functional requirement has no claim, or if a requirement cites a claim ID that does not exist.
