import { db } from "@/lib/db"
import { settings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export const TELEGRAM_ENABLED_KEY = "telegram_enabled"
export const TELEGRAM_BOT_TOKEN_KEY = "telegram_bot_token"
export const TELEGRAM_CHAT_IDS_KEY = "telegram_chat_ids"

export type TelegramSettings = {
  enabled: boolean
  botToken: string | null
  chatIds: string[]
}

export type SendTelegramResult = {
  ok: boolean
  skipped?: boolean
  error?: string
}

/** Loads the Telegram delivery config from the settings table. */
export async function getTelegramSettings(): Promise<TelegramSettings> {
  const rows = await db.select().from(settings)
  const map = new Map(rows.map((r) => [r.key, r.value]))
  let chatIds: string[] = []
  try {
    const raw = map.get(TELEGRAM_CHAT_IDS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) chatIds = parsed.filter((c): c is string => typeof c === "string").map((c) => c.trim()).filter(Boolean)
    }
  } catch {
    chatIds = []
  }
  return {
    enabled: map.get(TELEGRAM_ENABLED_KEY) === "true",
    botToken: map.get(TELEGRAM_BOT_TOKEN_KEY) ?? null,
    chatIds,
  }
}

/** Stores a single settings value (upsert). */
export async function saveSetting(key: string, value: string | null) {
  const existing = await db.select().from(settings).where(eq(settings.key, key)).limit(1)
  if (existing.length > 0) {
    await db.update(settings).set({ value, updatedAt: new Date() }).where(eq(settings.key, key))
  } else {
    await db.insert(settings).values({ key, value })
  }
}

/**
 * Sends a plain-text message to every configured Telegram chat.
 * Never throws — returns { ok, error } so callers can log and continue.
 */
export async function sendTelegramMessage(text: string): Promise<SendTelegramResult> {
  const cfg = await getTelegramSettings()
  if (!cfg.enabled) return { ok: false, skipped: true, error: "Kênh Telegram đang tắt" }
  if (!cfg.botToken) return { ok: false, skipped: true, error: "Chưa có bot token" }
  if (cfg.chatIds.length === 0) return { ok: false, skipped: true, error: "Chưa có chat id" }

  const results = await Promise.all(
    cfg.chatIds.map(async (chatId) => {
      try {
        const res = await fetch(`https://api.telegram.org/bot${cfg.botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text }),
          signal: AbortSignal.timeout(10_000),
        })
        if (!res.ok) {
          const body = await res.text().catch(() => "")
          return { ok: false, error: `Telegram HTTP ${res.status}: ${body.slice(0, 200)}` }
        }
        return { ok: true }
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) }
      }
    })
  )

  const failures = results.filter((r) => !r.ok)
  if (failures.length > 0) return { ok: false, error: failures.map((f) => f.error).filter(Boolean).join("; ") }
  return { ok: true }
}
