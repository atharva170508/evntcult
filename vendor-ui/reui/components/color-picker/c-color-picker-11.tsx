"use client"

import { useState } from "react"
import {
  ColorPicker,
  ColorPickerChannelInput,
  ColorPickerSlider,
  ColorPickerSwatch,
  ColorPickerValue,
} from "@/registry-reui/bases/radix/reui/color-picker"

import { Card, CardContent } from "@/registry/bases/radix/ui/card"
import { InputGroup } from "@/registry/bases/radix/ui/input-group"

const CHANNELS = [
  { channel: "red", short: "R" },
  { channel: "green", short: "G" },
  { channel: "blue", short: "B" },
  { channel: "alpha", short: "A" },
] as const

export default function Pattern() {
  const [value, setValue] = useState<string | null>("rgb(244 63 94 / 0.85)")

  return (
    <Card className="w-full max-w-sm">
      <CardContent>
        <div className="flex flex-col gap-5">
          <ColorPicker
            value={value}
            onValueChange={setValue}
            alpha
            format="rgb"
            aria-label="Mixed color"
          >
            <div className="flex items-center gap-3">
              <ColorPickerSwatch shape="circle" className="size-10" />
              <div className="flex min-w-0 flex-col">
                <span className="text-sm font-medium">Channel mixer</span>
                <span className="text-muted-foreground font-mono text-xs">
                  <ColorPickerValue />
                </span>
              </div>
            </div>
            {/* Each track shows the range its channel can reach from here:
                dragging red redraws the green and blue tracks with it. */}
            <div className="grid gap-3">
              {CHANNELS.map(({ channel, short }) => (
                <div
                  key={channel}
                  className="grid grid-cols-[1rem_1fr_4rem] items-center gap-3"
                >
                  <span
                    aria-hidden="true"
                    className="text-muted-foreground text-xs font-medium"
                  >
                    {short}
                  </span>
                  <ColorPickerSlider channel={channel} />
                  <InputGroup>
                    <ColorPickerChannelInput channel={channel} />
                  </InputGroup>
                </div>
              ))}
            </div>
          </ColorPicker>
        </div>
      </CardContent>
    </Card>
  )
}
