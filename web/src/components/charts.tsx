import { Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, Line, LineChart, XAxis, YAxis } from "recharts"
import { useReducedMotion } from "motion/react"
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart"
import { fmt, type Fmt } from "@/lib/format"
import { cn } from "@/lib/utils"

/** One bar or point. `detail` is an optional second line in the tooltip. */
export type Datum = { key: string; value: number | null; detail?: string }

/** Shared panel: a heading and the chart, no card chrome. */
export function Panel({ title, note, children, className }: { title: string; note?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("min-w-0", className)}>
      <h3 className="text-base font-semibold">{title}</h3>
      {note && <p className="mt-0.5 text-sm text-muted-foreground">{note}</p>}
      <div className="mt-3">{children}</div>
    </section>
  )
}

function Tip({ active, payload, format }: { active?: boolean; payload?: { payload: Datum }[]; format: Fmt }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md">
      <div className="font-semibold">{d.key}</div>
      <div className="tabular-nums">{fmt(d.value, format)}</div>
      {d.detail && <div className="text-muted-foreground tabular-nums">{d.detail}</div>}
    </div>
  )
}

const config = { value: { label: "Value", color: "var(--left)" } } satisfies ChartConfig

/** The highest bar carries full colour, the rest step back to the ramp's lightest tint. */
function fills(data: Datum[], color: string) {
  if (color !== "var(--left)") return data.map(() => color)
  const max = Math.max(...data.map((d) => d.value ?? 0))
  return data.map((d) => (d.value === max ? "var(--left)" : "var(--heat-1)"))
}

