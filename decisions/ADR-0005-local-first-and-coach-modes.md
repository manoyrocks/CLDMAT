# ADR-0005: Local-first MVP, and an offline-extractive default coach

- **Status:** Accepted (2026-09-23)
- **Context:** Children's health-adjacent data is covered by the privacy laws in `evidence/regulatory_map.md`. The coach must be grounded and must never make cure claims. No LLM credentials are provisioned in this environment (OQ-11).
- **Decision:**
  1. The MVP stores everything on the device. The operator receives no personal data, so the COPPA and PDPA collection duties that come with an account do not arise until sync (OQ-03).
  2. By default the coach runs in **grounded-extractive mode**: it returns approved passages verbatim, with citations, after the deterministic safety pipeline. **LLM mode** (Claude through a backend proxy) is opt-in and behind a setting. Its output passes the same post-checks, and on failure the extractive answer replaces it.
- **Consequences:** The coach's answers are less conversational offline, but they cannot hallucinate. The AI evaluation report covers extractive mode. LLM mode needs its own eval run with live credentials before it is enabled for users (Gate 3 OUTSTANDING item).
