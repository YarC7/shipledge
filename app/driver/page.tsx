import { deleteInvoice, getMyInvoices } from "@/app/actions/invoices"
import { buttonVariants } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DeleteInvoiceButton } from "@/components/driver/delete-invoice-button"
import { EditInvoiceLink } from "@/components/driver/edit-invoice-link"
import { Plus } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

function formatDate(value: string) {
  return new Date(value + "T00:00:00").toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export default async function DriverHomePage() {
  const invoices = await getMyInvoices()

  const monthTotal = invoices
    .filter((inv) => inv.invoiceDate.slice(0, 7) === new Date().toISOString().slice(0, 7))
    .reduce((sum, inv) => sum + Number(inv.total), 0)

  async function handleDelete(formData: FormData) {
    "use server"
    const id = Number(formData.get("id"))
    if (id) await deleteInvoice(id)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Hóa đơn của tôi</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {invoices.length} hóa đơn &middot; {monthTotal.toLocaleString("vi-VN")} ₫ tháng này
          </p>
        </div>
        <Link href="/driver/new" className={cn(buttonVariants({ variant: "default", size: "default" }), "gap-2")}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Tạo mới</span>
        </Link>
      </div>

      {invoices.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          Bạn chưa gửi hóa đơn nào.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ngày</TableHead>
                <TableHead>Mã chuyến hàng</TableHead>
                <TableHead>Ghi chú</TableHead>
                <TableHead className="text-right">Tổng</TableHead>
                <TableHead className="w-20 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="whitespace-nowrap font-medium">{formatDate(inv.invoiceDate)}</TableCell>
                  <TableCell className="font-mono text-sm">{inv.shipReference}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">{inv.note ?? "—"}</TableCell>
                  <TableCell className="text-right font-mono">{Number(inv.total).toLocaleString("vi-VN")} ₫</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <EditInvoiceLink id={inv.id} />
                      <form action={handleDelete}>
                        <input type="hidden" name="id" value={inv.id} />
                        <DeleteInvoiceButton />
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
