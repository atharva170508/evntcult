"use client"

import { useState } from "react"
import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerEyeDropper,
  ColorPickerFields,
  ColorPickerPanel,
  ColorPickerSlider,
  ColorPickerSwatches,
  ColorPickerTrigger,
} from "@/registry-reui/bases/radix/reui/color-picker"

import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/registry/bases/radix/ui/field"

export default function Pattern() {
  const [color, setColor] = useState<string | null>("#2563eb")
  const [recent, setRecent] = useState([
    "#0f172a",
    "#e11d48",
    "#f59e0b",
    "#10b981",
  ])

  return (
    <div className="w-full max-w-xs">
      <Field>
        <FieldLabel id="brush-color-label" htmlFor="brush-color">
          Brush color
        </FieldLabel>
        {/* `onValueCommit` fires once per pick, when a drag is released, so
            dragging across the area adds one recent color, not hundreds. */}
        <ColorPicker
          id="brush-color"
          value={color}
          onValueChange={setColor}
          onValueCommit={(next) => {
            if (!next) return
            setRecent((list) =>
              [next, ...list.filter((item) => item !== next)].slice(0, 8)
            )
          }}
          aria-labelledby="brush-color-label"
          aria-describedby="brush-color-description"
        >
          <ColorPickerTrigger />
          <ColorPickerContent>
            <ColorPickerPanel>
              <ColorPickerArea />
              <div className="flex items-center gap-3">
                <ColorPickerEyeDropper />
                <ColorPickerSlider channel="hue" />
              </div>
              <ColorPickerFields />
              <div className="flex flex-col gap-2">
                <span
                  id="brush-recent-label"
                  className="text-muted-foreground text-xs font-medium"
                >
                  Recent
                </span>
                <ColorPickerSwatches
                  colors={recent}
                  aria-labelledby="brush-recent-label"
                />
              </div>
            </ColorPickerPanel>
          </ColorPickerContent>
        </ColorPicker>
        <FieldDescription id="brush-color-description">
          Colors you pick are kept under Recent.
        </FieldDescription>
      </Field>
    </div>
  )
}
