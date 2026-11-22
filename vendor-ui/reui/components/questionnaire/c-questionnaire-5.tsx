"use client"

import { useId, useState, type FormEvent } from "react"
import { Badge } from "@/registry-reui/bases/radix/reui/badge"
import type { QuestionnaireItemStatus } from "@shadcn/react/questionnaire"

import { Button } from "@/registry/bases/radix/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/registry/bases/radix/ui/card"
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from "@/registry/bases/radix/ui/questionnaire"

type Option = { value: string; label: string }

const CURRENT: Option[] = [
  { value: "sheets", label: "Spreadsheets on a shared drive" },
  { value: "legacy", label: "An in-house tool" },
  { value: "vendor", label: "Another vendor" },
]

const WATCH: Option[] = [
  { value: "fields", label: "Custom fields we cannot lose" },
  { value: "exports", label: "Historical exports" },
  { value: "sso", label: "Single sign-on" },
]

const WINDOWS: Option[] = [
  { value: "weekend", label: "A weekend" },
  { value: "evening", label: "A weekday evening" },
  { value: "anytime", label: "Any time, we can take downtime" },
]

// Omitting required from this one entry is the whole switch. Skip renders only
// while the active item is optional, so it appears on the middle question and
// on neither of its neighbours.
//
// Optional does not mean passable. An item counts as satisfied when it is
// answered, skipped or disabled, so the visitor still has to declare one way
// or the other before Next will move off the middle question.
const ITEMS = [
  { name: "from", required: true },
  { name: "watch" },
  { name: "window", required: true },
]

const WATCH_BADGE = {
  answered: { label: "Optional - answered", variant: "primary-light" },
  skipped: { label: "Optional - skipped", variant: "outline" },
  unanswered: { label: "Optional - not answered", variant: "secondary" },
} as const

type Summary = { from: string; watch: string; window: string }

// The optional question takes a written note as well as three choices, and
// either of them marks it answered. An entry matching no choice is that note,
// so it comes back as typed rather than mapped.
function answerLabel(options: Option[], value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") {
    return "Not answered"
  }

  return options.find((option) => option.value === value)?.label ?? value
}

