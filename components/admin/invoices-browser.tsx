"use client"

import { deleteInvoice, exportInvoicesCsv, getInvoiceDetail, getInvoicesForAdmin, type InvoiceFilter } from "@/app/actions/invoices"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DateRangePicker, type DateRange } from "@/components/ui/date-range-picker"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Pencil, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState, useTransition } from "react"

type Invoice = {
  id: number
  driverId: string
  driverName: string
  shipReference: string
  invoiceDate: string
  note: string | null
  total: string
}

type Driver = { id: string; name: string }

type Detail = {
  invoice: Invoice
  entries: { id: number; itemName: string; amount: string }[]
}

function formatDate(value: string) {
  return new Date(value + "T00:00:00").toLocaleDateString("vi-VN", { dateStyle: "medium" })
}

function parseISODate(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function toISODate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function InvoicesBrowser({
  drivers,
  initialInvoices,
  initialDateRange,
}: {
  drivers: Driver[]
  initialInvoices: Invoice[]
  initialDateRange: { from: string; to: string }
}) {
  const router = useRouter()
  const [dateRange, setDateRange] = useState<DateRange>(() => ({
    from: parseISODate(initialDateRange.from),
    to: parseISODate(initialDateRange.to),
  }))
  const [driverId, setDriverId] = useState<string>("all")
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices)
  const [isPending, startTransition] = useTransition()
  const [exporting, setExporting] = useState(false)
  const [detail, setDetail] = useState<Detail | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const filter: InvoiceFilter = useMemo(() => {
    const from = dateRange.from ? toISODate(dateRange.from) : undefined
    const to = dateRange.to ? toISODate(dateRange.to) : undefined
    return { driverId, from, to }
  }, [dateRange, driverId])

  useEffect(() => {
    startTransition(async () => {
      const rows = await getInvoicesForAdmin(filter)
      setInvoices(rows as Invoice[])
    })
  }, [filter])

  const total = invoices.reduce((sum, inv) => sum + Number(inv.total), 0)

  async function openDetail(id: number) {
    const d = await getInvoiceDetail(id)
    if (d) {
      setDetail(d as Detail)
      setDetailOpen(true)
    }
  }

  async function handleDelete() {
    if (!detail) return
    if (!confirm("Xóa hóa đơn này?")) return
    await deleteInvoice(detail.invoice.id)
    setDetailOpen(false)
    setDetail(null)
    startTransition(async () => {
      const rows = await getInvoicesForAdmin(filter)
      setInvoices(rows as Invoice[])
    })
  }

  async function handleExport() {
    setExporting(true)
    try {
      const csv = await exportInvoicesCsv(filter)
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      const driverPart = driverId === "all" ? "all-drivers" : drivers.find((d) => d.id === driverId)?.name ?? "driver"
      a.href = url
      const rangePart = dateRange.from
        ? dateRange.to
          ? `${toISODate(dateRange.from)}-to-${toISODate(dateRange.to)}`
          : `from-${toISODate(dateRange.from)}`
        : dateRange.to
          ? `until-${toISODate(dateRange.to)}`
          : "all-dates"
      a.download = `invoices-${driverPart}-${rangePart}.csv`.replace(/\s+/g, "-").toLowerCase()
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  function formatRangeLabel(range: DateRange) {
    if (!range.from && !range.to) return "Tất cả"
    const fmt = (d: Date) => d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
    if (range.from && range.to) {
      if (toISODate(range.from) === toISODate(range.to)) return fmt(range.from)
      return `${fmt(range.from)} – ${fmt(range.to)}`
    }
    if (range.from) return `Từ ${fmt(range.from)}`
    return `Đến ${fmt(range.to!)}`
  }

  const datePresets = [
    { label: "Hôm nay", value: { from: new Date(), to: new Date() } },
    {
      label: "Tuần này",
      value: (() => {
        const d = new Date()
        const day = d.getDay()
        const diff = (day + 6) % 7
        const from = new Date(d)
        from.setDate(d.getDate() - diff)
        const to = new Date(from)
        to.setDate(from.getDate() + 6)
        return { from, to }
      })(),
    },
    {
      label: "Tháng này",
      value: (() => {
        const now = new Date()
        const from = new Date(now.getFullYear(), now.getMonth(), 1)
        const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        return { from, to }
      })(),
    },
    { label: "Tất cả", value: {} },
  ]

  return (
    <div className="flex flex-col gap-6 text-base">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Hóa đơn</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatRangeLabel(dateRange)} &middot; {invoices.length} hóa đơn
          </p>
        </div>
        <Button
          onClick={handleExport}
          disabled={exporting || invoices.length === 0}
          className="gap-2 sm:self-end"
          data-tour="admin-invoice-export"
        >
          <Download className="h-4 w-4" />
          {exporting ? "Đang xuất…" : "Xuất CSV"}
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-2" data-tour="admin-invoice-filter">
            <label className="text-sm font-medium text-muted-foreground">Thời gian</label>
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              presets={datePresets}
              className="w-full"
            />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">Tài xế</label>
            <Select value={driverId} onValueChange={(value) => value && setDriverId(value)}>
              <SelectTrigger className="w-full h-10">
                <SelectValue>
                  {driverId === "all" ? "Tất cả tài xế" : drivers.find((d) => d.id === driverId)?.name ?? "Tất cả tài xế"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả tài xế</SelectItem>
                {drivers.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end justify-end sm:ml-auto">
            <div className="text-right">
              <p className="text-sm font-medium text-muted-foreground">Tổng</p>
              <p className="font-mono text-2xl font-semibold">{total.toLocaleString("vi-VN")} ₫</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-lg border border-border bg-card" data-tour="admin-invoice-table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ngày</TableHead>
              <TableHead>Tài xế</TableHead>
              <TableHead>Mã chuyến hàng</TableHead>
              <TableHead className="text-right">Tổng</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending && invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                  Đang tải…
                </TableCell>
              </TableRow>
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                  Không có hóa đơn nào cho lựa chọn này.
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => (
                <TableRow
                  key={inv.id}
                  className="cursor-pointer"
                  onClick={() => openDetail(inv.id)}
                >
                  <TableCell className="whitespace-nowrap font-medium">{formatDate(inv.invoiceDate)}</TableCell>
                  <TableCell>{inv.driverName}</TableCell>
                  <TableCell className="font-mono text-sm">{inv.shipReference}</TableCell>
                  <TableCell className="text-right font-mono">{Number(inv.total).toLocaleString("vi-VN")} ₫</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chi tiết hóa đơn</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="flex flex-col gap-4">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Tài xế</dt>
                <dd className="text-right font-medium">{detail.invoice.driverName}</dd>
                <dt className="text-muted-foreground">Ngày</dt>
                <dd className="text-right font-medium">{formatDate(detail.invoice.invoiceDate)}</dd>
                <dt className="text-muted-foreground">Mã chuyến hàng</dt>
                <dd className="text-right font-mono">{detail.invoice.shipReference}</dd>
              </dl>
              <div className="flex flex-col divide-y divide-border rounded-md border border-border">
                {detail.entries.map((e) => (
                  <div key={e.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span>{e.itemName}</span>
                    <span className="font-mono">{Number(e.amount).toLocaleString("vi-VN")} ₫</span>
                  </div>
                ))}
                <div className="flex items-center justify-between bg-muted px-3 py-2 text-sm font-semibold">
                  <span>Tổng</span>
                  <span className="font-mono">{Number(detail.invoice.total).toLocaleString("vi-VN")} ₫</span>
                </div>
              </div>
              {detail.invoice.note && (
                <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">{detail.invoice.note}</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="ghost"
              className="gap-2"
              onClick={() => {
                if (detail) {
                  setDetailOpen(false)
                  router.push(`/admin/invoices/${detail.invoice.id}/edit`)
                }
              }}
            >
              <Pencil className="h-4 w-4" />
              Chỉnh sửa
            </Button>
            <Button
              variant="ghost"
              className="gap-2 text-destructive hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
