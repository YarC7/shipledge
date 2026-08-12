"use client"

import { createDriver, deleteDriver } from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

type Driver = {
  id: string
  name: string
  username: string
  email: string
  createdAt: Date | string
}

export function DriversManager({ drivers }: { drivers: Driver[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleCreate(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const res = await createDriver(formData)
      if (res?.error) {
        setError(res.error)
      } else {
        setOpen(false)
        router.refresh()
      }
    })
  }

  return (
    <div className="flex flex-col gap-6 text-base">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tài xế</h1>
          <p className="mt-1 text-sm text-muted-foreground">Tạo và quản lý tài khoản tài xế.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Thêm tài xế</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form action={handleCreate}>
              <DialogHeader>
                <DialogTitle>Thêm tài xế</DialogTitle>
                <DialogDescription>
                  Tài xế đăng nhập bằng email và mật khẩu này để gửi hóa đơn.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Họ và tên</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="username">Tên đăng nhập</Label>
                  <Input id="username" name="username" required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="password">Mật khẩu tạm thời</Label>
                  <Input id="password" name="password" type="password" minLength={8} required />
                  <p className="text-xs text-muted-foreground">Tối thiểu 8 ký tự.</p>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Đang tạo…" : "Tạo tài xế"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {drivers.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          Chưa có tài xế nào. Thêm tài xế đầu tiên để bắt đầu.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Họ tên</TableHead>
                <TableHead>Tên đăng nhập</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-16 text-right">Xóa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell className="font-medium">{driver.name}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{driver.username}</TableCell>
                  <TableCell className="text-muted-foreground">{driver.email}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        if (!confirm(`Xóa ${driver.name}? Hóa đơn của họ sẽ được giữ lại.`)) return
                        startTransition(async () => {
                          await deleteDriver(driver.id)
                          router.refresh()
                        })
                      }}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Xóa {driver.name}</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
