# AI Agent Contracts

Owner: Agent Architects · Evaluators hold the eval sets (`evals/`). All agents are **advisory**. None can change safety state, consent, volume, exposure level, or data retention.

## A1. Activity Recommender (REQ-AI-01)
| Field | Contract |
| --- | --- |
| Purpose | Suggest 2–4 next activities for a session |
| Inputs | Child profile (age band, communication level), active goals, recent session logs, liked and disliked activity IDs, time budget |
| Tools | Read-only access to the activity library |
| Method | Deterministic scoring: goal match +3, age fit +2 (hard filter if outside the band), communication fit +1, liked +2, disliked −5, done in the last 2 days −1 (variety), fits the remaining time. Ties are broken by ID. No LLM |
| Outputs | `{activityId, reasons[]}[]`; each ID must exist in the library; the total duration is 10–15 min when the library allows |
| Refusals | Never outputs free-text clinical advice |
| Escalation | None needed |
| Eval set | `evals/sets/recommender.json`: library-only 100%, explanations 100%, goal alignment ≥ 90% |

## A2. Caregiver Coach, chat (REQ-AI-02 to REQ-AI-05, REQ-AI-08)
| Field | Contract |
| --- | --- |
| Purpose | Answer "how do I…" questions about the activities and sound strategies |
| Inputs | The caregiver's question (≤ 500 characters) and the region code. **No child profile or logs** are sent to any model |
| Knowledge | Approved passages only (`packages/content/src/knowledge.ts`), each tied to claim IDs |
| Pipeline (fixed order) | 1. **Crisis and safeguarding detector** (lexicon) → escalation template with regional emergency and crisis numbers; stop. 2. **Injection detector** → restate scope; stop. 3. **Banned-category classifier**: diagnosis, medication or supplements, cure or recovery → approved refusal template quoting D-001; stop. 4. **Caregiver-distress detector** → a supportive line and respite resources, then continue. 5. **Retrieval** (BM25 over passages); below the threshold → "I don't have approved guidance on that" plus a clinician referral. 6. **Compose**: offline extractive mode (default), or LLM mode (opt-in). 7. **Post-check**: no banned terms; ≥ 1 citation; citations ⊆ retrieved IDs; no dosage patterns; ≤ 180 words. On failure, use extractive mode |
| Outputs | `{kind: answer / refusal / escalation / unknown, text, citations[], disclosure}` |
| Disclosure | Every response carries "I'm an AI helper, not a clinician." |
| LLM mode | System prompt holds the rules; passages are wrapped in `<passage id=…>` as *data*; the model must cite IDs. Model: Claude via a backend proxy (OQ-11). The model has no tools |
| Refusals | Diagnosis, medication, dosage, supplements, cure or recovery, legal questions, anything outside approved content |
| Escalation | Crisis → emergency and crisis lines (region table in content, OQ-12). Suspected abuse → safeguarding resources |
| Eval set | `evals/sets/coach.json`: grounded ≥ 95%; refusal 100%; crisis escalation 100%; injection resistance 100%; cure claims 0; disclosure 100% |

## A3. Progress Summariser (REQ-AI-06, REQ-M6-03)
| Field | Contract |
| --- | --- |
| Purpose | Turn 8–12 weeks of logs into a plain-language review |
| Inputs | Goals, goal logs, session logs, date range |
| Method | Deterministic templates. For each goal: mean of first 14 days vs last 14 days, day count, and trend word (≥ +0.5 "higher", ≤ −0.5 "lower", otherwise "about the same"). Fewer than 6 logs in either window → "not enough logs to compare". Never says "improved autism", "better", or anything causal |
| Outputs | Editable text plus a raw-count table that is always included; the D-001 disclaimer is always appended |
| Refusals | Never attributes change to the app; always adds "Many things affect day-to-day change" |
| Eval set | `evals/sets/summariser.json`: no overstatement 100%, raw counts 100%, banned terms 0 |

## A4. Content Compliance Checker, internal (REQ-AI-07, REQ-NFR-05)
| Field | Contract |
| --- | --- |
| Purpose | Block publication of non-compliant content |
| Inputs | A content item (activity, routine, education entry, knowledge passage) |
| Checks | Banned terms (negation is allowed only in approved-negation items); required fields (version, source sections, claim IDs that exist, tier, reviewer, review date); review date ≤ 365 days old; forbidden audio fields (`tuningHz`, `binaural`, `filter`, `modulation`); tier matches the tiers of the cited claims |
| Outputs | `{status: pass / blocked, violations[], warnings[]}`. Publishing needs `pass` **and** a recorded Evaluator approval |
| Eval set | `evals/sets/compliance.json`: seeded violations detected 100%, false blocks on the clean library 0 |
