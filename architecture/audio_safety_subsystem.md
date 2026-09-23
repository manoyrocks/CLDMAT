# Audio-Safety Subsystem Specification (highest-integrity component)

Owner: Agent Architects · Reviewers: Evaluators, QA, audiologist consultant (OUTSTANDING, OQ-01)
Implements: REQ-SAF-01, REQ-SAF-02, REQ-SAF-03, REQ-SAF-04, REQ-SAF-05, REQ-SAF-06, REQ-SAF-07, REQ-SAF-09, REQ-M4-03, REQ-M5-05

## 1. Principles
1. **Deterministic, no AI:** every number below lives in `packages/core/src/audio/policy.ts` and is unit-tested with 100% branch coverage.
2. **Defence in depth:** four independent layers must *all* fail before a child hears more than the ceiling.
3. **Fail quiet:** any error in the audio path mutes the output. Nothing is ever skipped.
4. **User-initiated only:** the `AudioContext` is created lazily inside a user-gesture handler. No module creates one at import time.

## 2. Signal chain

```
source(s) ──► voice gain (per-sound fade-in) ──► session gain (user volume, slew-limited, ≤ ceiling)
          ──► soft-knee limiter (static WaveShaper curve: unity gain below ceiling − 3 dB; no make-up gain)
          ──► hard clipper (WaveShaper: clamps every sample to ±ceilingLinear)
          ──► mono downmix (Child Mode) ──► destination
```

| Layer | What it protects against | Guarantee |
| --- | --- | --- |
| L1 content normalisation | Loud source files or synthesis | Synthesised voices peak at ≤ −6 dBFS pre-gain; recordings are peak-normalised to −6 dBFS at playback (REQ-M3-03) |
| L2 session gain clamp | User sets the volume too high; a bug requests a high gain | `clampDb()` and `safeGain()` never return more than the mode ceiling |
| L3 soft-knee limiter | Transient build-up from overlapping voices | Smooth limiting towards the ceiling with **unity gain below the knee**. It replaced a `DynamicsCompressorNode`, whose automatic make-up gain added ~8.5 dB to every quiet level (DEF-009) |
| L4 hard clipper | Everything upstream failing | **No sample reaching the destination exceeds the ceiling.** This is verified by an offline render test with a +20 dB overdriven source |

## 3. Parameters (provisional until audiologist sign-off, OQ-01)

| Parameter | Child Mode | Parent Mode |
| --- | --- | --- |
| Output ceiling (peak) | **−12 dBFS** | −6 dBFS |
| Default volume | −20 dBFS | −14 dBFS |
| Minimum fade-in (session gain, from silence or after Stop) | 500 ms | 250 ms |
| Max volume increase rate | +6 dB/s | +12 dB/s |
| Volume decrease | Immediate (20 ms ramp) | Immediate |
| Stop / Too Loud latency budget | < 200 ms to silence (implementation target: 30 ms ramp) | Same |
| Channel mode | Mono downmix (no per-ear differences, which also prevents binaural content; ADR-0002) | Stereo allowed |

dBFS cannot be converted to SPL without knowing the device, route and system volume (risk R-16). The MVP therefore also shows a headphone safety notice (REQ-SAF-10) and recommends volume-limited children's headphones (≤ 85 dB). The native wrapper (Phase 4+) will read the output route and system volume and apply per-route offsets.

## 4. Graded-exposure rules (REQ-M5-05, REQ-SAF-05, REQ-SAF-06)

| Rule | Value |
| --- | --- |
| Precondition | The caregiver confirms "I am with my child" at the start of each exposure session; the plan is not locked; consent is granted |
| Start level (first session) | −45 dBFS (must be ≤ −40) |
| Step size | +2 dB default, configurable up to a **maximum of +3 dB** |
| Step-ups per session | At most one, and only after a distress check-in rated 0–1 |
| Minimum time between step-ups | 20 hours |
| Exposure ceiling | Child ceiling − 6 dB = **−18 dBFS** |
| Distress check-in | Required at every level before a step-up is offered; scale 0 (calm) – 4 (very distressed) |
| Stop rule A | The child presses Stop / Too Loud → immediate silence; the session ends |
| Stop rule B | The caregiver rates distress ≥ 3 → immediate silence; the session ends |
| After a stop | The next session starts **two steps lower** (not below −60 dBFS) |
| Lockout | Two consecutive stopped sessions → the plan locks for 24 h, with advice to contact the OT or audiologist |
| Session length | Maximum 5 minutes of exposure audio, then an automatic fade-out |

### 4.1 Fade-in semantics (clarified in Phase 2)
REQ-SAF-03 is applied to the **session gain**. Whenever sound starts after at least 1 s of silence, or after any Stop, the whole output ramps from zero over the mode minimum (500 ms in Child Mode). While a child is actively tapping an instrument, each individual hit keeps a short 5–30 ms attack, so the drum still sounds like a drum; the burst as a whole always starts from silence. Graded exposure always fades in from zero to its own level and silences any other voice first.

### 4.2 Level clamping rules (defect DEF-001, fixed in Phase 2)
- **User volume** is clamped into [floor, ceiling] (`clampDb`).
- **Explicit exposure levels** are only ever clamped **down**: `min(level, exposure ceiling, mode ceiling)`, with −60 dBFS as the minimum. An early build clamped exposure through the user-volume floor (−36 dBFS), so a −45 dBFS step played 9 dB too loud. The e2e test AS-07 caught this before release; see `tests/qa_report.md`.
- While exposure audio plays, the volume buttons cannot raise the level (`exposureActive` lock).

### 4.3 Measuring at the output
Levels are verified with an `AnalyserNode` tapped after the final clipper (`engine.outputPeak()`), never only by reading gain parameters. A calibration e2e test asserts that the planned and measured levels match.

## 5. Stop path (REQ-SAF-04)
`engine.stopAll()` is synchronous. It (1) cancels scheduled values on the session gain, (2) ramps to 0 over 30 ms, (3) stops and disconnects all sources at +60 ms, and (4) records `performance.now()` deltas for tests. The Stop control is a native `<button>` fixed at the top of every child-facing screen. It has a `pointerdown` handler, which fires before `click`, and responds to the keyboard.

## 6. Verification
- Unit: `packages/core/src/audio/*.test.ts` (100% branches).
- Offline render: `apps/web/e2e/audio-safety.spec.ts` renders the real chain in an `OfflineAudioContext` and checks peak ≤ ceiling.
- End-to-end: no `AudioContext` before the first tap; fade-in shape; Stop to silence under 200 ms; Child Mode gain never above the ceiling after repeated volume-up presses.
- Device routes (speaker, wired, Bluetooth) with an SPL meter: **OUTSTANDING (human, Phase 3 device lab)**.
