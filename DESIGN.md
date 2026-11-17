---
version: 3.0
name: EvntCult — Marketplace, warm
description: Browse like Airbnb, feel like Wispr Flow. Cream page, white cards, #1A1A1A ink, lavender call-to-action buttons with a dark outline, brand red for search, the logo and live states. Figtree for the interface, EB Garamond for big headlines (italic for the second phrase), JetBrains Mono for pass codes.
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
| `canvas` / `surface` | `#FFFEF6` / `#FFFFFF` | Cream page, white cards |
| `ink` · `ink-2` · `ink-muted` · `ink-subtle` | `#1A1A1A` · `#3F3F3F` · `#6A6A6A` · `#717171` | Text |
| `line` / `line-strong` | `#ECE8DD` / `#DCD6C6` | Warm hairlines, outlines |
| `sunken` / `mist` | `#F6F3EA` / `#ECE8DC` | Footer, wells, hovers |
| `lavender` | `#F0D7FF` | Call-to-action buttons (with a 2px `ink` outline) |
| `night` / `cream` | `#1A1A1A` / `#FFFFEB` | Dark bands with cream type |
| `accent` | `#E3264F` | Search button, the logo, live badges |
| `live` · `warn` · `danger` | status colours, always with a word |

## Type

Figtree for the interface: page titles 28–32px semibold, shelf titles 22px semibold, card titles
15px semibold, body 14–16px. EB Garamond (`font-display`, `text-display-xl/2xl`) for the big
moments — the homepage hero, dark bands, "Good questions", sign-in, the hosting welcome — with an
`<em>` for the italic second phrase. JetBrains Mono only for pass codes.

## Shape

- Buttons: 10–12px corners, 40–48px tall. `accent` is lavender with a 2px dark outline; primary is solid dark.
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
