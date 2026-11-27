---
version: alpha
name: EvntCult
description: Campus events, browsed like a marketplace and felt like a warm product. Cream paper, white cards, ink, lavender actions with a dark outline, brand red for search and live moments. Plus Jakarta Sans for the interface, Instrument Serif for the big moments.
colors:
  primary: "#1A1A1A"
  on-primary: "#FFFFFF"
  neutral: "#FFFEF6"
  surface: "#FFFFFF"
  surface-sunken: "#F6F3EA"
  surface-mist: "#ECE8DC"
  on-surface: "#1A1A1A"
  on-surface-variant: "#6A6A6A"
  on-surface-subtle: "#666666"
  outline: "#DCD6C6"
  outline-variant: "#ECE8DD"
  secondary: "#F0D7FF"
  on-secondary: "#1A1A1A"
  secondary-hover: "#E6C4FB"
  tertiary: "#E3264F"
  on-tertiary: "#FFFFFF"
  night: "#1A1A1A"
  on-night: "#FFFFEB"
  live: "#0B7A54"
  error: "#B42318"
typography:
  display-xl:
    fontFamily: Instrument Serif
    fontSize: 96px
    fontWeight: 400
    lineHeight: 0.92
    letterSpacing: -0.025em
  display-lg:
    fontFamily: Instrument Serif
    fontSize: 72px
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.01em
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: 600
    lineHeight: 1.35
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.52
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.55
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: 600
    lineHeight: 1.3
  code:
    fontFamily: JetBrains Mono
    fontSize: 15px
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: 0.08em
rounded:
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  2xl: 24px
  full: 9999px
spacing:
  unit: 8px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 48px
  container-max: 1360px
  section: 96px
components:
  button-primary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    typography: "{typography.title-md}"
    rounded: "{rounded.md}"
    height: 48px
    padding: 0 24px
  button-primary-hover:
    backgroundColor: "{colors.secondary-hover}"
  button-solid:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.title-md}"
    rounded: "{rounded.md}"
    height: 48px
  button-search:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-tertiary}"
    rounded: "{rounded.full}"
    size: 48px
  card-event:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xl}"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: 24px
  band-night:
    backgroundColor: "{colors.night}"
    textColor: "{colors.on-night}"
    typography: "{typography.display-lg}"
  chip-filter:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    height: 36px
  chip-filter-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    height: 56px
  pass-code:
    textColor: "{colors.on-surface}"
    typography: "{typography.code}"
  muted-text:
    textColor: "{colors.on-surface-variant}"
    typography: "{typography.body-md}"
  status-live:
    textColor: "{colors.live}"
  status-error:
    textColor: "{colors.error}"
  divider:
    backgroundColor: "{colors.outline-variant}"
  hairline:
    backgroundColor: "{colors.outline}"
  well:
    backgroundColor: "{colors.surface-sunken}"
  well-hover:
    backgroundColor: "{colors.surface-mist}"
  page:
    backgroundColor: "{colors.neutral}"
  caption:
    textColor: "{colors.on-surface-subtle}"
  display-hero:
    typography: "{typography.display-xl}"
  headline-page:
    typography: "{typography.headline-lg}"
  headline-shelf:
    typography: "{typography.headline-md}"
  body-intro:
    typography: "{typography.body-lg}"
---

# EvntCult

## Overview

The noticeboard outside a college canteen in November, rebuilt as a quiet, well-lit app.
Every event on campus is pinned there — hackathons, Garba nights, finals under floodlights —
and the app's job is to let a student find tonight's one in seconds, register in a tap and
walk in with a scan.

Two references set the feel. The **structure** is a marketplace (Airbnb): search first,
shelves of real things, facts on every card, nothing to read that isn't useful. The **warmth**
is a crafted product site (Wispr Flow): cream paper, a classic serif for the big moments,
buttons with a hand-drawn confidence — lavender fill, dark outline. Premium here means
*calm and exact*, not glossy: thin edges, soft light from above, motion that answers you.

## Colors

A paper-and-ink system with two signals.

- **Neutral {colors.neutral}** is the page — cream, never pure white, so white cards lift off it.
- **Surface {colors.surface}** is every card, panel and sheet that holds content.
- **Primary {colors.primary}** is ink: all text, solid buttons, the dark bands. Never pure black.
- **Secondary {colors.secondary}** (lavender) is the call to action — Register, Get your pass,
  Create event — always with a 2px ink outline.
- **Tertiary {colors.tertiary}** (brand red) is reserved: the logo, the search button, live
  badges. Its scarcity is what makes "Live now" read instantly.
- **Night {colors.night}** with **cream {colors.on-night}** type carries the one or two cinematic
  bands per page.

## Typography

