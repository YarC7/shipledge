import { getSettings } from "@/app/actions/settings"
import { ChangePasswordForm } from "@/components/change-password-form"
import { SettingsManager } from "@/components/admin/settings-manager"

export default async function AdminSettingsPage() {
  const config = await getSettings()

  return (
    <div className="flex flex-col gap-6 text-base">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cài đặt</h1>
        <p className="mt-1 text-sm text-muted-foreground">Cấu hình kênh gửi thông báo qua Telegram</p>
      </div>
      <SettingsManager initialConfig={config} />
      <ChangePasswordForm />
    </div>
  )
}
