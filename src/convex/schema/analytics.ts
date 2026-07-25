import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Analytics & Reporting Schema
 *
 * Tables for the centralized Reporting & Analytics Platform.
 * These support report builder, saved reports, execution history,
 * export, scheduling, dashboard layouts, and KPI snapshots.
 *
 * All analytics engines reference these tables:
 *   - reportEngine.ts
 *   - reportExportEngine.ts
 *   - reportScheduleEngine.ts
 *   - analyticsEngine.ts
 *   - kpiEngine.ts
 *   - executiveReports.ts
 *   - financeReports.ts
 */
export const analyticsTables = {
  reportDefinitions: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    module: v.union(
      v.literal("crm"), v.literal("admissions"), v.literal("students"),
      v.literal("employees"), v.literal("academics"), v.literal("finance"),
      v.literal("examinations"), v.literal("lms"), v.literal("inventory"),
      v.literal("hr"), v.literal("support"), v.literal("procurement"),
      v.literal("custom"),
    ),
    reportType: v.union(
      v.literal("tabular"), v.literal("summary"), v.literal("chart"),
      v.literal("kpi"), v.literal("leaderboard"), v.literal("heatmap"),
      v.literal("timeline"), v.literal("progress"),
    ),
    dataSource: v.string(),
    config: v.string(),
    defaultFilters: v.optional(v.string()),
    allowedRoles: v.optional(v.array(v.string())),
    isSystem: v.boolean(),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("module", ["module"])
    .index("reportType", ["reportType"])
    .index("dataSource", ["dataSource"])
    .index("isActive", ["isActive"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),

  savedReports: defineTable({
    definitionId: v.id("reportDefinitions"),
    userId: v.id("users"),
    name: v.string(),
    filters: v.string(),
    chartConfig: v.optional(v.string()),
    isFavorite: v.boolean(),
    lastRunAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("definitionId", ["definitionId"])
    .index("userId", ["userId"])
    .index("userId_definitionId", ["userId", "definitionId"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),

  reportExecutions: defineTable({
    reportId: v.id("reportDefinitions"),
    userId: v.optional(v.id("users")),
    savedReportId: v.optional(v.id("savedReports")),
    scheduleId: v.optional(v.id("reportSchedules")),
    filters: v.optional(v.string()),
    resultData: v.optional(v.string()),
    recordCount: v.number(),
    executionTime: v.number(),
    errorMessage: v.optional(v.string()),
    status: v.union(v.literal("success"), v.literal("failed"), v.literal("pending")),
    executedAt: v.number(),
    createdAt: v.number(),
  })
    .index("reportId", ["reportId"])
    .index("userId", ["userId"])
    .index("status", ["status"])
    .index("by_created", ["createdAt"]),

  reportExports: defineTable({
    reportId: v.optional(v.id("reportDefinitions")),
    savedReportId: v.optional(v.id("savedReports")),
    userId: v.id("users"),
    format: v.union(v.literal("pdf"), v.literal("csv"), v.literal("excel"), v.literal("json")),
    filters: v.optional(v.string()),
    data: v.optional(v.string()),
    fileUrl: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    recordCount: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed")),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("reportId", ["reportId"])
    .index("userId", ["userId"])
    .index("status", ["status"])
    .index("by_created", ["createdAt"]),

  reportSchedules: defineTable({
    reportId: v.id("reportDefinitions"),
    userId: v.id("users"),
    name: v.string(),
    frequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
    dayOfWeek: v.optional(v.number()),
    dayOfMonth: v.optional(v.number()),
    time: v.string(),
    filters: v.optional(v.string()),
    recipients: v.array(v.string()),
    exportFormat: v.union(v.literal("pdf"), v.literal("csv"), v.literal("excel")),
    isActive: v.boolean(),
    lastSentAt: v.optional(v.number()),
    nextRunAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("reportId", ["reportId"])
    .index("userId", ["userId"])
    .index("isActive", ["isActive"])
    .index("nextRunAt", ["nextRunAt"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),

  userDashboardLayouts: defineTable({
    userId: v.id("users"),
    name: v.string(),
    layout: v.string(),
    widgets: v.string(),
    globalFilters: v.optional(v.string()),
    isDefault: v.boolean(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("userId", ["userId"])
    .index("isDefault", ["isDefault"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),

  kpiSnapshots: defineTable({
    kpiId: v.id("kpiDefinitions"),
    value: v.number(),
    period: v.string(),
    periodStart: v.number(),
    periodEnd: v.number(),
    createdAt: v.number(),
  })
    .index("kpiId", ["kpiId"])
    .index("period", ["period"])
    .index("kpiId_period", ["kpiId", "period"])
    .index("by_created", ["createdAt"]),
};
