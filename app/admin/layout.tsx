import { getUnreadCount } from "@/app/actions/notifications"
import { DashboardShell } from "@/components/dashboard-shell"
import { getCurrentUser } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")
  if (user.role !== "admin") redirect("/driver")

  const unread = await getUnreadCount()

  const nav = [
    { href: "/admin", label: "Hóa đơn" },
    { href: "/admin/notifications", label: "Thông báo", badge: unread },
    { href: "/admin/items", label: "Chi phí" },
    { href: "/admin/drivers", label: "Tài xế" },
    { href: "/admin/settings", label: "Cài đặt" },
  ]

  return (
    <DashboardShell user={user} nav={nav}>
      {children}
    </DashboardShell>
  )
}
