"use client"

import { deleteInvoice, exportInvoicesCsv, getInvoiceDetail, getInvoicesForAdmin, type InvoiceFilter } from "@/app/actions/invoices"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { periodLabel, periodRange, type Period } from "@/lib/period"
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

export function InvoicesBrowser({ drivers, initialInvoices }: { drivers: Driver[]; initialInvoices: Invoice[] }) {
  const router = useRouter()
  const [period, setPeriod] = useState<Period>("month")
  const [driverId, setDriverId] = useState<string>("all")
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices)
  const [isPending, startTransition] = useTransition()
  const [exporting, setExporting] = useState(false)
  const [detail, setDetail] = useState<Detail | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const filter: InvoiceFilter = useMemo(() => {
    const { from, to } = periodRange(period)
    return { driverId, from, to }
  }, [period, driverId])

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
      a.download = `invoices-${driverPart}-${period}.csv`.replace(/\s+/g, "-").toLowerCase()
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 text-base">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Hóa đơn</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {periodLabel(period)} &middot; {invoices.length} hóa đơn
          </p>
        </div>
        <Button onClick={handleExport} disabled={exporting || invoices.length === 0} className="gap-2 sm:self-end">
          <Download className="h-4 w-4" />
          {exporting ? "Đang xuất…" : "Xuất CSV"}
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-2 sm:w-52">
            <label className="text-base font-medium text-muted-foreground">Thời gian</label>
            <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Hôm nay</SelectItem>
                <SelectItem value="week">Tuần này</SelectItem>
                <SelectItem value="month">Tháng này</SelectItem>
                <SelectItem value="all">Tất cả</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2 sm:w-52">
            <label className="text-base font-medium text-muted-foreground">Tài xế</label>
            <Select value={driverId} onValueChange={setDriverId}>
              <SelectTrigger>
                <SelectValue />
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
          <div className="flex flex-1 items-end justify-end">
            <div className="text-right">
              <p className="text-base font-medium text-muted-foreground">Tổng</p>
              <p className="font-mono text-2xl font-semibold">{total.toLocaleString("vi-VN")} ₫</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
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