**Instrument Serif** speaks only at the big moments: the homepage welcome, dark bands, "Good
questions", sign-in, section headers, and pass titles. It sets tight (−0.025em) and puts the second phrase in
italic — "Every event, *one pass.*" — the whole phrase, never a single accented word.

**Plus Jakarta Sans** does all the work: page titles {typography.headline-lg}, shelf titles
{typography.headline-md}, card titles {typography.title-md}, body {typography.body-md}.
Labels are sentence case. **JetBrains Mono** appears only in pass serials, live clocks, and codes.

## Layout

Centred column, max {spacing.container-max}, margins {spacing.margin-mobile} → {spacing.margin-desktop},
8px rhythm. Browsing pages are shelves (horizontally scrolling rows) and grids of event cards;
detail pages split 2:1 with a sticky panel. Feature groups use a **bento**: one large tile with
a live preview beside smaller tiles, never a row of identical cards. Everything is left-aligned
except the homepage welcome, which is centred like a poster.

## Elevation & Depth

Three planes, lit from above.

1. **Paper** — the cream page.
2. **Card** — white, a 1px {colors.outline} edge and a 1px white inner highlight on the top edge,
   so the card catches light.
3. **Float** — menus, the header on scroll, the booking panel: a soft shadow tinted warm
   (`rgba(60, 40, 10, 0.10)`), never cold grey. The header is solid cream, never glass.

On hover a card lifts 2px (never scales) and a soft light follows the cursor across it.

## Shapes

Rounded, with hierarchy: inputs {rounded.sm}, buttons and chips {rounded.md} or full pills,
panels {rounded.lg}, event covers {rounded.xl}, big bands {rounded.2xl}. Avatars and icon
buttons are circles.

## Components

- **Buttons:** lavender call to action with a 2px ink outline; solid ink for secondary actions
  that still matter; white with an ink outline for the rest. The main call to action leans
  toward the cursor slightly (magnetic) and presses down on click.
- **Event card:** cover with {rounded.xl} corners, at most one badge, then title, date and time,
  venue, price and seats left. No box around the card.
- **Search:** one pill — what · when · kind — with the round red button that widens to say
  "Search" while you're choosing.
- **Tabs and category bar:** the current item has an ink underline that slides between items.
- **Questions:** an accordion whose answers open smoothly; the plus turns into a cross.
- **Hero (visitors):** split — the serif line, one lavender action and a text link on the
  left; the real "Up next on campus" list on the right (recent events when nothing is
  scheduled). Never centred with two equal buttons.
- **Empty states:** designed panels with a cover, a serif line and one next step — "The board is
  *clear.*", "No passes *yet.*".
- **Featured event:** the homepage's big card — cover, a live countdown in the serif,
  when/where, a seats bar and the lavender Register.
- **Bentos:** kinds (one large tile, four small, real counts), hosting (a scanner preview tile
  plus three feature tiles on the night band). Tiles are lit by the cursor.
- **Numbers:** real counts in the serif that count up once when they arrive.

Inspiration taken from the awesome-design-md collection (Airbnb's single shadow tier and
search orb, Apple's frosted bars and press scale, Stripe's tinted shadows, composited product
previews and tabular figures, Linear's top-edge highlight, Superhuman's closing call to action)
— never copied.

## Motion

Timings follow the antislop-design motion table.

| Role | Duration | Curve |
|---|---|---|
| Hover and press | 150ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Entrances (sections, menus, accordion open, tab underline) | 200–250ms | same |
| Exits | ~170ms | `cubic-bezier(0.4, 0, 1, 1)` (ease-in, faster than entrances) |
| Route change | 200ms fade | same |
| Homepage hero lines | 400ms, 80ms apart | same — `OVERRIDE: canonical motion limit → 400ms [craft tier §5]` |

Motion answers people. Only `transform` and `opacity` animate; nothing scales on hover,
nothing loops, nothing bounces. There is **one** orchestrated
entrance per page: the homepage welcome rises line by line, sharpening from a slight blur.
Below the fold, sections appear once as you reach them, never again. Under
`prefers-reduced-motion` everything is shown in its final state with no movement.

## Do's and Don'ts

- **Do** run the antislop-design Pre-Delivery Audit (`.claude/skills/antislop-design`) before
  shipping UI.
- **Do** keep red for search, the logo and live states only.
- **Do** put the italic on the whole second phrase of a serif headline.
- **Do** show real data — counts, seats left, prices — and nothing invented.
- **Don't** add taglines or explanatory paragraphs; titles are two or three words.
- **Don't** animate individual cards or shelves into view; only whole sections, once.
- **Don't** pair two equal buttons; one primary action, then a text link.
- **Don't** show sample UI content without an "Example" label.
- **Don't** use grey shadows, gradients as decoration, or all-caps labels.
- **Don't** put more than one badge on a card.
