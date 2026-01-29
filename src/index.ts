import { loadConfig } from "./lib/config.js";
import { createLogger } from "./lib/logger.js";
import { createHealthState } from "./lib/health-state.js";
import { createTelegramClient, createFakeTelegramClient } from "./lib/telegram.js";
import { createApp } from "./app.js";

function main(): void {
  let config;
  try {
    config = loadConfig();
  } catch (e) {
    console.error("Config error:", e instanceof Error ? e.message : String(e));
    process.exit(1);
  }

  const logger = createLogger(config.logLevel);
  const health = createHealthState();
  const telegram = config.telegramEnabled
    ? createTelegramClient(config.telegramToken)
    : createFakeTelegramClient(logger);

  if (config.telegramEnabled) {
    logger.info("Telegram bot enabled");
  } else {
    logger.info("Telegram disabled (fake client)");
  }

  const app = createApp({
    config,
    logger,
    telegram,
    health,
  });

  Bun.serve({
    fetch: app.fetch,
    port: config.port,
  });

  logger.info(`GitLab-Telegram Bot listening at http://localhost:${config.port}`);
}

main();
