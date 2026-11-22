"use client"

import { useEffect, useRef, useState } from "react"
import { IconTile } from "@/registry-reui/bases/radix/reui/icon-tile"
import {
  Stepper,
  StepperContent,
  StepperItem,
  StepperNav,
  StepperPanel,
  StepperTitle,
  StepperTrigger,
} from "@/registry-reui/bases/radix/reui/stepper"
import { cn } from "cn"

import { Button } from "@/registry/bases/radix/ui/button"

const stages = [
  {
    title: "Lead",
    description: "Inbound request from the pricing page, assigned to a rep.",
  },
  {
    title: "Contact",
    description: "First call with the buyer to walk through the product.",
  },
  {
    title: "Qualify",
    description: "Confirm the budget, the decision makers and the timeline.",
  },
  {
    title: "Discovery",
    description: "Map the current workflow and what success looks like.",
  },
  {
    title: "Proposal",
    description: "Send pricing for 120 seats on a 3-year plan.",
  },
  {
    title: "Negotiation",
    description: "Agree on terms and the volume discount with procurement.",
  },
  {
    title: "Approval",
    description: "Final sign-off from finance before the contract goes out.",
  },
]

// Each trigger is clipped to a chevron: a 16px arrow at the end and a 16px
// notch at the start. It overlaps the previous stage by 14px, so the notch
// wraps that arrow with a 2px gap. The first stage drops the notch and the last
// the arrow; their outer corners take --radius-sm less 2px (4px by default).
// A polygon cannot round a corner, so the design's rounded tip, shoulders and
// notch are sampled as a few points each, scaled by --arrow and --notch.
// As in the design, the tint sits on ::after over an opaque base.
const chevron =
  "relative isolate bg-background after:absolute after:inset-0 after:-z-10 after:rounded-[inherit] -ms-3.5 rounded-none [--arrow:--spacing(4)] [--notch:--spacing(4)] group-first/step:ms-0 group-first/step:rounded-s-[calc(var(--radius-sm)-2px)] group-first/step:[--notch:0px] group-last/step:rounded-e-[calc(var(--radius-sm)-2px)] group-last/step:[--arrow:0px] [clip-path:polygon(calc(var(--notch)*0.167)_0,calc(100%_-_var(--arrow)*1.113)_0,calc(100%_-_var(--arrow)*1.01)_0.98%,calc(100%_-_var(--arrow)*0.926)_3.73%,calc(100%_-_var(--arrow)*0.148)_42.62%,calc(100%_-_var(--arrow)*0.092)_47.38%,calc(100%_-_var(--arrow)*0.092)_52.62%,calc(100%_-_var(--arrow)*0.148)_57.38%,calc(100%_-_var(--arrow)*0.926)_96.27%,calc(100%_-_var(--arrow)*1.01)_99.02%,calc(100%_-_var(--arrow)*1.113)_100%,calc(var(--notch)*0.167)_100%,calc(var(--notch)*0.111)_94.45%,calc(var(--notch)*0.852)_57.38%,calc(var(--notch)*0.908)_52.62%,calc(var(--notch)*0.908)_47.38%,calc(var(--notch)*0.852)_42.62%,calc(var(--notch)*0.111)_5.55%)] rtl:[clip-path:polygon(calc(100%_-_var(--notch)*0.167)_0,calc(var(--arrow)*1.113)_0,calc(var(--arrow)*1.01)_0.98%,calc(var(--arrow)*0.926)_3.73%,calc(var(--arrow)*0.148)_42.62%,calc(var(--arrow)*0.092)_47.38%,calc(var(--arrow)*0.092)_52.62%,calc(var(--arrow)*0.148)_57.38%,calc(var(--arrow)*0.926)_96.27%,calc(var(--arrow)*1.01)_99.02%,calc(var(--arrow)*1.113)_100%,calc(100%_-_var(--notch)*0.167)_100%,calc(100%_-_var(--notch)*0.111)_94.45%,calc(100%_-_var(--notch)*0.852)_57.38%,calc(100%_-_var(--notch)*0.908)_52.62%,calc(100%_-_var(--notch)*0.908)_47.38%,calc(100%_-_var(--notch)*0.852)_42.62%,calc(100%_-_var(--notch)*0.111)_5.55%)]"

