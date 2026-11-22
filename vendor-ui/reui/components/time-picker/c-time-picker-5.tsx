import {
  TimePicker,
  TimePickerContent,
  TimePickerTrigger,
} from "@/registry-reui/bases/radix/reui/time-picker"

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/registry/bases/radix/ui/item"
import { IconPlaceholder } from "@/app/(create)/components/icon-placeholder"

export default function Pattern() {
  return (
    <div className="w-full max-w-sm">
      <Item variant="outline">
        <ItemMedia variant="icon">
          <IconPlaceholder
            lucide="MailIcon"
            tabler="IconMail"
            hugeicons="Mail01Icon"
            phosphor="EnvelopeIcon"
            remixicon="RiMailLine"
            aria-hidden="true"
          />
        </ItemMedia>
        <ItemContent>
          <ItemTitle id="digest-time-title">Daily digest</ItemTitle>
          <ItemDescription id="digest-time-description">
            Mentions, replies and new tasks, once a day.
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          {/* Hour granularity leaves 2 columns, hour and AM/PM, and every
              value lands on the hour ("09:00", "21:00"). The row title names
              the trigger, which adds its value: "Daily digest 09:00 AM". */}
          <TimePicker
            granularity="hour"
            hourCycle={12}
            defaultValue="09:00"
            aria-labelledby="digest-time-title"
            aria-describedby="digest-time-description"
          >
            <TimePickerTrigger size="sm" className="w-32" />
            {/* The trigger sits at the row's end, so `align="end"` keeps the
                popover under the row instead of hanging past its edge. */}
            <TimePickerContent align="end" />
          </TimePicker>
        </ItemActions>
      </Item>
    </div>
  )
}
