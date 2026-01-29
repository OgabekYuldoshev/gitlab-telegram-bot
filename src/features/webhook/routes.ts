import { Hono } from "hono";
import type { Config } from "../../lib/config.js";
import type { GitLabWebhookBody } from "./types.js";
import { createHandleGitlabWebhook } from "./handler.js";

type Logger = {
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
  setError(value: boolean): void;
};

export interface WebhookRoutesDeps {
  config: Config;
  logger: Logger;
  telegram: Telegram;
  health: Health;
}

export function createWebhookRoutes(deps: WebhookRoutesDeps): Hono {
  const router = new Hono();
  const { config, logger, telegram, health } = deps;
  const handleWebhook = createHandleGitlabWebhook({ config, logger, telegram, health });

  router.post("/", async (c) => {
    const token = c.req.header("X-Gitlab-Token");
    if (!token || token !== config.gitlabSecretToken) {
      logger.warn("GitLab Secret Token mismatch");
      return c.json({}, 200);
    }
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({}, 200);
    }
    if (body != null && typeof body === "object" && "object_kind" in body) {
      try {
        await handleWebhook(body as GitLabWebhookBody);
      } catch (err) {
        logger.error(err instanceof Error ? err : String(err));
      }
    }
    return c.json({}, 200);
  });

  return router;
}
