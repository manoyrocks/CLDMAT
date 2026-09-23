# ADR-0004: Technology stack

- **Status:** Accepted (pre-approved Gate 1, ADR-0001). `TECH_STACK`: Architects propose it; humans approve.
- **Context:** We need iOS and Android, a web portal for therapists later, an offline-first design, deterministic safety logic with exhaustive tests, and precise audio scheduling (drum latency under 50 ms).

| Option | Pros | Cons |
| --- | --- | --- |
| **A. TypeScript monorepo: React PWA + Capacitor shells** | One codebase for mobile and the therapist portal; the Web Audio API allows sample-accurate scheduling and an `OfflineAudioContext` to test the safety chain; Playwright testing in CI; fast iteration | WebView audio latency on low-end Android; native route and volume need a plugin |
| B. React Native (Expo) + a separate web portal | Native audio APIs; native feel | Two UI codebases; audio-safety chain harder to test offline; heavier CI |
| C. Flutter | Performance; one codebase | Web portal is weaker; smaller audio ecosystem; the team would need Dart |

- **Decision:** **A.** TypeScript 5, React 18, Vite 5, Vitest (coverage via v8), Playwright, and axe-core for accessibility. The safety core is framework-free TypeScript, so it can be reused unchanged in a native module or on a server.
- **Consequences:** Spike T-SPIKE-1 measures scheduling latency (see `tests/audio_safety_report.md`). If real-device latency on mid-range Android is over 50 ms, the drum pad moves to a native audio plugin behind the same `AudioEngine` interface.
