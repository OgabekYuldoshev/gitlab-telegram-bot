import { describe, test, expect } from "bun:test";
import { createHandleGitlabWebhook } from "./handler.js";
import type { Config } from "../../lib/config.js";
import type { GitLabWebhookBody } from "./types.js";

function noopLogger() {
  return {
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
  };
}

function createMockTelegram(): {
  client: { sendMessage: (chatId: string | number, text: string) => Promise<void> };
  sent: { chatId: string | number; text: string }[];
} {
  const sent: { chatId: string | number; text: string }[] = [];
  const client = {
    async sendMessage(chatId: string | number, text: string) {
      sent.push({ chatId, text });
    },
  };
  return { client, sent };
}

function createMockHealth() {
  let err = false;
  return {
    hasError: () => err,
    setError: (v: boolean) => {
      err = v;
    },
  };
}

describe("createHandleGitlabWebhook", () => {
  test("resolves chatId from mapping and sends issue message", async () => {
    const { client, sent } = createMockTelegram();
    const health = createMockHealth();
    const config: Config = {
      telegramToken: "x",
      gitlabSecretToken: "s",
      gitlabTelegramMapping: { 42: "@mygroup" },
      url: "localhost",
      port: 3013,
      logLevel: "info",
      gitlabPipelineBranchName: undefined,
      gitlabPipelineShowSuccess: false,
      telegramEnabled: true,
    };
    const handle = createHandleGitlabWebhook({
      config,
      logger: noopLogger(),
      telegram: client,
      health,
    });

    const body: GitLabWebhookBody = {
      object_kind: "issue",
      project: { id: 42, name: "p" },
      user: { name: "Alice" },
      object_attributes: { action: "open", title: "Bug", url: "https://gitlab.com/1" },
    };

    await handle(body);

    expect(sent.length).toBe(1);
    expect(sent[0].chatId).toBe("@mygroup");
    expect(sent[0].text).toContain("New issue created by:");
  });

  test("skips when projectId not in mapping", async () => {
    const { client, sent } = createMockTelegram();
    const config: Config = {
      telegramToken: "x",
      gitlabSecretToken: "s",
      gitlabTelegramMapping: { 1: "@one" },
      url: "localhost",
      port: 3013,
      logLevel: "info",
      gitlabPipelineBranchName: undefined,
      gitlabPipelineShowSuccess: false,
      telegramEnabled: true,
    };
    const handle = createHandleGitlabWebhook({
      config,
      logger: noopLogger(),
      telegram: client,
      health: createMockHealth(),
    });

    const body: GitLabWebhookBody = {
      object_kind: "issue",
      project: { id: 999, name: "other" },
      user: { name: "U" },
      object_attributes: { action: "open", title: "T", url: "https://x.com" },
    };

    await handle(body);

    expect(sent.length).toBe(0);
  });

  test("skips pipeline when branch filter does not match", async () => {
    const { client, sent } = createMockTelegram();
    const config: Config = {
      telegramToken: "x",
      gitlabSecretToken: "s",
      gitlabTelegramMapping: { 1: "@one" },
      url: "localhost",
      port: 3013,
      logLevel: "info",
      gitlabPipelineBranchName: "main",
      gitlabPipelineShowSuccess: true,
      telegramEnabled: true,
    };
    const handle = createHandleGitlabWebhook({
      config,
      logger: noopLogger(),
      telegram: client,
      health: createMockHealth(),
    });

    const body: GitLabWebhookBody = {
      object_kind: "pipeline",
      project: { id: 1, name: "p" },
      user: { name: "Dev" },
      object_attributes: { id: 1, status: "failed", ref: "develop", url: "https://x.com" },
      commit: { title: "c" },
    };

    await handle(body);

    expect(sent.length).toBe(0);
  });
});
