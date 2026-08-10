import { DashboardShell } from "@/components/dashboard-shell"
import { getCurrentUser } from "@/lib/session"
import { redirect } from "next/navigation"

const nav = [
  { href: "/admin", label: "Hóa đơn" },
  { href: "/admin/items", label: "Chi phí" },
  { href: "/admin/drivers", label: "Tài xế" },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")
  if (user.role !== "admin") redirect("/driver")

  return (
    <DashboardShell user={user} nav={nav}>
      {children}
    </DashboardShell>
  )
}
