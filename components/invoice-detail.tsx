import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Pencil } from "lucide-react"
import Link from "next/link"

type InvoiceDetailProps = {
  invoice: {
    id: number
    driverId: string
    driverName: string
    shipReference: string
    invoiceDate: string
    note: string | null
    total: string
  }
  entries: { id: number; itemName: string; amount: string }[]
  editHref: string
  backHref: string
  backLabel: string
}

function formatDate(value: string) {
  return new Date(value + "T00:00:00").toLocaleDateString("vi-VN", { dateStyle: "medium" })
}

/** Read-only invoice detail with full line items — used as the deeplink target
 *  for notifications (admin and driver). */
export function InvoiceDetail({ invoice, entries, editHref, backHref, backLabel }: InvoiceDetailProps) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 text-base">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Chi tiết hóa đơn</h1>
        <p className="mt-1 text-sm text-muted-foreground">{invoice.shipReference}</p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 py-4">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Tài xế</dt>
            <dd className="text-right font-medium">{invoice.driverName}</dd>
            <dt className="text-muted-foreground">Ngày</dt>
            <dd className="text-right font-medium">{formatDate(invoice.invoiceDate)}</dd>
            <dt className="text-muted-foreground">Mã chuyến hàng</dt>
            <dd className="text-right font-mono">{invoice.shipReference}</dd>
          </dl>

          <div className="flex flex-col divide-y divide-border rounded-md border border-border">
            {entries.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">Không có khoản chi nào.</div>
            ) : (
              entries.map((e) => (
                <div key={e.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span>{e.itemName}</span>
                  <span className="font-mono">{Number(e.amount).toLocaleString("vi-VN")} ₫</span>
                </div>
              ))
            )}
            <div className="flex items-center justify-between bg-muted px-3 py-2 text-sm font-semibold">
              <span>Tổng</span>
              <span className="font-mono">{Number(invoice.total).toLocaleString("vi-VN")} ₫</span>
            </div>
          </div>

          {invoice.note && (
            <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">{invoice.note}</p>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Link href={backHref} className={cn(buttonVariants({ variant: "outline" }))}>
          {backLabel}
        </Link>
        <Link href={editHref} className={cn(buttonVariants({ variant: "default" }), "gap-2")}>
          <Pencil className="h-4 w-4" />
          Chỉnh sửa
        </Link>
      </div>
    </div>
  )
}
