export type Period = "day" | "week" | "month" | "all"

function toISO(d: Date) {
  return d.toISOString().slice(0, 10)
}

/**
 * Returns the inclusive {from,to} date range (yyyy-mm-dd) for a period anchored
 * on the given reference date. Weeks start on Monday.
 */
export function periodRange(period: Period, ref: Date = new Date()): { from?: string; to?: string } {
  const d = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate()))

  if (period === "all") return {}

  if (period === "day") {
    return { from: toISO(d), to: toISO(d) }
  }

  if (period === "week") {
    const day = d.getUTCDay() // 0 = Sun
    const diffToMonday = (day + 6) % 7
    const start = new Date(d)
    start.setUTCDate(d.getUTCDate() - diffToMonday)
    const end = new Date(start)
    end.setUTCDate(start.getUTCDate() + 6)
    return { from: toISO(start), to: toISO(end) }
  }

  // month
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0))
  return { from: toISO(start), to: toISO(end) }
}

export function periodLabel(period: Period, ref: Date = new Date()): string {
  const { from, to } = periodRange(period, ref)
  if (period === "all") return "Tất cả"
  if (period === "day") return new Date(from + "T00:00:00").toLocaleDateString(undefined, { dateStyle: "medium" })
  const fmt = (s: string) => new Date(s + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })
  return `${fmt(from!)} – ${fmt(to!)}`
}
