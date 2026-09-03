"use client"

import { markAllNotificationsRead, markNotificationRead } from "@/app/actions/notifications"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Bell, CheckCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

type NotificationItem = {
  id: number
  type: string
  title: string
  body: string | null
  link: string | null
  readAt: string | Date | null
  createdAt: string | Date
}

const typeMeta: Record<string, { label: string; variant: "outline" | "secondary" | "destructive" }> = {
  new_invoice: { label: "Hóa đơn mới", variant: "outline" },
  invoice_updated: { label: "Đã cập nhật", variant: "secondary" },
  invoice_deleted: { label: "Đã xóa", variant: "destructive" },
  info: { label: "Thông báo", variant: "secondary" },
}

function formatTime(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value
  return d.toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" })
}

export function NotificationsList({
  title,
  description,
  notifications,
}: {
  title: string
  description: string
  notifications: NotificationItem[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const unreadCount = notifications.filter((n) => !n.readAt).length

  async function handleOpen(item: NotificationItem) {
    if (item.link) router.push(item.link)
    if (!item.readAt) {
      setError(null)
      startTransition(async () => {
        await markNotificationRead(item.id)
        router.refresh()
      })
    }
  }

  function handleMarkAll() {
    setError(null)
    startTransition(async () => {
      const res = await markAllNotificationsRead()
      if (res?.error) setError(res.error)
      else router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-6 text-base">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} chưa đọc` : description}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" className="gap-2" onClick={handleMarkAll} disabled={isPending}>
            <CheckCheck className="h-4 w-4" />
            Đánh dấu tất cả đã đọc
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <Bell className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Không có thông báo nào.</p>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col divide-y divide-border">
            {notifications.map((n) => {
              const meta = typeMeta[n.type] ?? typeMeta.info
              const unread = !n.readAt
              return (
                <div
                  key={n.id}
                  onClick={() => handleOpen(n)}
                  className={cn(
                    "group flex cursor-pointer items-start gap-3 px-(--card-spacing) py-3 transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-muted/50",
                    unread && "bg-muted/40"
                  )}
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                      <span className={cn("text-sm", unread ? "font-semibold" : "font-medium text-muted-foreground")}>
                        {n.title}
                      </span>
                    </div>
                    {n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}
                    <p className="text-xs text-muted-foreground/70">{formatTime(n.createdAt)}</p>
                  </div>
                  {unread && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="self-center opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        setError(null)
                        startTransition(async () => {
                          await markNotificationRead(n.id)
                          router.refresh()
                        })
                      }}
                    >
                      Đã đọc
                    </Button>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
