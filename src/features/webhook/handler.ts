import type { Config } from "../../lib/config.js";
import type { GitLabWebhookBody, ChatId } from "./types.js";
import {
  formatIssueMessage,
  formatMergeRequestMessage,
  formatPipelineMessage,
  formatDeploymentMessage,
  formatReleaseMessage,
} from "./format.js";

const DEFAULT_SEND_OPTIONS = {
  parse_mode: "MarkdownV2" as const,
  disable_web_page_preview: true,
};

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

async function sendSafe(
  telegram: Telegram,
  chatId: ChatId,
  message: string,
  logger: Logger,
  health: Health
): Promise<void> {
  try {
    await telegram.sendMessage(chatId, message, DEFAULT_SEND_OPTIONS);
  } catch (err) {
    logger.warn("Message send failed (chatId: %s): %s", String(chatId), message);
    logger.error(err instanceof Error ? err : String(err));
    health.setError(true);
  }
}

export interface WebhookHandlerDeps {
  config: Config;
  logger: Logger;
  telegram: Telegram;
  health: Health;
}

export function createHandleGitlabWebhook(deps: WebhookHandlerDeps) {
  const { config, logger, telegram, health } = deps;
  const mapping = config.gitlabTelegramMapping;
  const pipelineBranch = config.gitlabPipelineBranchName;
  const pipelineShowSuccess = config.gitlabPipelineShowSuccess;

  return async function handleGitlabWebhook(body: GitLabWebhookBody): Promise<void> {
    const projectId = body.project?.id;
    if (projectId == null) {
      logger.error("Webhook missing project. Body: %s", JSON.stringify(body));
      return;
    }
    const chatId = mapping[projectId];
    if (chatId == null) {
      logger.error("Project ID %s not in mapping. Body: %s", projectId, JSON.stringify(body));
      return;
    }

    const kind = body.object_kind;
    if (!kind) return;

    switch (kind) {
      case "issue": {
        const msg = formatIssueMessage(body);
        if (msg) await sendSafe(telegram, chatId, msg, logger, health);
        break;
      }
      case "merge_request": {
        const msg = formatMergeRequestMessage(body);
        if (msg) await sendSafe(telegram, chatId, msg, logger, health);
        break;
      }
      case "pipeline": {
        const ref = body.object_attributes?.ref;
        if (pipelineBranch != null && ref !== pipelineBranch) return;
        const msg = formatPipelineMessage(body, pipelineShowSuccess);
        if (msg) await sendSafe(telegram, chatId, msg, logger, health);
        break;
      }
      case "deployment": {
        const msg = formatDeploymentMessage(body);
        if (msg) await sendSafe(telegram, chatId, msg, logger, health);
        break;
      }
      case "release": {
        const msg = formatReleaseMessage(body);
        if (msg) await sendSafe(telegram, chatId, msg, logger, health);
        break;
      }
      default:
        break;
    }
  };
}
