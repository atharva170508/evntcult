import {
  FileType,
  type FileTypeName,
  type FileTypeVariant,
} from "@/registry-reui/bases/radix/reui/file-type"

const variants: FileTypeVariant[] = ["outline", "solid", "light", "mono"]

// The same types in every row, so the variant is the only thing that changes.
const types = [
  "pdf",
  "docx",
  "xlsx",
  "jpg",
  "zip",
] as const satisfies readonly FileTypeName[]

export default function Pattern() {
  return (
    <div className="mx-auto flex w-fit flex-col gap-5">
      {variants.map((variant) => (
        <div key={variant} className="flex flex-col gap-2.5">
          <span className="text-muted-foreground text-xs capitalize">
            {variant}
          </span>
          <div className="flex gap-4">
            {types.map((type) => (
              <FileType key={type} type={type} variant={variant} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
