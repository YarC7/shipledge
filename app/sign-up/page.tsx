import { AuthForm } from "@/components/auth-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentUser, noUsersExist } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function SignUpPage() {
  const user = await getCurrentUser()
  if (user) redirect("/")

  const bootstrap = await noUsersExist()
  if (!bootstrap) redirect("/sign-in")

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-2 text-foreground">
          <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-foreground font-mono text-sm font-bold text-background">
            SL
          </span>
          <span className="text-lg font-semibold tracking-tight">ShipLedger</span>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Tạo tài khoản quản trị</CardTitle>
            <CardDescription>
              Đây là tài khoản đầu tiên, vì vậy nó sẽ trở thành quản trị viên. Bạn sẽ thêm tài xế từ bảng điều khiển.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AuthForm mode="sign-up" />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
