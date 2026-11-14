/**
 * Telegram provider. Uses Bot API when TELEGRAM_BOT_TOKEN is set,
 * otherwise falls back to a mock (console log) for local development.
 * Recipient chat id is stored on User.telegramChatId (or env default for owners).
 */

export interface TelegramResult {
  ok: boolean;
  providerRef?: string;
  error?: string;
}

export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN);
}

export async function sendTelegram(params: { chatId: string; text: string }): Promise<TelegramResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    console.log(`[MOCK TELEGRAM] Chat: ${params.chatId}, Text: ${params.text.slice(0, 80)}`);
    return { ok: true, providerRef: `mock_tg_${Date.now()}` };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: params.chatId, text: params.text, parse_mode: "HTML" }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      result?: { message_id?: number };
      description?: string;
    };
    if (res.ok && data.ok) {
      return { ok: true, providerRef: String(data.result?.message_id || Date.now()) };
    }
    return { ok: false, error: `Telegram: ${data.description || `HTTP ${res.status}`}` };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Telegram request failed" };
  }
}
