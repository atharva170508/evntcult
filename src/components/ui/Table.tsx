import { cn } from "@/lib/utils";

/**
 * §8 Table — rows 40 (dense) or 48, 13px with lining numbers, a sticky header, horizontal hairlines only,
 * numbers right-aligned, a faint hover, no zebra stripes. An empty table is a sentence and an action.
 */
export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  numeric?: boolean;
  className?: string;
}

export function Table<T>({
  columns,
  rows,
  rowKey,
  caption,
  dense = true,
  empty,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  caption: string;
  dense?: boolean;
  empty: { sentence: string; action?: React.ReactNode };
}) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 border-y border-line py-8">
        <p className="text-body text-ink-muted">{empty.sentence}</p>
        {empty.action}
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-body-sm tabular-nums">
        <caption className="sr-only">{caption}</caption>
        <thead className="sticky top-0 z-10 bg-canvas">
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className={cn("h-10 border-b border-line px-3 text-label font-medium text-ink-muted first:pl-0 last:pr-0", c.numeric ? "text-right" : "text-left", c.className)}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={rowKey(r)} className="border-b border-line transition-colors duration-micro hover:bg-white/[0.03]">
              {columns.map((c) => (
                <td key={c.key} className={cn("px-3 first:pl-0 last:pr-0", dense ? "h-10" : "h-12", c.numeric ? "text-right font-mono" : "text-left", c.className)}>
                  {c.cell(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
