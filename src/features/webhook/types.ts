/**
 * GitLab webhook payload shapes (subset we care about).
 * See https://docs.gitlab.com/ee/user/project/integrations/webhook_events.html
 */

export interface GitLabProject {
  id: number;
  name: string;
}

export interface GitLabUser {
  name: string;
}

export interface GitLabObjectAttributes {
  id?: number;
  title?: string;
  url?: string;
  action?: string;
  status?: string;
  ref?: string;
}

export interface GitLabCommit {
  title?: string;
}

export interface GitLabMergeRequestRef {
  iid?: number;
  url?: string;
}

export interface GitLabWebhookBody {
  object_kind?: string;
  project?: GitLabProject;
  user?: GitLabUser;
  object_attributes?: GitLabObjectAttributes;
  commit?: GitLabCommit;
  merge_request?: GitLabMergeRequestRef | null;
  status?: string;
  environment?: string;
  environment_external_url?: string;
  action?: string;
  tag?: string;
  url?: string;
}

export type ChatId = string | number;
