"use client"

import { useRef, useState } from "react"
import { Frame, FramePanel } from "@/registry-reui/bases/radix/reui/frame"
import {
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperPanel,
  StepperTitle,
  StepperTrigger,
} from "@/registry-reui/bases/radix/reui/stepper"

import { Button } from "@/registry/bases/radix/ui/button"
import { Separator } from "@/registry/bases/radix/ui/separator"
import { IconPlaceholder } from "@/app/(create)/components/icon-placeholder"

const steps = [
  {
    title: "Resolution",
    detail: "Pick the fix: roll api-gateway back to v2.14.1.",
    icon: (
      <IconPlaceholder
        lucide="LightbulbIcon"
        tabler="IconBulb"
        hugeicons="Idea01Icon"
        phosphor="LightbulbIcon"
        remixicon="RiLightbulbLine"
        className="size-3.5"
        aria-hidden="true"
      />
    ),
  },
  {
    title: "Scoping",
    detail: "Limit the change to 6 pods in eu-west-1.",
    icon: (
      <IconPlaceholder
        lucide="TargetIcon"
        tabler="IconTarget"
        hugeicons="Target01Icon"
        phosphor="TargetIcon"
        remixicon="RiFocus3Line"
        className="size-3.5"
        aria-hidden="true"
      />
    ),
  },
  {
    title: "Execution",
    detail: "Replace the pods one at a time.",
    icon: (
      <IconPlaceholder
        lucide="WorkflowIcon"
        tabler="IconSitemap"
        hugeicons="WorkflowCircle01Icon"
        phosphor="TreeStructureIcon"
        remixicon="RiFlowChart"
        className="size-3.5"
        aria-hidden="true"
      />
    ),
  },
  {
    title: "Verification",
    detail: "Watch error rate and p95 latency for 10 min.",
    icon: (
      <IconPlaceholder
        lucide="CheckSquareIcon"
        tabler="IconCheckbox"
        hugeicons="CheckmarkSquare02Icon"
        phosphor="CheckSquareIcon"
        remixicon="RiCheckboxLine"
        className="size-3.5"
        aria-hidden="true"
      />
    ),
  },
  {
    title: "Approval",
    detail: "The incident lead signs off on the fix.",
    icon: (
      <IconPlaceholder
        lucide="ClockCheckIcon"
        tabler="IconClockCheck"
        hugeicons="ClockCheckIcon"
        phosphor="ClockIcon"
        remixicon="RiTimeLine"
        className="size-3.5"
        aria-hidden="true"
      />
    ),
  },
  {
    title: "Summary",
    detail: "Record the root cause and follow-ups.",
    icon: (
      <IconPlaceholder
        lucide="FileTextIcon"
        tabler="IconFileText"
        hugeicons="File02Icon"
        phosphor="FileTextIcon"
        remixicon="RiFileTextLine"
        className="size-3.5"
        aria-hidden="true"
      />
    ),
  },
]

const completed = (
  <IconPlaceholder
    lucide="CheckIcon"
    tabler="IconCheck"
    hugeicons="Tick02Icon"
    phosphor="CheckIcon"
    remixicon="RiCheckLine"
    className="size-2.5"
    aria-hidden="true"
  />
)

export default function Pattern() {
  const [current, setCurrent] = useState(3)
  const prevRef = useRef<HTMLButtonElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  // One past the last step marks every step complete. No tab is selected
  // then, so the last one keeps the tablist's tab stop.
  const allDone = current > steps.length

  function goTo(step: number) {
    setCurrent(step)
    // The pressed button disables itself at either end, so focus moves to
    // its partner.
    if (step === 1) nextRef.current?.focus()
    if (step > steps.length) prevRef.current?.focus()
  }

  return (
    <div className="@container mx-auto w-full max-w-lg">
      <Stepper
        value={current}
        onValueChange={setCurrent}
        orientation="vertical"
        indicators={{ completed }}
        className="flex flex-col gap-6 @md:flex-row @md:items-start"
        aria-label="Incident workflow"
      >
        {/* A bare frame that paints nothing: it only hands each row its
            per-style radius, padding and border color. 6px of block padding
            around the 20px text-sm line keeps the drawn 34px row. */}
        <Frame
          variant="ghost"
          spacing="xs"
          className="w-full max-w-45 shrink-0 bg-transparent p-0 [--frame-panel-py-base:--spacing(1.5)]"
        >
          <StepperNav className="gap-1.5">
            {steps.map((item, index) => {
              const step = index + 1

              // Every row is a panel whose border stays transparent until it
              // is active, so the selection moves without shifting a row, and
              // gap-1.5 absorbs that border to keep the design's row pitch.
              // 3px under the ghost panel radius lands on the drawn 8px. The
              // theme has no blue token, so the active row takes blue-500.
              return (
                <StepperItem key={item.title} step={step}>
                  <StepperTrigger
                    tabIndex={allDone && step === steps.length ? 0 : undefined}
                    asChild
                    className="text-muted-foreground hover:bg-muted/50 data-[state=active]:bg-muted/50 data-[state=completed]:text-foreground w-full gap-2 rounded-[calc(var(--frame-panel-radius)-3px)] border-transparent bg-transparent shadow-none data-[state=active]:border-(--frame-panel-border-color) data-[state=active]:text-blue-500"
                  >
                    <FramePanel>
                      {item.icon}
                      <StepperTitle className="min-w-0 flex-1 truncate leading-5">
                        {item.title}
                      </StepperTitle>
                      {step < current && (
                        <span className="sr-only">, completed</span>
                      )}
                      <StepperIndicator className="data-[state=completed]:bg-success size-3.5 not-data-[state=completed]:hidden data-[state=completed]:text-white" />
                      {step === current && (
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute start-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-e-full bg-blue-500"
                        />
                      )}
                    </FramePanel>
                  </StepperTrigger>
                </StepperItem>
              )
            })}
          </StepperNav>
        </Frame>

        {/* Stacked, 9px (a row's 1px border plus its 8px inline padding)
            lines the copy up with the step icons above it. */}
        {/* Decorative, so hidden from assistive tech: a line across while the
            columns stack, a line between them once they sit side by side. */}
        <Separator aria-hidden="true" className="@md:hidden" />
        <Separator
          aria-hidden="true"
          orientation="vertical"
          className="hidden @md:block"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-3 px-2.25 text-start @md:px-0">
          <StepperPanel>
            {steps.map((item, index) => (
              <StepperContent key={item.title} value={index + 1}>
                <p className="text-muted-foreground text-xs">
                  Step {index + 1} of {steps.length}
                </p>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-muted-foreground text-sm text-pretty">
                  {item.detail}
                </p>
              </StepperContent>
            ))}
            <StepperContent value={steps.length + 1}>
              <p className="text-muted-foreground text-xs">
                All {steps.length} steps done
              </p>
              <p className="text-sm font-medium">Incident closed</p>
              <p className="text-muted-foreground text-sm text-pretty">
                Approved and summarized, with every step done.
              </p>
            </StepperContent>
          </StepperPanel>
          <div className="flex justify-start gap-2">
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
        </div>
      </Stepper>
    </div>
  )
}
