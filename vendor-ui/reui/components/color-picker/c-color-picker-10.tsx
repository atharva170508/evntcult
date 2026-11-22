"use client"

import { useState } from "react"
import {
  ColorPicker,
  ColorPickerClear,
  ColorPickerContent,
  ColorPickerSwatches,
  ColorPickerTrigger,
} from "@/registry-reui/bases/radix/reui/color-picker"
import { Frame, FramePanel } from "@/registry-reui/bases/radix/reui/frame"

import { Separator } from "@/registry/bases/radix/ui/separator"
import { Toggle } from "@/registry/bases/radix/ui/toggle"
import { IconPlaceholder } from "@/app/(create)/components/icon-placeholder"

const TEXT_COLORS = [
  { value: "#6b7280", label: "Gray" },
  { value: "#dc2626", label: "Red" },
  { value: "#ea580c", label: "Orange" },
  { value: "#ca8a04", label: "Yellow" },
  { value: "#16a34a", label: "Green" },
  { value: "#0d9488", label: "Teal" },
  { value: "#2563eb", label: "Blue" },
  { value: "#7c3aed", label: "Violet" },
  { value: "#db2777", label: "Pink" },
  { value: "#92400e", label: "Brown" },
]

const HIGHLIGHTS = [
  { value: "#fef08a", label: "Yellow" },
  { value: "#bbf7d0", label: "Green" },
  { value: "#bfdbfe", label: "Blue" },
  { value: "#fbcfe8", label: "Pink" },
  { value: "#fed7aa", label: "Orange" },
  { value: "#ddd6fe", label: "Violet" },
  { value: "#99f6e4", label: "Teal" },
  { value: "#fecaca", label: "Red" },
  { value: "#d9f99d", label: "Lime" },
  { value: "#e5e7eb", label: "Gray" },
]

const SWATCH_GRID = "grid-cols-[repeat(5,var(--color-picker-swatch-size))]"

/* A palette menu: presets, then a way back to no color at all. */
function ColorMenu({
  title,
  colors,
  reset,
}: {
  title: string
  colors: typeof TEXT_COLORS
  reset: string
}) {
  return (
    <ColorPickerContent className="w-auto">
      <span className="text-muted-foreground text-xs font-medium">{title}</span>
      <ColorPickerSwatches
        colors={colors}
        aria-label={title}
        className={SWATCH_GRID}
      />
      <Separator />
      <ColorPickerClear className="justify-start">{reset}</ColorPickerClear>
    </ColorPickerContent>
  )
}

export default function Pattern() {
  const [bold, setBold] = useState(false)
  /* `null` is the editor's default ink and no highlight at all. */
  const [ink, setInk] = useState<string | null>(null)
  const [highlight, setHighlight] = useState<string | null>("#fef08a")
  /* Each palette closes on a pick, like an editor menu, and hands focus back
     to its toolbar button. */
  const [menu, setMenu] = useState<"ink" | "highlight" | null>(null)

  return (
    /* Two panels: the toolbar, then the text it formats. */
    <Frame spacing="sm" className="w-full max-w-md">
      <FramePanel>
        <div className="flex items-center gap-1">
          <Toggle
            size="sm"
            aria-label="Bold"
            pressed={bold}
            onPressedChange={setBold}
          >
            <IconPlaceholder
              lucide="BoldIcon"
              tabler="IconBold"
              hugeicons="TextBoldIcon"
              phosphor="TextBIcon"
              remixicon="RiBold"
              aria-hidden="true"
            />
          </Toggle>
          <Separator orientation="vertical" className="my-auto h-4" />
          <ColorPicker
            value={ink}
            onValueChange={setInk}
            onValueCommit={() => setMenu(null)}
            open={menu === "ink"}
            onOpenChange={(open) => setMenu(open ? "ink" : null)}
            aria-label="Text color"
          >
            {/* The bar under the glyph shows the current ink. */}
            <ColorPickerTrigger variant="ghost" size="icon-sm">
              <span className="relative flex">
                <IconPlaceholder
                  lucide="TypeIcon"
                  tabler="IconTypography"
                  hugeicons="TextIcon"
                  phosphor="TextTIcon"
                  remixicon="RiFontColor"
                  aria-hidden="true"
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 -bottom-1 h-0.5 rounded-full"
                  style={{ background: ink ?? "currentColor" }}
                />
              </span>
            </ColorPickerTrigger>
            <ColorMenu
              title="Text color"
              colors={TEXT_COLORS}
              reset="Default color"
            />
          </ColorPicker>
          <ColorPicker
            value={highlight}
            onValueChange={setHighlight}
            onValueCommit={() => setMenu(null)}
            open={menu === "highlight"}
            onOpenChange={(open) => setMenu(open ? "highlight" : null)}
            aria-label="Highlight color"
          >
            <ColorPickerTrigger variant="ghost" size="icon-sm">
              <span className="relative flex">
                <IconPlaceholder
                  lucide="HighlighterIcon"
                  tabler="IconHighlight"
                  hugeicons="HighlighterIcon"
                  phosphor="HighlighterIcon"
                  remixicon="RiMarkPenLine"
                  aria-hidden="true"
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 -bottom-1 h-0.5 rounded-full"
                  style={{ background: highlight ?? "transparent" }}
                />
              </span>
            </ColorPickerTrigger>
            <ColorMenu
              title="Highlight"
              colors={HIGHLIGHTS}
              reset="No highlight"
            />
          </ColorPicker>
        </div>
      </FramePanel>
      <FramePanel>
        <p
          className="text-sm leading-relaxed data-bold:font-semibold"
          data-bold={bold || undefined}
          style={{ color: ink ?? undefined }}
        >
          The launch review moves to Thursday.{" "}
          <mark
            className="rounded-sm px-0.5 text-inherit"
            style={{ backgroundColor: highlight ?? "transparent" }}
          >
            Bring the final pricing and the onboarding copy
          </mark>{" "}
          so we can sign off before the press embargo lifts.
        </p>
      </FramePanel>
    </Frame>
  )
}
