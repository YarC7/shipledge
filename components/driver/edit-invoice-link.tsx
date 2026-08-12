import Link from "next/link"
import { Pencil } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function EditInvoiceLink({ id }: { id: number }) {
  return (
    <Link
      href={`/driver/${id}/edit`}
      className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
    >
      <Pencil className="h-4 w-4" />
      <span className="sr-only">Chỉnh sửa</span>
    </Link>
  )
}
