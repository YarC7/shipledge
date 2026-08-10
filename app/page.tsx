import { getCurrentUser } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function Home() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")
  redirect(user.role === "admin" ? "/admin" : "/driver")
}
