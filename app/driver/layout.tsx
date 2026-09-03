import { getUnreadCount } from "@/app/actions/notifications"
import { DashboardShell } from "@/components/dashboard-shell"
import { getCurrentUser } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")
  if (user.role === "admin") redirect("/admin")

  const unread = await getUnreadCount()

  const nav = [
    { href: "/driver", label: "Hóa đơn của tôi" },
    { href: "/driver/notifications", label: "Thông báo", badge: unread },
    { href: "/driver/new", label: "Tạo hóa đơn" },
    { href: "/driver/settings", label: "Cài đặt" },
  ]

  return (
    <DashboardShell user={user} nav={nav}>
      {children}
    </DashboardShell>
  )
}
