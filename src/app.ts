import { Hono } from "hono";
import type { Config } from "./lib/config.js";
import { createHomeRoutes } from "./features/home/routes.js";
import { createHealthRoutes } from "./features/health/routes.js";
import { createWebhookRoutes } from "./features/webhook/routes.js";

type Logger = {
  info: (msg: string, ...args: unknown[]) => void;
  warn: (msg: string, ...args: unknown[]) => void;
  error: (msg: string | Error, ...args: unknown[]) => void;
};

type Telegram = {
  sendMessage(
    chatId: string | number,
    text: string,
    options?: { parse_mode?: "MarkdownV2"; disable_web_page_preview?: boolean }
  ): Promise<void>;
};

type Health = {
  hasError(): boolean;
  setError(value: boolean): void;
};

export interface AppDeps {
  config: Config;
  logger: Logger;
  telegram: Telegram;
  health: Health;
}

export function createApp(deps: AppDeps): Hono {
  const app = new Hono();
  const { config, logger, telegram, health } = deps;

  app.route("/", createHomeRoutes());
  app.route("/health", createHealthRoutes(health));
  app.route("/gitlab", createWebhookRoutes({ config, logger, telegram, health }));

  return app;
}
