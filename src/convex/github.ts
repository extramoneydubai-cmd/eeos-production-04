"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";

const GITHUB_API_BASE = "https://api.github.com";

/**
 * Create an authenticated GitHub API client.
 * Reads GITHUB_TOKEN from process.env.
 */
function githubClient() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error(
      "GITHUB_TOKEN environment variable is not set. " +
        "Add it in the Keys/API keys tab and redeploy.",
    );
  }

  return {
    async request<T>(
      path: string,
      options: RequestInit = {},
    ): Promise<T> {
      const url = `${GITHUB_API_BASE}${path}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
          "User-Agent": "freebuff-app",
          ...options.headers,
        },
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          `GitHub API error (${response.status}): ${body}`,
        );
      }

      return response.json() as Promise<T>;
    },

    get<T>(path: string): Promise<T> {
      return this.request<T>(path);
    },

    post<T>(path: string, body: unknown): Promise<T> {
      return this.request<T>(path, {
        method: "POST",
        body: JSON.stringify(body),
      });
    },

    patch<T>(path: string, body: unknown): Promise<T> {
      return this.request<T>(path, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    },

    delete<T>(path: string): Promise<T> {
      return this.request<T>(path, { method: "DELETE" });
    },
  };
}

// ============================
// USER / AUTH
// ============================

export const getAuthenticatedUser = action({
  args: {},
  handler: async () => {
    const client = githubClient();
    return client.get<{
      login: string;
      id: number;
      avatar_url: string;
      name: string | null;
      email: string | null;
    }>("/user");
  },
});

// ============================
// REPOSITORIES
// ============================

export const listRepos = action({
  args: {
    type: v.optional(
      v.union(
        v.literal("all"),
        v.literal("owner"),
        v.literal("public"),
        v.literal("private"),
        v.literal("member"),
      ),
    ),
    sort: v.optional(
      v.union(
        v.literal("created"),
        v.literal("updated"),
        v.literal("pushed"),
        v.literal("full_name"),
      ),
    ),
    perPage: v.optional(v.number()),
  },
  handler: async (_, args) => {
    const client = githubClient();
    const params = new URLSearchParams();
    if (args.type) params.set("type", args.type);
    if (args.sort) params.set("sort", args.sort);
    if (args.perPage) params.set("per_page", String(args.perPage));
    params.set("page", "1");
    return client.get<Array<{
      id: number;
      name: string;
      full_name: string;
      html_url: string;
      description: string | null;
      private: boolean;
      owner: { login: string; avatar_url: string };
    }>>(`/user/repos?${params.toString()}`);
  },
});

export const getRepo = action({
  args: { owner: v.string(), repo: v.string() },
  handler: async (_, args) => {
    const client = githubClient();
    return client.get<{
      id: number;
      name: string;
      full_name: string;
      html_url: string;
      description: string | null;
      private: boolean;
      default_branch: string;
      language: string | null;
      stars: number;
      forks: number;
      open_issues_count: number;
      owner: { login: string; avatar_url: string };
    }>(`/repos/${args.owner}/${args.repo}`);
  },
});

// ============================
// ISSUES
// ============================

export const listIssues = action({
  args: {
    owner: v.string(),
    repo: v.string(),
    state: v.optional(
      v.union(v.literal("open"), v.literal("closed"), v.literal("all")),
    ),
    labels: v.optional(v.string()),
    sort: v.optional(
      v.union(
        v.literal("created"),
        v.literal("updated"),
        v.literal("comments"),
      ),
    ),
    perPage: v.optional(v.number()),
  },
  handler: async (_, args) => {
    const client = githubClient();
    const params = new URLSearchParams();
    if (args.state) params.set("state", args.state);
    if (args.labels) params.set("labels", args.labels);
    if (args.sort) params.set("sort", args.sort);
    if (args.perPage) params.set("per_page", String(args.perPage));
    params.set("page", "1");
    return client.get<Array<{
      id: number;
      number: number;
      title: string;
      state: string;
      html_url: string;
      created_at: string;
      updated_at: string;
      body: string | null;
      labels: Array<{ name: string; color: string }>;
      user: { login: string; avatar_url: string };
    }>>(`/repos/${args.owner}/${args.repo}/issues?${params.toString()}`);
  },
});

export const createIssue = action({
  args: {
    owner: v.string(),
    repo: v.string(),
    title: v.string(),
    body: v.optional(v.string()),
    labels: v.optional(v.array(v.string())),
    assignees: v.optional(v.array(v.string())),
  },
  handler: async (_, args) => {
    const client = githubClient();
    return client.post<{
      id: number;
      number: number;
      title: string;
      state: string;
      html_url: string;
    }>(`/repos/${args.owner}/${args.repo}/issues`, {
      title: args.title,
      body: args.body,
      labels: args.labels,
      assignees: args.assignees,
    });
  },
});

// ============================
// PULL REQUESTS
// ============================

export const listPullRequests = action({
  args: {
    owner: v.string(),
    repo: v.string(),
    state: v.optional(
      v.union(v.literal("open"), v.literal("closed"), v.literal("all")),
    ),
    sort: v.optional(
      v.union(
        v.literal("created"),
        v.literal("updated"),
        v.literal("popularity"),
        v.literal("long-running"),
      ),
    ),
    perPage: v.optional(v.number()),
  },
  handler: async (_, args) => {
    const client = githubClient();
    const params = new URLSearchParams();
    if (args.state) params.set("state", args.state);
    if (args.sort) params.set("sort", args.sort);
    if (args.perPage) params.set("per_page", String(args.perPage));
    params.set("page", "1");
    return client.get<Array<{
      id: number;
      number: number;
      title: string;
      state: string;
      html_url: string;
      created_at: string;
      updated_at: string;
      body: string | null;
      user: { login: string; avatar_url: string };
      head: { ref: string; repo: { full_name: string } | null };
      base: { ref: string };
    }>>(`/repos/${args.owner}/${args.repo}/pulls?${params.toString()}`);
  },
});

// ============================
// GENERIC: RAW GitHub API CALL
// ============================

export const apiCall = action({
  args: {
    method: v.union(
      v.literal("GET"),
      v.literal("POST"),
      v.literal("PATCH"),
      v.literal("DELETE"),
    ),
    path: v.string(),
    body: v.optional(v.any()),
  },
  handler: async (_, args) => {
    const client = githubClient();
    switch (args.method) {
      case "GET":
        return client.get(args.path);
      case "POST":
        return client.post(args.path, args.body);
      case "PATCH":
        return client.patch(args.path, args.body);
      case "DELETE":
        return client.delete(args.path);
    }
  },
});
