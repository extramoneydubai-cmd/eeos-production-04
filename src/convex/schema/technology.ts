/**
 * Technology Schema — PATCH-ERP-003 Phase 2
 *
 * Persistence for the Technology Workspace:
 *   - deploymentHistory: deployment/version/release records per environment
 *   - techMetrics: time-series usage metrics (AI usage, storage, licenses,
 *     search latency, workflow failures, …)
 *
 * No runtime engines are duplicated — this is genuine persistence that did
 * not exist anywhere in the platform. All reads/writes flow through
 * `technologyEngine`.
 */
import { defineTable } from "convex/server";
import { v } from "convex/values";

export const technologyTables = {
  deploymentHistory: defineTable({
    version: v.string(),
    environment: v.union(
      v.literal("production"),
      v.literal("staging"),
      v.literal("development")
    ),
    status: v.union(
      v.literal("success"),
      v.literal("failed"),
      v.literal("in_progress"),
      v.literal("rolled_back")
    ),
    trigger: v.string(),
    deployedBy: v.optional(v.id("users")),
    notes: v.optional(v.string()),
    durationMs: v.optional(v.number()),
    deployedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_deployedAt", ["deployedAt"])
    .index("by_status", ["status"])
    .index("by_environment", ["environment"])
    .index("by_version", ["version"]),

  techMetrics: defineTable({
    metric: v.string(), // ai_usage | storage_usage | license_usage | search_latency_p95 | workflow_failures | ...
    value: v.number(),
    unit: v.optional(v.string()),
    recordedAt: v.number(),
  })
    .index("by_metric", ["metric"])
    .index("by_metric_time", ["metric", "recordedAt"]),
};
