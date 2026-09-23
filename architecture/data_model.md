# Data Model (local-first, minimised)

Owner: Agent Architects · Implements REQ-PRV-03, REQ-PRV-04, REQ-PRV-07, REQ-PRV-08

All records live on the device under one namespaced store (`harmony.v1`). Recordings go in IndexedDB. **Never stored:** child's full name, birth date, photos, diagnosis, location, contact details, device identifiers.

| Entity | Fields | Retention | Notes |
| --- | --- | --- | --- |
| `ConsentRecord` | `status` (none / granted / withdrawn), `version`, `grantedAt`, `withdrawnAt?`, `adultGatePassed` | Life of the install | Required before any other write |
| `ChildProfile` | `nickname` (≤ 20 chars), `ageBand` (2–4 / 5–7 / 8–12), `communication` (speaking / some-words / minimally-verbal), `likedActivityIds[]`, `dislikedActivityIds[]`, `calmPlaylist[]` | Until deleted | One per install in the MVP |
| `Settings` | `reducedMotion` (default true), `dyslexiaFont`, `textScale`, `parentVolumeDb`, `childVolumeDb`, `llmCoachEnabled` (default false), `region`, `headphoneNoticeSeen` | Until deleted | — |
| `Goal` | `id`, `templateId`, `label`, `baseline` (0–4), `target` (0–4), `createdAt`, `active` | 365 d after it is archived | 1–3 active |
| `GoalLog` | `goalId`, `date`, `score` (0–4), `note?` (≤ 140) | 365 d | — |
| `SessionLog` | `id`, `date`, `activityIds[]`, `minutes`, `together` (bool), `engagement` (0–3) | 365 d | Participation, not performance |
| `SoundDiaryEntry` | `id`, `at`, `soundType`, `place`, `loudness` (1–3), `reaction` (0–4), `predictable` (bool) | **90 d** | — |
| `ExposurePlan` | `id`, `soundId`, `currentLevelDb`, `stepDb`, `lastStepUpAt?`, `consecutiveStops`, `lockedUntil?` | 365 d | State is owned by `core/exposure` |
| `ExposureSession` | `planId`, `startedAt`, `endedAt`, `levels[]`, `distress[]`, `outcome` (completed / stopped-child / stopped-distress) | 365 d | — |
| `Recording` | `routineId`, `blob` (IndexedDB), `peakNormalisedDb` | Until deleted | Normalised on save |
| `AuditEvent` | `seq`, `at`, `type`, `data` (allow-listed keys only), `prevHash`, `hash` | 730 d | No PII. Any key outside the allow-list is rejected |

**Export (REQ-PRV-08):** a JSON file of every entity except recording blobs, which are listed by ID. **Delete all:** clears localStorage and IndexedDB and appends a `data.deleted` audit event to a fresh log.