export default function Pattern() {
  // CardHeader sits between each fieldset and its legend, which stops the
  // legend naming the group. Pairing these ids with aria-labelledby on each
  // item puts that name back.
  const titleId = useId()

  // Skip clears whatever was ticked before it marks the item skipped, so a
  // half-answer can never ride along with a declined question. Answering
  // afterwards flips the status back, which is why the two cannot both hold.
  const [watchStatus, setWatchStatus] =
    useState<QuestionnaireItemStatus>("unanswered")
  const [summary, setSummary] = useState<Summary | null>(null)

  // Skipping is not the same as leaving a question blank, and FormData cannot
  // tell them apart: both arrive as nothing. onStatusChange is the only place
  // that distinction survives, which is what the middle row below reports.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)

    setSummary({
      from: answerLabel(CURRENT, formData.get("from")),
      watch:
        watchStatus === "skipped"
          ? "Skipped"
          : answerLabel(WATCH, formData.get("watch")),
      window: answerLabel(WINDOWS, formData.get("window")),
    })
  }

  // The flow unmounts while the summary is on screen, so the mirrored status
  // has to be cleared alongside it. Leaving it would reopen an untouched
  // question under a badge still reporting it as skipped.
  function startOver() {
    setSummary(null)
    setWatchStatus("unanswered")
  }

  if (summary) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle>Migration booked</CardTitle>
          <CardDescription>
            An engineer will confirm the window by email within one working day.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3">
            <div className="grid min-w-0 gap-0.5">
              <dt className="text-muted-foreground text-sm">Moving off</dt>
              <dd className="text-sm font-medium">{summary.from}</dd>
            </div>
            <div className="grid min-w-0 gap-0.5">
              <dt className="text-muted-foreground text-sm">Watch out for</dt>
              <dd className="text-sm font-medium">{summary.watch}</dd>
            </div>
            <div className="grid min-w-0 gap-0.5">
              <dt className="text-muted-foreground text-sm">Window</dt>
              <dd className="text-sm font-medium">{summary.window}</dd>
            </div>
          </dl>
        </CardContent>
        <CardFooter>
          <Button size="sm" variant="outline" onClick={startOver}>
            Start over
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    // The header row below lives outside the card on purpose. Only the active
    // fieldset has a layout box, so anything inside the card moves with the
    // question, while the progress and the badge should stay put across all
    // three.
    <Questionnaire
      className="mx-auto w-full max-w-md"
      defaultItem="from"
      items={ITEMS}
      onSubmit={handleSubmit}
    >
      <div className="flex items-center justify-between gap-2">
        <QuestionnaireProgress />
        <Badge variant={WATCH_BADGE[watchStatus].variant}>
          {WATCH_BADGE[watchStatus].label}
        </Badge>
      </div>

      <Card>
        <QuestionnaireItem
          aria-labelledby={`${titleId}-from`}
          name="from"
          required
        >
          <CardHeader>
            <QuestionnaireTitle id={`${titleId}-from`} render={<CardTitle />}>
              What are you moving off?
            </QuestionnaireTitle>
            <QuestionnaireDescription render={<CardDescription />}>
              We have an importer for each of these.
            </QuestionnaireDescription>
          </CardHeader>
          <CardContent>
            <QuestionnaireChoices>
              {CURRENT.map((option) => (
                <QuestionnaireChoice key={option.value} value={option.value}>
                  {option.label}
                </QuestionnaireChoice>
              ))}
            </QuestionnaireChoices>
            <QuestionnaireError />
          </CardContent>
        </QuestionnaireItem>

        <QuestionnaireItem
          aria-labelledby={`${titleId}-watch`}
          name="watch"
          onStatusChange={setWatchStatus}
        >
          <CardHeader>
            <QuestionnaireTitle id={`${titleId}-watch`} render={<CardTitle />}>
              Anything we should watch out for?
            </QuestionnaireTitle>
            <QuestionnaireDescription render={<CardDescription />}>
              Skip this if nothing comes to mind. It changes the plan, not the
              price.
            </QuestionnaireDescription>
          </CardHeader>
          <CardContent>
            <QuestionnaireChoices>
              {WATCH.map((option) => (
                <QuestionnaireChoice key={option.value} value={option.value}>
                  {option.label}
                </QuestionnaireChoice>
              ))}
              <QuestionnaireInput
                aria-label="Something else to watch out for"
                placeholder="Something else"
              />
            </QuestionnaireChoices>
            <QuestionnaireError />
          </CardContent>
        </QuestionnaireItem>

        <QuestionnaireItem
          aria-labelledby={`${titleId}-window`}
          name="window"
          required
        >
          <CardHeader>
            <QuestionnaireTitle id={`${titleId}-window`} render={<CardTitle />}>
              When is your migration window?
            </QuestionnaireTitle>
            <QuestionnaireDescription render={<CardDescription />}>
              Expect roughly two hours of read-only access.
            </QuestionnaireDescription>
          </CardHeader>
          <CardContent>
            <QuestionnaireChoices>
              {WINDOWS.map((option) => (
                <QuestionnaireChoice key={option.value} value={option.value}>
                  {option.label}
                </QuestionnaireChoice>
              ))}
            </QuestionnaireChoices>
            <QuestionnaireError />
          </CardContent>
        </QuestionnaireItem>

        <CardFooter>
          <QuestionnaireActions
            // Nothing extra goes in this grid. Its three columns are assigned
            // to Previous, Skip and Next or Submit, so a fourth child lands in
            // column one and jumps to a second row once Previous appears.
            //
            // The buttons hide with the hidden attribute over an inline-flex
            // base class, which only wins because preflight marks [hidden] as
            // display:none with !important. Without it, all four show at once.
            className="w-full"
          >
            <QuestionnairePrevious />
            <QuestionnaireSkip>Skip for now</QuestionnaireSkip>
            <QuestionnaireNext>Next</QuestionnaireNext>
            <QuestionnaireSubmit>Book the migration</QuestionnaireSubmit>
          </QuestionnaireActions>
        </CardFooter>
      </Card>
    </Questionnaire>
  )
}
