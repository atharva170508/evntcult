"use client"

import { useState } from "react"
import { Badge } from "@/registry-reui/bases/radix/reui/badge"
import {
  ColorPicker,
  ColorPickerContent,
  ColorPickerSwatch,
  ColorPickerSwatches,
  ColorPickerTrigger,
  getForegroundColor,
} from "@/registry-reui/bases/radix/reui/color-picker"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/registry/bases/radix/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/registry/bases/radix/ui/field"
import { Input } from "@/registry/bases/radix/ui/input"
import { IconPlaceholder } from "@/app/(create)/components/icon-placeholder"

const LABEL_COLORS = [
  { value: "#ef4444", label: "Red" },
  { value: "#f97316", label: "Orange" },
  { value: "#eab308", label: "Yellow" },
  { value: "#22c55e", label: "Green" },
  { value: "#14b8a6", label: "Teal" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#8b5cf6", label: "Violet" },
  { value: "#ec4899", label: "Pink" },
  { value: "#64748b", label: "Slate" },
]

export default function Pattern() {
  const [name, setName] = useState("Needs design")
  const [color, setColor] = useState<string | null>("#8b5cf6")
  const custom =
    !!color && !LABEL_COLORS.some((preset) => preset.value === color)
  const ink = color ? getForegroundColor(color) : null

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Edit label</CardTitle>
        <CardDescription>Labels group issues across projects.</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="label-name">Name</FieldLabel>
            <Input
              id="label-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel id="label-color-label">Color</FieldLabel>
            <ColorPicker value={color} onValueChange={setColor}>
              <div className="flex items-center gap-3">
                <ColorPickerSwatches
                  colors={LABEL_COLORS}
                  shape="circle"
                  aria-labelledby="label-color-label"
                  className="flex-1"
                />
                {/* The plus opens the full picker; once a custom color is
                    set, it shows that color instead. */}
                <ColorPickerTrigger size="icon-sm" aria-label="Custom color">
                  {custom ? (
                    <ColorPickerSwatch shape="circle" />
                  ) : (
                    <IconPlaceholder
                      lucide="PlusIcon"
                      tabler="IconPlus"
                      hugeicons="PlusSignIcon"
                      phosphor="PlusIcon"
                      remixicon="RiAddLine"
                      aria-hidden="true"
                    />
                  )}
                </ColorPickerTrigger>
                <ColorPickerContent align="end" />
              </div>
            </ColorPicker>
          </Field>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-sm">Preview</span>
            <Badge
              style={{
                backgroundColor: color ?? undefined,
                color: ink ?? undefined,
              }}
            >
              {name.trim() || "Untitled"}
            </Badge>
          </div>
        </FieldGroup>
      </CardContent>
    </Card>
  )
}
