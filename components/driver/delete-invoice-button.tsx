"use client"

import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DeleteInvoiceButton() {
  return (
    <Button
      type="submit"
      size="icon"
      variant="ghost"
      className="text-destructive hover:text-destructive"
      onClick={(e) => {
        if (!confirm("Xóa hóa đơn này?")) e.preventDefault()
      }}
    >
      <Trash2 className="h-4 w-4" />
      <span className="sr-only">Xóa</span>
    </Button>
  )
}
