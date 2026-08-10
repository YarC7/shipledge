"use server"

import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { count, eq } from "drizzle-orm"

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
