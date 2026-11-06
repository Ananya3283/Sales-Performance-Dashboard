import NumberFlow from "@number-flow/react"
import { AnimatePresence, motion } from "motion/react"
import { parseAsString, useQueryStates } from "nuqs"
import { useMemo } from "react"
import { OrderedColumns, Panel, RankBars, SignedBars, TrendLine } from "@/components/charts"
import { Figures } from "@/components/figures"
import { ALL, FilterBar, type Field } from "@/components/filter-bar"
import { PageHeader } from "@/components/page-header"
import { LINES, MONTHS, applyFilters, by, customers, insights, margin, monthLabel, options, orders, profit, sales, type Filters } from "@/data/sales"

// Every slicer lives in the URL, so a filtered view can be shared as a link
const params = {
  year: parseAsString.withDefault(ALL),
  region: parseAsString.withDefault(ALL),
  segment: parseAsString.withDefault(ALL),
  category: parseAsString.withDefault(ALL),
}

const FIELDS: Field[] = [
  { key: "year", label: "Year", all: "All years", options: options.year },
  { key: "region", label: "Region", all: "All regions", options: options.region },
  { key: "segment", label: "Segment", all: "All segments", options: options.segment },
  { key: "category", label: "Category", all: "All categories", options: options.category },
]

const short = (name: string) => (name.length > 26 ? `${name.slice(0, 24)}…` : name)

export default function App() {
  const [q, setQ] = useQueryStates(params)
  const filters: Filters = { year: q.year, region: q.region, segment: q.segment, category: q.category }
  const rows = useMemo(() => applyFilters(LINES, filters), [q.year, q.region, q.segment, q.category]) // eslint-disable-line react-hooks/exhaustive-deps

  const months = q.year === ALL ? MONTHS : MONTHS.filter((m) => m.startsWith(q.year))
  const monthly = by(rows, (l) => l.month, sales)
  const monthlyProfit = by(rows, (l) => l.month, profit)
  const trend = months.map((m) => ({
    key: monthLabel(m),
    sales: monthly.find((d) => d.key === m)?.value ?? 0,
    profit: monthlyProfit.find((d) => d.key === m)?.value ?? 0,
  }))
  const products = by(rows, (l) => l.product, sales)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
    .slice(0, 10)
    .map((d) => ({ key: short(d.key), value: d.value, detail: d.key }))
  const s = sales(rows)
  const m = margin(rows)

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 sm:px-8">
      <PageHeader
        title="Sales performance"
        dataset="Superstore orders, 2014 to 2017, 9,994 order lines."
        repo="https://github.com/Ananya3283/Sales-Performance-Dashboard"
      />

      <div className="sticky top-0 z-20 -mx-4 mt-6 border-b bg-background/90 px-4 py-4 backdrop-blur sm:-mx-8 sm:px-8">
        <FilterBar fields={FIELDS} value={filters} onChange={(k, v) => setQ({ [k]: v === ALL ? null : v })} />
      </div>

      <main className="mt-10">
        {rows.length === 0 ? (
          <p className="py-24 text-center text-muted-foreground">No orders match these filters. Clear one to see results.</p>
        ) : (
          <div className="space-y-12">
            <section className="grid items-start gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
              <div>
                <h1 className="text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl">
                  <NumberFlow value={s} format={{ notation: "compact", maximumFractionDigits: 1 }} prefix="$" /> in sales.{" "}
                  <span className={m != null && m < 0 ? "text-leaver" : "text-kept"}>
                    <NumberFlow value={m ?? 0} format={{ style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }} /> margin.
                  </span>
                </h1>
                <h2 className="mt-8 text-base font-semibold">What stands out</h2>
                <ul className="mt-2 space-y-2.5">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {insights(rows).map((t) => (
                      <motion.li
                        key={t}
                        layout
                        initial={{ opacity: 0, y: 4, filter: "blur(2px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, filter: "blur(2px)", transition: { duration: 0.15 } }}
                        transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                        className="border-l-2 border-kept pl-3 leading-snug"
                      >
                        {t}
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </div>
              <Panel title="Sales and profit by month" note="Hover the lines to read a month.">
                <TrendLine
                  data={trend}
                  format="usd"
                  height={300}
                  series={[
                    { key: "sales", label: "Sales", color: "var(--male)" },
                    { key: "profit", label: "Profit", color: "var(--kept)" },
                  ]}
                />
              </Panel>
            </section>

            <Figures
              items={[
                { label: "Sales", value: s, format: "usd" },
                { label: "Profit", value: profit(rows), format: "usd", tone: "kept" },
                { label: "Profit margin", value: m, format: "pct" },
                { label: "Orders", value: orders(rows), format: "int" },
                { label: "Customers", value: customers(rows), format: "int" },
                { label: "Avg sales per order", value: s / orders(rows), format: "int", prefix: "$" },
              ]}
            />

            <div className="grid gap-x-12 gap-y-10 lg:grid-cols-2">
              <Panel title="Profit by sub-category" note="Teal makes money, raspberry loses it.">
                <SignedBars data={by(rows, (l) => l.subcategory, profit)} format="usd" />
              </Panel>
              <div className="space-y-10">
                <Panel title="Sales by region">
                  <RankBars data={by(rows, (l) => l.region, sales)} format="usd" color="var(--male)" labelWidth={90} />
                </Panel>
                <Panel title="Profit margin by category">
                  <OrderedColumns data={by(rows, (l) => l.category, margin)} format="pct" color="var(--kept)" height={190} />
                </Panel>
                <Panel title="Sales by customer segment">
                  <RankBars data={by(rows, (l) => l.segment, sales)} format="usd" color="var(--male)" labelWidth={110} />
                </Panel>
              </div>
              <Panel title="Top 10 products by sales" note="Hover a bar for the full product name." className="lg:col-span-2">
                <RankBars data={products} format="usd" color="var(--male)" labelWidth={230} />
              </Panel>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
