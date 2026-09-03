"use client"

import { saveSettings, testTelegram, type TelegramConfig } from "@/app/actions/settings"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

export function SettingsManager({ initialConfig }: { initialConfig: TelegramConfig }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [testing, setTesting] = useState(false)
  const [editingToken, setEditingToken] = useState(!initialConfig.hasToken)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await saveSettings(formData)
      if (res?.error) {
        setError(res.error)
      } else {
        setEditingToken(false)
        setMessage("Đã lưu cài đặt.")
        router.refresh()
      }
    })
  }

  async function handleTest() {
    setError(null)
    setMessage(null)
    setTesting(true)
    try {
      const res = await testTelegram()
      if (res?.error) setError(res.error)
      else setMessage("Đã gửi tin nhắn thử thành công.")
    } finally {
      setTesting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-4 py-4">
          <div className="flex items-center gap-2">
            <input
              id="telegramEnabled"
              name="telegramEnabled"
              type="checkbox"
              defaultChecked={initialConfig.enabled}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="telegramEnabled">Bật gửi thông báo qua Telegram</Label>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Bot token</Label>
            {editingToken ? (
              <Input
                name="telegramToken"
                type="password"
                autoComplete="off"
                placeholder="Nhập bot token"
              />
            ) : (
              <div className="flex items-center gap-2">
                <Input value="••••••••••••••••" readOnly className="font-mono" />
                <Button type="button" variant="outline" onClick={() => setEditingToken(true)}>
                  Đổi
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Lấy từ BotFather. Token chỉ hiển thị dạng che dấu; để trống khi lưu là giữ nguyên.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Chat id</Label>
            <Textarea
              name="telegramChatIds"
              defaultValue={initialConfig.chatIds.join("\n")}
              placeholder={"Mỗi dòng một chat id, ví dụ:\n-1001234567890"}
              className="min-h-24 font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Nhắn bất kỳ tin nào cho bot rồi xem chat id trong URL api.telegram.org để lấy id.
            </p>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Đang lưu…" : "Lưu cài đặt"}
        </Button>
        <Button type="button" variant="outline" className="gap-2" onClick={handleTest} disabled={testing}>
          <Send className="h-4 w-4" />
          {testing ? "Đang gửi…" : "Gửi tin nhắn thử"}
        </Button>
      </div>
    </form>
  )
}
