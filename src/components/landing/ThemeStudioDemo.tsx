"use client";

import { useState } from "react";
import { CalendarDays, MapPin, Shuffle } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { cn } from "@/lib/utils";
import { EventArt, accentHex } from "@/components/ui/EventArt";
import {
  EFFECTS,
  EVENT_THEME_PRESETS,
  PAGE_STYLES,
  PAGE_STYLE_KEYS,
  THEME_CATEGORIES,
  TITLE_FONTS,
  TITLE_FONT_KEYS,
  type EventThemePreset,
  type PageStyle,
  type ThemeCategoryCode,
  type TitleFont,
} from "@/lib/effects";
import { Reveal } from "@/components/motion/Reveal";
import { EASE } from "@/components/motion/MotionProvider";

function TextureBackdrop({ style, hex }: { style: PageStyle; hex: string }) {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 opacity-[0.18] transition-colors duration-500"
        style={{ background: `radial-gradient(500px 240px at 30% 0%, ${hex}, transparent 75%)` }}
      />
      {style === "dots" && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(rgb(var(--c-line-strong))_1px,transparent_1.2px)] [background-size:20px_20px] [mask-image:linear-gradient(to_bottom,black,transparent_90%)]"
        />
      )}
      {style === "ruled" && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(rgb(var(--c-line))_1px,transparent_1px)] [background-size:100%_28px] [mask-image:linear-gradient(to_bottom,black,transparent_90%)]"
        />
      )}
      {style === "grid" && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgb(var(--c-line))_1px,transparent_1px),linear-gradient(to_bottom,rgb(var(--c-line))_1px,transparent_1px)] [background-size:24px_24px] [mask-image:linear-gradient(to_bottom,black,transparent_90%)]"
        />
      )}
      {style === "diagonal" && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-55 bg-[repeating-linear-gradient(-45deg,transparent,transparent_12px,rgb(var(--c-line))_12px,rgb(var(--c-line))_13px)] [mask-image:linear-gradient(to_bottom,black,transparent_90%)]"
        />
      )}
      {style === "spotlight" && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 opacity-[0.26] transition-colors duration-500"
          style={{ background: `radial-gradient(420px 300px at 50% 0%, ${hex}, transparent 72%)` }}
        />
      )}
    </>
  );
}

/**
 * Interactive 21-Theme Event Studio on the homepage.
 * Pick any category (Sports, Tech, Cultural, Parties, Workshops, Gaming, Talks) -> choose from
 * 3 curated themes per category -> watch the miniature event page transform live.
 */
