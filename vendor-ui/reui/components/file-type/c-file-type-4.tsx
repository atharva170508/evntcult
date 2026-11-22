import {
  FILE_TYPE_CATEGORIES,
  FileType,
} from "@/registry-reui/bases/radix/reui/file-type"

// The blank page goes last: it stands for a file with no type, so it closes
// the set instead of sitting between two families.
const families = [
  ...FILE_TYPE_CATEGORIES.filter((family) => family !== "empty"),
  "empty",
] as const

export default function Pattern() {
  // Cells fit "Presentation" in a monospace font. The width cap holds a row
  // to 5, so with room the 13 families wrap as 5, 5 and a centered 3.
  return (
    <ul className="mx-auto flex max-w-lg flex-wrap justify-center gap-x-1 gap-y-5">
      {families.map((family) => (
        <li key={family} className="flex w-22 flex-col items-center gap-2">
          {/* The caption names the family, so the icon would read twice. */}
          <FileType type={family} aria-hidden="true" />
          <span className="text-muted-foreground text-xs capitalize">
            {family}
          </span>
        </li>
      ))}
    </ul>
  )
}
