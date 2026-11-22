"use client"

import { useEffect, useRef, useState } from "react"
import { IconTile } from "@/registry-reui/bases/radix/reui/icon-tile"
import {
  Stepper,
  StepperContent,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperPanel,
  StepperTitle,
  StepperTrigger,
} from "@/registry-reui/bases/radix/reui/stepper"

import { Button } from "@/registry/bases/radix/ui/button"
import { IconPlaceholder } from "@/app/(create)/components/icon-placeholder"

const steps = [
  {
    title: "Choose Resolution",
    detail: "Pick a fix: roll back, scale out or patch forward.",
    icon: (
      <IconPlaceholder
        lucide="ListChecksIcon"
        tabler="IconListCheck"
        hugeicons="CheckListIcon"
        phosphor="ListChecksIcon"
        remixicon="RiListCheck"
      />
    ),
  },
  {
    title: "Execute Resolution",
    detail: "Rolling back api-gateway to v2.14.1 across 6 pods.",
    icon: (
      <IconPlaceholder
        lucide="WorkflowIcon"
        tabler="IconSitemap"
        hugeicons="WorkflowCircle01Icon"
        phosphor="TreeStructureIcon"
        remixicon="RiFlowChart"
      />
    ),
  },
  {
    title: "Verify Outcome",
    detail: "Watching error rate and p95 latency for 10 minutes.",
    icon: (
      <IconPlaceholder
        lucide="ClipboardCheckIcon"
        tabler="IconClipboardCheck"
        hugeicons="TaskDone02Icon"
        phosphor="ClipboardTextIcon"
        remixicon="RiClipboardLine"
      />
    ),
  },
  {
    title: "Resolution Summary",
    detail: "Timeline, root cause and follow-ups for the postmortem.",
    icon: (
      <IconPlaceholder
        lucide="ScrollTextIcon"
        tabler="IconScript"
        hugeicons="ScrollIcon"
        phosphor="ScrollIcon"
        remixicon="RiFileListLine"
      />
    ),
  },
]

export default function Pattern() {
  const [current, setCurrent] = useState(2)
  const prevRef = useRef<HTMLButtonElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  // One past the last step marks every step complete. No tab is selected
  // then, so the last one keeps the tablist's tab stop.
  const allDone = current > steps.length

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
    // The pressed button disables itself at either end, so focus moves to its partner.
    if (step === 1) nextRef.current?.focus()
    if (step > steps.length) prevRef.current?.focus()
  }

  return (
    <Stepper
      value={current}
      onValueChange={setCurrent}
      className="flex max-w-4xl flex-col gap-6"
      aria-label="Incident resolution"
    >
      {/* Under 56rem every step drops to its tile, so the tiles hold still
          as the current step moves and the panel names it; past that
          min-w-max holds the row and the box scrolls instead of crushing it. The padding keeps the tiles' focus ring inside the
          scroll box, and flex (not inline-flex) leaves no line-box gap under
          the row. */}
      <div
        ref={rowRef}
        className="@container relative -m-1 overflow-x-auto p-1"
      >
        <StepperNav className="flex min-w-max justify-center gap-4">
          {steps.map((item, index) => {
            const step = index + 1

            // Steps hug their content with 16px either side of each chevron,
            // as drawn, instead of the primitive's flex-1 spread.
            return (
              <StepperItem
                key={item.title}
                step={step}
                className="gap-4 not-last:flex-none"
              >
                {/* The focus ring moves from the pill-shaped trigger onto the
                    tile, so it follows the tile's corners in every style. The
                    indicator goes overflow-visible so its round clip cuts
                    neither the tile's corners nor that ring. */}
                <StepperTrigger
                  tabIndex={allDone && step === steps.length ? 0 : undefined}
                  className="gap-2 focus-visible:ring-0"
                >
                  <StepperIndicator className="size-8.5 overflow-visible bg-transparent data-[state=active]:bg-transparent data-[state=completed]:bg-transparent">
                    {/* The frame tile's 1px border, made transparent, plus its
                        2px inset form the 3px tinted ring around a 28px card.
                        The step's data-state picks the tone. */}
                    <IconTile
                      variant="frame"
                      size="sm"
                      className="bg-input/40 text-ring/80 after:bg-background after:border-ring/30 in-focus-visible:ring-ring/50 group-data-[state=active]/step:bg-input/60 group-data-[state=active]/step:text-foreground group-data-[state=completed]/step:bg-success/20 group-data-[state=completed]/step:after:bg-success border-transparent [--icon-tile-icon-size:--spacing(3.5)] [--icon-tile-size:--spacing(8.5)] group-data-[state=completed]/step:text-white after:shadow-sm group-data-[state=completed]/step:after:border-white/8 in-focus-visible:ring-3"
                      aria-hidden="true"
                    >
                      {item.icon}
                    </IconTile>
                  </StepperIndicator>

                  {/* Pending titles drop to muted-foreground; done and current steps
                      keep full contrast. */}
                  <div className="flex flex-col gap-1 text-start whitespace-nowrap @max-4xl:sr-only">
                    <StepperTitle className="data-[state=inactive]:text-muted-foreground">
                      {item.title}
                    </StepperTitle>
                    <StepperDescription className="text-xs">
                      Step {step}
                    </StepperDescription>
                    {step < current && (
                      <span className="sr-only">, completed</span>
                    )}
                  </div>
                </StepperTrigger>

                {step < steps.length && (
                  <IconPlaceholder
                    lucide="ChevronRightIcon"
                    tabler="IconChevronRight"
                    hugeicons="ArrowRight01Icon"
                    phosphor="CaretRightIcon"
                    remixicon="RiArrowRightSLine"
                    className="text-ring/80 size-3.5 shrink-0 rtl:rotate-180"
                    aria-hidden="true"
                  />
                )}
              </StepperItem>
            )
          })}
        </StepperNav>
      </div>

      <StepperPanel className="text-center">
        {steps.map((item, index) => (
          <StepperContent key={item.title} value={index + 1}>
            <p className="text-sm font-medium">{item.title}</p>
            <p className="text-muted-foreground text-sm">{item.detail}</p>
          </StepperContent>
        ))}
        <StepperContent value={steps.length + 1}>
          <p className="text-sm font-medium">Incident resolved</p>
          <p className="text-muted-foreground text-sm">
            The postmortem is filed and the incident closed.
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
