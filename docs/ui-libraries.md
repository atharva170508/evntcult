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
