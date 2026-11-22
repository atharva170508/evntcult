"use client"

import { useId, useRef, useState } from "react"
import {
  DEFAULT_EMOJI_PICKER_I18N,
  EmojiPicker,
  EmojiPickerCategories,
  EmojiPickerContent,
  EmojiPickerFooter,
  EmojiPickerHeader,
  EmojiPickerList,
  EmojiPickerPreview,
  EmojiPickerSearch,
  EmojiPickerSkinTone,
  EmojiPickerTrigger,
  EmojiPickerValue,
  findEmoji,
  getEmojiValue,
  useEmojiPicker,
  type EmojiPickerEmoji,
  type EmojiPickerSkinTone as SkinTone,
} from "@/registry-reui/bases/radix/reui/emoji-picker"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/registry/bases/radix/ui/avatar"
import { Button } from "@/registry/bases/radix/ui/button"
import {
  Item,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from "@/registry/bases/radix/ui/item"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/registry/bases/radix/ui/tooltip"
import { IconPlaceholder } from "@/app/(create)/components/icon-placeholder"

type Reaction = {
  /** The toned value, so each skin tone gets a pill of its own. */
  emoji: string
  label: string
  /** Everyone else who reacted, in the order they did. */
  people: string[]
  mine: boolean
}

const INITIAL_REACTIONS: Reaction[] = [
  {
    emoji: "🎉",
    label: "party popper",
    people: ["Amara Okafor", "Priya Shah"],
    mine: true,
  },
  {
    emoji: "🚀",
    label: "rocket",
    people: ["Daniel Kim", "Michael Rodriguez", "Priya Shah"],
    mine: false,
  },
  {
    emoji: "👍🏽",
    label: "thumbs up, medium skin tone",
    people: ["Michael Rodriguez", "Amara Okafor"],
    mine: false,
  },
  { emoji: "👀", label: "eyes", people: ["Daniel Kim"], mine: false },
]

/* Untoned on purpose: the row draws them in the tone picked in the footer,
   so a toned 👍 joins the matching pill instead of starting a new one. */
const QUICK_REACTIONS = ["👍", "❤️", "😂", "🎉", "🙏", "👀"]

const TONES = DEFAULT_EMOJI_PICKER_I18N.labels.skinTones

/* The tone goes into the name, or two pills of one emoji would announce
   the same thing. */
const labelOf = (emoji: EmojiPickerEmoji, tone: SkinTone) =>
  tone > 0 && emoji.skins
    ? `${emoji.label}, ${TONES[tone].toLowerCase()} skin tone`
    : emoji.label

const countOf = (reaction: Reaction) =>
  reaction.people.length + (reaction.mine ? 1 : 0)

/* "Amara Okafor, Priya Shah and you": you always come last. */
function namesOf(reaction: Reaction) {
  const names = reaction.mine ? [...reaction.people, "you"] : reaction.people
  if (names.length === 1) return reaction.mine ? "You" : names[0]
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`
}

/* A composed first row in the popover, so the common reactions take one
   click. It goes through the picker's own `select`, so the skin tone, the
   recent list and closing on pick behave exactly like a grid pick. Columns
   one cell wide from the grid's gutter put each glyph over a grid column. */
function QuickReactions({ reactions }: { reactions: Reaction[] }) {
  const { emojis, skinTone, select } = useEmojiPicker()
  return (
    <div
      role="group"
      aria-label="Quick reactions"
      className="grid auto-cols-(--emoji-picker-cell) grid-flow-col justify-start justify-items-center px-(--emoji-picker-gutter) pt-(--emoji-picker-padding)"
    >
      {QUICK_REACTIONS.map((glyph) => {
        /* Undefined until the data arrives, which the trigger starts
           fetching on hover, so the row is rarely disabled for long. */
        const emoji = findEmoji(emojis, glyph)
        const value = emoji ? getEmojiValue(emoji, skinTone) : glyph
        const mine = reactions.some(
          (reaction) => reaction.mine && reaction.emoji === value
        )
        return (
          /* Pressed reads as a quiet fill, not a solid primary tile. */
          <Button
            key={glyph}
            variant={mine ? "secondary" : "ghost"}
            size="icon-sm"
            aria-pressed={mine}
            aria-label={emoji ? labelOf(emoji, skinTone) : glyph}
            disabled={!emoji}
            onClick={() => emoji && select(emoji)}
          >
            <span
              aria-hidden="true"
              className="text-(length:--emoji-picker-emoji) leading-none"
            >
              <EmojiPickerValue value={value} />
            </span>
          </Button>
        )
      })}
    </div>
  )
}

export default function Pattern() {
  const id = useId()
  const [reactions, setReactions] = useState(INITIAL_REACTIONS)
  const [announcement, setAnnouncement] = useState("")
  const triggerRef = useRef<HTMLButtonElement>(null)

  /* One path for a pill, a quick reaction and a grid pick: reacting with
     an emoji you already used takes yours back, and a pill nobody is left
     on goes away. */
  const toggle = (emoji: string, label: string) => {
    const existing = reactions.find((reaction) => reaction.emoji === emoji)
    const mine = !existing?.mine
    const next = existing
      ? reactions.map((reaction) =>
          reaction.emoji === emoji ? { ...reaction, mine } : reaction
        )
      : [...reactions, { emoji, label, people: [], mine }]
    const kept = next.filter((reaction) => countOf(reaction) > 0)
    setReactions(kept)
    setAnnouncement(
      mine ? `You reacted with ${label}` : `Removed your ${label} reaction`
    )
    /* The pressed pill unmounts with its last reaction, and focus would
       fall to the page; the add button sits beside the row. */
    if (kept.length < next.length) triggerRef.current?.focus()
  }

  return (
    <Item variant="outline" className="max-w-md">
      {/* Top-aligned to the author line; an Item centres its media unless
          the row has an ItemDescription. */}
      <ItemMedia className="self-start">
        <Avatar>
          <AvatarImage
            src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=96&h=96&dpr=2&q=80"
            alt=""
          />
          <AvatarFallback>LM</AvatarFallback>
        </Avatar>
      </ItemMedia>
      <ItemContent>
        <ItemTitle>
          Lucas Martin
          <span
            aria-hidden="true"
            className="bg-muted-foreground/40 size-1 shrink-0 rounded-full"
          />
          <span className="text-muted-foreground font-normal">10:42 AM</span>
        </ItemTitle>
        <p className="text-pretty">
          Dark mode is live for 10% of workspaces. If error rates hold, everyone
          gets it on Thursday.
        </p>
        <TooltipProvider>
          <div className="flex flex-wrap items-center gap-1.5 pt-2">
            {reactions.map((reaction) => {
              const count = countOf(reaction)
              /* Keyed by the emoji, not the index, so a description never
               moves to a neighbour when a pill above it goes away. */
              const descriptionId = `${id}-${reaction.emoji}`
              return (
                <Tooltip key={reaction.emoji}>
                  {/* Yours are solid, everyone else's muted. */}
                  <TooltipTrigger asChild>
                    <Button
                      variant={reaction.mine ? "default" : "secondary"}
                      size="sm"
                      aria-pressed={reaction.mine}
                      aria-label={`${reaction.label}, ${count} ${
                        count === 1 ? "reaction" : "reactions"
                      }`}
                      aria-describedby={descriptionId}
                      onClick={() => toggle(reaction.emoji, reaction.label)}
                    >
                      <span aria-hidden="true" className="text-sm leading-none">
                        {reaction.emoji}
                      </span>
                      <span aria-hidden="true" className="tabular-nums">
                        {count}
                      </span>
                      {/* Base UI keeps tooltip text from screen readers, so
                      the names reach them through this instead. */}
                      <span id={descriptionId} hidden>
                        {namesOf(reaction)} reacted with {reaction.label}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{namesOf(reaction)}</TooltipContent>
                </Tooltip>
              )
            })}
            {/* Controlled to null so the trigger keeps its icon instead of
              showing the last pick as a value. */}
            <EmojiPicker
              value={null}
              aria-label="Add reaction"
              onEmojiSelect={({ value, emoji, skinTone }) =>
                toggle(value, labelOf(emoji, skinTone))
              }
            >
              <EmojiPickerTrigger
                ref={triggerRef}
                variant="secondary"
                size="icon-sm"
                title="Add reaction"
              >
                <IconPlaceholder
                  lucide="SmilePlusIcon"
                  tabler="IconMoodPlus"
                  hugeicons="SmilePlusIcon"
                  phosphor="SmileyIcon"
                  remixicon="RiEmotionLine"
                  aria-hidden="true"
                />
              </EmojiPickerTrigger>
              {/* Offset past the card's bottom edge, so the panel reads as
                its own surface instead of clipping the corner. */}
              <EmojiPickerContent side="bottom" align="end" sideOffset={20}>
                <QuickReactions reactions={reactions} />
                <EmojiPickerHeader>
                  <EmojiPickerSearch />
                </EmojiPickerHeader>
                <EmojiPickerCategories />
                <EmojiPickerList />
                <EmojiPickerFooter>
                  <EmojiPickerPreview />
                  <EmojiPickerSkinTone />
                </EmojiPickerFooter>
              </EmojiPickerContent>
            </EmojiPicker>
          </div>
        </TooltipProvider>
        <p role="status" className="sr-only">
          {announcement}
        </p>
      </ItemContent>
    </Item>
  )
}
