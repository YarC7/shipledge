"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { requireUser } from "@/lib/session"
import { count, eq } from "drizzle-orm"
import { headers } from "next/headers"

/**
 * Looks up a user by username and returns their email for sign-in.
 */
export async function lookupUserByUsername(username: string): Promise<string | null> {
  const [row] = await db
    .select({ email: user.email })
    .from(user)
    .where(eq(user.username, username))
    .limit(1)
  return row?.email ?? null
}

/**
 * Promotes the given user to admin ONLY if they are the very first user in the
 * system. Used to bootstrap the initial admin account right after sign-up.
 * Returns the resulting role.
 */
export async function claimFirstAdmin(userId: string): Promise<"admin" | "driver"> {
  const [row] = await db.select({ value: count() }).from(user)
  const total = row?.value ?? 0

  // The just-created user counts as 1. Only bootstrap when they are alone.
  if (total === 1) {
    await db.update(user).set({ role: "admin" }).where(eq(user.id, userId))
    return "admin"
  }
  return "driver"
}

/**
 * Changes the signed-in user's password (driver or admin).
 * Revokes all other sessions; the current one is kept by better-auth.
 */
export async function changeMyPassword(formData: FormData) {
  const u = await requireUser()

  const currentPassword = String(formData.get("currentPassword") ?? "")
  const newPassword = String(formData.get("newPassword") ?? "")

  if (!currentPassword) return { error: "Mật khẩu hiện tại là bắt buộc" }
  if (!newPassword) return { error: "Mật khẩu mới là bắt buộc" }
  if (newPassword.length < 8) return { error: "Mật khẩu mới phải có ít nhất 8 ký tự" }

  try {
    await auth.api.changePassword({
      body: { currentPassword, newPassword, revokeOtherSessions: true },
      headers: await headers(),
    })
    return { success: true }
  } catch (err) {
    const code = (err as { code?: string })?.code
    if (code === "INVALID_PASSWORD") return { error: "Mật khẩu hiện tại không đúng" }
    if (code === "PASSWORD_TOO_SHORT") return { error: "Mật khẩu mới phải có ít nhất 8 ký tự" }
    if (code === "PASSWORD_TOO_LONG") return { error: "Mật khẩu mới quá dài" }
    if (code === "CREDENTIAL_ACCOUNT_NOT_FOUND") {
      return { error: "Tài khoản này không dùng mật khẩu đăng nhập" }
    }
    console.error("[auth] changeMyPassword failed:", err)
    return { error: "Không thể đổi mật khẩu" }
  }
}
