"use client"

import { claimFirstAdmin, lookupUserByUsername } from "@/app/actions/auth"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const isSignUp = mode === "sign-up"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isSignUp) {
        const signUpInput = { email, password, name, username }
        const { data, error } = await authClient.signUp.email(
          signUpInput as Parameters<typeof authClient.signUp.email>[0],
        )
        if (error) {
          setError(error.message ?? "Không thể tạo tài khoản")
          setLoading(false)
          return
        }
        if (data?.user?.id) {
          const role = await claimFirstAdmin(data.user.id)
          router.push(role === "admin" ? "/admin" : "/driver")
          router.refresh()
          return
        }
      } else {
        const foundEmail = await lookupUserByUsername(username)
        if (!foundEmail) {
          setError("Tên đăng nhập không tồn tại")
          setLoading(false)
          return
        }
        const { error } = await authClient.signIn.email({ email: foundEmail, password })
        if (error) {
          setError(error.message ?? "Tên đăng nhập hoặc mật khẩu không đúng")
          setLoading(false)
          return
        }
      }
      router.push("/")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xl">
      {isSignUp && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="name" className="text-lg">Họ và tên</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
        </div>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="username" className="text-lg">Tên đăng nhập</Label>
        <Input
          id="username"
          value={username}
          className="text-lg"
          onChange={(e) => setUsername(e.target.value)}
          required
          autoComplete={isSignUp ? "username" : "username"}
        />
      </div>
      {isSignUp && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="text-lg">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="password" className="text-lg">Mật khẩu</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            className="pr-10 text-lg"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" disabled={loading} className="mt-2">
        {loading ? "Vui lòng đợi…" : isSignUp ? "Tạo tài khoản" : "Đăng nhập"}
      </Button>
    </form>
  )
}
