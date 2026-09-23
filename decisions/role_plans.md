# Role Plans (team prompt §10 format)

## Agent Architects
- **ROLE:** Agent Architects
- **UNDERSTANDING:** An offline-first caregiver app; deterministic safety core; advisory AI; the audio-safety chain is the highest-integrity part; privacy is local-first.
- **DELIVERABLES:** ARC-1 system architecture (`architecture/system_architecture.md`) · ARC-2 audio-safety spec · ARC-3 agent contracts · ARC-4 data model · ARC-5 threat model · ARC-6 stack ADR-0004 · ARC-7 offline and sync design. *Acceptance:* each REQ-SAF, REQ-PRV and REQ-AI requirement is addressed; reviewed by Evaluators.
- **DEPENDENCIES:** Evaluators (limits sign-off), Designers (Child Mode flows).
- **RISKS:** R-16 volume outside app control → native plugin + notice; R-15 latency → spike.
- **OPEN QUESTIONS:** OQ-01, OQ-03, OQ-11.
- **ESTIMATED EFFORT:** 8 person-days.

## UX/UI Designers
- **ROLE:** UX/UI Designers
- **UNDERSTANDING:** Design for a tired parent and a sensory-sensitive child at once; Parent and Child modes are separate; no reading needed in Child Mode; calm, still and predictable.
- **DELIVERABLES:** UX-1 journeys · UX-2 IA · UX-3 wireframes (low-fi here; high-fi = the MVP plus screenshots) · UX-4 design system · UX-5 AAC picture cards · UX-6 microcopy guide · UX-7 accessibility annotations. *Acceptance:* WCAG 2.2 AA annotations; banned-term free; tested with caregivers and autistic advisers (OUTSTANDING).
- **DEPENDENCIES:** Architects (gate, audio controls), Evaluators (copy approval).
- **RISKS:** R-11 overstimulation; R-12 caregiver burden.
- **OPEN QUESTIONS:** AAC symbol licence (PCS vs in-house); regional song packs.
- **ESTIMATED EFFORT:** 12 person-days, plus research sessions.

## Software Developers
- **ROLE:** Software Developers
- **UNDERSTANDING:** No production code before Gate 1; implement to spec; 100% branch coverage on safety; content from the governed store only; strings externalised.
- **DELIVERABLES (Phase 0–1):** DEV-1 audio latency and limiter spike · DEV-2 estimates · DEV-3 architecture review. **Phase 2:** the MVP (M1–M8, plus the M9 checklist), with unit and e2e tests.
- **DEPENDENCIES:** Architects (specs), QA (test IDs).
- **RISKS:** WebView audio latency; IndexedDB quirks on iOS.
- **OPEN QUESTIONS:** Capacitor plugin budget for the native volume and route API.
- **ESTIMATED EFFORT:** MVP ≈ 25 person-days.

## Testers (QA)
- **ROLE:** Testers
- **UNDERSTANDING:** Traceable tests; audio-safety and child-privacy defects are Critical.
- **DELIVERABLES:** QA-1 test strategy · QA-2 test cases (in code, named with REQ IDs) · QA-3 QA report · QA-4 audio-safety report.
- **DEPENDENCIES:** Developers (test hooks); a device lab (human).
- **RISKS:** Headless audio cannot measure SPL → device lab is OUTSTANDING.
- **ESTIMATED EFFORT:** 10 person-days.

## Evaluators
- **ROLE:** Evaluators (Evidence, Safety & AI Quality)
- **UNDERSTANDING:** Own the claims register and veto content; build eval sets; targets are 100% refusal, ≥ 95% grounded, 0 cure claims.
- **DELIVERABLES:** EV-1 claims register · EV-2 evaluation plan · EV-3 eval sets + runner · EV-4 AI evaluation report · EV-5 coordinate clinical review (human).
- **DEPENDENCIES:** A credentialed music therapist and an audiologist or OT (external).
- **RISKS:** Circular evaluation → independent red-team set.
- **ESTIMATED EFFORT:** 10 person-days, plus clinical reviewers.
