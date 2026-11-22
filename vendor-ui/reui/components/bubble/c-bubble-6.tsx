"use client"

import { useState } from "react"

import {
  Bubble,
  BubbleContent,
  BubbleGroup,
} from "@/registry/bases/radix/ui/bubble"
import { Button } from "@/registry/bases/radix/ui/button"
import { Card, CardContent } from "@/registry/bases/radix/ui/card"
import { IconPlaceholder } from "@/app/(create)/components/icon-placeholder"

// Each pickable option carries the answer it earns. One confirmation string
// shared by both would contradict whichever option it was not written for, and
// the two here ask for opposite things.
const options: {
  id: string
  label: string
  reply?: string
  href?: string
}[] = [
  {
    id: "retry",
    label: "Retry both invoices now",
    reply: "Queued again. INV-4417 and INV-4419 go out on the next run.",
  },
  {
    id: "hold",
    label: "Hold them until I check the addresses",
    reply: "Held. Neither invoice sends until you confirm the addresses.",
  },
  { id: "log", label: "Open the failed invoice log", href: "#" },
]

export default function Pattern() {
  const [picked, setPicked] = useState<string | null>(null)
  const chosen = options.find((option) => option.id === picked)

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="flex flex-col gap-4">
        <Bubble variant="muted">
          <BubbleContent>
            Two invoices failed to send last night. What do you want to do?
          </BubbleContent>
        </Bubble>
        {chosen ? (
          <>
            <Bubble align="end">
              <BubbleContent>{chosen.label}</BubbleContent>
            </Bubble>
            {/* max-w-full lifts the 80% cap for the one bubble that carries
                controls, and it needs no `!` because a plain utility already
                outranks the style sheet. */}
            <Bubble variant="outline" className="max-w-full">
              <BubbleContent>
                {chosen.reply}
                {/* Both actions move the thread forward. Repeating the pick or
                    the link option still on offer would give the reader a row
                    of choices they have already made. */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm">Check addresses</Button>
                  <Button variant="outline" size="sm">
                    Notify the owner
                  </Button>
                </div>
              </BubbleContent>
            </Bubble>
          </>
        ) : (
          <BubbleGroup>
            {options.map((option) =>
              option.href ? (
                <Bubble key={option.id} variant="tinted" align="end">
                  {/* This option is an anchor and not a button, because it
                      leaves the thread instead of answering it. asChild keeps
                      that difference in the DOM, so middle click still works. */}
                  <BubbleContent asChild>
                    <a href={option.href}>
                      {option.label}
                      <IconPlaceholder
                        lucide="ArrowUpRightIcon"
                        tabler="IconArrowUpRight"
                        hugeicons="ArrowUpRight01Icon"
                        phosphor="ArrowUpRightIcon"
                        remixicon="RiArrowRightUpLine"
                        aria-hidden="true"
                        className="ms-1 inline size-4 align-text-bottom"
                      />
                    </a>
                  </BubbleContent>
                </Bubble>
              ) : (
                <Bubble key={option.id} variant="tinted" align="end">
                  {/* asChild turns the content element itself into the button,
                      which earns the focus ring and the hover the variant
                      already ships; a button nested inside it would get
                      neither. The visible text is the accessible name. */}
                  <BubbleContent asChild>
                    <button type="button" onClick={() => setPicked(option.id)}>
                      {option.label}
                    </button>
                  </BubbleContent>
                </Bubble>
              )
            )}
          </BubbleGroup>
        )}
      </CardContent>
    </Card>
  )
}
