"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { costItems, user } from "@/lib/db/schema"
import { requireAdmin } from "@/lib/session"
import { asc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

// ----- Cost items -----

export async function getCostItems() {
  await requireAdmin()
  return db.select().from(costItems).orderBy(asc(costItems.sortOrder), asc(costItems.id))
}

export async function createCostItem(formData: FormData) {
  await requireAdmin()
  const name = String(formData.get("name") ?? "").trim()
  if (!name) return { error: "Họ tên là bắt buộc" }
  const [maxRow] = await db.select().from(costItems).orderBy(asc(costItems.sortOrder))
  await db.insert(costItems).values({ name, sortOrder: (maxRow?.sortOrder ?? 0) + 1 })
  revalidatePath("/admin/items")
  return { success: true }
}

export async function renameCostItem(id: number, name: string) {
  await requireAdmin()
  const trimmed = name.trim()
  if (!trimmed) return { error: "Họ tên là bắt buộc" }
  await db.update(costItems).set({ name: trimmed }).where(eq(costItems.id, id))
  revalidatePath("/admin/items")
  return { success: true }
}

export async function toggleCostItem(id: number, active: boolean) {
  await requireAdmin()
  await db.update(costItems).set({ active }).where(eq(costItems.id, id))
  revalidatePath("/admin/items")
  return { success: true }
}

export async function deleteCostItem(id: number) {
  await requireAdmin()
  await db.delete(costItems).where(eq(costItems.id, id))
  revalidatePath("/admin/items")
  return { success: true }
}

// ----- Driver management -----

export async function getDrivers() {
  await requireAdmin()
  return db
    .select({ id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt })
    .from(user)
    .where(eq(user.role, "driver"))
    .orderBy(asc(user.name))
}

export async function createDriver(formData: FormData) {
  await requireAdmin()
  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase()
  const password = String(formData.get("password") ?? "")

  if (!name || !email || !password) return { error: "Tất cả các trường là bắt buộc" }
  if (password.length < 8) return { error: "Mật khẩu phải có ít nhất 8 ký tự" }

  try {
    const result = await auth.api.signUpEmail({
      body: { name, email, password },
    })
    if (!result?.user?.id) return { error: "Không thể tạo tài xế" }
    await db.update(user).set({ role: "driver" }).where(eq(user.id, result.user.id))
    revalidatePath("/admin/drivers")
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Không thể tạo tài xế"
    if (message.toLowerCase().includes("exist")) return { error: "Tài khoản email này đã tồn tại" }
    return { error: message }
  }
}

export async function deleteDriver(id: string) {
  await requireAdmin()
  await db.delete(user).where(eq(user.id, id))
  revalidatePath("/admin/drivers")
  return { success: true }
}
