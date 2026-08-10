import { getDriverOptions, getInvoicesForAdmin } from "@/app/actions/invoices"
import { InvoicesBrowser } from "@/components/admin/invoices-browser"
import { periodRange } from "@/lib/period"

export default async function AdminInvoicesPage() {
  const drivers = await getDriverOptions()
  const { from, to } = periodRange("month")
  const initialInvoices = await getInvoicesForAdmin({ driverId: "all", from, to })

  return <InvoicesBrowser drivers={drivers} initialInvoices={initialInvoices as never} />
}
