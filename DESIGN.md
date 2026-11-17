---
version: 3.0
name: EvntCult — Marketplace
description: A browse-first event marketplace. White pages, #222 text, soft grey hairlines, covers doing the talking, one red for the action that matters. Figtree only; JetBrains Mono for pass codes.
---

# EvntCult design system

> Read this before touching UI. Tokens live in `tailwind.config.ts` and `src/app/globals.css`;
> primitives in `src/components/ui/*`; the shell in `src/components/site/*`; browse pieces in
> `src/components/landing/*`. Use the tokens — never hard-code a colour, radius or shadow.

## Principles

1. **Browse first.** People come to find something to do. The header search and the category
   bar are always one glance away; events are shown as shelves (`Row`) and grids of `EventCard`.
2. **Facts, not copy.** No taglines or explanatory paragraphs. Section titles are two or three
   words ("This week", "Free entry"). Cards carry date, time, venue, price and seats left.
3. **One badge, one red.** A card shows at most one badge (Live now, Almost full, Full). Red is
   for the single most important action on a screen.
4. **Real data only.** No invented numbers, reviews or testimonials.

## Colour

| Token | Hex | Use |
|---|---|---|
| `ink` · `ink-2` · `ink-muted` · `ink-subtle` | `#222222` · `#3F3F3F` · `#6A6A6A` · `#717171` | Text |
| `line` / `line-strong` | `#EBEBEB` / `#DDDDDD` | Hairlines, outlines |
| `sunken` / `mist` | `#F7F7F7` / `#EBEBEB` | Footer, wells, hovers |
| `accent` | `#E3264F` | Search button, Register, Create event, the logo |
| `live` · `warn` · `danger` | status colours, always with a word |

## Type

Figtree for everything. Page titles 26–32px semibold; shelf titles 22px semibold; card titles
15px semibold; body 14–16px. JetBrains Mono only for pass codes.

## Shape

- Buttons: 8px corners (`rounded-lg`), 40–48px tall. Primary is `#222`; `accent` is red.
- Search, filter chips, the account button and icon buttons are fully round.
- Cards: cover with 20px corners, no box around the card. Panels: 16–24px corners, 1px `#DDDDDD`.
- Shadows only on things that float or on hover (`shadow-raised`, `shadow-pop`, `shadow-search`).

## Covers

`EventArt` draws a scene per kind of event (court, circuit, controller, diyas, chat bubbles,
confetti) in the category's colours, varied by event id. An uploaded banner always wins.

## Shell

- `SiteHeader`: logo · illustrated tabs (Events, Calendar, Passes, Photos) · Host link,
  notifications, account menu. Home and Events add the big `HeaderSearch` pill, which folds into
  `CompactSearch` on scroll. Hosting swaps the tabs and shows Create event.
- Phones: search button and menu sheet; signed-in phones get the `TabBar`
  (Explore, Passes, Calendar, Photos, Profile).
- `SiteFooter`: three columns on `#F7F7F7`.
