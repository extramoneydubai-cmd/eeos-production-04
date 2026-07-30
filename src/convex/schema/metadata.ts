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

  // ─── White Label Config ──────────────────────────────────────
  whiteLabelConfig: defineTable({
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    companyName: v.optional(v.string()),
    config: v.any(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_branch", ["branchId"]),

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

  // ─── Integration Connectors ─────────────────────────────────
  integrationConnectors: defineTable({
    connectorType: v.union(
      v.literal("whatsapp"), v.literal("sms"), v.literal("email"),
      v.literal("google"), v.literal("microsoft"), v.literal("zoom"), v.literal("teams"),
      v.literal("accounting"), v.literal("payment_gateway"),
      v.literal("biometric"), v.literal("face_recognition"),
      v.literal("rest"), v.literal("webhook"), v.literal("ftp"), v.literal("sftp"),
      v.literal("mqtt"), v.literal("graphql"),
      v.literal("lms"), v.literal("moodle"),
      v.literal("custom"),
    ),
    name: v.string(),
    config: v.any(),
    isActive: v.boolean(),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    lastTestedAt: v.optional(v.number()),
    lastUsedAt: v.optional(v.number()),
    errorCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_connector_type", ["connectorType"])
    .index("by_company", ["companyId"])
    .index("by_branch", ["branchId"])
    .index("by_active", ["isActive"]),

  // ─── Production Tasks ───────────────────────────────────────
  productionTasks: defineTable({
    title: v.string(),
    taskType: v.union(
      v.literal("content_writing"), v.literal("video_production"),
      v.literal("graphic_design"), v.literal("question_bank"),
      v.literal("review"), v.literal("publishing"),
      v.literal("recording"), v.literal("editing"),
    ),
    status: v.union(
      v.literal("assigned"), v.literal("in_progress"),
      v.literal("review"), v.literal("approved"),
      v.literal("published"), v.literal("rejected"),
    ),
    assignedTo: v.optional(v.string()),
    courseId: v.optional(v.id("courses")),
    dueDate: v.optional(v.number()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_task_type", ["taskType"])
    .index("by_assigned", ["assignedTo"])
    .index("by_created", ["createdAt"]),

  // ─── Attendance Records ─────────────────────────────────────
  attendanceRecords: defineTable({
    studentId: v.id("personMaster"),
    studentName: v.optional(v.string()),
    batchId: v.optional(v.id("academicBatches")),
    date: v.number(),
    status: v.union(
      v.literal("present"), v.literal("absent"),
      v.literal("late"), v.literal("half_day"), v.literal("holiday"),
    ),
    branchId: v.optional(v.id("branches")),
    markedBy: v.optional(v.id("users")),
    remarks: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_student", ["studentId"])
    .index("by_batch", ["batchId"])
    .index("by_date", ["date"])
    .index("by_status", ["status"])
    .index("by_branch", ["branchId"])
    .index("by_batch_date", ["batchId", "date"]),
};
