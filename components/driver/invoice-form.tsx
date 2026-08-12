"use client"

import { submitInvoice, updateInvoice } from "@/app/actions/invoices"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useMemo, useState, useTransition } from "react"

type Item = { id: number; name: string }
type Entry = { itemId: number; amount: string }

type Props = {
  items: Item[]
  invoiceId?: number
  initialData?: {
    shipReference: string
    invoiceDate: string
    note: string
    entries: Entry[]
  }
}

export function InvoiceForm({ items, invoiceId, initialData }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const entryMap = useMemo(() => {
    if (!initialData) return {}
    const map: Record<number, string> = {}
    for (const e of initialData.entries) {
      map[e.itemId] = String(Math.round(Number(e.amount)))
    }
    return map
  }, [initialData])

  const [amounts, setAmounts] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {}
    for (const item of items) {
      initial[item.id] = entryMap[item.id] ?? ""
    }
    return initial
  })

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const isEdit = !!invoiceId

  const total = useMemo(
    () => items.reduce((sum, item) => sum + (Number(amounts[item.id]) || 0), 0),
    [amounts, items],
  )

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const res = isEdit
        ? await updateInvoice(invoiceId, formData)
        : await submitInvoice(formData)
      if (res?.error) {
        setError(res.error)
      } else {
        router.push("/driver")
        router.refresh()
      }
    })
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Quản trị viên chưa thiết lập chi phí nào. Vui lòng quay lại sau.
        </CardContent>
      </Card>
    )
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-6 text-base">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chuyến hàng</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="shipReference">Mã chuyến hàng</Label>
            <Input
              id="shipReference"
              name="shipReference"
              placeholder="VD: SHP-10432"
              defaultValue={initialData?.shipReference}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="invoiceDate">Ngày</Label>
            <Input
              id="invoiceDate"
              name="invoiceDate"
              type="date"
              defaultValue={initialData?.invoiceDate ?? today}
              required
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="note">Ghi chú (không bắt buộc)</Label>
            <Input
              id="note"
              name="note"
              placeholder="Những điểm đáng chú ý"
              defaultValue={initialData?.note}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chi phí</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-4">
              <Label htmlFor={`item_${item.id}`} className="flex-1 font-normal">
                {item.name}
              </Label>
              <div className="relative w-40">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  ₫
                </span>
                <Input
                  id={`item_${item.id}`}
                  name={`item_${item.id}`}
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  placeholder="0"
                  className="pl-7 text-right font-mono"
                  value={amounts[item.id] ?? ""}
                  onChange={(e) => setAmounts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                />
              </div>
            </div>
          ))}
          <div className="mt-2 flex items-center justify-between border-t border-border pt-4">
            <span className="text-sm font-medium">Tổng</span>
            <span className="font-mono text-lg font-semibold">{total.toLocaleString("vi-VN")} ₫</span>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.push("/driver")}>
          Hủy
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Đang lưu…" : isEdit ? "Cập nhật" : "Gửi hóa đơn"}
        </Button>
      </div>
    </form>
  )
}
