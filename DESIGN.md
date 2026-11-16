---
version: 1.0
name: EvntCult — Paper, Ink & Signal
description: A light, editorial event product. Warm paper canvas, near-black ink, one vermilion signal colour, Geist type with mono ticket-stub labels and single serif accent words. Built so agents can extend any screen without drifting.
---

# EvntCult design system

> Agents: read this before touching UI. Tokens are implemented in `tailwind.config.ts` and
> `src/app/globals.css`; primitives in `src/components/ui/*`. Use them — never hard-code a
> colour, radius or shadow.

## 1. Brand synthesis — what we took, and from whom

EvntCult is campus tickets: a pass you carry, a gate you walk through, a night you remember.
The language combines the most transferable details of a handful of world-class products,
filtered through that ticket idea so it never reads as a clone of any of them.

| Source | Detail we extracted | How it shows up here |
|---|---|---|
| **Apple** | Restraint; one idea per section; huge, quiet headlines; photography-first heroes | Landing sections each make one point; display type up to 136px with nothing competing |
| **Stripe** | Editorial grids, precise hierarchy, colour used only to mean something | 12-col grid, mono eyebrows, accent only on live/primary signals |
| **Linear** | Hairline borders, dense-but-calm app surfaces, keyboard-first, tight tracking | 1px edges (`shadow-card`), sidebar app shell, `Ctrl K` search, `-0.03em → -0.05em` tracking |
| **Vercel** | Ink-black primary buttons, Geist + Geist Mono, numbers in mono | Every primary CTA is ink; counts, serials, prices and dates use tabular mono |
| **Raycast** | Command bar as the hub, crisp key caps, tactile pressed states | Header command search with `kbd` caps; buttons compress to 0.98 on press |
| **Framer** | Scroll reveals with long, soft settles | `<Reveal>`: 14px rise, 700ms, `cubic-bezier(.16,1,.3,1)`, staggered |
| **Airbnb** | Warm, human canvas; soft but never sloppy rounding | Paper `#F6F5F1` instead of clinical white; 20px cards, pill controls |

**EvntCult's own signatures** (keep these; they're what makes it unmistakable):
1. **The missing e** — the logo drops the e from "event" and puts a blinking vermilion caret in the gap.
2. **Ticket stubs** — perforated `ticket-cut` dividers, mono serials, date blocks.
3. **Mono eyebrows** — every section label is uppercase Geist Mono at 11px, like print on a ticket.
4. **Serif accent word** — one italic Instrument Serif word per headline, in ink (never coloured).
5. **Printed posters** — generated event art is flat ink-on-colour with grain, never glowing gradients.

## 2. Colour

| Token | Hex | Use |
|---|---|---|
| `canvas` | `#F6F5F1` | Page background (warm paper) |
| `surface` | `#FFFFFF` | Cards, inputs, menus |
| `sunken` | `#EEECE6` | Wells inside cards, skeletons, inactive tracks |
| `line` / `line-strong` | `#E4E1DA` / `#D1CDC4` | Hairlines, dividers, input borders |
| `ink` | `#111110` | Headlines, primary buttons, body emphasis (17.3:1) |
| `ink-2` | `#3B3A36` | Body copy (10.4:1) |
| `ink-muted` | `#62605A` | Secondary copy (5.8:1) |
| `ink-subtle` | `#6E6C66` | Meta, captions — only on canvas/surface (4.8:1) |
| `accent` | `#D93A12` | **Signal.** Live dots, caret, the one key CTA per screen. White text on it = 4.6:1 |
| `accent-ink` | `#B22F0D` | Accent as text on paper (5.8:1) |
| `accent-soft` | `#FBE9E2` | Accent tint backgrounds |
| `live` / `warn` / `danger` (+ `-soft`) | `#16734A` / `#8F5200` / `#B42619` | Status only, always with a word |

Rules: one accent per viewport region; no gradients on UI chrome; status is never colour-only.

## 3. Typography

