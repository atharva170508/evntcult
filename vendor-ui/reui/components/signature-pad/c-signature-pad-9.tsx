"use client"

import { useId, useState } from "react"
import { Badge } from "@/registry-reui/bases/radix/reui/badge"
import {
  SignaturePad,
  SignaturePadArea,
  SignaturePadClear,
  SignaturePadControls,
  SignaturePadGuide,
  SignaturePadPlaceholder,
  type SignaturePadPointerType,
} from "@/registry-reui/bases/radix/reui/signature-pad"

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/registry/bases/radix/ui/field"
import { Switch } from "@/registry/bases/radix/ui/switch"

const INPUT_LABEL: Record<SignaturePadPointerType, string> = {
  pen: "Stylus, width from pressure",
  touch: "Finger, width from speed",
  mouse: "Mouse, width from speed",
}

export default function Pattern() {
  const id = useId()
  const [penOnly, setPenOnly] = useState(false)
  const [lastInput, setLastInput] = useState<SignaturePadPointerType | null>(
    null
  )

  return (
    <SignaturePad
      /* A stylus reports pressure; accepting only it ignores a resting palm. */
      pointerTypes={penOnly ? ["pen"] : undefined}
      onStrokeStart={({ pointerType }) => setLastInput(pointerType)}
      className="mx-auto max-w-lg"
    >
      <Field orientation="horizontal">
        <FieldContent>
          <FieldLabel htmlFor={`${id}-pen`}>Pen only</FieldLabel>
          <FieldDescription>
            Ignore touch and mouse, so a hand resting on the screen leaves no
            marks.
          </FieldDescription>
        </FieldContent>
        <Switch
          id={`${id}-pen`}
          checked={penOnly}
          onCheckedChange={(checked) => setPenOnly(checked)}
        />
      </Field>
      <SignaturePadArea className="h-48">
        <SignaturePadGuide />
        <SignaturePadPlaceholder>
          {penOnly
            ? "Sign with a stylus"
            : "Sign with a stylus, finger or mouse"}
        </SignaturePadPlaceholder>
        <SignaturePadControls position="top-end">
          <SignaturePadClear variant="ghost" />
        </SignaturePadControls>
      </SignaturePadArea>
      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        Last stroke
        <Badge variant="outline">
          {lastInput ? INPUT_LABEL[lastInput] : "None yet"}
        </Badge>
      </div>
    </SignaturePad>
  )
}
