import { DashboardShell } from "@/components/dashboard-shell"
import { getCurrentUser } from "@/lib/session"
import { redirect } from "next/navigation"

const nav = [
  { href: "/driver", label: "Hóa đơn của tôi" },
  { href: "/driver/new", label: "Tạo hóa đơn" },
]

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")
  if (user.role === "admin") redirect("/admin")

  return (
    <DashboardShell user={user} nav={nav}>
      {children}
    </DashboardShell>
  )
}
