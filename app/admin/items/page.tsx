import { getCostItems } from "@/app/actions/admin"
import { CostItemsManager } from "@/components/admin/cost-items-manager"

export default async function AdminItemsPage() {
  const items = await getCostItems()

  return (
    <div className="flex flex-col gap-6 text-base">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">Chi phí</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Định nghĩa các trường chi phí mà tài xế điền trên mỗi hóa đơn. Các mục ẩn sẽ không hiển thị trên hóa đơn
          mới nhưng vẫn giữ trên hóa đơn cũ.
        </p>
      </div>
      <CostItemsManager items={items} />
    </div>
  )
}
