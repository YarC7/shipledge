import { getInvoiceForEdit } from "@/app/actions/invoices"
import { InvoiceForm } from "@/components/driver/invoice-form"
import { redirect } from "next/navigation"

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getInvoiceForEdit(Number(id))
  if (!data) redirect("/driver")

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Chỉnh sửa hóa đơn</h1>
        <p className="mt-1 text-sm text-muted-foreground">Cập nhật thông tin chuyến hàng và chi phí.</p>
      </div>
      <InvoiceForm
        items={data.items.map((i) => ({ id: i.id, name: i.name }))}
        invoiceId={data.invoice.id}
        initialData={{
          shipReference: data.invoice.shipReference,
          invoiceDate: data.invoice.invoiceDate,
          note: data.invoice.note ?? "",
          entries: data.entries.map((e) => ({ itemId: e.itemId, amount: e.amount })),
        }}
      />
    </div>
  )
}
