"use server"

import { db } from "@/lib/db"
import { costItems, invoiceEntries, invoices, user } from "@/lib/db/schema"
import { notifyInvoiceChanged, notifyNewInvoice } from "@/lib/notifications"
import { requireAdmin, requireUser } from "@/lib/session"
import { and, asc, desc, eq, gte, lte } from "drizzle-orm"
import { revalidatePath } from "next/cache"

// ----- Driver: submit + list own invoices -----

/** Active cost items a driver fills in. */
export async function getActiveCostItems() {
  await requireUser()
  return db.select().from(costItems).where(eq(costItems.active, true)).orderBy(asc(costItems.sortOrder), asc(costItems.id))
}

export async function submitInvoice(formData: FormData) {
  const u = await requireUser()

  const shipReference = String(formData.get("shipReference") ?? "").trim()
  const invoiceDate = String(formData.get("invoiceDate") ?? "").trim()
  const note = String(formData.get("note") ?? "").trim()

  if (!shipReference) return { error: "Mã chuyến hàng là bắt buộc" }
  if (!invoiceDate) return { error: "Ngày là bắt buộc" }

  const items = await db.select().from(costItems).where(eq(costItems.active, true))

  const entries: { itemId: number; itemName: string; amount: string }[] = []
  let total = 0
  for (const item of items) {
    const raw = String(formData.get(`item_${item.id}`) ?? "").trim()
    const value = raw === "" ? 0 : Number(raw)
    if (Number.isNaN(value) || value < 0) return { error: `Số tiền không hợp lệ cho ${item.name}` }
    total += value
    entries.push({ itemId: item.id, itemName: item.name, amount: String(Math.round(value)) })
  }

  const [invoice] = await db
    .insert(invoices)
    .values({
      driverId: u.id,
      driverName: u.name,
      shipReference,
      invoiceDate,
      note: note || null,
      total: String(Math.round(total)),
    })
    .returning()

  if (entries.length > 0) {
    await db.insert(invoiceEntries).values(entries.map((e) => ({ invoiceId: invoice.id, ...e })))
  }

  try {
    await notifyNewInvoice({
      id: invoice.id,
      driverId: u.id,
      driverName: u.name,
      shipReference,
      invoiceDate,
      total: String(Math.round(total)),
    })
  } catch (err) {
    console.error("[notify] submitInvoice failed:", err)
  }

  revalidatePath("/driver")
  return { success: true }
}

/** Invoices for the currently signed-in driver. */
export async function getMyInvoices() {
  const u = await requireUser()
  return db.select().from(invoices).where(eq(invoices.driverId, u.id)).orderBy(desc(invoices.invoiceDate), desc(invoices.id))
}

/** Get invoice with entries for editing — driver must own it, or admin. */
export async function getInvoiceForEdit(id: number) {
  const u = await requireUser()
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1)
  if (!invoice) return null
  if (invoice.driverId !== u.id && u.role !== "admin") return null
  const entries = await db.select().from(invoiceEntries).where(eq(invoiceEntries.invoiceId, id))
  const items = await db.select().from(costItems).where(eq(costItems.active, true)).orderBy(asc(costItems.sortOrder), asc(costItems.id))
  return { invoice, entries, items }
}

/** Update an invoice and its entries — driver must own it, or admin. */
export async function updateInvoice(id: number, formData: FormData) {
  const u = await requireUser()
  const [existing] = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1)
  if (!existing) return { error: "Hóa đơn không tồn tại" }
  if (existing.driverId !== u.id && u.role !== "admin") return { error: "Không có quyền chỉnh sửa" }

  const shipReference = String(formData.get("shipReference") ?? "").trim()
  const invoiceDate = String(formData.get("invoiceDate") ?? "").trim()
  const note = String(formData.get("note") ?? "").trim()

  if (!shipReference) return { error: "Mã chuyến hàng là bắt buộc" }
  if (!invoiceDate) return { error: "Ngày là bắt buộc" }

  const items = await db.select().from(costItems).where(eq(costItems.active, true))

  const entries: { itemId: number; itemName: string; amount: string }[] = []
  let total = 0
  for (const item of items) {
    const raw = String(formData.get(`item_${item.id}`) ?? "").trim()
    const value = raw === "" ? 0 : Number(raw)
    if (Number.isNaN(value) || value < 0) return { error: `Số tiền không hợp lệ cho ${item.name}` }
    total += value
    entries.push({ itemId: item.id, itemName: item.name, amount: String(Math.round(value)) })
  }

  await db
    .update(invoices)
    .set({
      shipReference,
      invoiceDate,
      note: note || null,
      total: String(Math.round(total)),
    })
    .where(eq(invoices.id, id))

  await db.delete(invoiceEntries).where(eq(invoiceEntries.invoiceId, id))
  if (entries.length > 0) {
    await db.insert(invoiceEntries).values(entries.map((e) => ({ invoiceId: id, ...e })))
  }

  if (u.role === "admin" && existing.driverId !== u.id) {
    try {
      await notifyInvoiceChanged(
        { ...existing, shipReference, invoiceDate, total: String(Math.round(total)) },
        u.name,
        "invoice_updated"
      )
    } catch (err) {
      console.error("[notify] updateInvoice failed:", err)
    }
  }

  revalidatePath("/driver")
  revalidatePath("/admin")
  return { success: true }
}

