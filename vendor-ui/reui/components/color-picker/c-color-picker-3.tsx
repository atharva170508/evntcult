import {
  ColorPicker,
  ColorPickerContent,
  ColorPickerInput,
} from "@/registry-reui/bases/radix/reui/color-picker"

import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/registry/bases/radix/ui/field"

export default function Pattern() {
  return (
    <div className="w-full max-w-xs">
      <Field>
        <FieldLabel htmlFor="canvas-background">Canvas background</FieldLabel>
        {/* The input reads any CSS color on blur or Enter and writes it back
            as hex; the swatch button opens the full picker. */}
        <ColorPicker id="canvas-background" defaultValue="#f8fafc">
          <ColorPickerInput aria-describedby="canvas-background-description" />
          <ColorPickerContent />
        </ColorPicker>
        <FieldDescription id="canvas-background-description">
          Type a hex code, rgb(), hsl(), oklch() or a name like tomato.
        </FieldDescription>
      </Field>
    </div>
  )
}
