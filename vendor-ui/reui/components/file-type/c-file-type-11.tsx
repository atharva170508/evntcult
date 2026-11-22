import { FileType } from "@/registry-reui/bases/radix/reui/file-type"

type CustomFormat = {
  type: string
  name: string
  /** A text color class. The label band, glyph and solid page follow it. */
  className: string
}

/* None of these is in the built-in table. Each color keeps the white label
   text at 4.5:1 or better: 700 for teal and orange, 600 for indigo and rose. */
const FORMATS: CustomFormat[] = [
  { type: "dwg", name: "AutoCAD drawing", className: "text-teal-700" },
  { type: "stl", name: "3D print mesh", className: "text-indigo-600" },
  { type: "blend", name: "Blender scene", className: "text-orange-700" },
  { type: "step", name: "CAD exchange", className: "text-rose-600" },
]

export default function Pattern() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <figure className="flex flex-col gap-3">
        {/* No visible text names these, so each keeps its default
            accessible name ("DWG file"). */}
        <ul className="flex flex-wrap gap-3">
          {FORMATS.map((format) => (
            <li key={format.type}>
              <FileType type={format.type} />
            </li>
          ))}
        </ul>
        <figcaption className="text-muted-foreground text-sm text-pretty">
          An extension outside the built-in table renders on a neutral page,
          labeled with the extension itself.
        </figcaption>
      </figure>
      <figure className="@container flex flex-col gap-3">
        {/* 2 columns once the figure, not the viewport, fits a name and
            its class side by side. */}
        <ul className="grid gap-3 @[22rem]:grid-cols-2">
          {FORMATS.map((format) => (
            <li key={format.type} className="flex min-w-0 items-center gap-3">
              <FileType type={format.type} className={format.className} />
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">
                  {format.name}
                </span>
                <code className="text-muted-foreground truncate font-mono text-xs">
                  {format.className}
                </code>
              </div>
            </li>
          ))}
        </ul>
        <figcaption className="text-muted-foreground text-sm text-pretty">
          One <code className="font-mono">text-*</code> class recolors any type,
          and the label stays white.
        </figcaption>
      </figure>
    </div>
  )
}
