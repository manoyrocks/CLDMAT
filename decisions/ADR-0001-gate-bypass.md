# ADR-0001: Phases 0–3 run with pre-approved gates

- **Status:** Accepted (2026-09-23)
- **Context:** The team prompt (§2.9, §7) requires a human product-owner sign-off at each gate. It also allows a gate to be bypassed "if human say so". The product owner told the team to "proceed to phase 0 to 3 with pre-approved gates".
- **Options:** (a) stop at Gate 0 and wait; (b) run Phases 0–3 with every gate pre-approved and log each one; (c) run only the agent-doable parts.
- **Decision:** (b). Each gate is recorded in `decisions/gate-N.md` with the criteria check. Any criterion that **only a human can meet** (clinical review by a credentialed music therapist, audiologist sign-off, caregiver or autistic-adviser testing, real-device audio-route measurement, legal review) is marked **OUTSTANDING**. It is not reported as met.
- **Consequences:** Code exists before the human safety-design review. Gate 4 (pilot) **must not start** until every OUTSTANDING item in gates 1–3 is closed; this is recorded as risk R-20. The Phase 0–1 rule "no production code until Gate 1" is met in order: the Gate 1 record is committed before any Phase 2 code.
