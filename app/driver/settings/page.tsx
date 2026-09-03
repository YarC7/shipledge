import { ChangePasswordForm } from "@/components/change-password-form"

export default function DriverSettingsPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 text-base">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cài đặt</h1>
        <p className="mt-1 text-sm text-muted-foreground">Quản lý mật khẩu đăng nhập của bạn.</p>
      </div>
      <ChangePasswordForm />
    </div>
  )
}
