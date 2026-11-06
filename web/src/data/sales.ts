// Order lines from salesdataset.xlsx (built by web/scripts/build_data.py). Measures mirror the Power BI report.
import raw from "./sales.json"
import { ALL } from "@/components/filter-bar"

type Raw = { dims: { r: string[]; s: string[]; c: string[]; sc: string[]; p: string[] }; rows: [string, number, number, number, number, number, number, number, number, number, number][] }
const data = raw as unknown as Raw

export type Line = {
  month: string
  year: string
  region: string
  segment: string
  category: string
  subcategory: string
  order: number
  customer: number
  product: string
  sales: number
  profit: number
  quantity: number
}

export const LINES: Line[] = data.rows.map(([month, r, s, c, sc, o, cu, p, sales, profit, quantity]) => ({
  month,
  year: month.slice(0, 4),
  region: data.dims.r[r],
  segment: data.dims.s[s],
  category: data.dims.c[c],
  subcategory: data.dims.sc[sc],
  order: o,
  customer: cu,
  product: data.dims.p[p],
  sales,
  profit,
  quantity,
}))

export const MONTHS = [...new Set(LINES.map((l) => l.month))].sort()

// ---------- filters (the slicers)
export type Filters = { year: string; region: string; segment: string; category: string }
export const options = {
  year: [...new Set(LINES.map((l) => l.year))].sort(),
  region: data.dims.r,
  segment: data.dims.s,
  category: data.dims.c,
}
export const applyFilters = (rows: Line[], f: Filters) =>
  rows.filter(
    (l) =>
      (f.year === ALL || l.year === f.year) &&
      (f.region === ALL || l.region === f.region) &&
      (f.segment === ALL || l.segment === f.segment) &&
      (f.category === ALL || l.category === f.category),
  )

// ---------- measures
export const sum = (rows: Line[], v: (l: Line) => number) => rows.reduce((t, l) => t + v(l), 0)
export const sales = (rows: Line[]) => sum(rows, (l) => l.sales)
export const profit = (rows: Line[]) => sum(rows, (l) => l.profit)
export const margin = (rows: Line[]) => (rows.length ? profit(rows) / sales(rows) : null)
export const orders = (rows: Line[]) => new Set(rows.map((l) => l.order)).size
export const customers = (rows: Line[]) => new Set(rows.map((l) => l.customer)).size

/** Group rows by a key and reduce each group to one number. */
export function by<K extends string>(rows: Line[], key: (l: Line) => K, measure: (g: Line[]) => number | null) {
  const groups = new Map<K, Line[]>()
  for (const l of rows) {
    const k = key(l)
    const g = groups.get(k)
    if (g) g.push(l)
    else groups.set(k, [l])
  }
  return [...groups].map(([k, g]) => ({ key: k, value: measure(g), n: g.length }))
}

const money = (v: number) => `${v < 0 ? "-" : ""}$${Math.abs(v) >= 1e6 ? `${(Math.abs(v) / 1e6).toFixed(2)}M` : `${(Math.abs(v) / 1e3).toFixed(1)}K`}`

/** Plain-language findings that update with the filters. */
export function insights(rows: Line[]): string[] {
  if (!rows.length) return []
  const out: string[] = []
  const regions = by(rows, (l) => l.region, sales).sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
  if (regions.length > 1) out.push(`${regions[0].key} leads on sales with ${money(regions[0].value ?? 0)}, ${((regions[0].value ?? 0) / sales(rows) * 100).toFixed(0)}% of the total.`)
  const losses = by(rows, (l) => l.subcategory, profit).filter((d) => (d.value ?? 0) < 0).sort((a, b) => (a.value ?? 0) - (b.value ?? 0))
  if (losses.length) out.push(`${losses.map((d) => d.key).join(", ")} ${losses.length === 1 ? "loses" : "lose"} money overall (${money(losses.reduce((t, d) => t + (d.value ?? 0), 0))} combined).`)
  const discounted = rows.filter((l) => l.profit < 0)
  out.push(`${(discounted.length / rows.length * 100).toFixed(0)}% of order lines are sold at a loss.`)
  const best = by(rows, (l) => l.month, sales).sort((a, b) => (b.value ?? 0) - (a.value ?? 0))[0]
  if (best) out.push(`The best month was ${monthLabel(best.key)} with ${money(best.value ?? 0)} in sales.`)
  return out
}

export const monthLabel = (m: string) => new Date(`${m}-01T00:00:00`).toLocaleDateString("en-US", { month: "short", year: "numeric" })
