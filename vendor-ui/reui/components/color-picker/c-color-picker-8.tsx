"use client"

import { useState } from "react"
import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerFields,
  ColorPickerWheel,
} from "@/registry-reui/bases/radix/reui/color-picker"

import { Card, CardContent } from "@/registry/bases/radix/ui/card"

export default function Pattern() {
  const [value, setValue] = useState<string | null>("#f43f5e")

  return (
    <Card className="w-fit">
      <CardContent>
        <div className="flex flex-col items-center gap-5">
          <ColorPicker
            value={value}
            onValueChange={setValue}
            aria-label="Brush"
          >
            {/* The area fills the square inside the ring: hue on the ring,
                saturation and brightness in the middle. */}
            <ColorPickerWheel className="size-56">
              <ColorPickerArea className="size-full" />
            </ColorPickerWheel>
            <ColorPickerFields
              formats={["hex", "rgb", "hsl"]}
              className="w-56"
            />
          </ColorPicker>
        </div>
      </CardContent>
    </Card>
  )
}