/** Delete an invoice and its entries — driver must own it, or admin. */
export async function deleteInvoice(id: number) {
  const u = await requireUser()
  const [existing] = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1)
  if (!existing) return { error: "Hóa đơn không tồn tại" }
  if (existing.driverId !== u.id && u.role !== "admin") return { error: "Không có quyền xóa" }

  if (u.role === "admin" && existing.driverId !== u.id) {
    try {
      await notifyInvoiceChanged(existing, u.name, "invoice_deleted")
    } catch (err) {
      console.error("[notify] deleteInvoice failed:", err)
    }
  }

  await db.delete(invoiceEntries).where(eq(invoiceEntries.invoiceId, id))
  await db.delete(invoices).where(eq(invoices.id, id))

  revalidatePath("/driver")
  revalidatePath("/admin")
  return { success: true }
}

// ----- Admin: view all invoices with filters -----

export type InvoiceFilter = {
  driverId?: string
  from?: string // yyyy-mm-dd
  to?: string // yyyy-mm-dd
}

export async function getInvoicesForAdmin(filter: InvoiceFilter) {
  await requireAdmin()

  const conditions = []
  if (filter.driverId && filter.driverId !== "all") conditions.push(eq(invoices.driverId, filter.driverId))
  if (filter.from) conditions.push(gte(invoices.invoiceDate, filter.from))
  if (filter.to) conditions.push(lte(invoices.invoiceDate, filter.to))

  const rows = await db
    .select()
    .from(invoices)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(invoices.invoiceDate), desc(invoices.id))

  return rows
}

/** Full detail (with entries) for a single invoice — admin only. */
export async function getInvoiceDetail(id: number) {
  await requireAdmin()
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1)
  if (!invoice) return null
  const entries = await db.select().from(invoiceEntries).where(eq(invoiceEntries.invoiceId, id))
  return { invoice, entries }
}

/** All driver names for the admin filter dropdown. */
export async function getDriverOptions() {
  await requireAdmin()
  return db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(eq(user.role, "driver"))
    .orderBy(asc(user.name))
}

/**
 * Builds the rows needed for CSV export: every invoice in range flattened with
 * one column per cost item. Returns headers + rows so the client can serialize.
 */
export async function getExportData(filter: InvoiceFilter) {
  await requireAdmin()

  const invoiceRows = await getInvoicesForAdmin(filter)
  const allItems = await db.select().from(costItems).orderBy(asc(costItems.sortOrder), asc(costItems.id))

  const invoiceIds = invoiceRows.map((r) => r.id)
  const entries = invoiceIds.length
    ? await db.select().from(invoiceEntries)
    : []

  const entriesByInvoice = new Map<number, Map<number, string>>()
  for (const e of entries) {
    if (!entriesByInvoice.has(e.invoiceId)) entriesByInvoice.set(e.invoiceId, new Map())
    entriesByInvoice.get(e.invoiceId)!.set(e.itemId, e.amount)
  }

  const headers = ["Ngày", "Tài xế", "Mã chuyến hàng", ...allItems.map((i) => i.name), "Tổng", "Ghi chú"]

  const rows = invoiceRows.map((inv) => {
    const itemMap = entriesByInvoice.get(inv.id) ?? new Map()
    return [
      inv.invoiceDate,
      inv.driverName,
      inv.shipReference,
      ...allItems.map((i) => itemMap.get(i.id) ?? "0.00"),
      inv.total,
      inv.note ?? "",
    ]
  })

  return { headers, rows }
}

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

/** Returns a ready-to-download CSV string for the given filter. */
export async function exportInvoicesCsv(filter: InvoiceFilter): Promise<string> {
  const { headers, rows } = await getExportData(filter)
  const lines = [headers, ...rows].map((cols) => cols.map((c) => csvEscape(String(c))).join(","))
  return lines.join("\r\n")
}