export default function Pattern() {
  const [current, setCurrent] = useState(3)
  const prevRef = useRef<HTMLButtonElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  // One past the last step marks every step complete. No tab is selected
  // then, so the last one keeps the tablist's tab stop.
  const allDone = current > stages.length

  // Past the collapsed width (many steps in a small box) the row scrolls, so
  // the current step comes back into view when it changes or the row resizes,
  // and a tab comes into view when focus lands on it (the browser leaves a
  // half-hidden one where it is). Only the row scrolls, never the page.
  const rowRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const row = rowRef.current
    if (!row) return
    const reveal = (tab: Element | null) => {
      if (!tab) return
      const box = row.getBoundingClientRect()
      const { left, right } = tab.getBoundingClientRect()
      if (left < box.left || right > box.right) {
        row.scrollLeft += (left + right - box.left - box.right) / 2
      }
    }
    const onFocus = (event: FocusEvent) =>
      reveal((event.target as Element).closest('[role="tab"]'))
    const observer = new ResizeObserver(() =>
      reveal(row.querySelector('[aria-selected="true"]'))
    )
    observer.observe(row)
    row.addEventListener("focusin", onFocus)
    return () => {
      observer.disconnect()
      row.removeEventListener("focusin", onFocus)
    }
  }, [current])

  function goTo(step: number) {
    setCurrent(step)
    // The pressed button disables itself at either end, so focus moves to
    // its partner.
    if (step === 1) nextRef.current?.focus()
    if (step > stages.length) prevRef.current?.focus()
  }

  return (
    <Stepper
      value={current}
      onValueChange={setCurrent}
      className="flex max-w-4xl flex-col gap-6"
      aria-label="Sales pipeline"
    >
      {/* With every label the bar needs about 820px, so under 56rem the
          stages around the current one drop to their number, and under 24rem
          the current one too (the panel names it). Past that
          min-w-max holds the row and the bar scrolls instead of squeezing a
          label; the padding keeps the focus outline in view. */}
      <div
        ref={rowRef}
        className="@container relative -m-1 overflow-x-auto p-1"
      >
        <StepperNav className="flex min-w-max justify-center">
          {stages.map((stage, index) => {
            const step = index + 1

            return (
              // The clip also hides the trigger's own focus ring, so the item
              // traces the chevron with a 1.5px drop-shadow outline, which the
              // opaque base keeps from showing through the tint. The item
              // ignores the pointer, so once raised its box cannot take clicks
              // meant for the next stage's notch.
              <StepperItem
                key={stage.title}
                step={step}
                className="pointer-events-none not-last:flex-none has-focus-visible:z-10 has-focus-visible:[filter:drop-shadow(1.5px_0_var(--color-ring))_drop-shadow(-1.5px_0_var(--color-ring))_drop-shadow(0_1.5px_var(--color-ring))_drop-shadow(0_-1.5px_var(--color-ring))]"
              >
                {/* The theme has no blue token, so the current stage takes
                    the palette blue-500. */}
                <StepperTrigger
                  tabIndex={allDone && step === stages.length ? 0 : undefined}
                  className={cn(
                    chevron,
                    "after:bg-input/40 not-data-[state=active]:hover:after:bg-input/60 data-[state=completed]:after:bg-input/50 pointer-events-auto h-9 gap-1.5 ps-6.5 pe-6 group-first/step:ps-3 group-last/step:pe-3 data-[state=active]:text-white data-[state=active]:after:bg-blue-500"
                  )}
                >
                  {/* Without the border, the 2px inset alone frames the
                      16px keycap inside the 20px tile, and overflow-hidden
                      keeps the keycap's shadow inside that ring. */}
                  <IconTile
                    variant="frame"
                    size="xs"
                    aria-hidden="true"
                    className="bg-input/30 group-data-[state=completed]/step:bg-input/60 after:border-ring/30 overflow-hidden border-0 text-xs leading-none font-medium [--icon-tile-size:--spacing(5)] group-data-[state=active]/step:bg-white/20 group-data-[state=active]/step:text-blue-500 after:border-[0.5px] after:shadow-sm group-data-[state=active]/step:after:border-blue-500 group-data-[state=active]/step:after:bg-white"
                  >
                    {step}
                  </IconTile>
                  <StepperTitle className="whitespace-nowrap @max-4xl:not-data-[state=active]:sr-only @max-sm:sr-only">
                    {stage.title}
                  </StepperTitle>
                  {step < current && (
                    <span className="sr-only">, completed</span>
                  )}
                </StepperTrigger>
              </StepperItem>
            )
          })}
        </StepperNav>
      </div>

      <StepperPanel className="text-center">
        {stages.map((stage, index) => (
          <StepperContent key={stage.title} value={index + 1}>
            <p className="text-muted-foreground text-xs">
              Stage {index + 1} of {stages.length}
            </p>
            <p className="text-sm font-medium">{stage.title}</p>
            <p className="text-muted-foreground text-sm">{stage.description}</p>
          </StepperContent>
        ))}
        <StepperContent value={stages.length + 1}>
          <p className="text-muted-foreground text-xs">
            All {stages.length} stages done
          </p>
          <p className="text-sm font-medium">Deal approved</p>
          <p className="text-muted-foreground text-sm">
            Every stage is cleared and the contract is ready to sign.
          </p>
        </StepperContent>
        <div className="mt-3 flex justify-center gap-2">
          <Button
            ref={prevRef}
            variant="outline"
            size="sm"
            disabled={current === 1}
            onClick={() => goTo(current - 1)}
          >
            Previous
          </Button>
          <Button
            ref={nextRef}
            variant="outline"
            size="sm"
            disabled={allDone}
            onClick={() => goTo(current + 1)}
          >
            Next
          </Button>
        </div>
      </StepperPanel>
    </Stepper>
  )
}
