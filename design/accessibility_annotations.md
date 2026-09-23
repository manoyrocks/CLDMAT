# Accessibility Annotations (WCAG 2.2 AA) — REQ-NFR-01, REQ-NFR-02

| Area | Annotation | WCAG |
| --- | --- | --- |
| All screens | One `<h1>` per screen; landmarks (`header`, `main`, `nav`); a skip link in Parent Mode | 1.3.1, 2.4.1 |
| Focus | Visible 3 px focus ring; focus moves to the `<h1>` on screen change; no focus traps except the parental-gate dialog, which is dismissible | 2.4.3, 2.4.7, 2.4.11 |
| Targets | ≥ 48 dp (exceeds the 24 px minimum); child cards ≥ 120 dp | 2.5.8 |
| StopBar | `button` with `aria-label="Stop all sound"`; reachable first in tab order; works on keyboard Space and Enter | 2.1.1, 4.1.2 |
| PictureCard | `button` with an accessible name = label; `aria-pressed` for selection; the icon is `aria-hidden` | 1.1.1, 4.1.2 |
| Parental gate hold | Press-and-hold has a keyboard alternative (hold Space or Enter for 2 s) and a screen-reader alternative ("Open grown-ups check" button inside Parent Mode settings) | 2.5.1, 2.5.7 |
| Countdown | Silent; announces "3", "2", "1" through an `aria-live="polite"` region; digits are ≥ 96 px | 1.3.3, 4.1.3 |
| Session timer | Not a time limit; the user can pause or extend; no auto-advance | 2.2.1 |
| Motion | Reduced motion by default; honours `prefers-reduced-motion`; the sway visual has a pause toggle | 2.3.3, 2.2.2 |
| Flashing | None. No animation cycles faster than 0.25 Hz | 2.3.1 |
| Colour | Tier chips and selections use icon + text as well as colour | 1.4.1 |
| Contrast | Text ≥ 4.5 : 1 (tokens table); UI components ≥ 3 : 1 | 1.4.3, 1.4.11 |
| Text scale | 100–130% in-app plus browser zoom to 200% without loss; reflow at 320 px | 1.4.4, 1.4.10 |
| Forms | Every input has a visible `<label>`; errors in text next to the field | 3.3.1, 3.3.2 |
| Audio | No autoplay; every sound starts from a user tap; Stop is always available | 1.4.2 |
| Dyslexia | Optional font stack, 1.5 line height, left-aligned text, no justified text | Best practice |

Automated check: axe-core runs in Playwright on every main screen (`apps/web/e2e/a11y.spec.ts`), with zero serious or critical violations allowed. Manual screen-reader testing (VoiceOver, TalkBack) on devices is **OUTSTANDING (human)**.
