import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { count, eq } from "drizzle-orm"
import { headers } from "next/headers"

export type SessionUser = {
  id: string
  name: string
  email: string
  role: "admin" | "driver"
}

/** Returns the current session user, or null if not signed in. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null
  const [row] = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1)
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role === "admin" ? "admin" : "driver",
  }
}

/** Throws unless there is a signed-in user. */
export async function requireUser(): Promise<SessionUser> {
  const u = await getCurrentUser()
  if (!u) throw new Error("Unauthorized")
  return u
}

/** Throws unless the signed-in user is an admin. */
export async function requireAdmin(): Promise<SessionUser> {
  const u = await requireUser()
  if (u.role !== "admin") throw new Error("Forbidden")
  return u
}

/** True when there are no users yet — used to bootstrap the first admin. */
export async function noUsersExist(): Promise<boolean> {
  const [row] = await db.select({ value: count() }).from(user)
  return (row?.value ?? 0) === 0
}
