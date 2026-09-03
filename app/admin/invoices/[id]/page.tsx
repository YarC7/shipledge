import { getInvoiceForEdit } from "@/app/actions/invoices"
import { InvoiceDetail } from "@/components/invoice-detail"
import { notFound } from "next/navigation"

export default async function AdminInvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getInvoiceForEdit(Number(id))
  if (!data) notFound()

  return (
    <InvoiceDetail
      invoice={data.invoice}
      entries={data.entries}
      editHref={`/admin/invoices/${data.invoice.id}/edit`}
      backHref="/admin"
      backLabel="Về danh sách hóa đơn"
    />
  )
}
