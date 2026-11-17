---
version: 2.0
name: EvntCult — Concourse
description: Campus life as a terminal. A calm white page, night navy for cinematic bands and primary actions, one crimson for the action that matters most, brass gold only as pass foil. Fraunces headlines, Figtree interface, JetBrains Mono for pass codes and timetable figures.
---

# EvntCult design system: Concourse

> Read this before touching UI. Tokens live in `tailwind.config.ts` and `src/app/globals.css`;
> primitives in `src/components/ui/*`; the shell in `src/components/site/*`. Use the tokens —
> never hard-code a colour, radius or shadow.

## 1. The idea

EvntCult already speaks the language of travel: you hold a **pass**, you walk through a
**gate**, someone **scans** you in. Concourse leans into that. Events "depart", the homepage
has a live **departures board**, passes are drawn as **boarding passes**, and the 404 is
"Gate 404". The metaphor is the product, not decoration — use it where it clarifies, never as
a pun on every screen.

References, taken as inspiration rather than copied:

| Reference | What we took |
|---|---|
| **Emirates** | Night navy with brass detail; the boarding pass; the departures board |
| **Airbnb** | One search bar that asks the real questions (what · when · kind); a category rail; artwork-led cards with facts underneath and no box around them |
| **Apple** | A calm white page, big confident headlines, one idea per section, cinematic dark bands |
| **Wispr Flow** | Warmth and a human voice: copy written like a person talking, a soft serif |

## 2. Colour

| Token | Hex | Use |
|---|---|---|
| `canvas` / `surface` | `#FFFFFF` | Page and cards |
| `sunken` | `#F4F5F7` | Wells, hovers, the footer |
| `mist` | `#EEF0F3` | Pressed/hover on sunken |
| `line` / `line-strong` | `#E5E7EB` / `#D2D6DC` | Hairlines, input borders |
| `ink` · `ink-2` · `ink-muted` · `ink-subtle` | `#14161B` · `#383D47` · `#5B626E` · `#6A717D` | Text, all ≥ 4.5:1 on white |
| `night` (`-2`, `-3`) | `#0B1626` | Primary buttons, the host/admin header, cinematic bands, the departures board |
| `accent` | `#D9234B` | The single most important action on a screen (Search, Register, Get your pass, Create event) |
| `gold` | `#C9A45C` | Pass foil and small labels on night only. Never for text on white. |
| `live` · `warn` · `danger` | `#0B7A54` · `#8A5300` · `#B42318` | Status, always with a word |

The header colour tells you where you are: **white while attending, night while hosting or in admin.**

## 3. Type

- **Fraunces** (upright, `SOFT 60`, optical size automatic) for every `text-display-*` size and `font-display`. Weight 500–600. Never italic.
- **Figtree** for everything else. Labels are sentence case and semibold — no uppercase mono eyebrows.
- **JetBrains Mono** only for pass codes, times on the departures board, and timetable-like figures.

## 4. Shape and depth

- Corners: buttons 9–12px, inputs 12px, cards 18px, large panels 26px. **No pill buttons.** Round shapes are for avatars, status dots and the notification badge.
- Depth comes from hairlines (`shadow-card` is a 1px ring). Shadows appear on interaction (`shadow-raised`, `shadow-float`) and on things that genuinely float (menus, dialogs, the pass, the board: `shadow-pop`).
- Event artwork (`EventArt`) is a flat travel-poster scene: sky, sun, three horizons. Each event gets its own composition from its id. Use `flat` on small tiles that carry text.

## 5. Motion

- 160ms for colour and hover, 240ms for layout, 420ms for big moves; easing `cubic-bezier(.16,1,.3,1)`.
- Page sections rise in (`animate-rise`, 24px, 900ms, staggered by 60ms).
- Departure times turn over like split-flap characters (`animate-flap`) once, on load.
- Everything respects `prefers-reduced-motion`.

## 6. Shell

- `SiteHeader`: one bar. Logo, the workspace's main links (current page gets a filled `sunken` block), command search (`Ctrl/⌘ K` or `/`), "Switch to hosting/attending", notifications, account menu.
- Phones: full-screen menu sheet and, when signed in, the `TabBar`.
- `SiteFooter`: sign-off line, the app, three link columns.
- Full-width bands inside the page column use the `.bleed` class.

## 7. Voice

Short, warm, specific. Say what happens ("Your pass is ready", "Scanned at the gate"), not what the
product "empowers". No invented testimonials or numbers: every figure on the homepage is live from
the database, and illustrations of the organizer view are labelled as examples.
