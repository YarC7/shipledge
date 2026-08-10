"use client"

import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function SignOutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSignOut() {
    setLoading(true)
    await authClient.signOut()
    router.push("/sign-in")
    router.refresh()
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleSignOut} disabled={loading} className="gap-2">
      <LogOut className="h-4 w-4" />
      <span className="hidden sm:inline">Đăng xuất</span>
    </Button>
  )
}
