"use client"

import { useState } from "react"
import { ColorPicker } from "@/registry-reui/bases/radix/reui/color-picker"

import { Card, CardContent } from "@/registry/bases/radix/ui/card"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/registry/bases/radix/ui/field"

export default function Pattern() {
  const [overlay, setOverlay] = useState<string | null>("rgb(15 23 42 / 0.55)")

  return (
    <Card className="w-full max-w-sm overflow-hidden pt-0">
      <div className="relative flex h-40 items-end bg-[linear-gradient(135deg,#f97316,#ec4899_45%,#6366f1)] p-5">
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: overlay ?? "transparent" }}
        />
        <div className="relative">
          <p className="text-xs font-medium tracking-wide text-white/80 uppercase">
            New season
          </p>
          <p className="text-lg font-semibold text-white">Spring collection</p>
        </div>
      </div>
      <CardContent>
        <Field>
          <FieldLabel id="banner-overlay-label" htmlFor="banner-overlay">
            Banner overlay
          </FieldLabel>
          {/* `alpha` adds the opacity slider and field; `format="rgb"` writes
              the value as rgb(15 23 42 / 0.55), ready for a style prop. */}
          <ColorPicker
            id="banner-overlay"
            value={overlay}
            onValueChange={setOverlay}
            alpha
            format="rgb"
            aria-labelledby="banner-overlay-label"
            aria-describedby="banner-overlay-description"
          />
          <FieldDescription id="banner-overlay-description">
            Darken the artwork so the headline stays readable.
          </FieldDescription>
        </Field>
      </CardContent>
    </Card>
  )
}
