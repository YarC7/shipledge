import { getMyNotifications } from "@/app/actions/notifications"
import { NotificationsList } from "@/components/notifications-list"

export default async function AdminNotificationsPage() {
  const { notifications } = await getMyNotifications()

  return (
    <NotificationsList
      title="Thông báo"
      description="Tất cả thông báo về hóa đơn của tài xế"
      notifications={notifications as never}
    />
  )
}
