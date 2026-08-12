import { AuthForm } from "@/components/auth-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentUser, noUsersExist } from "@/lib/session"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function SignInPage() {
  const user = await getCurrentUser()
  if (user) redirect("/")
  const bootstrap = await noUsersExist()

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-2 text-foreground">
          <span className="text-lg font-semibold tracking-tight">ShipLedger</span>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Đăng nhập</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <AuthForm mode="sign-in" />
            {bootstrap && (
              <p className="text-center text-sm text-muted-foreground">
                Chưa có tài khoản?{" "}
                <Link href="/sign-up" className="font-medium text-primary underline-offset-4 hover:underline">
                  Tạo tài khoản quản trị
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
