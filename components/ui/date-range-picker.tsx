"use client"

import * as React from "react"
import * as ReactDOM from "react-dom"
import { DayPicker } from "react-day-picker"
import type { DateRange as DayPickerDateRange } from "react-day-picker"
import { CalendarIcon, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type DateRange = { from?: Date; to?: Date }

type DateRangePickerProps = {
  value: DateRange
  onChange: (range: DateRange) => void
  presets?: { label: string; value: DateRange }[]
  className?: string
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function normalizeRange(range: DateRange | undefined): DateRange {
  if (!range?.from) return {}
  const from = startOfDay(range.from)
  const to = range.to ? startOfDay(range.to) : undefined
  return to && to < from ? { from: to, to: from } : { from, to }
}

function formatDateShort(date: Date) {
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function rangesEqual(first: DateRange, second: DateRange) {
  return first.from && second.from && dateKey(first.from) === dateKey(second.from) &&
    (!first.to || !second.to ? !first.to && !second.to : dateKey(first.to) === dateKey(second.to))
}

export function DateRangePicker({ value, onChange, presets = [], className }: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selected, setSelected] = React.useState<DateRange>(normalizeRange(value))
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const [position, setPosition] = React.useState({ top: 0, left: 0, width: 340 })

  React.useEffect(() => {
    setSelected(normalizeRange(value))
  }, [value])

  const updatePosition = React.useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const width = Math.min(340, window.innerWidth - 24)
    const left = Math.min(Math.max(12, rect.left), Math.max(12, window.innerWidth - width - 12))
    const estimatedHeight = 500
    const top = rect.bottom + estimatedHeight <= window.innerHeight ? rect.bottom + 8 : Math.max(12, rect.top - estimatedHeight - 8)
    setPosition({ top, left, width })
  }, [])

  React.useLayoutEffect(() => {
    if (!open || !panelRef.current || !triggerRef.current) return
    const triggerRect = triggerRef.current.getBoundingClientRect()
    const panelHeight = Math.min(panelRef.current.scrollHeight, window.innerHeight - 24)
    const top = triggerRect.bottom + panelHeight + 8 <= window.innerHeight
      ? triggerRect.bottom + 8
      : Math.max(12, triggerRect.top - panelHeight - 8)
    if (top !== position.top) setPosition((current) => ({ ...current, top }))
  }, [open, position.top, position.width])

  React.useEffect(() => {
    if (!open) return
    updatePosition()

    const handleViewportChange = () => updatePosition()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (triggerRef.current?.contains(target)) return
      if ((event.target as HTMLElement)?.closest("[data-date-picker-dropdown]")) return
      setOpen(false)
    }

    window.addEventListener("resize", handleViewportChange)
    window.addEventListener("scroll", handleViewportChange, true)
    window.addEventListener("keydown", handleKeyDown)
    document.addEventListener("pointerdown", handlePointerDown)
    return () => {
      window.removeEventListener("resize", handleViewportChange)
      window.removeEventListener("scroll", handleViewportChange, true)
      window.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("pointerdown", handlePointerDown)
    }
  }, [open, updatePosition])

  function selectPreset(range: DateRange) {
    const next = normalizeRange(range)
    setSelected(next)
    onChange(next)
    setOpen(false)
  }

  function formatRange(range: DateRange) {
    if (!range.from) return "Chọn ngày hoặc khoảng ngày"
    if (!range.to) return `Từ ${formatDateShort(range.from)}`
    if (range.from.toDateString() === range.to.toDateString()) return formatDateShort(range.from)
    return `${formatDateShort(range.from)} – ${formatDateShort(range.to)}`
  }

  return (
    <>
      <div className={cn("relative", className)}>
        <Button
          ref={triggerRef}
          type="button"
          variant="outline"
          className="h-10 w-full justify-start gap-2 text-left font-normal"
          onClick={() => {
            if (!open) {
              setSelected(normalizeRange(value))
              updatePosition()
            }
            setOpen((current) => !current)
          }}
        >
          <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{formatRange(selected)}</span>
        </Button>
      </div>

      {open &&
        ReactDOM.createPortal(
          <div
            data-date-picker-dropdown
            ref={panelRef}
            className="shipledger-date-picker fixed z-[9999] max-h-[calc(100dvh-24px)] overflow-auto rounded-2xl border border-border bg-popover p-4 text-popover-foreground shadow-xl"
            style={{ top: position.top, left: position.left, width: position.width }}
          >
            <div className="flex items-start justify-between gap-4 pb-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Bộ lọc hóa đơn</p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">Lọc theo thời gian</h2>
              </div>
              <CalendarIcon className="mt-1 h-5 w-5 text-muted-foreground" />
            </div>

            {presets.length > 0 && (
              <div className="mb-4 flex gap-1 rounded-xl bg-muted p-1">
                {presets.map((preset) => (
                  <Button
                    key={preset.label}
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 min-w-0 flex-1 rounded-lg px-2 text-xs font-medium",
                      rangesEqual(selected, normalizeRange(preset.value))
                        ? "bg-background text-foreground shadow-sm hover:bg-background"
                        : "text-muted-foreground hover:bg-background/80 hover:text-foreground",
                    )}
                    onClick={() => selectPreset(preset.value)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            )}

            <div className="mb-3 rounded-xl border border-border bg-muted/50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Khoảng ngày</p>
              <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                <div>
                  <p className="text-[11px] text-muted-foreground">Bắt đầu</p>
                  <p className="mt-0.5 text-sm font-semibold">{selected.from ? formatDateShort(selected.from) : "Chọn ngày"}</p>
                </div>
                <span className="pb-0.5 text-muted-foreground">→</span>
                <div className="text-right">
                  <p className="text-[11px] text-muted-foreground">Kết thúc</p>
                  <p className="mt-0.5 text-sm font-semibold">{selected.to ? formatDateShort(selected.to) : "Chọn ngày"}</p>
                </div>
              </div>
            </div>

            <p className="mb-2 text-xs text-muted-foreground">Chọn ngày bắt đầu, sau đó chọn ngày kết thúc.</p>

            <DayPicker
              mode="range"
              selected={selected.from ? ({ from: selected.from, to: selected.to } as DayPickerDateRange) : undefined}
              onSelect={(range) => setSelected(normalizeRange(range))}
              showOutsideDays
              fixedWeeks
              navLayout="around"
              classNames={{
                months: "flex",
                month: "relative flex w-full flex-col gap-3",
                month_caption: "mx-4 flex h-10 items-center justify-center",
                caption_label: "text-sm font-semibold",
                button_previous: "absolute left-0 top-0 z-10 flex h-9 w-9 items-center justify-center rounded-xl",
                button_next: "absolute right-0 top-0 z-10 flex h-9 w-9 items-center justify-center rounded-xl",
                month_grid: "w-full border-collapse",
                weekdays: "flex w-full",
                weekday: "w-10 flex-1 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground",
                week: "mt-1 flex w-full",
                day: "relative flex h-10 flex-1 items-center justify-center p-0 text-sm",
                day_button: cn("h-9 w-9 rounded-lg font-normal transition-colors hover:bg-muted", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"),
                selected: "bg-lime-100 text-foreground hover:bg-lime-200",
                range_start: "rounded-l-lg bg-lime-100",
                range_middle: "rounded-none bg-lime-100",
                range_end: "rounded-r-lg bg-lime-100",
                today: "font-semibold ring-1 ring-inset ring-foreground/30",
                outside: "text-muted-foreground/40",
                disabled: "text-muted-foreground/40",
                hidden: "invisible",
              }}
            />

            <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
              <Button type="button" variant="ghost" size="sm" className="gap-2" onClick={() => selectPreset({})}>
                <RotateCcw className="h-3.5 w-3.5" />
                Xóa lọc
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  Đóng
                </Button>
                <Button type="button" size="sm" onClick={() => { onChange(selected); setOpen(false) }}>
                  Áp dụng
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
