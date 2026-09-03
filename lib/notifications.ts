import { db } from "@/lib/db"
import { notifications, user } from "@/lib/db/schema"
import { sendTelegramMessage } from "@/lib/telegram"
import { eq } from "drizzle-orm"
import { after } from "next/server"

export type NotificationType = "new_invoice" | "invoice_updated" | "invoice_deleted" | "info"

/** Inserts a single in-app notification for a user. */
export async function createNotification(
  userId: string,
  input: { type: NotificationType; title: string; body?: string; link?: string; invoiceId?: number }
) {
  await db.insert(notifications).values({
    userId,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    link: input.link ?? null,
    invoiceId: input.invoiceId ?? null,
  })
}

type InvoiceLike = {
  id: number
  driverId: string
  driverName: string
  shipReference: string
  invoiceDate: string
  total: string
}

function formatVnd(value: string | number) {
  return Number(value).toLocaleString("vi-VN")
}

/**
 * Fired right after a driver submits an invoice:
 * notifies every admin in-app, gives the driver a confirmation, and forwards
 * the news to the configured external channel (Telegram) after the response.
 */
export async function notifyNewInvoice(invoice: InvoiceLike) {
  const admins = await db.select({ id: user.id }).from(user).where(eq(user.role, "admin"))

  const body = `${invoice.driverName} · ${invoice.shipReference} · ${formatVnd(invoice.total)} ₫`

  await Promise.all([
    ...admins.map((admin) =>
      createNotification(admin.id, {
        type: "new_invoice",
        title: "Hóa đơn mới",
        body,
        link: `/admin/invoices/${invoice.id}`,
        invoiceId: invoice.id,
      })
    ),
    createNotification(invoice.driverId, {
      type: "new_invoice",
      title: "Đã gửi hóa đơn",
      body: `${invoice.shipReference} · ${formatVnd(invoice.total)} ₫`,
      link: `/driver/invoices/${invoice.id}`,
      invoiceId: invoice.id,
    }),
  ])

  const text = [
    `📄 Hóa đơn mới`,
    `Tài xế: ${invoice.driverName}`,
    `Mã chuyến hàng: ${invoice.shipReference}`,
    `Tổng: ${formatVnd(invoice.total)} ₫`,
  ].join("\n")

  after(async () => {
    try {
      const result = await sendTelegramMessage(text)
      if (!result.ok && !result.skipped) console.error("[telegram] send failed:", result.error)
    } catch (err) {
      console.error("[telegram] send threw:", err)
    }
  })
}

/**
 * Notifies an invoice's owner when an admin updates or deletes it.
 * Only fired when the actor is an admin (drivers editing their own invoices
 * do not get notified about their own actions).
 */
export async function notifyInvoiceChanged(
  invoice: InvoiceLike,
  actorName: string,
  kind: "invoice_updated" | "invoice_deleted"
) {
  const title = kind === "invoice_updated" ? "Hóa đơn đã được cập nhật" : "Hóa đơn đã bị xóa"
  const body = `${invoice.shipReference} · bởi ${actorName}`
  await createNotification(invoice.driverId, {
    type: kind,
    title,
    body,
    link: `/driver/invoices/${invoice.id}`,
    invoiceId: invoice.id,
  })
}
