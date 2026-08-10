import { getActiveCostItems } from "@/app/actions/invoices"
import { InvoiceForm } from "@/components/driver/invoice-form"

export default async function NewInvoicePage() {
  const items = await getActiveCostItems()

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tạo hóa đơn mới</h1>
        <p className="mt-1 text-sm text-muted-foreground">Ghi lại chi phí cho một chuyến hàng.</p>
      </div>
      <InvoiceForm items={items.map((i) => ({ id: i.id, name: i.name }))} />
    </div>
  )
}
