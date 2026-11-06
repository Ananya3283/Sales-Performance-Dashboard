import type { Format } from "@number-flow/react"

export type Fmt = "pct" | "pct0" | "int" | "money" | "x" | "dec" | "dec2" | "usd"

export function fmt(v: number | null | undefined, kind: Fmt): string {
  if (v == null || Number.isNaN(v)) return "–"
  switch (kind) {
    case "pct":
      return `${(v * 100).toFixed(1)}%`
    case "pct0":
      return `${Math.round(v * 100)}%`
    case "dec2":
      return v.toFixed(2)
    case "int":
      return Math.round(v).toLocaleString("en-US")
    case "x":
      return `${v.toFixed(1)}×`
    case "dec":
      return v.toFixed(1)
    case "usd":
      return `${v < 0 ? "-" : ""}$${fmt(Math.abs(v), "money")}`
    case "money":
      return Math.abs(v) >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : Math.abs(v) >= 1e3 ? `${(v / 1e3).toFixed(1)}K` : `${Math.round(v)}`
  }
}

/** NumberFlow format options for each kind. */
export const flowFormat: Record<Fmt, Format> = {
  pct: { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 },
  pct0: { style: "percent", maximumFractionDigits: 0 },
  dec2: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
  int: { maximumFractionDigits: 0 },
  x: { minimumFractionDigits: 1, maximumFractionDigits: 1 },
  dec: { minimumFractionDigits: 1, maximumFractionDigits: 1 },
  money: { notation: "compact", maximumFractionDigits: 1 },
  usd: { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 },
}
