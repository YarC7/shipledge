"use client"

import { createCostItem, deleteCostItem, renameCostItem, toggleCostItem } from "@/app/actions/admin"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, Pencil, Plus, Trash2, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

type Item = {
  id: number
  name: string
  active: boolean
  sortOrder: number
}

export function CostItemsManager({ items }: { items: Item[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [newName, setNewName] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValue, setEditValue] = useState("")
  const [error, setError] = useState<string | null>(null)

  function refresh() {
    router.refresh()
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const name = newName.trim()
    if (!name) return
    const fd = new FormData()
    fd.set("name", name)
    startTransition(async () => {
      const res = await createCostItem(fd)
      if (res?.error) setError(res.error)
      else {
        setNewName("")
        refresh()
      }
    })
  }

  function startEdit(item: Item) {
    setEditingId(item.id)
    setEditValue(item.name)
  }

  function saveEdit(id: number) {
    startTransition(async () => {
      await renameCostItem(id, editValue)
      setEditingId(null)
      refresh()
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleAdd} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-2">
          <label htmlFor="new-item" className="text-sm font-medium">
            Chi phí mới
          </label>
          <Input
            id="new-item"
            placeholder="VD: Xăng, Vé cầu đường, Bãi đỗ xe"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={isPending} className="gap-2">
          <Plus className="h-4 w-4" />
          Thêm
        </Button>
      </form>
      {error && <p className="text-sm text-destructive">{error}</p>}

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          Chưa có chi phí nào. Thêm các trường mà tài xế cần điền.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-4 py-3">
              {editingId === item.id ? (
                <>
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1"
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" onClick={() => saveEdit(item.id)} disabled={isPending}>
                    <Check className="h-4 w-4" />
                    <span className="sr-only">Lưu</span>
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                    <X className="h-4 w-4" />
                    <span className="sr-only">Hủy</span>
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 font-medium">{item.name}</span>
                  {item.active ? (
                    <Badge variant="secondary">Đang dùng</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Đã ẩn
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      startTransition(async () => {
                        await toggleCostItem(item.id, !item.active)
                        refresh()
                      })
                    }
                    disabled={isPending}
                  >
                    {item.active ? "Ẩn" : "Hiện"}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => startEdit(item)}>
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Đổi tên</span>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() =>
                      startTransition(async () => {
                        await deleteCostItem(item.id)
                        refresh()
                      })
                    }
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Xóa</span>
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
