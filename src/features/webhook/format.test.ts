import { describe, test, expect } from "bun:test";
import {
  escapeMarkdownV2,
  formatIssueMessage,
  formatMergeRequestMessage,
  formatPipelineMessage,
  formatDeploymentMessage,
  formatReleaseMessage,
} from "./format.js";
import type { GitLabWebhookBody } from "./types.js";

describe("escapeMarkdownV2", () => {
  test("escapes special characters", () => {
    expect(escapeMarkdownV2("a.b")).toBe("a\\.b");
    expect(escapeMarkdownV2("a-b")).toBe("a\\-b");
    expect(escapeMarkdownV2("a!b")).toBe("a\\!b");
    expect(escapeMarkdownV2("a+b")).toBe("a\\+b");
    expect(escapeMarkdownV2("a#b")).toBe("a\\#b");
    expect(escapeMarkdownV2("a*b")).toBe("a\\*b");
    expect(escapeMarkdownV2("a_b")).toBe("a\\_b");
    expect(escapeMarkdownV2("a(b)c")).toBe("a\\(b\\)c");
    expect(escapeMarkdownV2("a[b]c")).toBe("a\\[b\\]c");
    expect(escapeMarkdownV2("a<b>c")).toBe("a\\<b\\>c");
    expect(escapeMarkdownV2("a=b")).toBe("a\\=b");
    expect(escapeMarkdownV2("a{b}c")).toBe("a\\{b\\}c");
  });

  test("returns empty string unchanged", () => {
    expect(escapeMarkdownV2("")).toBe("");
  });

  test("returns string with no special chars unchanged", () => {
    expect(escapeMarkdownV2("hello world")).toBe("hello world");
  });

  test("escapes multiple occurrences", () => {
    expect(escapeMarkdownV2("a.b.c")).toBe("a\\.b\\.c");
  });
});

describe("formatIssueMessage", () => {
  test("returns message for open action", () => {
    const body: GitLabWebhookBody = {
      object_kind: "issue",
      project: { id: 1, name: "p" },
      user: { name: "Alice" },
      object_attributes: { action: "open", title: "Bug", url: "https://gitlab.com/1" },
    };
    const msg = formatIssueMessage(body);
    expect(msg).toContain("New issue created by:");
    expect(msg).toContain("Bug");
    expect(msg).toContain("https://gitlab.com/1");
  });

  test("returns null for unknown action", () => {
    const body: GitLabWebhookBody = {
      object_kind: "issue",
      project: { id: 1, name: "p" },
      user: { name: "Alice" },
      object_attributes: { action: "update", title: "Bug", url: "https://x.com" },
    };
    expect(formatIssueMessage(body)).toBeNull();
  });

  test("returns null when required fields missing", () => {
    expect(formatIssueMessage({})).toBeNull();
    expect(formatIssueMessage({ object_attributes: {}, user: { name: "A" } })).toBeNull();
  });
});

describe("formatMergeRequestMessage", () => {
  test("returns message for merge action", () => {
    const body: GitLabWebhookBody = {
      object_kind: "merge_request",
      project: { id: 1, name: "p" },
      user: { name: "Bob" },
      object_attributes: { action: "merge", title: "Feature", url: "https://gitlab.com/mr/1" },
    };
    const msg = formatMergeRequestMessage(body);
    expect(msg).toContain("merged successfully");
    expect(msg).toContain("Feature");
  });

  test("returns null for unknown action", () => {
    const body: GitLabWebhookBody = {
      object_kind: "merge_request",
      project: { id: 1, name: "p" },
      user: { name: "Bob" },
      object_attributes: { action: "update", title: "F", url: "https://x.com" },
    };
    expect(formatMergeRequestMessage(body)).toBeNull();
  });
});

describe("formatPipelineMessage", () => {
  test("returns message for failed pipeline", () => {
    const body: GitLabWebhookBody = {
      object_kind: "pipeline",
      project: { id: 1, name: "p" },
      user: { name: "Dev" },
      object_attributes: {
        id: 42,
        status: "failed",
        ref: "main",
        url: "https://gitlab.com/pipelines/42",
      },
      commit: { title: "Fix bug" },
    };
    const msg = formatPipelineMessage(body, false);
    expect(msg).toContain("failed");
    expect(msg).toContain("42");
    expect(msg).toContain("main");
  });

  test("returns null for success when showSuccess is false", () => {
    const body: GitLabWebhookBody = {
      object_kind: "pipeline",
      project: { id: 1, name: "p" },
      user: { name: "Dev" },
      object_attributes: { id: 42, status: "success", ref: "main", url: "https://x.com" },
      commit: { title: "Fix" },
    };
    expect(formatPipelineMessage(body, false)).toBeNull();
  });

  test("returns message for success when showSuccess is true", () => {
    const body: GitLabWebhookBody = {
      object_kind: "pipeline",
      project: { id: 1, name: "p" },
      user: { name: "Dev" },
      object_attributes: { id: 42, status: "success", ref: "main", url: "https://x.com" },
      commit: { title: "Fix" },
    };
    const msg = formatPipelineMessage(body, true);
    expect(msg).toContain("succeeded");
  });
});

describe("formatDeploymentMessage", () => {
  test("returns message for success", () => {
    const body: GitLabWebhookBody = {
      object_kind: "deployment",
      status: "success",
      environment: "production",
      environment_external_url: "https://app.example.com",
    };
    const msg = formatDeploymentMessage(body);
    expect(msg).toContain("successful");
    expect(msg).toContain("production");
    expect(msg).toContain("https://app.example.com");
  });

  test("returns null for non-success", () => {
    expect(formatDeploymentMessage({ object_kind: "deployment", status: "failed" })).toBeNull();
  });
});

describe("formatReleaseMessage", () => {
  test("returns message for create action", () => {
    const body: GitLabWebhookBody = {
      object_kind: "release",
      action: "create",
      project: { id: 1, name: "MyApp" },
      tag: "v1.0.0",
      url: "https://gitlab.com/releases/1",
    };
    const msg = formatReleaseMessage(body);
    expect(msg).toContain("New release");
    expect(msg).toContain("MyApp");
    expect(msg).toContain("v1"); // tag is escaped for MarkdownV2 (v1\.0\.0)
    expect(msg).toContain("Download now");
  });

  test("returns null when action is not create", () => {
    const body: GitLabWebhookBody = {
      object_kind: "release",
      action: "delete",
      project: { id: 1, name: "A" },
      tag: "v1",
      url: "https://x.com",
    };
    expect(formatReleaseMessage(body)).toBeNull();
  });
});
