"use client"

import { changeMyPassword } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

/** Self-contained change-password card, used by both admin and driver pages. */
export function ChangePasswordForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const form = e.currentTarget
    const formData = new FormData(form)
    const newPassword = String(formData.get("newPassword") ?? "")
    const confirmPassword = String(formData.get("confirmPassword") ?? "")

    if (newPassword.length < 8) {
      setError("Mật khẩu mới phải có ít nhất 8 ký tự")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Xác nhận mật khẩu không khớp")
      return
    }

    startTransition(async () => {
      const res = await changeMyPassword(formData)
      if (res?.error) {
        setError(res.error)
      } else {
        setSuccess(true)
        form.reset()
        router.refresh()
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Đổi mật khẩu</CardTitle>
        <CardDescription>Cập nhật mật khẩu đăng nhập của bạn. Các thiết bị khác sẽ bị đăng xuất.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="newPassword">Mật khẩu mới</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-muted-foreground">Đã đổi mật khẩu.</p>}

          <div>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Đang lưu…" : "Đổi mật khẩu"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
