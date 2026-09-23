# ADR-0002: How to read principle 2.3 (excluded therapies)

- **Status:** Accepted (2026-09-23). Evaluators decide clinical and safety matters (§9.4).
- **Context:** Principle 2.3 is garbled: "May Build these Auditory Integration only as experimental/education and unveried, Tomatis-style filtering, binaural beats, '432 Hz / Solfeggio' frequencies, or 'healing' sound features. Education content may explain why these are unverified." It could mean either (i) education content only, or (ii) an experimental feature labelled unverified.
- **Options:** (i) education only; (ii) an experimental feature behind a flag.
- **Decision:** (i). These therapies appear **only as education content labelled Unverified** (M8). The audio engine has no filtering, modulation, per-ear frequency offset, or alternative-tuning capability, and the content schema rejects such fields.
- **Rationale:** Option (ii) would deliver an intervention the sub-study rates Unverified (§5) to children. That conflicts with the evidence-fidelity principle (2.1) and the child-safety principle (2.4).
- **Consequences:** If the product owner wants option (ii) later, it needs a new ADR, Evaluator approval, an ethics review and a separate research build. The consumer app will not get it.
