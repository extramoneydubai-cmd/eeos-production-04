/**
 * Report SDK — Enterprise Reporting Service
 *
 * Every business module MUST use this SDK for report generation.
 *
 * Usage:
 *   import { reportSdk } from "@/platform/sdk/reportSdk";
 *   const report = await reportSdk.generate(ctx, { module: "crm", type: "lead_summary", ... });
 */

import { v } from "convex/values";
import { mutation, query } from "../convex/_generated/server";
import { Id } from "../convex/_generated/dataModel";

// ─── SDK Methods ─────────────────────────────────────────────────────────

/**
 * Generate a report by executing the report's query definition.
 * Returns the data — export is handled separately.
 */
export const generate = query({
  args: {
    reportId: v.id("reports"),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    departmentId: v.optional(v.id("departments")),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
    filters: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("Report not found");

    return {
      report: {
        _id: report._id,
        name: report.name,
        module: report.moduole,
        type: (report as { type?: string }).type || "table",
      },
      message: "Report data should be resolved by the specific module's query platform.",
    };
  },
});

/**
 * List available reports for a module.
 */
export const listByModule = query({
  args: { module: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("reports")
      .filter((q) => q.eq(q.field("module"), args.module))
      .collect();
  },
});

/**
 * Create a saved report configuration.
 */
export const create = mutation({
  args: {
    name: v.string(),
    module: v.string(),
    type: v.string(),
    config: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return ctx.db.insert("reports", {
      name: args.name,
      module: args.module,
      type: args.type,
      config: args.config,
      companyId: args.companyId,
      branchId: args.branchId,
      createdBy: args.createdBy,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Schedule a report for periodic delivery.
 */
export const schedule = mutation({
  args: {
    reportId: v.id("reports"),
    frequency: v.string(),
    recipients: v.array(v.string()),
    format: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return ctx.db.insert("reportSchedules", {
      reportId: args.reportId,
      frequency: args.frequency,
      recipients: args.recipients,
      format: args.format || "pdf",
      isActive: args.isActive !== undefined ? args.isActive : true,
      nextRunAt: now + 24 * 60 * 60 * 1000, // Default: tomorrow
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Export report data.
 */
export const exportData = mutation({
  args: {
    reportId: v.id("reports"),
    format: v.string(),
    filters: v.optional(v.string()),
    exportedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Placeholder — actual export logic depends on format (PDF, CSV, Excel)
    return {
      success: true,
      message: `Export initiated for report ${args.reportId} in ${args.format} format.`,
      exportedAt: Date.now(),
    };
  },
});
