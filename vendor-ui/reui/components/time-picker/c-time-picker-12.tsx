"use client"

import { useId, useState } from "react"
import { TimePicker } from "@/registry-reui/bases/radix/reui/time-picker"

import { Button } from "@/registry/bases/radix/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/registry/bases/radix/ui/field"

export default function Pattern() {
  const id = useId()
  const [invalid, setInvalid] = useState(false)
  const [booked, setBooked] = useState<string | null>(null)

  return (
    /* `noValidate`: the Field draws the error, not the browser bubble. */
    <form
      noValidate
      className="mx-auto w-full max-w-sm"
      onSubmit={(event) => {
        event.preventDefault()
        /* The picker submits `HH:mm` under its `name`, or "" while empty. */
        const time = String(
          new FormData(event.currentTarget).get("deliveryTime") ?? ""
        )
        setInvalid(!time)
        setBooked(time || null)
      }}
      onReset={() => {
        /* The picker returns to its default (empty) on the same reset. */
        setInvalid(false)
        setBooked(null)
      }}
    >
      <FieldGroup>
        <Field data-invalid={invalid || undefined}>
          <FieldLabel id={`${id}-label`} htmlFor={id}>
            Delivery time
          </FieldLabel>
          <TimePicker
            id={id}
            name="deliveryTime"
            required
            /* Sets aria-invalid on the trigger; the Field colors the label. */
            invalid={invalid}
            minuteStep={30}
            min="08:00"
            max="20:00"
            aria-labelledby={`${id}-label`}
            aria-describedby={`${id}-hint`}
            onValueChange={(next) => {
              /* A pick clears the error; emptying the field waits for Submit. */
              if (next) setInvalid(false)
            }}
          />
          {/* One id for both, so aria-describedby follows whichever is shown. */}
          {invalid ? (
            <FieldError id={`${id}-hint`}>
              Choose a delivery time to continue.
            </FieldError>
          ) : (
            <FieldDescription id={`${id}-hint`}>
              30-minute slots between 08:00 and 20:00.
            </FieldDescription>
          )}
        </Field>
        <div className="flex items-center gap-2">
          <Button type="submit">Submit</Button>
          <Button type="reset" variant="outline">
            Reset
          </Button>
          <p
            role="status"
            className="text-muted-foreground ms-auto min-w-0 truncate text-sm"
          >
            {booked && `Delivery booked for ${booked}`}
          </p>
        </div>
      </FieldGroup>
    </form>
  )
}
