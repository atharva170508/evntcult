---
version: 2.0
name: EvntCult
description: Editorial, calm, dark-led campus passbook reading like a well-set record sleeve. Near-black ink ground (#151412), warm archival paper (#EEE8DD), tinted dark surface (#1D1B18), and warm burnished gold (#C9A26B) as the sole accent. Gloock display serifs, Inter 300 body, IBM Plex Mono 11px facts, structured strictly by 1px hairlines.
colors:
  ink: "#151412"
  paper: "#EEE8DD"
  surface: "#1D1B18"
  accent: "#C9A26B"
  on-accent: "#151412"
  muted: "#9A9284"
  line: "#35322D"
  live: "#84C7A2"
  error: "#E27A6E"
typography:
  display-hero:
    fontFamily: Gloock
    fontSize: 138px
    fontWeight: 400
    lineHeight: 0.98
    letterSpacing: -0.02em
  display-section:
    fontFamily: Gloock
    fontSize: 64px
    fontWeight: 400
    lineHeight: 0.98
    letterSpacing: -0.02em
  body:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 300
    lineHeight: 1.55
  meta:
    fontFamily: IBM Plex Mono
    fontSize: 11px
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: 0.06em
rounded:
  default: 8px
  panel: 24px
  full: 9999px
spacing:
  gutter-mobile: 20px
  gutter-desktop: 40px
  container-max: 1200px
  section-desktop: 128px
---

# EvntCult

## Overview

An editorial, calm campus event passbook set like a record sleeve. Near-black ground, warm gold accent, monumental Gloock headlines against quiet Inter 300 copy, real architectural photography given space, and 1px hairlines in place of drop shadows or boxed cards.

## Colors

- **Ink (`#151412`)**: Default ground and text on paper or gold panels.
- **Paper (`#EEE8DD`)**: Primary text on dark ground and light contrast bands.
- **Surface (`#1D1B18`)**: Tinted dark ground for inset signature panels and alternating bands.
- **Accent (`#C9A26B`)**: Warm burnished gold, the sole accent for CTAs, active indicators, and occasional italic display words.
- **Muted (`#9A9284`)**: Secondary text and mono metadata (`5.96:1` WCAG AA on Ink).
- **Line (`rgba(238,232,221,0.15)`)**: 1px structural hairlines.

## Typography

- **Gloock 400**: Hero (`96px` to `150px`), section titles (`48px` to `76px`), statement prose, and single editorial quote. At most one italic gold word in about half of headlines.
- **Inter 300/400/500**: `16px` body copy, `1.55` line height.
- **IBM Plex Mono 400**: `11px` uppercase `0.06em` tracking, used strictly for real facts, index labels (`001/ The pass`), dates, venues, and fees.

## Do's and Don'ts

- **Do** alternate section grounds: dark, paper, dark, surface, photo, dark, surface, paper, dark, gold accent, dark footer.
- **Do** use one purposeful motion per section (`0.6s` to `1.2s`, `cubic-bezier(0.22,1,0.36,1)`).
- **Don't** use drop shadows, boxed cards, glassmorphism, glows, neon accents, gradients, emojis, icon grids, `100vh` heroes, or dashes in copy.