- **Geist** (sans) for everything. Weights 400 / 500 / 600 only — contrast comes from size, not 800-weight shouting.
- **Geist Mono** for eyebrows, numbers, dates, serials, prices, key caps. Always tabular.
- **Instrument Serif italic** only via `<em>` inside headings — one word.

| Token | Size | Leading | Tracking |
|---|---|---|---|
| `display-2xl` | clamp(56→136px) | 0.90 | −0.05em |
| `display-xl` | clamp(44→96px) | 0.95 | −0.045em |
| `display-lg` | clamp(36→64px) | 1.00 | −0.04em |
| `display-md` | clamp(28→40px) | 1.05 | −0.035em |
| `h3` / `h4` | 22 / 17px | 1.2 / 1.3 | −0.025 / −0.015em |
| `lead` / `body` | 18 / 15px | 1.55 / 1.6 | −0.01 / −0.005em |
| `small` / `micro` | 13 / 11px | 1.45 / 1.3 | 0 / +0.08em (mono, uppercase) |

## 4. Space, grid, radius

- Container `max-w-shell` (1240px), gutter `clamp(16px, 4vw, 40px)`.
- Section rhythm `py-section` = clamp(72→136px) on marketing; app pages use 32/48px between blocks.
- 4px base unit; card padding 20/24/32px.
- Radius: **controls are pills** (`rounded-full`); fields `rounded-xl` (12px); tiles `rounded-tile` (14px); cards `rounded-card` (20px); hero panels `rounded-panel` (28px). Nothing else.

## 5. Depth

Hairline first, shadow second:
- `shadow-card` — 1px ink-6% ring + 1px drop. Default for every card.
- `shadow-raised` — hover state for clickable cards (+ `-translate-y-0.5`).
- `shadow-pop` — menus, dialogs, drawers.
- `shadow-button` / `shadow-accent` — inner top highlight on filled buttons.
- Glass only on the sticky header (`.glass`: paper 80% + blur + saturate).

## 6. Motion

- Easing `ease-out` = `cubic-bezier(.16,1,.3,1)`; `ease-spring` = `cubic-bezier(.34,1.56,.64,1)` for press release.
- Durations: `fast` 160ms (colour), `base` 240ms (hover lift), `slow` 420ms (drawers), 700ms (reveals).
- Animate only `transform` and `opacity`. Everything respects `prefers-reduced-motion`.
- Buttons: `active:scale-[0.98]`. Cards: lift 2px on hover. Arrows nudge 2px.

## 7. Components (src/components/ui)

- **Button / LinkButton** — `primary` (ink), `accent` (signal, one per screen), `secondary` (white + hairline), `ghost`, `soft`. Sizes `sm | md | lg`. `loading` shows a spinner and keeps width.
- **Card** — eyebrow + title + optional action link header.
- **Chip** — status badges; tones `neutral | accent | live | warn | danger | outline | dark | white`.
- **Field / Input / Textarea / Select** — label, hint, error wired with `aria-describedby` / `aria-invalid`.
- **Section / SectionHeader** — eyebrow, title, sub, actions.
- **Reveal** — scroll-triggered fade-up with `delay`.
- **EmptyState, Meter, Notice, Skeleton, EventArt, Avatars**.

## 8. Do / Don't

- ✅ Ink buttons for actions, accent for *the* action. ✅ Mono for every number. ✅ One serif word per headline.
- ❌ Purple/blue gradients, glows, neon. ❌ 700+ weights. ❌ New radii or shadows. ❌ Colour-only status. ❌ Centre-aligned body copy longer than two lines.

## 9. Agent prompt guide

"Build the screen with EvntCult's Paper, Ink & Signal system: canvas `#F6F5F1`, white cards with `shadow-card` and `rounded-card`, Geist headings at `display-*` sizes with tight tracking and one `<em>` serif word, mono `eyebrow` labels, ink-black primary pill buttons, and the vermilion accent only for live state or the single key action. Use the primitives in `src/components/ui`."
