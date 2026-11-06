import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export const ALL = "All"

export type Field = { key: string; label: string; all: string; options: string[]; show?: (v: string) => string }

/** The slicers: one dropdown per field, plus "Clear filters" once any is set. */
export function FilterBar({ fields, value, onChange }: { fields: Field[]; value: Record<string, string>; onChange: (k: string, v: string) => void }) {
  const active = fields.some((f) => value[f.key] !== ALL)
  return (
    <div className="flex flex-wrap items-end gap-3">
      {fields.map((f) => {
        const items = [{ value: ALL, label: f.all }, ...f.options.map((o) => ({ value: o, label: f.show ? f.show(o) : o }))]
        return (
          <label key={f.key} className="grid min-w-40 flex-1 gap-1 text-sm text-muted-foreground sm:flex-none">
            {f.label}
            <Select items={items} value={value[f.key]} onValueChange={(v) => onChange(f.key, String(v ?? ALL))}>
              <SelectTrigger className="w-full bg-card text-foreground sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {items.map((it) => (
                  <SelectItem key={it.value} value={it.value}>
                    {it.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        )
      })}
      {active && (
        <button
          onClick={() => fields.forEach((f) => onChange(f.key, ALL))}
          className="h-9 rounded-md px-3 text-sm font-semibold text-kept underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring outline-none"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
