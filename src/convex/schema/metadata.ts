import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Metadata Registry & Zero-Hardcode Validator schema tables.
 */
export const metadataTables = {
  // ─── Metadata Registry ──────────────────────────────────────
  metadataRegistry: defineTable({
    entityType: v.union(
      v.literal("module"), v.literal("form"), v.literal("field"),
      v.literal("dashboard"), v.literal("menu"), v.literal("workflow"),
      v.literal("notification"), v.literal("document"), v.literal("api"),
      v.literal("report"), v.literal("policy"), v.literal("automation"),
      v.literal("integration"), v.literal("extension"),
    ),
    entityId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    version: v.number(),
    status: v.union(
      v.literal("draft"), v.literal("testing"),
      v.literal("published"), v.literal("archived"),
      v.literal("deprecated"),
    ),
    owner: v.optional(v.string()),
    dependencies: v.optional(v.array(v.string())),
    usageCount: v.number(),
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_entity", ["entityType", "entityId"])
    .index("by_entity_type", ["entityType"])
    .index("by_status", ["status"])
    .index("by_usage", ["usageCount"])
    .index("by_updated", ["updatedAt"]),

  // ─── Metadata Version History ───────────────────────────────
  metadataHistory: defineTable({
    entityType: v.union(
      v.literal("module"), v.literal("form"), v.literal("field"),
      v.literal("dashboard"), v.literal("menu"), v.literal("workflow"),
      v.literal("notification"), v.literal("document"), v.literal("api"),
      v.literal("report"), v.literal("policy"), v.literal("automation"),
      v.literal("integration"), v.literal("extension"),
    ),
    entityId: v.string(),
    metadata: v.any(),
    version: v.number(),
    createdAt: v.number(),
  })
    .index("by_entity_history", ["entityType", "entityId"])
    .index("by_created", ["createdAt"]),

  // ─── Enterprise Health Metrics ──────────────────────────────
  healthMetrics: defineTable({
    metric: v.string(),
    value: v.number(),
    unit: v.string(),
    status: v.union(
      v.literal("healthy"), v.literal("warning"),
      v.literal("critical"), v.literal("unknown"),
    ),
    source: v.string(),
    metadata: v.optional(v.any()),
    recordedAt: v.number(),
  })
    .index("by_metric", ["metric"])
    .index("by_status", ["status"])
    .index("by_recorded", ["recordedAt"])
    .index("by_metric_recorded", ["metric", "recordedAt"]),

  // ─── Data Retention Policies ────────────────────────────────
  dataRetentionPolicies: defineTable({
    module: v.string(),
    entityType: v.string(),
    retentionDays: v.number(),
    softDelete: v.boolean(),
    archivalEnabled: v.boolean(),
    legalHold: v.boolean(),
    gdprExportable: v.boolean(),
    auditRetentionDays: v.optional(v.number()),
    backupRetentionDays: v.optional(v.number()),
    isActive: v.boolean(),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_module", ["module"])
    .index("by_entity", ["entityType"])
    .index("by_active", ["isActive"]),
};
