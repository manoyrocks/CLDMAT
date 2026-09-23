# Gate 0: Discovery & Evidence Mapping

- **Date:** 2026-09-23 · **Decision:** APPROVED (pre-approved by the product owner, ADR-0001)

| Gate criterion | Result | Evidence |
| --- | --- | --- |
| Every MVP feature traces to evidence | Met | `evidence/evidence_to_feature.md`; `npm run trace` passes (every MVP functional REQ cites a claim) |
| No excluded feature slipped in | Met | Scope audit, `evidence/evidence_to_feature.md` §2; ADR-0002 |
| Privacy approach approved | Met by pre-approval: local-first, no operator data collection in the MVP | `evidence/regulatory_map.md` |

**Phase 0 outputs:** claims register (`evidence/claims_register.json` and `.md`), evidence-to-feature traceability plus a generated matrix, persona research plan, risk register, regulatory map, requirements catalogue (`specs/requirements.json`), open questions.

**OUTSTANDING (human-only):** counsel review of the regulatory map (OQ-04); Evaluators to check primary full texts (OQ-09); persona research not yet run.

**Handoff:** Architects and Designers start Phase 1 from `specs/requirements.json`. Testers derive test cases from the REQ IDs.
