# Sensory-Friendly Design System

Owner: UX/UI Designers · Implements REQ-NFR-01, REQ-NFR-02, REQ-SAF-04, REQ-M7-01. Tokens live in `apps/web/src/styles/tokens.css`.

## 1. Principles
1. **Calm by default:** a muted palette, low contrast *between surfaces* but AA-or-better contrast for text, and no pure black on pure white.
2. **Still by default:** `reducedMotion = true` at install. With motion on, the only animation is slow easing (≥ 4 s cycles for the sway visual). Nothing flashes: no element changes luminance more than 3 times per second, ever.
3. **Predictable:** the same layout on every screen. In Parent Mode: header → content → bottom nav. In Child Mode: Stop bar → a 2×2 or 2×3 card grid.
4. **Big and forgiving:** touch targets ≥ 48 × 48 dp (child cards ≥ 120 dp), 8 dp minimum spacing, and no gestures other than tap (plus the one press-and-hold on the parental gate).
5. **No surprise sound:** tapping a card never plays sound unless the card is labelled with a speaker icon.

## 2. Tokens

| Token | Light value | Use | Contrast on `--bg` |
| --- | --- | --- | --- |
| `--bg` | `#F6F4EF` (warm off-white) | Page | — |
| `--surface` | `#FFFFFF` | Cards | — |
| `--ink` | `#2E3A3F` | Body text | 10.6 : 1 |
| `--ink-muted` | `#55626A` | Secondary text | 5.7 : 1 |
| `--primary` | `#3D6B7A` (muted teal) | Buttons, links | 5.3 : 1 |
| `--primary-ink` | `#FFFFFF` | Text on primary | 5.9 : 1 |
| `--calm` | `#DCE8E4` (sage) | Calm Corner surfaces | — |
| `--warm` | `#F3E3CF` (sand) | Routine cards | — |
| `--stop` | `#8C3B3B` (muted brick, not alarm red) | Stop / Too Loud bar | 7.5 : 1 with white |
| `--focus` | `#1F5FAF` 3 px outline + 2 px offset | Keyboard focus | ≥ 3 : 1 |
| Tier chips | Verified `#2F6B4F`, Emerging `#7A5B1E`, Unverified `#6B3A5B`, on tinted backgrounds `#E3EFE8` / `#F5EAD3` / `#F0E3EC` | Evidence tier labels | All ≥ 5.0 : 1 (checked by script) |

Type: system UI font at 17 px base and line height 1.5. Optional dyslexia-friendly stack: "Atkinson Hyperlegible", "OpenDyslexic", "Comic Sans MS", then sans-serif. The font is never downloaded from a CDN; the stack falls back to system fonts. Scale options: 100%, 115% and 130%.

Spacing uses a 4 dp grid (4, 8, 12, 16, 24, 32). Radius is 12 dp for cards and 999 for chips.

## 3. Components

| Component | Spec |
| --- | --- |
| **StopBar** (REQ-SAF-04) | Fixed to the top of every Child Mode screen; full width, 72 dp tall, `--stop` background; label "Stop – too loud" with a hand icon; a `pointerdown` handler; `aria-label="Stop all sound"`. Pressing it silences audio and shows the calm "Quiet now" card |
| **PictureCard** (REQ-M7-01) | A ≥ 120 dp square with an SVG pictogram (2 px strokes, flat fills from the tokens), a one-word label under it, and an accessible name. The selected state has a thick border and a check icon (colour is never the only cue) |
| **GrownUpsButton** | Small, low-contrast corner button in Child Mode; press and hold for 2 s shows a progress ring, then opens the adult challenge |
| **CueCard** | Large text caregiver prompt ("Pause… wait 5–10 seconds"); a single primary action "Next" |
| **TierChip** | Tier name + icon (✓ Verified, ◐ Emerging, ✕ Unverified) + optional "clinical consensus" sub-label |
| **VolumeControl** | − / + buttons in 3 dB steps (no slider for children, which avoids a big jump from one drag); shows the level as 1–5 dots; the maximum dot equals the ceiling |
| **Scale04** | Five large buttons (0–4) with word anchors (Not yet · With lots of help · Sometimes · Often · On their own) |
| **Disclaimer** | Plain panel with D-001 text, never collapsed on first view |

## 4. Pictograms
Pictograms are drawn in-house as inline SVG (drum, shaker, bells, song, calm, routine, countdown, stop hand, teeth, bath, tidy, shoes and door, bed, food). They use no copyrighted symbol sets. A PCS or ARASAAC licence for richer AAC symbols is a later option (ARASAAC is CC BY-NC-SA and needs a licence review).
