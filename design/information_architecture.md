# Information Architecture

```
Onboarding (first run only)
 ├─ Welcome + Disclaimer              REQ-M8-04
 ├─ Adult check → Consent             REQ-PRV-01
 ├─ Child profile                     REQ-PRV-03
 └─ Goals (optional)                  REQ-M6-01

PARENT MODE (bottom nav: Today · Activities · Sound · Goals · Learn)
 ├─ Today            suggested session, Start session, Child Mode button, Coach entry     REQ-AI-01
 │   └─ Session player (cue cards) → Session log                                          REQ-M2-01, REQ-M2-02, REQ-M2-03
 ├─ Activities       by goal → Activity detail (steps, pause prompt, tier, example ▶)     REQ-M1-01, REQ-M1-02, REQ-M1-03, REQ-M1-04
 │   └─ Routines     routine list → routine (visual schedule, song ▶, record my voice)    REQ-M3-01, REQ-M3-02, REQ-M3-03
 ├─ Sound            Toolkit hub                                                          REQ-M5-*
 │   ├─ Sound diary → Patterns
 │   ├─ Countdown (also in Child Mode)
 │   ├─ Too-loud card
 │   ├─ Graded practice (exposure planner)
 │   └─ Strategies + "See an audiologist / OT"
 ├─ Goals            goals, daily log, 8–12 week review, export                           REQ-M6-*
 ├─ Learn            evidence tiers · interventions · unverified therapies ·
 │                   red-flag checker · choosing a music therapist                        REQ-M8-*, REQ-M9-01
 ├─ Coach            chat (from Today and Learn)                                          REQ-AI-02, REQ-AI-03, REQ-AI-04, REQ-AI-05
 └─ Settings (header gear)  privacy (consent, export, delete) · accessibility · audio     REQ-PRV-*, REQ-NFR-01

CHILD MODE (no nav bar; Stop bar on every screen; exit only through the parental gate)
 ├─ Home: Drum · Shaker · Songs · Calm · My day · Countdown                               REQ-M7-01
 ├─ Drum / Shaker (instrument pads)
 ├─ Songs (picture choice → play)
 ├─ Calm corner (child playlist, sway visual, child volume)                               REQ-M4-01, REQ-M4-02, REQ-M4-03
 ├─ My day (visual schedule for the current routine, song ▶)                              REQ-M3-02
 └─ Countdown (3-2-1 visual, silent)                                                      REQ-M5-03
```

Card-sort validation of the Parent Mode labels is part of the persona research plan (OUTSTANDING).
