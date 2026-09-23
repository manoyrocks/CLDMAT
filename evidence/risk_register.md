# Risk Register

Owner: all roles; clinical and safety risks are decided by Evaluators. Score = Likelihood (1–5) × Impact (1–5). Reviewed at every gate.

| ID | Risk | L | I | Score | Mitigation | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R-01 | Audio too loud for a sound-sensitive child (sudden peak, route change, user error) | 3 | 5 | 15 | Deterministic ceiling + limiter + fade-in + slew limit (REQ-SAF-01/03/07); 100% branch-covered tests; route-specific device tests | Architects / QA | Mitigated in code; device-route tests open (Phase 3) |
| R-02 | Graded exposure causes distress | 3 | 5 | 15 | Caregiver-present gate, +3 dB steps, ceiling 6 dB under child cap, stop rules, 24 h lockout (REQ-M5-05, SAF-05/06) | Evaluators | Mitigated in code; clinical review pending |
| R-03 | App or AI implies a cure or reduction in core severity | 3 | 5 | 15 | Claims register, banned-term checker on content and AI output, refusal templates, zero-tolerance eval | Evaluators | Mitigated; eval 100% |
| R-04 | Coach gives clinical advice (diagnosis, medication) | 3 | 4 | 12 | Deterministic pre-classifier + refusal; grounded-only answers; LLM output post-check | Architects / Evaluators | Mitigated |
| R-05 | Coach misses a crisis or safeguarding signal | 2 | 5 | 10 | Crisis lexicon runs first; region crisis lines; recall-weighted eval set; human escalation copy | Evaluators | Mitigated for the lexicon; needs a clinical safeguarding review |
| R-06 | Prompt injection through user text or content | 3 | 3 | 9 | Rules outside the model; passages marked as data; output validated against allowed citation IDs | Architects | Mitigated |
| R-07 | Child-data breach | 2 | 5 | 10 | Local-only MVP; no third-party SDKs; data minimisation; delete-all | Architects | Mitigated for MVP |
| R-08 | Consent not "verifiable" under COPPA for cloud features | 3 | 4 | 12 | MVP has no data collection by the operator (all on device); VPC method to be chosen before sync (OQ-03) | Product owner | Open |
| R-09 | Classified as a medical device (SaMD) in a launch region | 2 | 4 | 8 | Wellness and education intended-use statement; no diagnosis or treatment claims; regulatory review per region | Product owner | Open (counsel) |
| R-10 | Child escapes Child Mode and changes settings | 3 | 3 | 9 | Parental gate (hold + adult challenge); Back and Escape trapped; OS-level guided access recommended | Designers / QA | Mitigated in app; OS pinning is guidance only |
| R-11 | Visual overstimulation (flashing, motion) | 2 | 4 | 8 | Design tokens; reduced motion by default; no animation over 3 Hz; lint for keyframes | Designers | Mitigated |
| R-12 | Caregiver burden and low engagement | 4 | 3 | 12 | 30-second logs; 10-minute sessions; no streak shaming | Designers | Mitigated in design; pilot measures it |
| R-13 | Evidence drift (new trials change tiers) | 3 | 3 | 9 | Review dates on content; compliance checker blocks items past their review date | Evaluators | Mitigated |
| R-14 | Cultural mismatch of songs (SG, PH) | 3 | 3 | 9 | Strings externalised; caregivers record their own voice; regional song packs in phase 2 of localisation | Designers | Open |
| R-15 | Web-audio latency on low-end Android over 50 ms | 3 | 2 | 6 | Pre-scheduled synthesis; latency hint "interactive"; spike measured (see tests/audio_safety_report.md) | Developers | Partly verified (headless only) |
| R-16 | Browser or OS volume outside app control | 5 | 4 | 20 | In-app ceiling in dBFS is the only guarantee; SPL cannot be guaranteed without calibration; onboarding notice (REQ-SAF-10); native wrapper to read route and volume | Architects | **Open, needs native layer and audiologist** |
| R-17 | Agents invent clinical facts | 2 | 5 | 10 | Claims-register-only content; open questions logged instead of guessing | All | Mitigated |
| R-18 | Stimming framed as a target | 2 | 3 | 6 | Goal templates reviewed; banned "normalise"; microcopy guide | Evaluators | Mitigated |
| R-19 | Recorded caregiver voice played too loud | 2 | 4 | 8 | Recordings are normalised on save and routed through the Child Mode chain | Developers | Mitigated |
| R-20 | Gate bypass (pre-approval) hides unfinished human reviews | 3 | 4 | 12 | Gate records list every human-only item as OUTSTANDING; Gate 4 pilot cannot start until they close | Product owner | Open, tracked |
