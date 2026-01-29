export type ProjectToChatMapping = Record<number, string | number>;

export interface Config {
  readonly telegramToken: string;
  readonly gitlabSecretToken: string;
  readonly gitlabTelegramMapping: ProjectToChatMapping;
  readonly url: string;
  readonly port: number;
  readonly logLevel: string;
  readonly gitlabPipelineBranchName: string | undefined;
  readonly gitlabPipelineShowSuccess: boolean;
  readonly telegramEnabled: boolean;
}

function env(key: string): string | undefined {
  return typeof process !== "undefined" && process.env ? process.env[key] : undefined;
}

function envRequired(key: string): string {
  const v = env(key);
  if (v == null || v === "") {
    throw new Error(`Missing required env: ${key}`);
  }
  return v;
}

function parseMapping(raw: string): ProjectToChatMapping {
  try {
    const parsed = JSON.parse(raw) as Record<string, string | number>;
    const out: ProjectToChatMapping = {};
    for (const [k, v] of Object.entries(parsed)) {
      const id = parseInt(k, 10);
      if (!Number.isNaN(id)) out[id] = v;
    }
    return out;
  } catch (e) {
    throw new Error(
      `Invalid GITLAB_TELEGRAM_CHAT_MAPPING JSON: ${e instanceof Error ? e.message : String(e)}`
    );
  }
}

export function loadConfig(): Config {
  const gitlabSecretToken = envRequired("GITLAB_SECRET_TOKEN");
  const gitlabTelegramMappingRaw = envRequired("GITLAB_TELEGRAM_CHAT_MAPPING");
  const gitlabTelegramMapping = parseMapping(gitlabTelegramMappingRaw);

  const telegramEnabled = env("TELEGRAM_ENABLED") !== "false";
  const telegramToken = telegramEnabled ? envRequired("TELEGRAM_TOKEN") : "";

  return {
    telegramToken,
    gitlabSecretToken,
    gitlabTelegramMapping,
    url: env("URL") ?? "localhost",
    port: parseInt(env("PORT") ?? "3013", 10) || 3013,
    logLevel: env("LOG_LEVEL") ?? "info",
    gitlabPipelineBranchName: env("GITLAB_PIPELINE_BRANCH_NAME") ?? undefined,
    gitlabPipelineShowSuccess: env("GITLAB_PIPELINE_SHOW_SUCCESS") === "true",
    telegramEnabled,
  };
}
