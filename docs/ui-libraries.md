# UI libraries

Components from outside libraries are added one at a time, only when a screen needs them, and then
restyled to EvntCult. Nothing is pulled in up front.

```bash
npx shadcn add @magicui/marquee          # namespaced registry
npx shadcn add https://21st.dev/r/<author>/<component>   # 21st.dev, by URL
npx shadcn view @animate-ui/tabs          # look before adding
npx shadcn search @kibo-ui -q "calendar"
```

Files land in `src/components/shadcn/` (not `src/components/ui/`, so a lowercase `switch.tsx` can
never overwrite our `Switch.tsx` on Windows). Their colour classes (`bg-background`, `text-muted-foreground`,
`border-border`, `bg-primary`…) are mapped to EvntCult colours in `tailwind.config.ts`.

## After every add

1. Read the diff. The CLI may touch `tailwind.config.ts`, `globals.css` and `package.json`; keep only
   what the component needs.
2. `bg-accent` is our brand red, not a soft hover grey. Swap it for `bg-sunken` in menus and lists.
3. Check it against the AI-look list: no glow, gradient text, shimmer, bouncing, pill-everything or
   tiny all-caps labels. Most effects from Magic UI and Aceternity need toning down.
4. Fonts: Figtree for UI, EB Garamond for headlines. Remove any Inter or Geist imports.
5. Respect reduced motion (`useReducedMotion` from `motion/react`).

## What's installed (branch `ui-libraries`)

**Component sources** are in `vendor-ui/<library>/`, one folder per library, with each library's
licence. About 10,000 files, taken from the libraries' public GitHub repos. Each component folder from
a built registry has a `meta.json` listing its npm dependencies.

`vendor-ui/` is left out of the type-check, the linter and Tailwind's class scan, so nothing there
reaches the site until it's used. To use a component: copy it into `src/components/shadcn/`, fix its
imports, install the packages in its `meta.json`, and restyle it (checklist above).

**npm packages** in `package.json`: `@heroui/react` 2.7 and `framer-motion`, `lightswind`,
`daisyui` 4, `flowbite` 2, `preline` 2, `flyonui` 1. These are the newest versions that work with
Tailwind 3.4. `.npmrc` sets `legacy-peer-deps` because Lightswind asks for an older tailwind-merge.

The four Tailwind theme kits are installed but **not switched on** in `tailwind.config.ts`.
Switching one on restyles existing pages: Flowbite and Preline restyle every form field, FlyonUI and
DaisyUI add their own `.card` and `.btn` classes (we already have a `.card`), and HeroUI's plugin
replaces the `primary` and `background` colours. When a screen needs one, enable it with a prefix
(e.g. DaisyUI: `daisyui: { prefix: "dy-", base: false }`).

| Library | Installed as | Count |
|---|---|---|
| Magic UI | `vendor-ui/magic-ui` | 262 components |
| React Bits | `vendor-ui/react-bits` | 219 components |
| Kibo UI | `vendor-ui/kibo-ui` | 1,234 files |
| Animate UI | `vendor-ui/animate-ui` | 579 components |
| Motion Primitives | `vendor-ui/motion-primitives` | 33 components |
| ReUI | `vendor-ui/reui` | 1,439 files |
| Coss UI | `vendor-ui/coss-ui` | 646 components |
| Smooth UI | `vendor-ui/smooth-ui` | 919 files |
| Eldora UI | `vendor-ui/eldora-ui` | 125 components |
| shadcn Studio | `vendor-ui/shadcn-studio` | 637 components |
| 8bitcn | `vendor-ui/8bitcn` | 118 files |
| Fancy Components | `vendor-ui/fancy-components` | 49 files |
| Jolly UI | `vendor-ui/jolly-ui` | 34 components |
| shadcn/ui | `vendor-ui/shadcn-ui` | 62 components |
| TailGrids | `vendor-ui/tailgrids` | 144 files |
| Float UI | `vendor-ui/float-ui` | 198 files |
| HyperUI | `vendor-ui/hyperui` | 658 HTML files |
| Meraki UI | `vendor-ui/meraki-ui` | 228 HTML files |
| HeroUI | npm `@heroui/react` | needs `HeroUIProvider` and its plugin |
| Lightswind | npm `lightswind` | import from `lightswind` |
| DaisyUI, Flowbite, Preline, FlyonUI | npm, plugin off | see above |
| Aceternity UI, Skiper UI | registry only | no public source; add per component with the shadcn CLI |
| Glassy UI, Watermelon UI | registry only | no public repo found; add per component with the shadcn CLI |
| 21st.dev | per-component URL | a marketplace, no single library |
| Beautiful UI | not found | no package, registry or repo |

## The 30 libraries

| Library | How to add | Notes |
|---|---|---|
| Magic UI | `@magicui/…` | Registry |
| Flowbite | not installed | Tailwind theme plugin; restyles every element |
| React Bits | `@react-bits/…` | Registry |
| Aceternity UI | `@aceternity/…` | Registry; heavy effects, tone down |
| Kibo UI | `@kibo-ui/…` | Registry |
| Animate UI | `@animate-ui/…` | Registry |
| Motion Primitives | `@motion-primitives/…` | Registry; already uses `motion` like we do |
| HeroUI | not installed | A second design system with its own theme provider |
| 21st.dev | `npx shadcn add https://21st.dev/r/<author>/<name>` | Per-component URL |
| Glassy UI | `@glassyui/…` | Registry; glass effects, use sparingly |
| ReUI | `@reui/…` | Registry |
| Coss UI | `@coss/…` | Registry |
| Beautiful UI | — | No registry or package found |
| Smooth UI | `@smoothui/…` | Registry |
| Fancy Components | `npx shadcn add https://fancycomponents.dev/r/<name>.json` | Not in the index; check the URL on their site first |
| Eldora UI | `@eldoraui/…` | Registry |
| Watermelon UI | `@watermelon/…` | Registry |
| Float UI | copy from floatui.com | Copy-paste JSX, no registry |
| Preline | not installed | Tailwind plugin plus JS; restyles every element |
| Meraki UI | copy from merakiui.com | Copy-paste HTML |
| HyperUI | copy from hyperui.dev | Copy-paste HTML |
| DaisyUI | not installed | Theme plugin; v5 needs Tailwind 4 (we're on 3.4) |
| Lightswind | `npx lightswind@latest add <name>` | Its own CLI; writes to `src/components/lightswind` |
| Jolly UI | `@jolly-ui/…` | React Aria based |
| Skiper UI | `@skiper-ui/…` | Registry |
| FlyonUI | not installed | Theme plugin on top of DaisyUI |
| shadcn/ui | `npx shadcn add button` | The base registry |
| shadcn Studio | `@shadcn-studio/…` | Registry |
| 8bitcn | `@8bitcn/…` | Registry; retro pixel style |
| TailGrids | `@tailgrids/…` | Registry |