export function ThemeStudioDemo() {
  const [cat, setCat] = useState<ThemeCategoryCode>("SPORTS");
  const [preset, setPreset] = useState<EventThemePreset>(EVENT_THEME_PRESETS[0]);
  const [style, setStyle] = useState<PageStyle>(EVENT_THEME_PRESETS[0].style);
  const [font, setFont] = useState<TitleFont>(EVENT_THEME_PRESETS[0].font);
  const [spins, setSpins] = useState(0);

  const catPresets = EVENT_THEME_PRESETS.filter((p) => p.category === cat);

  const selectCategory = (nextCat: ThemeCategoryCode) => {
    setCat(nextCat);
    const first = EVENT_THEME_PRESETS.find((p) => p.category === nextCat);
    if (first) {
      setPreset(first);
      setStyle(first.style);
      setFont(first.font);
    }
  };

  const pickPreset = (p: EventThemePreset) => {
    setPreset(p);
    setStyle(p.style);
    setFont(p.font);
  };

  const shuffle = () => {
    const others = EVENT_THEME_PRESETS.filter((p) => p.id !== preset.id);
    const next = others[Math.floor(Math.random() * others.length)];
    setCat(next.category);
    pickPreset(next);
    setSpins((s) => s + 1);
  };

  const hex = accentHex(preset.accent);

  return (
    <Reveal as="section" aria-labelledby="studio-h" className="py-16 md:py-24">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2
            id="studio-h"
            className="max-w-[18ch] font-display text-[clamp(40px,4.8vw,62px)] leading-[0.94] tracking-[-0.03em] text-ink"
          >
            21 themes across every <em>event kind.</em>
          </h2>
          <p className="mt-3 max-w-[48ch] text-[15.5px] leading-relaxed text-ink-2">
            Pick your category, then choose from three distinct atmospheres built for it. Every
            theme coordinates paper texture, headline face, cover tint, and page effect.
          </p>
        </div>

        <button
          type="button"
          onClick={shuffle}
          className="ui-press inline-flex h-10 w-fit shrink-0 items-center gap-2 rounded-xl border border-line-strong bg-surface px-4 text-[13.5px] font-semibold text-ink hover:bg-sunken"
        >
          <m.span
            animate={{ rotate: spins * 180 }}
            transition={{ type: "spring", stiffness: 320, damping: 20 }}
            className="inline-flex"
          >
            <Shuffle className="size-3.5" aria-hidden />
          </m.span>
          Shuffle all 21
        </button>
      </div>

      {/* Step 1: Category selector */}
      <div
        role="tablist"
        aria-label="Event categories"
        className="mt-7 flex flex-wrap items-center gap-1.5"
      >
        {THEME_CATEGORIES.map((c) => {
          const active = cat === c.code;
          return (
            <button
              key={c.code}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => selectCategory(c.code)}
              className={cn(
                "relative min-h-[44px] shrink-0 rounded-full px-4 py-2 text-[13.5px] font-semibold transition-colors sm:min-h-[38px]",
                active ? "text-canvas" : "bg-sunken text-ink-2 hover:bg-mist hover:text-ink",
              )}
            >
              {active && (
                <m.span
                  layoutId="studio-cat-pill"
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-ink"
                  transition={{ type: "spring", stiffness: 460, damping: 36 }}
                />
              )}
              <span className="relative z-10">{c.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-12">
        {/* Step 2: 3 curated themes for the active category + fine-tune */}
        <div className="space-y-5">
          <div className="grid gap-3" role="radiogroup" aria-label={`Themes for ${cat}`}>
            {catPresets.map((p) => {
              const active = preset.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => pickPreset(p)}
                  className={cn(
                    "ui-press group flex items-center justify-between gap-4 rounded-2xl p-4 text-left transition-all duration-fast",
                    active
                      ? "bg-surface text-ink shadow-raised ring-2 ring-ink"
                      : "bg-surface/80 text-ink-2 shadow-card hover:bg-surface hover:text-ink",
                  )}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Mini visual swatch preview */}
                    <span
                      className="grid size-12 shrink-0 place-items-center rounded-xl text-[18px] text-white shadow-sm"
                      style={{ background: p.swatch }}
                      aria-hidden
                    >
                      {EFFECTS[p.effect].glyphs[0] ?? "Aa"}
                    </span>
                    <div className="min-w-0">
                      <span className={cn("block truncate text-[18px] leading-tight text-ink", TITLE_FONTS[p.font].cls)}>
                        {p.name}
                      </span>
                      <span className="mt-0.5 block truncate text-[13px] text-ink-muted">
                        {p.vibe} · {PAGE_STYLES[p.style].label}
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-[11px] font-medium text-ink-subtle">
                    {TITLE_FONTS[p.font].label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Fine-tune controls */}
          <div className="space-y-2.5 pt-1 text-[12px]">
            <div className="flex flex-wrap gap-1 rounded-xl bg-sunken p-1" role="group" aria-label="Texture">
              {PAGE_STYLE_KEYS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setStyle(k)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 font-semibold transition-colors",
                    style === k ? "bg-surface text-ink shadow-sm" : "text-ink-muted hover:text-ink",
                  )}
                >
                  {PAGE_STYLES[k].label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1 rounded-xl bg-sunken p-1" role="group" aria-label="Title font">
              {TITLE_FONT_KEYS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setFont(k)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 transition-colors",
                    TITLE_FONTS[k].cls,
                    font === k ? "bg-surface text-ink shadow-sm" : "text-ink-muted hover:text-ink",
                  )}
                >
                  {TITLE_FONTS[k].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Live transforming Event Page preview */}
        <div
          data-sample="true"
          className="relative isolate overflow-hidden rounded-[24px] bg-sunken/75 p-6 md:p-8"
        >
          <TextureBackdrop style={style} hex={hex} />

          <div className="mb-4 flex items-center justify-between text-[12px] text-ink-subtle">
            <span>Example · {preset.name}</span>
            <span>
              {PAGE_STYLES[style].label} · {TITLE_FONTS[font].label}
            </span>
          </div>

          <AnimatePresence mode="wait">
            <m.div
              key={preset.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.24, ease: EASE }}
              className="grid gap-5 sm:grid-cols-[0.82fr_1.18fr] sm:items-start"
            >
              <div className="overflow-hidden rounded-2xl bg-surface shadow-card">
                <div className="relative aspect-square">
                  <EventArt accent={preset.accent} seed={`preset-${preset.id}`} scrim={false} />
                </div>
                <div className="px-3.5 py-2.5 text-[12px] text-ink-muted">
                  Featured in <strong className="font-semibold text-ink">{THEME_CATEGORIES.find((c) => c.code === preset.category)?.label}</strong>
                </div>
              </div>

              <div className="rounded-2xl bg-surface p-5 shadow-card">
                <p className="text-[12.5px] text-ink-muted">{preset.vibe}</p>
                <h3 className={cn("mt-1.5 text-[30px] leading-[1.04] text-ink", TITLE_FONTS[font].cls)}>
                  {preset.sampleTitle}
                </h3>
                <ul className="mt-4 space-y-2 text-[13.5px] text-ink-2">
                  <li className="flex items-center gap-2">
                    <CalendarDays className="size-3.5 shrink-0 text-ink-muted" aria-hidden />
                    {preset.sampleTime}
                  </li>
                  <li className="flex items-center gap-2">
                    <MapPin className="size-3.5 shrink-0 text-ink-muted" aria-hidden />
                    {preset.sampleVenue}
                  </li>
                </ul>
                <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                  <span className="text-[14.5px] font-semibold text-ink">{preset.sampleFee}</span>
                  <span className="inline-flex h-9 items-center rounded-xl bg-lavender px-4 text-[13.5px] font-semibold text-ink ring-2 ring-inset ring-ink">
                    Register
                  </span>
                </div>
              </div>
            </m.div>
          </AnimatePresence>
        </div>
      </div>
    </Reveal>
  );
}
