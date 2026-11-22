"use client"

import { useState } from "react"
import type { CSSProperties } from "react"
import { Badge } from "@/registry-reui/bases/radix/reui/badge"
import {
  ColorPicker,
  ColorPickerChannelInput,
  ColorPickerCopy,
  ColorPickerSlider,
  getForegroundColor,
  isColorInSrgb,
  parseColor,
} from "@/registry-reui/bases/radix/reui/color-picker"

import { Button } from "@/registry/bases/radix/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/registry/bases/radix/ui/card"
import { Checkbox } from "@/registry/bases/radix/ui/checkbox"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/registry/bases/radix/ui/input-group"
import { Label } from "@/registry/bases/radix/ui/label"

const CHANNELS = [
  { channel: "lightness", short: "L" },
  { channel: "chroma", short: "C" },
  { channel: "hue", short: "H" },
] as const

export default function Pattern() {
  /* Tailwind's blue-500, a P3 color: its chroma runs past sRGB. */
  const [primary, setPrimary] = useState<string | null>(
    "oklch(62.3% 0.214 259.815)"
  )
  const color = parseColor(primary)
  const foreground = color ? getForegroundColor(color) : null
  /* The preview re-points the theme tokens themselves, so the Button and the
     Badge below render exactly as they would with this --primary. */
  const theme =
    primary && foreground
      ? ({
          "--primary": primary,
          "--primary-foreground": foreground,
        } as CSSProperties)
      : undefined

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Primary color</CardTitle>
        <CardDescription>
          Tune the --primary token in OKLCH, the format shadcn and Tailwind v4
          themes use.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-5">
          <ColorPicker
            value={primary}
            onValueChange={setPrimary}
            format="oklch"
            aria-label="Primary color"
          >
            <div className="grid gap-3">
              {CHANNELS.map(({ channel, short }) => (
                <div
                  key={channel}
                  className="grid grid-cols-[1rem_1fr_4.5rem] items-center gap-3"
                >
                  <span
                    aria-hidden="true"
                    className="text-muted-foreground text-xs font-medium"
                  >
                    {short}
                  </span>
                  <ColorPickerSlider channel={channel} colorSpace="oklch" />
                  <InputGroup>
                    <ColorPickerChannelInput
                      channel={channel}
                      colorSpace="oklch"
                    />
                  </InputGroup>
                </div>
              ))}
            </div>
            <InputGroup>
              <InputGroupInput
                readOnly
                value={`--primary: ${primary ?? "none"};`}
                aria-label="CSS variable"
              />
              <InputGroupAddon align="inline-end">
                <ColorPickerCopy size="icon-xs" />
              </InputGroupAddon>
            </InputGroup>
          </ColorPicker>
          <div className="flex flex-wrap items-center gap-3" style={theme}>
            {/* Each fills with --primary and draws on --primary-foreground,
                so all three follow the picked color. */}
            <Button>Save changes</Button>
            <Badge>New</Badge>
            <div className="flex items-center gap-2">
              <Checkbox id="primary-notify" defaultChecked />
              <Label htmlFor="primary-notify">Notify team</Label>
            </div>
            {color && !isColorInSrgb(color) && (
              <Badge variant="warning-light" className="ms-auto">
                Outside sRGB
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
