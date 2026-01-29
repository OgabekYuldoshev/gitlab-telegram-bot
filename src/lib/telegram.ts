const TELEGRAM_API_BASE = "https://api.telegram.org/bot";

export function createTelegramClient(token: string) {
  const base = `${TELEGRAM_API_BASE}${token}`;

  return {
    async sendMessage(
      chatId: string | number,
      text: string,
      options?: { parse_mode?: "MarkdownV2"; disable_web_page_preview?: boolean }
    ): Promise<void> {
      const body: Record<string, unknown> = {
        chat_id: chatId,
        text,
        ...(options?.parse_mode && { parse_mode: options.parse_mode }),
        ...(options?.disable_web_page_preview !== undefined && {
          disable_web_page_preview: options.disable_web_page_preview,
        }),
      };
      const res = await fetch(`${base}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Telegram API ${res.status}: ${errText}`);
      }
    },
  };
}

export function createFakeTelegramClient(
  logger: { info: (msg: string, ...args: unknown[]) => void }
) {
  return {
    async sendMessage(
      chatId: string | number,
      text: string,
      _options?: { parse_mode?: "MarkdownV2"; disable_web_page_preview?: boolean }
    ): Promise<void> {
      logger.info("Fake Telegram send (chatId: %s): %s", String(chatId), text);
    },
  };
}
