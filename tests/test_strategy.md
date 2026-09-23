# Test Strategy

Owner: Testers (QA) · Every test name includes the REQ ID it verifies, so `npm run trace` can link them.

## Levels

| Level | Tool | Scope | Gate |
| --- | --- | --- | --- |
| Unit | Vitest + v8 coverage | `packages/core` (**100% statements, branches, functions and lines, enforced**), `packages/content`, `packages/ai` (≥ 90% branches) | Gate 2 |
| Content | Vitest | Schema, compliance checker over the whole library, claim links | Gate 2 |
| AI eval | `npm run eval` | Sets in `evals/sets/`; targets in `evals/evaluation_plan.md` | Gate 3 |
| Integration / E2E | Playwright (Chromium, mobile viewport 390×844) | User journeys J1–J8; Child Mode; offline; privacy | Gate 2 |
| Audio safety | Playwright + `OfflineAudioContext` + engine test hooks | Ceiling, fade-in, no autoplay, stop latency, slew, exposure limits | Gate 3, **Critical** |
| Accessibility | axe-core (automated) + manual screen readers | WCAG 2.2 AA | Gate 3 (manual part OUTSTANDING) |
| Device matrix | Real devices (human lab) | iOS 16+, Android 10+ mid-range; speaker, wired, Bluetooth; SPL meter | OUTSTANDING (human) |

## Specialised suites (team prompt §8.4)

| Suite | Cases (IDs) | Pass criteria |
| --- | --- | --- |
| Audio safety | AS-01 ceiling under an overdriven source (offline render); AS-02 no `AudioContext` before a tap; AS-03 fade-in ≥ 500 ms in Child Mode; AS-04 Stop → gain ≈ 0 in < 200 ms; AS-05 repeated volume-up never exceeds the ceiling; AS-06 slew ≤ 6 dB/s; AS-07 exposure start ≤ −40, step ≤ 3, ceiling −18; AS-08 stop rules and lockout; AS-09 recordings normalised; AS-10 routes (speaker, wired, BT), human | 100%; any failure is Critical |
| Accessibility | A11Y-01 axe on 10 screens; A11Y-02 keyboard-only run of J2; A11Y-03 targets ≥ 48 px; A11Y-04 reduced motion by default; A11Y-05 screen reader, human | Zero serious or critical |
| Privacy and consent | PRV-T1 no writes before consent; PRV-T2 withdraw stops writes; PRV-T3 delete-all empties storage; PRV-T4 no third-party network requests; PRV-T5 export contains all entities; PRV-T6 retention purge | 100%; child-privacy failure is Critical |
| Offline | OFF-01 reload offline shows the app; OFF-02 Child Mode audio works offline; OFF-03 coach answers offline | 100% |
| Child Mode escape resistance | ESC-01 Back and Escape don't leave; ESC-02 a wrong gate answer stays; ESC-03 lockout after 3 failures; ESC-04 a correct answer exits; ESC-05 the Stop bar is on every child screen | 100% |
| Regression | The whole suite on every commit (CI) | Green |

## Defect severity
- **Critical:** any audio-safety or child-privacy defect, a banned claim in the UI, or a crisis message not escalated. Blocks release.
- **High:** a feature is broken with no workaround, or an accessibility blocker.
- **Medium:** a workaround exists. **Low:** cosmetic.