/** Ranked horizontal bars, highest first. */
export function RankBars({ data, format, color = "var(--left)", labelWidth = 156, sort = true }: { data: Datum[]; format: Fmt; color?: string; labelWidth?: number; sort?: boolean }) {
  const reduce = useReducedMotion()
  const rows = sort ? [...data].sort((a, b) => (b.value ?? 0) - (a.value ?? 0)) : data
  return (
    <ChartContainer config={config} className="aspect-auto w-full" style={{ height: rows.length * 30 + 12 }}>
      <BarChart data={rows} layout="vertical" margin={{ left: 0, right: 60, top: 0, bottom: 0 }} barCategoryGap={6}>
        <XAxis type="number" hide domain={[0, "dataMax"]} />
        <YAxis type="category" dataKey="key" width={labelWidth} tickLine={false} axisLine={false} tick={{ fontSize: 13 }} interval={0} />
        <ChartTooltip cursor={{ fill: "var(--muted)" }} content={<Tip format={format} />} />
        <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} isAnimationActive={!reduce} animationDuration={400}>
          {fills(rows, color).map((c, i) => <Cell key={i} fill={c} />)}
          <LabelList dataKey="value" position="right" className="fill-foreground tabular-nums" fontSize={12} formatter={(v) => fmt(v as number, format)} />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

/** Columns in a fixed category order (bands, hours, ratings). */
export function OrderedColumns({ data, format, color = "var(--left)", height = 210, labels = true }: { data: Datum[]; format: Fmt; color?: string; height?: number; labels?: boolean }) {
  const reduce = useReducedMotion()
  return (
    <ChartContainer config={config} className="aspect-auto w-full" style={{ height }}>
      <BarChart data={data} margin={{ left: 0, right: 14, top: 22, bottom: 0 }} barCategoryGap="22%">
        <XAxis dataKey="key" tickLine={false} axisLine={{ stroke: "var(--border)" }} tick={{ fontSize: 12 }} interval="preserveStartEnd" />
        <YAxis hide domain={[0, "dataMax"]} />
        <ChartTooltip cursor={{ fill: "var(--muted)" }} content={<Tip format={format} />} />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} isAnimationActive={!reduce} animationDuration={400}>
          {fills(data, color).map((c, i) => <Cell key={i} fill={c} />)}
          {labels && <LabelList dataKey="value" position="top" className="fill-foreground tabular-nums" fontSize={12} formatter={(v) => fmt(v as number, format)} />}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

/** Bars that can go below zero (profit and loss): teal for gains, raspberry for losses, sorted high to low. */
export function SignedBars({ data, format, labelWidth = 120 }: { data: Datum[]; format: Fmt; labelWidth?: number }) {
  const reduce = useReducedMotion()
  const rows = [...data].sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
  return (
    <ChartContainer config={config} className="aspect-auto w-full" style={{ height: rows.length * 28 + 12 }}>
      <BarChart data={rows} layout="vertical" margin={{ left: 0, right: 60, top: 0, bottom: 0 }} barCategoryGap={5}>
        <XAxis type="number" hide domain={[(min: number) => Math.min(0, min), "dataMax"]} />
        <YAxis type="category" dataKey="key" width={labelWidth} tickLine={false} axisLine={false} tick={{ fontSize: 13 }} interval={0} />
        <ChartTooltip cursor={{ fill: "var(--muted)" }} content={<Tip format={format} />} />
        <Bar dataKey="value" radius={4} isAnimationActive={!reduce} animationDuration={400}>
          {rows.map((d, i) => <Cell key={i} fill={(d.value ?? 0) < 0 ? "var(--left)" : "var(--kept)"} />)}
          {/* Losses are labelled just right of the zero line so the text never runs into the category names */}
          <LabelList
            dataKey="value"
            content={({ x, y, width, height, value }) => (
              <text x={Number(x) + Math.max(Number(width), 0) + 6} y={Number(y) + Number(height) / 2 + 4} fontSize={12} className="fill-foreground tabular-nums">
                {fmt(value as number, format)}
              </text>
            )}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

export type Series = { key: string; label: string; color: string }

/** Change over time: 2px lines, a crosshair and a tooltip on hover. One series needs no legend. */
export function TrendLine({ data, series, format, height = 260 }: { data: Record<string, string | number | null>[]; series: Series[]; format: Fmt; height?: number }) {
  const reduce = useReducedMotion()
  const cfg = Object.fromEntries(series.map((s) => [s.key, { label: s.label, color: s.color }])) satisfies ChartConfig
  return (
    <ChartContainer config={cfg} className="aspect-auto w-full" style={{ height }}>
      <LineChart data={data} margin={{ left: 4, right: 16, top: 8, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
        <XAxis dataKey="key" tickLine={false} axisLine={{ stroke: "var(--border)" }} tick={{ fontSize: 12 }} minTickGap={24} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={52} tickFormatter={(v) => fmt(v, format === "pct" ? "pct0" : "money")} />
        <ChartTooltip
          cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <div className="rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md">
                <div className="font-semibold">{label}</div>
                {payload.map((p) => (
                  <div key={String(p.dataKey)} className="flex items-center gap-1.5 tabular-nums">
                    {series.length > 1 && <span className="size-2 rounded-full" style={{ background: p.color }} />}
                    {series.length > 1 && <span className="text-muted-foreground">{series.find((s) => s.key === p.dataKey)?.label}</span>}
                    {fmt(p.value as number, format)}
                  </div>
                ))}
              </div>
            ) : null
          }
        />
        {series.length > 1 && (
          <Legend verticalAlign="top" align="left" height={28} iconType="circle" iconSize={8} formatter={(v) => <span className="text-sm text-foreground">{series.find((s) => s.key === v)?.label}</span>} />
        )}
        {series.map((s) => (
          <Line key={s.key} type="monotone" dataKey={s.key} stroke={s.color} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--background)" }} isAnimationActive={!reduce} animationDuration={400} />
        ))}
      </LineChart>
    </ChartContainer>
  )
}

/** Two measures per category, side by side (e.g. movies vs TV shows). */
export function PairBars({ data, series, format, labelWidth = 140 }: { data: Record<string, string | number | null>[]; series: [Series, Series]; format: Fmt; labelWidth?: number }) {
  const reduce = useReducedMotion()
  const cfg = Object.fromEntries(series.map((s) => [s.key, { label: s.label, color: s.color }])) satisfies ChartConfig
  return (
    <ChartContainer config={cfg} className="aspect-auto w-full" style={{ height: data.length * 40 + 40 }}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }} barGap={2} barCategoryGap={8}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="key" width={labelWidth} tickLine={false} axisLine={false} tick={{ fontSize: 13 }} interval={0} />
        <ChartTooltip
          cursor={{ fill: "var(--muted)" }}
          content={({ active, payload }) =>
            active && payload?.length ? (
              <div className="rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md">
                <div className="font-semibold">{payload[0].payload.key}</div>
                {payload.map((p) => (
                  <div key={String(p.dataKey)} className="flex items-center gap-1.5 tabular-nums">
                    <span className="size-2 rounded-full" style={{ background: p.color }} />
                    {series.find((s) => s.key === p.dataKey)?.label} {fmt(p.value as number, format)}
                  </div>
                ))}
              </div>
            ) : null
          }
        />
        <Legend verticalAlign="top" align="left" height={28} iconType="circle" iconSize={8} formatter={(v) => <span className="text-sm text-foreground">{series.find((s) => s.key === v)?.label}</span>} />
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} fill={s.color} radius={[0, 4, 4, 0]} isAnimationActive={!reduce} animationDuration={400} />
        ))}
      </BarChart>
    </ChartContainer>
  )
}
