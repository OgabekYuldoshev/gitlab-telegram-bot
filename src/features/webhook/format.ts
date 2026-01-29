import type { GitLabWebhookBody } from "./types.js";

const MARKDOWN_V2_SPECIAL = [
  ".",
  "-",
  "!",
  "+",
  "#",
  "*",
  "_",
  "(",
  ")",
  "~",
  "`",
  "|",
  "[",
  "]",
  "<",
  ">",
  "=",
  "{",
  "}",
];

export function escapeMarkdownV2(input: string): string {
  if (!input) return input;
  let out = input;
  for (const ch of MARKDOWN_V2_SPECIAL) {
    out = out.replaceAll(ch, "\\" + ch);
  }
  return out;
}

function isEmptyObject(obj: object | null | undefined): boolean {
  return obj == null || !Object.keys(obj).length;
}

export function formatIssueMessage(body: GitLabWebhookBody): string | null {
  const item = body.object_attributes;
  const user = body.user;
  if (!item?.action || !user?.name || item.title == null || item.url == null) return null;
  const name = escapeMarkdownV2(user.name);
  const title = escapeMarkdownV2(item.title);
  const url = item.url;
  switch (item.action) {
    case "open":
      return `🐞 New issue created by: ${name} \\- [${title}](${url})`;
    case "reopen":
      return `🐞 Issue re\\-opened by: ${name} \\- [${title}](${url})`;
    case "close":
      return `🐞 Issue closed by: ${name} \\- [${title}](${url})`;
    default:
      return null;
  }
}

export function formatMergeRequestMessage(body: GitLabWebhookBody): string | null {
  const item = body.object_attributes;
  const user = body.user;
  if (!item?.action || !user?.name || item.title == null || item.url == null) return null;
  const name = escapeMarkdownV2(user.name);
  const title = escapeMarkdownV2(item.title);
  const url = item.url;
  switch (item.action) {
    case "open":
      return `🍒 New merge request opened by: ${name} \\- [${title}](${url})`;
    case "reopen":
      return `🍒 Merge request is re\\-opened again by: ${name} \\- [${title}](${url})`;
    case "merge":
      return `🍒 Merge request is merged successfully \\- [${title}](${url})`;
    case "close":
      return `🍒 Merge request is closed \\- [${title}](${url})`;
    default:
      return null;
  }
}

export function formatPipelineMessage(
  body: GitLabWebhookBody,
  showSuccess: boolean
): string | null {
  const item = body.object_attributes;
  const user = body.user;
  const commit = body.commit;
  if (!item?.status || !user?.name) return null;
  const ref = escapeMarkdownV2(item.ref ?? "");
  const name = escapeMarkdownV2(user.name);
  const title = escapeMarkdownV2(commit?.title ?? "");
  const mr = body.merge_request;
  const mrSuffix =
    mr != null && !isEmptyObject(mr) && mr.iid != null && mr.url
      ? `\\. Part of MR [${mr.iid}](${mr.url})`
      : "";

  if (item.status === "failed") {
    return (
      `❌ Pipeline [\\#${item.id}](${item.url ?? ""}) on ${ref} failed\\! ` +
      `From user: ${name}, with commit: ${title}${mrSuffix}`
    );
  }
  if (item.status === "success" && showSuccess) {
    return (
      `✅ Pipeline [\\#${item.id}](${item.url ?? ""}) on ${ref} succeeded\\! ` +
      `From user: ${name}, with commit: ${title}${mrSuffix}`
    );
  }
  return null;
}

export function formatDeploymentMessage(body: GitLabWebhookBody): string | null {
  if (body.status !== "success") return null;
  const env = body.environment ?? "";
  const url = body.environment_external_url ?? "";
  return `🚀📦 Deployment job is successful\\! Deployed to ${env} at: [${url}](${url})`;
}

export function formatReleaseMessage(body: GitLabWebhookBody): string | null {
  if (body.action !== "create" || !body.project?.name || !body.tag || !body.url) return null;
  const projectName = escapeMarkdownV2(body.project.name);
  const tag = escapeMarkdownV2(body.tag);
  return `📢🚀🎂 New release is out\\! ${projectName} version ${tag} \\- [Download now](${body.url})`;
}
