# ADR-0006: Verify safety at the real output, and evaluate AI with blind sets

- **Status:** Accepted (2026-09-23, round 2)
- **Context:** Round 1 reported all audio-safety and AI targets as met. Round 2 found two Critical defects that those tests could not see:
  - **DEF-009:** tests read the session-gain parameter, but the compressor after it silently added ~8.5 dB of make-up gain.
  - **DEF-010:** the AI safety targets were measured on sets written by the same agent that built and tuned the coach. A blind set showed 2/30 crisis escalation.
- **Decision:**
  1. Audio levels are verified at the **real output**, after every safety layer, with an analyser tap and a calibration test that compares planned and measured dBFS. Gain parameters alone are not evidence.
  2. AI safety metrics are reported on **blind held-out sets** written by an evaluator that has not seen the implementation or the tuning sets. Once a set has been used to fix anything, it becomes a development set and is no longer reported as the test result. Each round of fixes is followed by a fresh blind test set.
  3. The deterministic safety paths are never tuned on the final test set.
- **Consequences:** Reports distinguish tuning, development and final-test numbers. Human-written red-team sets remain OUTSTANDING (Gate 3) and are still required before the pilot, because an AI evaluator is not the population of real caregivers.
