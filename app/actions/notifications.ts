"use server"

import { db } from "@/lib/db"
import { notifications } from "@/lib/db/schema"
import { requireUser } from "@/lib/session"
import { and, desc, eq, isNull } from "drizzle-orm"
import { revalidatePath } from "next/cache"

/** The signed-in user's notifications, newest first (max 100). */
export async function getMyNotifications() {
  const u = await requireUser()
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, u.id))
    .orderBy(desc(notifications.createdAt), desc(notifications.id))
    .limit(100)
  return { notifications: rows, unread: rows.filter((r) => !r.readAt).length }
}

/** Count of unread notifications — used for the nav badge. */
export async function getUnreadCount() {
  const u = await requireUser()
  const rows = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(and(eq(notifications.userId, u.id), isNull(notifications.readAt)))
  return rows.length
}

/** Marks a single notification as read — only its owner can do this. */
export async function markNotificationRead(id: number) {
  const u = await requireUser()
  const [row] = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1)
  if (!row || row.userId !== u.id) return { error: "Không tìm thấy thông báo" }
  if (!row.readAt) {
    await db.update(notifications).set({ readAt: new Date() }).where(eq(notifications.id, id))
  }
  revalidatePath("/admin/notifications")
  revalidatePath("/driver/notifications")
  return { success: true }
}

/** Marks every notification of the signed-in user as read. */
export async function markAllNotificationsRead() {
  const u = await requireUser()
  try {
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, u.id), isNull(notifications.readAt)))
    revalidatePath("/admin/notifications")
    revalidatePath("/driver/notifications")
    return { success: true }
  } catch (err) {
    console.error("[notify] markAllNotificationsRead failed:", err)
    return { error: "Không thể cập nhật thông báo" }
  }
}
