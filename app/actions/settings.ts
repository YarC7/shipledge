"use server"

import { requireAdmin } from "@/lib/session"
import {
  getTelegramSettings,
  saveSetting,
  sendTelegramMessage,
  TELEGRAM_BOT_TOKEN_KEY,
  TELEGRAM_CHAT_IDS_KEY,
  TELEGRAM_ENABLED_KEY,
} from "@/lib/telegram"

export type TelegramConfig = {
  enabled: boolean
  hasToken: boolean
  chatIds: string[]
}

/** Admin-visible Telegram config — the bot token itself never leaves the server. */
export async function getSettings(): Promise<TelegramConfig> {
  await requireAdmin()
  const cfg = await getTelegramSettings()
  return { enabled: cfg.enabled, hasToken: Boolean(cfg.botToken), chatIds: cfg.chatIds }
}

/** Saves Telegram delivery settings. An empty token field keeps the existing token. */
export async function saveSettings(formData: FormData) {
  await requireAdmin()
  const enabled = formData.get("telegramEnabled") === "on"
  const rawToken = String(formData.get("telegramToken") ?? "").trim()
  const chatIds = String(formData.get("telegramChatIds") ?? "")
    .split(/\r?\n/)
    .map((c) => c.trim())
    .filter(Boolean)

  try {
    await Promise.all([
      saveSetting(TELEGRAM_ENABLED_KEY, String(enabled)),
      saveSetting(TELEGRAM_CHAT_IDS_KEY, JSON.stringify(chatIds)),
    ])
    if (rawToken) await saveSetting(TELEGRAM_BOT_TOKEN_KEY, rawToken)
    return { success: true }
  } catch (err) {
    console.error("[settings] saveSettings failed:", err)
    return { error: "Không thể lưu cài đặt" }
  }
}

/** Sends a test message through the currently saved Telegram config. */
export async function testTelegram() {
  await requireAdmin()
  const result = await sendTelegramMessage("ShipLedger: tin nhắn thử ✓")
  if (!result.ok) return { error: result.error ?? "Không gửi được tin nhắn" }
  return { success: true }
}
