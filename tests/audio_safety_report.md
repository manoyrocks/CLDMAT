# Audio-Safety Test Report: Phase 3 (updated after round 2)

Owner: Testers (QA) with Architects · Spec: `architecture/audio_safety_subsystem.md` · Date: 2026-09-23
Any failure in this suite is **Critical** and blocks release (team prompt §8.4).

## 1. Results

| ID | Requirement | Method | Result | Evidence |
| --- | --- | --- | --- | --- |
| AS-01 | REQ-SAF-01 ceiling | Real safety chain rendered in an `OfflineAudioContext`: a 440 Hz sine plus a 97 Hz square wave, pre-gain ×4 (+12 dB), session gain ×10 (+20 dB) | ✅ Child peak ≤ 0.2512 (−12 dBFS) and > 90% of the ceiling, so the test really drove the chain to the ceiling. Output is mono in Child Mode. Parent peak ≤ −6 dBFS | `audio-safety.spec.ts` AS-01 |
| AS-02 | REQ-SAF-02 no autoplay | `engine.started` checked after visiting 8 parent screens and 5 child screens with no tap | ✅ no `AudioContext` is created before a tap; the silent countdown also creates none | AS-02; journeys (countdown) |
| AS-03 | REQ-SAF-03 fade-in | Session gain sampled every 20 ms after the first drum tap in Child Mode | ✅ starts < 30% of target; < 60% at 150 ms; ≥ 95% at 750 ms; never above target | AS-03 |
| AS-04 | REQ-SAF-04 Stop < 200 ms | `pointerdown` on the Stop bar while a song plays; time until the session gain is < 0.001; 5 repetitions | ✅ **26.2 – 42.3 ms** (26.2, 30.1, 38.4, 42.2, 42.3) | AS-04 annotations |
| AS-05 | REQ-SAF-01, REQ-M4-03 | 20 volume-up presses in the Calm corner | ✅ level stops at −12 dBFS; the gain never exceeds the ceiling; the dots show 5/5 | AS-05 |
| AS-06 | REQ-SAF-07 slew limit | Four instant presses (−20 → −12 dB); gain read after 100 ms | ✅ gain < 90% of target at 100 ms, reaching the ceiling after about 1.3 s (6 dB/s) | AS-05/06; unit `rampDurationMs` |
| AS-07 | REQ-SAF-05 exposure limits | e2e: start level −45 dBFS; step +2 dB; one step per session; 20 h between steps. Unit: start ≤ −40, step ≤ 3, ceiling −18, tamper clamp | ✅ (after the DEF-001 fix) the measured exposure gain is ≤ −45 dBFS | AS-07 ×2; `exposure.test.ts` |
| AS-08 | REQ-SAF-06 stop rules | Child Stop → the next level is 2 steps lower (−49); distress 3 → stop; 2 consecutive stops → 24 h lock | ✅ | AS-07/08; unit |
| AS-09 | REQ-M3-03 recording normalisation | Unit test of `normalisationGain`; playback routed through the chain | ✅ maths; ⚠️ real microphone capture not exercised in headless tests | `policy.test.ts` |
| AS-10 | Routes: speaker, wired, Bluetooth | SPL meter on real devices | ⏳ **OUTSTANDING (human device lab)** | — |
| NFR-06 | Drum latency < 50 ms | Scheduling offset reported by `engine.hit()` (base latency + 5 ms lookahead) | ✅ **15 ms** in headless Chromium. ⚠️ Output latency on a mid-range Android WebView still needs measuring (spike T-SPIKE-1) | annotation |

## 1b. Round 2: measurements at the real output (after every safety layer)
An `AnalyserNode` tapped after the final clipper (`engine.outputPeak()`) now measures what actually reaches the speakers. Round 1 measured only the session gain.

| Test | Result |
| --- | --- |
| **Calibration (DEF-009 regression)** | Exposure **−46.0 dBFS** (plan −46); child drum **−26.0 dBFS** (plan ≤ −26) |
| Stress: maximum child volume, song plus 120 overlapping drum and bell hits | Peak **0.2510** vs ceiling 0.2512 (−12 dBFS): never exceeded |
| AS-09 caregiver recording (fake microphone) played in Child Mode | Peak 0.0501 (−26 dBFS = −6 normalisation + −20 volume) |
| L-03 exposure using the family's own recording | Peak 0.00501 (−46 dBFS at plan level −45, after −1 dBFS normalisation) |
| Full-scale recording at −40 / tampered request at +20 dBFS | −41 dBFS / capped at −19 dBFS (exposure ceiling −18, after −1 dBFS normalisation) |
| DEF-008 Stop during decode | No sound starts (playing = false, output peak 0) |
| Exposure 5-minute limit (fake clock) | Session auto-completes and is logged |
| Cold start, CPU throttled 4× | 142–146 ms to an interactive Today screen (budget 2 s) |

**DEF-009 (Critical, fixed):** the Web Audio compressor's automatic make-up gain raised every quiet level by about 8.5 dB. The chain is now L1 normalisation → L2 gain clamp → **L3 static soft-knee limiter** (unity below −15 dBFS in Child Mode) → L4 hard clipper.

## 2. Defence in depth: verified layers
- **L1:** synthesis peaks at −6 dBFS; built-in practice sounds are normalised to −1 dBFS before the session gain.
- **L2:** `clampDb` and `capDb`; 100% branch coverage.
- **L3:** static soft-knee limiter (`softLimitCurve`): unity gain below ceiling − 3 dB, smooth approach to the ceiling, no make-up gain. It replaced the compressor after DEF-009.
- **L4:** WaveShaper hard clip at the ceiling. AS-01 shows that L4 holds even when L1 and L2 are deliberately bypassed.

## 3. Critical defect found and fixed
**DEF-001:** exposure at −45 dBFS played at −36 dBFS. Root cause, fix and regression test are in `qa_report.md` §3 and the spec §4.2. This is exactly the class of bug the suite exists to catch.

## 4. Outstanding before the pilot
1. Real-device SPL measurements for each route and a calibration table (audiologist, OQ-01).
2. Sign-off of the provisional levels: −12 dBFS ceiling, −20 dBFS default, −45 dBFS exposure start, −18 dBFS exposure ceiling.
3. WebKit (iOS) run of AS-01 to AS-08.
